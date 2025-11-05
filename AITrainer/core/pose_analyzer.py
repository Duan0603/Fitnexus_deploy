# core/pose_analyzer.py
import cv2
from ultralytics import YOLO
import numpy as np

# Các chỉ số của keypoint theo mô hình YOLOv8-pose
# Vai trái: 5, Vai phải: 6
# Hông trái: 11, Hông phải: 12
YOLO_KP_INDICES = {
    "nose": 0,
    "left_eye": 1,
    "right_eye": 2,
    "left_ear": 3,
    "right_ear": 4,
    "left_shoulder": 5,
    "right_shoulder": 6,
    "left_elbow": 7,
    "right_elbow": 8,
    "left_wrist": 9,
    "right_wrist": 10,
    "left_hip": 11,
    "right_hip": 12,
    "left_knee": 13,
    "right_knee": 14,
    "left_ankle": 15,
    "right_ankle": 16,
}

def load_yolo_model(model_path='yolov8n-pose.pt'):
    """Tải mô hình YOLOv8-pose đã được huấn luyện sẵn."""
    try:
        model = YOLO(model_path)
        print("Đã tải YOLOv8-pose model thành công.")
        return model
    except Exception as e:
        print(f"Lỗi khi tải mô hình YOLOv8: {e}")
        return None

def _euclidean_distance(p1, p2): 
    """Dùng thuật toán tính khoảng cách Eucliden giữa 2 điểm (x1, y1) và (x2, y2)"""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def _get_keypoint_coords(keypoints, key_name):
    """Lấy toạ độ (x, y , confidence) của keypoint theo tên"""
    idx = YOLO_KP_INDICES[key_name]
    x, y, conf = keypoints[idx]
    return x, y, conf

