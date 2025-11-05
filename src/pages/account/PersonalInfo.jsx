import React, { useState } from "react";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { validatePhone } from "../../lib/phoneValidation.js";
import { validateEmail } from "../../lib/emailValidation.js";
import { useAvailabilityCheck } from "../../hooks/useAvailabilityCheck.js";
import Alert from "../../components/common/Alert.jsx";
import { api, endpoints } from "../../lib/api.js";

export default function PersonalInfo() {
  const { user, updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    fullName: user?.fullName || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Kiểm tra availability cho phone và email (chỉ khi khác với giá trị hiện tại)
  const phoneCheck = useAvailabilityCheck(
    formData.phone !== user?.phone ? formData.phone : "", 
    'phone'
  );
  const emailCheck = useAvailabilityCheck(
    formData.email !== user?.email ? formData.email : "", 
    'email'
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate email
      if (formData.email && formData.email !== user?.email) {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
          setError(emailValidation.message);
          return;
        }
        if (emailCheck.isAvailable === false) {
          setError(emailCheck.error || 'Email đã tồn tại');
          return;
        }
      }

      // Validate phone
      if (formData.phone && formData.phone !== user?.phone) {
        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.isValid) {
          setError(phoneValidation.message);
          return;
        }
        if (phoneCheck.isAvailable === false) {
          setError(phoneCheck.error || 'Số điện thoại đã tồn tại');
          return;
        }
      }

      // Chuẩn bị dữ liệu để gửi (chỉ gửi những field có giá trị)
      const updateData = {};
      if (formData.email && formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.phone && formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.fullName && formData.fullName.trim()) updateData.fullName = formData.fullName.trim();

      console.log('Sending update data:', updateData);

      // Gọi API để cập nhật thông tin cá nhân
      const response = await api.put(endpoints.auth.updatePersonalInfo, updateData);

      if (response.data.success) {
        setSuccess(response.data.message);
        // Cập nhật user context với dữ liệu mới
        updateUserData(response.data.data.user);
        console.log("Updated user data:", response.data.data.user);
      } else {
        setError(response.data.message || "Có lỗi xảy ra khi cập nhật thông tin");
      }
    } catch (err) {
      console.error("Error updating personal info:", err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.");
      } else if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 500) {
        setError("Lỗi máy chủ. Vui lòng thử lại sau.");
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError("Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
            <p className="text-gray-600">Quản lý thông tin cá nhân của bạn</p>
          </div>

          {success && <Alert type="success">{success}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Tên đăng nhập không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.email !== user?.email && emailCheck.isAvailable === false
                        ? 'border-red-500'
                        : formData.email !== user?.email && emailCheck.isAvailable === true
                        ? 'border-green-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {formData.email !== user?.email && emailCheck.isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {formData.email !== user?.email && emailCheck.isAvailable === false && (
                  <p className="text-red-500 text-sm mt-1">{emailCheck.error}</p>
                )}
                {formData.email !== user?.email && emailCheck.isAvailable === true && (
                  <p className="text-green-500 text-sm mt-1">Email có thể sử dụng</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.phone !== user?.phone && phoneCheck.isAvailable === false
                        ? 'border-red-500'
                        : formData.phone !== user?.phone && phoneCheck.isAvailable === true
                        ? 'border-green-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {formData.phone !== user?.phone && phoneCheck.isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {formData.phone !== user?.phone && phoneCheck.isAvailable === false && (
                  <p className="text-red-500 text-sm mt-1">{phoneCheck.error}</p>
                )}
                {formData.phone !== user?.phone && phoneCheck.isAvailable === true && (
                  <p className="text-green-500 text-sm mt-1">Số điện thoại có thể sử dụng</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Account Type and Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài khoản
                </label>
                <input
                  type="text"
                  value={user?.user_type === 'premium' ? 'Premium' : 'Free'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                  disabled
                />
              </div>

              {user?.user_type === 'premium' && user?.user_exp_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày hết hạn Premium
                  </label>
                  <input
                    type="text"
                    value={new Date(user.user_exp_date).toLocaleDateString('vi-VN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                    disabled
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
