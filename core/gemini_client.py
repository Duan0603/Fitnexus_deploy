# core/gemini_client.py
import google.generativeai as genai
from google.api_core import exceptions
import config

def get_gemini_recommendations(ratio):
    """Gọi Gemini API để lấy gợi ý bài tập dựa trên tỷ lệ."""
    try:
        genai.configure(api_key=config.API_KEY)
        
        # --- THAY ĐỔI DUY NHẤT Ở ĐÂY ---
        # Sử dụng model gemini-1.5-flash-latest mới và nhanh hơn
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        # -------------------------------

        prompt = f"""
        Bạn là một huấn luyện viên thể hình AI chuyên nghiệp, có kiến thức sâu rộng về thể chất và dinh dưỡng. 
        Nhiệm vụ của bạn là phân tích chỉ số hình thể và đưa ra một kế hoạch hành động chi tiết, an toàn và hiệu quả.

        **DỮ LIỆU PHÂN TÍCH:**
        - Tỷ lệ xương vai trên xương hông (Shoulder-to-Hip Ratio) ước tính từ ảnh: **{ratio:.2f}**

        **YÊU CẦU:**
        Dựa trên chỉ số trên, hãy thực hiện các bước sau:

        1.  **PHÂN TÍCH VÓC DÁNG:**
            - Đưa ra nhận định về dáng người dựa trên tỷ lệ. Sử dụng các quy tắc sau:
                - Nếu tỷ lệ > 1.45: Kết luận là "Dáng tam giác ngược (vai rộng hơn hông đáng kể)".
                - Nếu tỷ lệ < 1.05: Kết luận là "Dáng quả lê (hông rộng hơn vai)".
                - Nếu tỷ lệ nằm giữa 1.05 và 1.45: Kết luận là "Dáng chữ nhật (tương đối cân đối)".

        2.  **CHIẾN LƯỢC TẬP LUYỆN:**
            - Dựa vào phân tích ở trên, đề xuất một chiến lược tập luyện tổng thể. Ví dụ: "Tập trung phát triển phần thân dưới để tạo sự cân đối" hoặc "Tăng cường các bài tập cho vai và lưng để mở rộng thân trên".

        3.  **BÀI TẬP GỢI Ý (3-4 BÀI):**
            - Liệt kê 3 đến 4 bài tập cụ thể phù hợp với chiến lược.
            - Với mỗi bài tập, giải thích ngắn gọn (1-2 dòng) lý do tại sao nó hiệu quả cho dáng người này.

        4.  **LƯU Ý QUAN TRỌNG:**
            - Thêm một lời khuyên về tầm quan trọng của việc khởi động, dinh dưỡng, hoặc lắng nghe cơ thể.

        **ĐỊNH DẠNG TRẢ LỜI:**
        - Sử dụng Markdown để trình bày. Dùng tiêu đề in đậm (ví dụ: **1. PHÂN TÍCH VÓC DÁNG**).
        - Ngôn ngữ chuyên nghiệp, tích cực và khuyến khích.
        """

        print(f"\nĐang gọi Gemini API với tỉ lệ {ratio:.2f}...")
        response = model.generate_content(prompt)
        return response.text

    except exceptions.ResourceExhausted as e:
        print(f"Lỗi khi gọi Gemini API: {e}")
        return "Lỗi: Đã vượt quá giới hạn (Quota) của API. Vui lòng kiểm tra tài khoản Google Cloud của bạn đã bật thanh toán (Billing) và API đã được kích hoạt. Thử lại sau 1 phút."
    except Exception as e:
        print(f"Lỗi khi gọi Gemini API: {e}")
        return f"Lỗi không xác định khi gọi Gemini API: {str(e)}"