def _calculate_measurements_from_keypoints(keypoints, known_height_cm=None):
    """
    Tính toán các số đo cơ thể từ keypoints.

    Returns: 
        dict: Dictonary chứa các số đo (px và cm có known_height_cm)

    """
    measurements = {
        "pixel_measurements": {},
        "cm_measurements": {},
        "scale_cm_per_px": None,
        "confidence_flags": {}
    }

    try :
        # Lất toạ độ các điểm cần thiết
        ls_x, ls_y, ls_conf = _get_keypoint_coords(keypoints, "left_shoulder")
        rs_x, rs_y, rs_conf = _get_keypoint_coords(keypoints, "right_shoulder")
        lh_x, lh_y, lh_conf = _get_keypoint_coords(keypoints, "left_hip")
        rh_x, rh_y, rh_conf = _get_keypoint_coords(keypoints, "right_hip")
        la_x, la_y, la_conf = _get_keypoint_coords(keypoints, "left_ankle")
        ra_x, ra_y, ra_conf = _get_keypoint_coords(keypoints, "right_ankle")

        # 1. Shoulder width
        if min(ls_conf, rs_conf) >= 0.5:
            shoulder_width_px = _euclidean_distance((ls_x, ls_y), (rs_x, rs_y))
            measurements["pixel_measurements"]["shoulder_width"] = float(shoulder_width_px)
            measurements["confidence_flags"]["shoulder_width"] = True
        else :
            measurements["confidence_flags"]["shoulder_width"] = False
            print("Cảnh báo : Độ tin cậy vai được đưa ra trong trường hợp này không cao")
        
        # 2. Hip width
        if min(lh_conf, rh_conf) >= 0.5:
            hip_width_px = _euclidean_distance((lh_x, lh_y), (rh_x, rh_y))
            measurements["pixel_measurements"]["hip_width"] = float(hip_width_px)
            measurements["confidence_flags"]["hip_width"] = True
        else:
            measurements["confidence_flags"]["hip_width"] = False
            print("Cảnh báo: Độ tin cậy hông được phân tích ra từ ảnh không cao")

        # 3. Waist width : Phân được suy ra từ vị trí vai và hông
        # Giả định eo nằm ở khoảng 60% từ vai xuống hông

        if min(ls_conf, rs_conf, lh_conf, rh_conf) >= 0.5:
            waist_ratio = 0.6  # Có thể điều chỉnh tỷ lệ này
            
            # Tính điểm eo trái (nội suy giữa vai trái và hông trái)
            left_waist_x = ls_x + waist_ratio * (lh_x - ls_x)
            left_waist_y = ls_y + waist_ratio * (lh_y - ls_y)
            
            # Tính điểm eo phải (nội suy giữa vai phải và hông phải)
            right_waist_x = rs_x + waist_ratio * (rh_x - rs_x)
            right_waist_y = rs_y + waist_ratio * (rh_y - rs_y)
            
            waist_width_px = _euclidean_distance(
                (left_waist_x, left_waist_y), 
                (right_waist_x, right_waist_y)
            )
            measurements["pixel_measurements"]["waist_width"] = float(waist_width_px)
            measurements["confidence_flags"]["waist_width"] = True
            
            # Lưu tọa độ điểm eo để vẽ sau này
            measurements["waist_points"] = {
                "left": (left_waist_x, left_waist_y),
                "right": (right_waist_x, right_waist_y)
            }
        else:
            measurements["confidence_flags"]["waist_width"] = False
            print("Cảnh báo: Không thể tính chiều rộng eo")

        # 4. Height (chiều cao tổng thể)
        # Lấy rẩ cả các điểm có độ tin cậy > 0.3
        valid_y_coords = []
        for kp in keypoints:
            x, y, conf = kp
            if conf > 0.3: 
                valid_y_coords.append(y)

        if len(valid_y_coords) >= 2:
            height_px = (max(valid_y_coords) - min(valid_y_coords))
            measurements["pixel_measurements"]["height"] = float(height_px)
            measurements["confidence_flags"]["height"] = True
        else :
            measurements["confidence_flags"]["height"] = False
            print("Cảnh báo, không đủ thông tin cùng keypoints để tính chiều cao")
        
        # 5. Leg length (độ dài chân)
        if min(lh_conf, rh_conf, la_conf, ra_conf) >= 0.5:
            # Tính điểm giữa hông
            mid_hip_x = (lh_x + rh_x) / 2
            mid_hip_y = (lh_y + rh_y) / 2
            
            # Tính điểm giữa mắt cá chân
            mid_ankle_x = (la_x + ra_x) / 2
            mid_ankle_y = (la_y + ra_y) / 2
            
            leg_length_px = _euclidean_distance(
                (mid_hip_x, mid_hip_y), 
                (mid_ankle_x, mid_ankle_y)
            )
            measurements["pixel_measurements"]["leg_length"] = float(leg_length_px)
            measurements["confidence_flags"]["leg_length"] = True
            
            # Lưu tọa độ để vẽ
            measurements["leg_points"] = {
                "mid_hip": (mid_hip_x, mid_hip_y),
                "mid_ankle": (mid_ankle_x, mid_ankle_y)
            }
        else:
            measurements["confidence_flags"]["leg_length"] = False
            print("Cảnh báo: Độ tin cậy chân thấp, cung cấp thêm hình ảnh để rõ ràng hơn")

        # 6. Tính tỷ lệ vai/hông và eo/hông
        if ("shoulder_width" in measurements["pixel_measurements"] and 
            "hip_width" in measurements["pixel_measurements"]):
            hip_width = measurements["pixel_measurements"]["hip_width"]
            if hip_width > 0:
                ratio = measurements["pixel_measurements"]["shoulder_width"] / hip_width
                measurements["pixel_measurements"]["shoulder_hip_ratio"] = float(ratio)
        if ("waist_width" in measurements["pixel_measurements"] and
            "hip_width" in measurements["pixel_measurements"]):
            hip_width = measurements["pixel_measurements"]["hip_width"]
            if hip_width > 0:
                whr = measurements["pixel_measurements"]["waist_width"] / hip_width
                measurements["pixel_measurements"]["waist_hip_ratio"] = float(whr)
        
        # 7. Quy đổi sang cm nếu có known_height_cm
        if known_height_cm and "height" in measurements["pixel_measurements"]:
            height_px = measurements["pixel_measurements"]["height"]
            if height_px > 0:
                scale_cm_per_px = known_height_cm / height_px
                measurements["scale_cm_per_px"] = float(scale_cm_per_px)

                # Quy đổi tất cả các số đo sang cm 
                for key, value_px in measurements["pixel_measurements"].items():
                    if key != "shoulder_hip_ratio": # Tỷ lệ không cần quy đổi
                        try:
                            measurements["cm_measurements"][key] = float(value_px) * float(scale_cm_per_px)
                        except Exception:
                            continue

                print(f"Tỉ lệ quy đổi: {scale_cm_per_px} cm/pixel")
        
        # 8. Phân loại hình dáng (shape) và cơ địa (somatotype) — heuristic đơn giản
        try:
            shp = measurements["pixel_measurements"].get("shoulder_hip_ratio")
            whr = measurements["pixel_measurements"].get("waist_hip_ratio")
            height_px = measurements["pixel_measurements"].get("height") or 0.0
            leg_px = measurements["pixel_measurements"].get("leg_length") or 0.0
            shoulder_px = measurements["pixel_measurements"].get("shoulder_width") or 0.0

            def classify_shape(shp, whr):
                if shp is None or whr is None:
                    return None
                if shp > 1.15 and whr < 0.9:
                    return "Inverted Triangle"
                if shp < 0.9 and (whr >= 0.9):
                    return "Triangle"
                if abs(shp - 1.0) <= 0.1 and 0.9 <= whr <= 1.05:
                    return "Rectangle"
                if shp >= 1.0 and whr < 1.0:
                    return "Inverted Triangle"
                if shp < 1.0 and whr >= 1.0:
                    return "Triangle"
                return "Rectangle"

            def classify_somatotype(shoulder_px, height_px, leg_px, whr):
                if not height_px or height_px <= 0:
                    return None
                sh_over_h = float(shoulder_px) / float(height_px)
                leg_over_h = float(leg_px) / float(height_px) if height_px else 0.0
                if sh_over_h < 0.23 and leg_over_h > 0.53 and (whr is not None and whr <= 0.9):
                    return "Ectomorph"
                if 0.23 <= sh_over_h <= 0.27 and (whr is not None and 0.85 <= whr <= 0.95) and 0.49 <= leg_over_h <= 0.53:
                    return "Mesomorph"
                if (whr is not None and whr >= 0.95) or sh_over_h > 0.27:
                    return "Endomorph"
                return "Mesomorph"

            measurements["classifications"] = {
                "shape_type": classify_shape(shp, whr),
                "somatotype": classify_somatotype(shoulder_px, height_px, leg_px, whr),
            }
        except Exception:
            measurements["classifications"] = measurements.get("classifications", {})

        return measurements
    except (IndexError, KeyError) as e:
        print(f"Lỗi: không đủ keypoints để tính toán - {e}")
        return measurements

