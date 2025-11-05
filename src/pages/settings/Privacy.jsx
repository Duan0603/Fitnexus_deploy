import React, { useState } from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function Privacy() {
  const [privacySettings, setPrivacySettings] = useState({
    // Profile visibility
    profileVisibility: "friends",
    showWorkoutStats: true,
    showAchievements: true,
    showProgress: false,
    
    // Data sharing
    shareDataWithPartners: false,
    allowAnalytics: true,
    allowPersonalizedAds: false,
    shareWorkoutData: false,
    
    // Account security
    twoFactorAuth: false,
    loginNotifications: true,
    deviceManagement: true,
    
    // Data control
    dataRetention: "1year",
    exportData: true,
    deleteAccount: false,
    
    // Location
    locationSharing: false,
    locationAccuracy: "city",
    
    // Social features
    friendRequests: "anyone",
    messageRequests: "friends",
    showOnlineStatus: true,
    allowTagging: true
  });

  const handleToggle = (key) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save privacy settings
    console.log("Saving privacy settings:", privacySettings);
    alert("Cài đặt quyền riêng tư đã được lưu!");
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log("Exporting user data...");
    alert("Dữ liệu của bạn đang được chuẩn bị để tải xuống. Bạn sẽ nhận được email khi quá trình hoàn tất.");
  };

  const handleDeleteAccount = () => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và tất cả dữ liệu sẽ bị mất vĩnh viễn.")) {
      // TODO: Implement account deletion
      console.log("Deleting account...");
      alert("Yêu cầu xóa tài khoản đã được gửi. Chúng tôi sẽ liên hệ với bạn để xác nhận.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Quyền riêng tư</h1>
          <p className="text-gray-600">Quản lý quyền riêng tư và bảo mật dữ liệu của bạn</p>
        </div>

        <div className="space-y-8">
          {/* Profile Visibility */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiển thị hồ sơ</h3>
            <p className="text-sm text-gray-600 mb-4">Kiểm soát ai có thể xem thông tin hồ sơ của bạn</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ai có thể xem hồ sơ của bạn
                </label>
                <select
                  value={privacySettings.profileVisibility}
                  onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Mọi người</option>
                  <option value="friends">Chỉ bạn bè</option>
                  <option value="private">Chỉ tôi</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Hiển thị thống kê tập luyện</p>
                    <p className="text-sm text-gray-600">Cho phép người khác xem thống kê tập luyện</p>
                  </div>
                  <button
                    onClick={() => handleToggle('showWorkoutStats')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showWorkoutStats ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showWorkoutStats ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Hiển thị thành tích</p>
                    <p className="text-sm text-gray-600">Cho phép người khác xem thành tích của bạn</p>
                  </div>
                  <button
                    onClick={() => handleToggle('showAchievements')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showAchievements ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showAchievements ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Hiển thị tiến độ</p>
                    <p className="text-sm text-gray-600">Cho phép người khác xem tiến độ tập luyện</p>
                  </div>
                  <button
                    onClick={() => handleToggle('showProgress')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showProgress ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showProgress ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chia sẻ dữ liệu</h3>
            <p className="text-sm text-gray-600 mb-4">Kiểm soát việc chia sẻ dữ liệu với bên thứ ba</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Chia sẻ với đối tác</p>
                  <p className="text-sm text-gray-600">Chia sẻ dữ liệu với các đối tác được tin cậy</p>
                </div>
                <button
                  onClick={() => handleToggle('shareDataWithPartners')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.shareDataWithPartners ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.shareDataWithPartners ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Phân tích sử dụng</p>
                  <p className="text-sm text-gray-600">Cho phép thu thập dữ liệu để cải thiện ứng dụng</p>
                </div>
                <button
                  onClick={() => handleToggle('allowAnalytics')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.allowAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.allowAnalytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Quảng cáo cá nhân hóa</p>
                  <p className="text-sm text-gray-600">Hiển thị quảng cáo phù hợp với sở thích</p>
                </div>
                <button
                  onClick={() => handleToggle('allowPersonalizedAds')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.allowPersonalizedAds ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.allowPersonalizedAds ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Chia sẻ dữ liệu tập luyện</p>
                  <p className="text-sm text-gray-600">Chia sẻ dữ liệu tập luyện với nhà nghiên cứu</p>
                </div>
                <button
                  onClick={() => handleToggle('shareWorkoutData')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.shareWorkoutData ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.shareWorkoutData ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Social Features */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tính năng xã hội</h3>
            <p className="text-sm text-gray-600 mb-4">Kiểm soát tương tác xã hội</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ai có thể gửi lời mời kết bạn
                </label>
                <select
                  value={privacySettings.friendRequests}
                  onChange={(e) => handleSelectChange('friendRequests', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="anyone">Mọi người</option>
                  <option value="friends">Chỉ bạn bè của bạn bè</option>
                  <option value="none">Không ai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ai có thể gửi tin nhắn
                </label>
                <select
                  value={privacySettings.messageRequests}
                  onChange={(e) => handleSelectChange('messageRequests', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="anyone">Mọi người</option>
                  <option value="friends">Chỉ bạn bè</option>
                  <option value="none">Không ai</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Hiển thị trạng thái online</p>
                  <p className="text-sm text-gray-600">Cho phép người khác thấy khi bạn đang online</p>
                </div>
                <button
                  onClick={() => handleToggle('showOnlineStatus')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cho phép gắn thẻ</p>
                  <p className="text-sm text-gray-600">Cho phép người khác gắn thẻ bạn trong bài viết</p>
                </div>
                <button
                  onClick={() => handleToggle('allowTagging')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacySettings.allowTagging ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.allowTagging ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Control */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kiểm soát dữ liệu</h3>
            <p className="text-sm text-gray-600 mb-4">Quản lý dữ liệu cá nhân của bạn</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lưu trữ dữ liệu
                </label>
                <select
                  value={privacySettings.dataRetention}
                  onChange={(e) => handleSelectChange('dataRetention', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="6months">6 tháng</option>
                  <option value="1year">1 năm</option>
                  <option value="2years">2 năm</option>
                  <option value="forever">Vĩnh viễn</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Dữ liệu sẽ được xóa sau thời gian này nếu bạn không hoạt động
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Xuất dữ liệu</p>
                  <p className="text-sm text-gray-600">Tải xuống tất cả dữ liệu của bạn</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Xuất dữ liệu
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Xóa tài khoản</p>
                  <p className="text-sm text-gray-600">Xóa vĩnh viễn tài khoản và tất cả dữ liệu</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                >
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
