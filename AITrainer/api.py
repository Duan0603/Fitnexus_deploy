import cv2
import math
import os
import json
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
import google.generativeai as genai
import uvicorn
import shutil

# Thêm thư viện FastAPI
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Import module pose_analyzer
from core.pose_analyzer import (
    load_yolo_model,
    analyze_pose_with_yolo,
    draw_measurements_on_image
)

# --- KHỞI TẠO APP FASTAPI ---
app = FastAPI(title="Fitnexus AI Trainer API")

# --- Cấu hình CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CẤU HÌNH VÀ KHỞI TẠO MODEL ---

# !!! QUAN TRỌNG: Dán khóa API hợp lệ của bạn vào đây !!!
GEMINI_API_KEY = "AIzaSyCBHEa4eJfTwEMCoJkKr8POz4_lNwomPrU" 

if not GEMINI_API_KEY or GEMINI_API_KEY == "DÁN_KHÓA_API_HỢP_LỆ_CỦA_BẠN_VÀO_ĐÂY":
    print("LỖI: Bạn chưa cấu hình khóa API cho Gemini trong file api.py.")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
print("Khởi tạo cấu hình Gemini API...")

# Chuẩn bị danh sách model fallback
GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL") or "gemini-2.5-flash-lite",
]

def _gemini_generate_json(prompt: str, timeout_sec: int = 120):
    last_err = None
    for model_name in GEMINI_MODELS:
        try:
            print(f"[Gemini] Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            resp = model.generate_content(prompt, request_options={'timeout': timeout_sec})
            return resp
        except Exception as e:
            print(f"[Gemini] model {model_name} failed: {e}")
            last_err = e
            continue
    raise last_err if last_err else RuntimeError("Gemini API call failed for all models")

# Sử dụng hàm load_yolo_model từ pose_analyzer
yolo_model = load_yolo_model('yolov8n-pose.pt')
if yolo_model is None:
    print("LỖI: Không thể tải YOLO model.")
    sys.exit(1)

FONT_PATH = "arial.ttf"
if not os.path.exists(FONT_PATH):
    print(f"CẢNH BÁO: Không tìm thấy tệp font '{FONT_PATH}'.")

os.makedirs("processed_images", exist_ok=True)
app.mount("/processed", StaticFiles(directory="processed_images"), name="processed")

# --- CÁC HÀM XỬ LÝ ---

def get_gemini_recommendations(measurements_data):
    """
    Gọi Gemini API với dữ liệu đo lường chi tiết.
    
    Args:
        measurements_data: Dictionary chứa các số đo từ pose_analyzer
    """
    # Lấy số đo (ưu tiên cm, không có thì dùng px)
    if measurements_data.get("cm_measurements"):
        measurements = measurements_data["cm_measurements"]
        unit = "cm"
    else:
        measurements = measurements_data.get("pixel_measurements", {})
        unit = "px"
    
    # Tạo prompt chi tiết
    prompt = f"""
    Phân tích vóc dáng cơ thể dựa trên các số đo sau:
    
    **Số đo cơ bản:**
    - Chiều rộng vai: {measurements.get('shoulder_width', 'N/A')} {unit}
    - Chiều rộng eo: {measurements.get('waist_width', 'N/A')} {unit}
    - Chiều rộng hông: {measurements.get('hip_width', 'N/A')} {unit}
    - Chiều cao: {measurements.get('height', 'N/A')} {unit}
    - Độ dài chân: {measurements.get('leg_length', 'N/A')} {unit}
    - Tỷ lệ vai/hông: {measurements_data.get('pixel_measurements', {}).get('shoulder_hip_ratio', 'N/A')}
    
    **Yêu cầu phân tích:**
    1. Đánh giá vóc dáng hiện tại (dáng chữ V, chữ A, chữ H, chữ O...)
    2. Đề xuất 4-6 bài tập gym phù hợp để cải thiện tỷ lệ cơ thể cân đối hơn
    3. Đưa ra lời khuyên dinh dưỡng và lối sống
    4. Ước tính thời gian để thấy kết quả (nếu tập đều đặn)
    
    Vui lòng trả lời bằng tiếng Việt, định dạng JSON với cấu trúc:
    {{
        "body_type": "Loại vóc dáng (VD: Dáng chữ V, Dáng táo...)",
        "body_analysis": "Phân tích chi tiết vóc dáng hiện tại",
        "title": "Tiêu đề chương trình tập luyện",
        "exercises": [
            "Tên bài tập 1: Mô tả chi tiết, số lượng set/rep",
            "Tên bài tập 2: Mô tả chi tiết, số lượng set/rep"
        ],
        "nutrition_advice": "Lời khuyên dinh dưỡng cụ thể",
        "lifestyle_tips": "Lời khuyên về lối sống, nghỉ ngơi",
        "estimated_timeline": "Thời gian ước tính để thấy kết quả",
        "general_advice": "Lời khuyên chung"
    }}
    
    Chỉ trả về JSON, không có văn bản nào khác.
    """
    
    try:
        response = _gemini_generate_json(prompt, timeout_sec=120)
        text_response = getattr(response, 'text', None) or ''
        
        # Tìm và parse JSON
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        
        if json_start != -1 and json_end != -1 and json_start < json_end:
            json_str = text_response[json_start:json_end]
            recommendations = json.loads(json_str)
            
            # Thêm số đo vào kết quả
            recommendations['measurements'] = measurements
            recommendations['unit'] = unit
            
            return recommendations
        else:
            raise ValueError(f"Gemini không trả về JSON hợp lệ: {text_response}")
            
    except Exception as e:
        print(f"Lỗi khi gọi Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi Gemini API: {e}")

# --- ENDPOINT API ---

@app.post("/analyze-image/")
async def analyze_image(
    file: UploadFile = File(...),
    known_height_cm: Optional[float] = Form(None)
):
    """
    Phân tích ảnh tư thế và trả về các số đo cơ thể kèm gợi ý từ Gemini AI.
    
    Args:
        file: File ảnh upload
        known_height_cm: Chiều cao thực tế (cm) - optional, để quy đổi sang cm
    
    Returns:
        JSON chứa:
        - analysis_data: Phân tích từ Gemini
        - measurements: Các số đo chi tiết (px và cm nếu có)
        - processed_image_url: URL ảnh đã xử lý
    """
    # Đọc file ảnh
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Không thể đọc file ảnh.")
    
    print(f"\n{'='*60}")
    print(f"Đang xử lý ảnh: {file.filename}")
    if known_height_cm:
        print(f"Chiều cao thực tế: {known_height_cm} cm")
    print(f"{'='*60}\n")
    
    # Phân tích tư thế với YOLO (bọc try để không rơi 500 chung chung)
    try:
        annotated_image, ratio, measurements = analyze_pose_with_yolo(
            yolo_model,
            image,
            known_height_cm=known_height_cm,
        )
    except Exception as e:
        print(f"✗ Lỗi khi chạy YOLO/pose analyzer: {e}")
        raise HTTPException(status_code=500, detail=f"Pose analysis failed: {e}")
    
    # Khởi tạo response mặc định
    response_data = {
        "success": False,
        "message": "Không phát hiện được cơ thể trong ảnh",
        "analysis_data": {
            "body_type": "Không xác định",
            "body_analysis": "Không thể phân tích",
            "title": "Không phát hiện được cơ thể", 
            "exercises": [], 
            "nutrition_advice": "",
            "lifestyle_tips": "",
            "estimated_timeline": "",
            "general_advice": "Vui lòng thử lại với ảnh rõ ràng hơn, đứng thẳng và toàn thân."
        },
        "measurements": None,
        "processed_image_url": None
    }
    
    # Nếu phát hiện được cơ thể và có đủ số đo
    if annotated_image is not None and measurements is not None:
        # Kiểm tra xem có đủ số đo quan trọng không
        has_valid_measurements = (
            measurements["confidence_flags"].get("shoulder_width") and
            measurements["confidence_flags"].get("hip_width") and
            measurements["confidence_flags"].get("height")
        )
        
        if has_valid_measurements:
            print("✓ Phát hiện đầy đủ các điểm khớp quan trọng")
            print(f"✓ Số đo pixel: {measurements['pixel_measurements']}")
            if measurements['cm_measurements']:
                print(f"✓ Số đo cm: {measurements['cm_measurements']}")
            
            # Gọi Gemini để phân tích
            try:
                gemini_recommendations = get_gemini_recommendations(measurements)

                # Bổ sung phân loại từ module đo lường (nếu có)
                cls = measurements.get("classifications") or {}
                if cls.get("shape_type"):
                    gemini_recommendations["shape_type"] = cls["shape_type"]
                if cls.get("somatotype"):
                    gemini_recommendations["somatotype"] = cls["somatotype"]

                # Chuẩn hóa trường advice cho FE (fallback từ các trường khác)
                if "advice" not in gemini_recommendations:
                    gemini_recommendations["advice"] = (
                        gemini_recommendations.get("general_advice")
                        or gemini_recommendations.get("nutrition_advice")
                        or ""
                    )

                response_data = {
                    "success": True,
                    "message": "Phân tích thành công",
                    "analysis_data": gemini_recommendations,
                    "measurements": {
                        "pixel_measurements": measurements["pixel_measurements"],
                        "cm_measurements": measurements["cm_measurements"],
                        "scale_cm_per_px": measurements["scale_cm_per_px"],
                        "confidence_flags": measurements["confidence_flags"],
                        "classifications": measurements.get("classifications", {})
                    },
                    "processed_image_url": None  # Sẽ cập nhật bên dưới
                }

                print("✓ Đã nhận phân tích từ Gemini AI")
                
            except Exception as e:
                print(f"✗ Lỗi khi gọi Gemini: {e}")
                response_data["message"] = f"Phát hiện cơ thể nhưng lỗi phân tích AI: {str(e)}"
                response_data["measurements"] = {
                    "pixel_measurements": measurements["pixel_measurements"],
                    "cm_measurements": measurements["cm_measurements"],
                    "scale_cm_per_px": measurements["scale_cm_per_px"],
                    "confidence_flags": measurements["confidence_flags"]
                }
        else:
            print("✗ Không đủ điểm khớp để phân tích")
            missing_parts = []
            if not measurements["confidence_flags"].get("shoulder_width"):
                missing_parts.append("vai")
            if not measurements["confidence_flags"].get("hip_width"):
                missing_parts.append("hông")
            if not measurements["confidence_flags"].get("height"):
                missing_parts.append("chiều cao")
            
            response_data["message"] = f"Không phát hiện rõ: {', '.join(missing_parts)}"
    
    # Lưu ảnh đã xử lý (dù có phát hiện hay không)
    try:
        output_filename = f"processed_{file.filename}"
        output_path = os.path.join("processed_images", output_filename)

        if annotated_image is not None:
            cv2.imwrite(output_path, annotated_image)
        else:
            # Nếu không có kết quả, lưu ảnh gốc
            cv2.imwrite(output_path, image)

        image_url = f"http://localhost:8000/processed/{output_filename}"
        response_data["processed_image_url"] = image_url

        print(f"\n✓ Đã lưu ảnh xử lý: {output_path}")
        print(f"{'='*60}\n")
    except Exception as e:
        print(f"✗ Lỗi khi lưu ảnh xử lý: {e}")
    
    return response_data

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Fitnexus AI Trainer API",
        "version": "2.0",
        "features": [
            "YOLOv8 Pose Detection",
            "Body Measurements (px and cm)",
            "Gemini AI Analysis",
            "Personalized Workout Recommendations"
        ]
    }

@app.get("/health")
async def health_check():
    """Kiểm tra trạng thái của các services"""
    return {
        "yolo_model": "loaded" if yolo_model else "failed",
        "gemini_api": "configured" if GEMINI_API_KEY else "not_configured",
        "processed_images_dir": os.path.exists("processed_images")
    }

# Lệnh để chạy server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
