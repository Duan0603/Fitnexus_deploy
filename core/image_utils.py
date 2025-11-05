# core/image_utils.py
import cv2
from PIL import Image, ImageDraw, ImageFont

def draw_text_with_pillow(image, text, position, font_size, color):
    """
    Vẽ văn bản lên ảnh sử dụng Pillow để hỗ trợ font TrueType và UTF-8.
    """
    try:
        # Chuyển đổi ảnh OpenCV (BGR) sang ảnh Pillow (RGB)
        # SỬA LỖI: cv -> cv2
        pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img)
        
        # Cố gắng tải một font chữ phổ biến, nếu không được thì dùng font mặc định
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()
            
        draw.text(position, text, font=font, fill=color)
        
        # Chuyển đổi lại sang định dạng OpenCV để hiển thị và lưu
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"Lỗi khi vẽ text: {e}. Trả về ảnh gốc.")
        # Nếu có lỗi (ví dụ thiếu thư viện), trả về ảnh gốc để không làm crash chương trình
        cv2.putText(image, text, position, cv2.FONT_HERSHEY_SIMPLEX, font_size/30, (b, g, r), 2)
        return image