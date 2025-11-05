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
import io
import cloudinary
import cloudinary.uploader

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

# Tải khóa API và cấu hình từ biến môi trường
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")

if not GEMINI_API_KEY:
    print("LỖI: Biến môi trường GEMINI_API_KEY chưa được thiết lập.")
    sys.exit(1)

if not CLOUDINARY_URL:
    print("LỖI: Biến môi trường CLOUDINARY_URL chưa được thiết lập.")
    sys.exit(1)

# Cấu hình Gemini và Cloudinary
genai.configure(api_key=GEMINI_API_KEY)

print("Khởi tạo cấu hình Gemini API và Cloudinary...")

# Chuẩn bị danh sách model fallback
GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL") or "gemini-1.5-flash-latest",
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

FONT_PATH = "ARIAL.TTF"
if not os.path.exists(FONT_PATH):
    print(f"CẢNH BÁO: Không tìm thấy tệp font '{FONT_PATH}'.")

# --- CÁC HÀM XỬ LÝ ---

def get_gemini_recommendations(measurements_data):
    # ... (giữ nguyên hàm này)
    if measurements_data.get("cm_measurements"):
        measurements = measurements_data["cm_measurements"]
        unit = "cm"
    else:
        measurements = measurements_data.get("pixel_measurements", {})
        unit = "px"
    
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
        
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        
        if json_start != -1 and json_end != -1 and json_start < json_end:
            json_str = text_response[json_start:json_end]
            recommendations = json.loads(json_str)
            
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
    
    try:
        annotated_image, ratio, measurements = analyze_pose_with_yolo(
            yolo_model,
            image,
            known_height_cm=known_height_cm,
        )
    except Exception as e:
        print(f"✗ Lỗi khi chạy YOLO/pose analyzer: {e}")
        raise HTTPException(status_code=500, detail=f"Pose analysis failed: {e}")
    
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
    
    image_to_upload = image if annotated_image is None else annotated_image
    uploaded_image_url = None

    try:
        # Chuyển ảnh từ OpenCV (BGR) sang RGB
        img_rgb = cv2.cvtColor(image_to_upload, cv2.COLOR_BGR2RGB)
        # Chuyển thành đối tượng ảnh của Pillow
        pil_img = Image.fromarray(img_rgb)
        
        # Tạo một buffer byte để lưu ảnh
        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()

        # Tải ảnh lên Cloudinary
        upload_result = cloudinary.uploader.upload(
            img_byte_arr,
            folder="fitnexus_ai_trainer",
            public_id=f"processed_{os.path.splitext(file.filename)[0]}",
            overwrite=True,
            resource_type="image"
        )
        uploaded_image_url = upload_result.get("secure_url")
        response_data["processed_image_url"] = uploaded_image_url
        print(f"\n✓ Đã tải ảnh lên Cloudinary: {uploaded_image_url}")

    except Exception as e:
        print(f"✗ Lỗi khi tải ảnh lên Cloudinary: {e}")
        # Không dừng lại nếu chỉ lỗi upload ảnh, vẫn trả về kết quả phân tích
        response_data["message"] += " (Lỗi lưu ảnh xử lý)"


    if annotated_image is not None and measurements is not None:
        has_valid_measurements = (
            measurements["confidence_flags"].get("shoulder_width") and
            measurements["confidence_flags"].get("hip_width") and
            measurements["confidence_flags"].get("height")
        )
        
        if has_valid_measurements:
            print("✓ Phát hiện đầy đủ các điểm khớp quan trọng")
            try:
                gemini_recommendations = get_gemini_recommendations(measurements)
                # ... (phần còn lại của logic xử lý gemini)
                response_data.update({
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
                })
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
            missing_parts = [part for part, found in measurements["confidence_flags"].items() if not found and part in ["shoulder_width", "hip_width", "height"]]
            response_data["message"] = f"Không phát hiện rõ: {', '.join(missing_parts)}"
    
    print(f"{'='*60}\n")
    return response_data

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Fitnexus AI Trainer API",
        "version": "2.0",
    }

@app.get("/health")
async def health_check():
    return {
        "yolo_model": "loaded" if yolo_model else "failed",
        "gemini_api": "configured" if GEMINI_API_KEY else "not_configured",
        "cloudinary": "configured" if CLOUDINARY_URL else "not_configured",
    }

# Lệnh để chạy server
if __name__ == "__main__":
    # Port sẽ được Render cung cấp qua biến môi trường PORT
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
