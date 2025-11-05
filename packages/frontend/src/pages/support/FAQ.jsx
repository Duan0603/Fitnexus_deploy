import React, { useState } from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openItems, setOpenItems] = useState(new Set());

  const categories = [
    { value: "all", label: "Tất cả" },
    { value: "account", label: "Tài khoản" },
    { value: "workout", label: "Tập luyện" },
    { value: "technical", label: "Kỹ thuật" },
    { value: "billing", label: "Thanh toán" }
  ];

  const faqData = getLegacyFaq()
    .map(faq => (faq.id === 8 ? {
      ...faq,
      category: "technical",
      question: "Làm thế nào để dùng Nutrition AI phân tích bữa ăn?",
      answer: "Vào Dinh dưỡng > Nutrition AI, tải ảnh món ăn hoặc nhập mô tả. Hệ thống sẽ ước tính calories và các chỉ số macro, bạn có thể lưu vào nhật ký bữa ăn của mình."
    } : faq))
    .concat([
      {
        id: 9,
        category: "workout",
        question: "Làm sao xem mô hình 3D hướng dẫn động tác?",
        answer: "Mở một bài tập bất kỳ rồi chọn nút 'Mô hình 3D'. Bạn có thể xoay, phóng to/thu nhỏ để quan sát kỹ nhóm cơ và chuyển động."
      },
      {
        id: 10,
        category: "workout",
        question: "Làm sao bắt đầu Onboarding để nhận kế hoạch tập?",
        answer: "Tại trang chủ chọn 'Nhận kế hoạch luyện tập', đăng nhập và trả lời các câu hỏi Onboarding (tuổi, cân nặng, mục tiêu...). Ứng dụng sẽ tự động tạo kế hoạch phù hợp cho bạn."
      }
    ]);

  function getLegacyFaq() { return [
    {
      id: 1,
      category: "account",
      question: "Làm thế nào để đổi mật khẩu?",
      answer: "Bạn có thể đổi mật khẩu bằng cách vào Tài khoản > Đổi mật khẩu. Nhập mật khẩu hiện tại và mật khẩu mới, sau đó xác nhận mật khẩu mới."
    },
    {
      id: 2,
      category: "workout",
      question: "Làm thế nào để tạo kế hoạch tập luyện mới?",
      answer: "Để tạo kế hoạch tập luyện mới, hãy vào Luyện tập > Tạo plan mới. Chọn mục tiêu của bạn, thời gian tập luyện và các bài tập yêu thích. Hệ thống sẽ tự động tạo kế hoạch phù hợp."
    },
    {
      id: 3,
      category: "technical",
      question: "Ứng dụng không hoạt động trên thiết bị của tôi, phải làm sao?",
      answer: "Hãy thử các bước sau: 1) Khởi động lại ứng dụng, 2) Kiểm tra kết nối internet, 3) Cập nhật ứng dụng lên phiên bản mới nhất, 4) Khởi động lại thiết bị. Nếu vẫn không được, hãy liên hệ hỗ trợ."
    },
    {
      id: 4,
      category: "workout",
      question: "Tôi có thể tùy chỉnh bài tập trong kế hoạch không?",
      answer: "Có, bạn hoàn toàn có thể tùy chỉnh kế hoạch tập luyện. Vào Kế hoạch của tôi, chọn kế hoạch muốn chỉnh sửa, sau đó thêm, xóa hoặc thay thế các bài tập theo ý muốn."
    },
    {
      id: 5,
      category: "account",
      question: "Làm thế nào để xóa tài khoản?",
      answer: "Để xóa tài khoản, hãy vào Cài đặt > Tài khoản > Xóa tài khoản. Lưu ý rằng hành động này không thể hoàn tác và tất cả dữ liệu sẽ bị mất vĩnh viễn."
    },
    {
      id: 6,
      category: "technical",
      question: "Tại sao video bài tập không phát được?",
      answer: "Vấn đề này có thể do: 1) Kết nối internet chậm, 2) Trình duyệt không hỗ trợ, 3) Chặn quảng cáo. Hãy thử tắt chặn quảng cáo, sử dụng trình duyệt khác hoặc kiểm tra kết nối mạng."
    },
    {
      id: 7,
      category: "billing",
      question: "Làm thế nào để hủy gói Premium?",
      answer: "Bạn có thể hủy gói Premium bất kỳ lúc nào trong Cài đặt > Tài khoản > Quản lý gói. Gói sẽ tiếp tục hoạt động đến hết chu kỳ thanh toán hiện tại."
    },
    {
      id: 8,
      category: "workout",
      question: "Làm thế nào để theo dõi tiến độ tập luyện?",
      answer: "Vào Hồ sơ > Thống kê để xem tổng quan tiến độ. Bạn có thể theo dõi số buổi tập, thời gian, calo đốt cháy và các thành tích đạt được."
    }
  ]; }

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h1>
          <p className="text-lg text-gray-600">Tìm câu trả lời cho các câu hỏi phổ biến</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(faq => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems.has(faq.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openItems.has(faq.id) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-gray-600">Hãy thử từ khóa khác hoặc danh mục khác</p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy câu trả lời?</h3>
            <p className="text-gray-600 mb-4">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp đỡ bạn</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Liên hệ hỗ trợ
              </button>
              <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
                Gửi email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
