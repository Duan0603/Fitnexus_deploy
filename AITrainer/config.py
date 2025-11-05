import os
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# Lấy API key
API_KEY = os.getenv("GEMINI_API_KEY")

# Kiểm tra xem API key có tồn tại không
if not API_KEY:
    raise ValueError("Lỗi: GEMINI_API_KEY không được tìm thấy. Vui lòng tạo file .env và đặt API key của bạn vào đó.")