def _calculate_ratio_from_keypoints(keypoints):
    """Tính toán tỷ lệ vai/hông từ các keypoints."""
    try:
        # Lấy tọa độ X và độ tin cậy của các điểm cần thiết
        ls_x, _, ls_conf = keypoints[YOLO_KP_INDICES["left_shoulder"]]
        rs_x, _, rs_conf = keypoints[YOLO_KP_INDICES["right_shoulder"]]
        lh_x, _, lh_conf = keypoints[YOLO_KP_INDICES["left_hip"]]
        rh_x, _, rh_conf = keypoints[YOLO_KP_INDICES["right_hip"]]

        # Chỉ tính toán nếu tất cả các điểm đều được phát hiện với độ tin cậy > 0.5
        if min(ls_conf, rs_conf, lh_conf, rh_conf) < 0.5:
            print("Cảnh báo: Không thể xác định rõ tất cả các khớp vai và hông.")
            return None

        shoulder_width = abs(ls_x - rs_x)
        hip_width = abs(lh_x - rh_x)

        if hip_width > 0:
            return shoulder_width / hip_width
        return None
    except IndexError:
        print("Lỗi: Không đủ keypoints để tính toán tỷ lệ.")
        return None
    

def draw_measurements_on_image(image, measurements, keypoints):
    """Vẽ các đường đo và số đo lên ảnh."""
    annotated_img = image.copy()
    
    # Màu sắc
    COLOR_SHOULDER = (255, 0, 0)  # Đỏ
    COLOR_HIP = (0, 255, 0)       # Xanh lá
    COLOR_WAIST = (0, 255, 255)   # Vàng
    COLOR_LEG = (255, 0, 255)     # Tím
    
    # Vẽ đường vai
    if measurements["confidence_flags"].get("shoulder_width"):
        ls_x, ls_y, _ = _get_keypoint_coords(keypoints, "left_shoulder")
        rs_x, rs_y, _ = _get_keypoint_coords(keypoints, "right_shoulder")
        cv2.line(annotated_img, (int(ls_x), int(ls_y)), (int(rs_x), int(rs_y)), 
                 COLOR_SHOULDER, 2)
    
    # Vẽ đường hông
    if measurements["confidence_flags"].get("hip_width"):
        lh_x, lh_y, _ = _get_keypoint_coords(keypoints, "left_hip")
        rh_x, rh_y, _ = _get_keypoint_coords(keypoints, "right_hip")
        cv2.line(annotated_img, (int(lh_x), int(lh_y)), (int(rh_x), int(rh_y)), 
                 COLOR_HIP, 2)
    
    # Vẽ đường eo
    if measurements["confidence_flags"].get("waist_width") and "waist_points" in measurements:
        left_waist = measurements["waist_points"]["left"]
        right_waist = measurements["waist_points"]["right"]
        cv2.line(annotated_img, 
                 (int(left_waist[0]), int(left_waist[1])),
                 (int(right_waist[0]), int(right_waist[1])),
                 COLOR_WAIST, 2)
        cv2.circle(annotated_img, (int(left_waist[0]), int(left_waist[1])), 
                   5, COLOR_WAIST, -1)
        cv2.circle(annotated_img, (int(right_waist[0]), int(right_waist[1])), 
                   5, COLOR_WAIST, -1)
    
    # Vẽ đường chân
    if measurements["confidence_flags"].get("leg_length") and "leg_points" in measurements:
        mid_hip = measurements["leg_points"]["mid_hip"]
        mid_ankle = measurements["leg_points"]["mid_ankle"]
        cv2.line(annotated_img, 
                 (int(mid_hip[0]), int(mid_hip[1])),
                 (int(mid_ankle[0]), int(mid_ankle[1])),
                 COLOR_LEG, 2)
    
    # Vẽ text số đo
    y_offset = 30
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    
    # Hiển thị số đo cm nếu có, không thì hiển thị px
    if measurements["cm_measurements"]:
        measurements_to_display = measurements["cm_measurements"]
        unit = "cm"
    else:
        measurements_to_display = measurements["pixel_measurements"]
        unit = "px"
    
    for key, value in measurements_to_display.items():
        if key != "shoulder_hip_ratio":
            text = f"{key}: {value:.1f} {unit}"
            cv2.putText(annotated_img, text, (10, y_offset), 
                       font, font_scale, (255, 255, 255), 2)
            y_offset += 25
    
    # Hiển thị tỷ lệ vai/hông
    if "shoulder_hip_ratio" in measurements["pixel_measurements"]:
        ratio = measurements["pixel_measurements"]["shoulder_hip_ratio"]
        text = f"Shoulder/Hip ratio: {ratio:.2f}"
        cv2.putText(annotated_img, text, (10, y_offset), 
                   font, font_scale, (255, 255, 255), 2)
    
    return annotated_img

def analyze_pose_with_yolo(model, image, known_height_cm=None):
    """
    Phân tích ảnh bằng YOLO, trả về ảnh đã vẽ, tỷ lệ và các số đo.    
    Args:
        model: YOLO model
        image: Ảnh đầu vào
        known_height_cm: Chiều cao thực tế (cm) để quy đổi, None nếu không có
    
    Returns:
        tuple: (annotated_image, ratio, measurements)
    """
    results = model(image)

    if not results or not results[0].keypoints:
        return None, None, None

    keypoints_tensor = results[0].keypoints.data[0]
    keypoints_list = keypoints_tensor.cpu().numpy()

    if len(keypoints_list) == 0:
        return None, None, None

    # Vẽ kết quả lên ảnh
    annotated_image = results[0].plot()

    # Tính toán các số đo chi tiết
    measurements = _calculate_measurements_from_keypoints(keypoints_list, known_height_cm)
    
    # Vẽ thêm các đường đo lên ảnh
    annotated_image = draw_measurements_on_image(annotated_image, measurements, keypoints_list)

    # Tính toán tỷ lệ
    ratio = _calculate_ratio_from_keypoints(keypoints_list)

    return annotated_image, ratio, measurements
