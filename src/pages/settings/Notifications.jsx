import React, { useState } from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function Notifications() {
  const [settings, setSettings] = useState({
    // Workout notifications
    workoutReminders: true,
    workoutReminderTime: "18:00",
    workoutReminderDays: ["monday", "wednesday", "friday"],
    
    // Progress notifications
    progressUpdates: true,
    weeklyProgress: true,
    monthlyProgress: true,
    achievementAlerts: true,
    
    // App notifications
    appUpdates: true,
    newFeatures: true,
    maintenanceAlerts: true,
    
    // Social notifications
    socialInteractions: true,
    friendRequests: true,
    communityUpdates: false,
    
    // Email notifications
    emailWorkoutReminders: false,
    emailProgressReports: true,
    emailNewsletter: true,
    emailMarketing: false,
    
    // Push notifications
    pushEnabled: true,
    pushWorkoutReminders: true,
    pushProgressUpdates: true,
    pushSocialActivity: false,
    
    // Quiet hours
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    quietHoursWeekends: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDayToggle = (day) => {
    setSettings(prev => ({
      ...prev,
      workoutReminderDays: prev.workoutReminderDays.includes(day)
        ? prev.workoutReminderDays.filter(d => d !== day)
        : [...prev.workoutReminderDays, day]
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save notification settings
    console.log("Saving notification settings:", settings);
    alert("Cài đặt thông báo đã được lưu!");
  };

  const days = [
    { value: "monday", label: "Thứ 2" },
    { value: "tuesday", label: "Thứ 3" },
    { value: "wednesday", label: "Thứ 4" },
    { value: "thursday", label: "Thứ 5" },
    { value: "friday", label: "Thứ 6" },
    { value: "saturday", label: "Thứ 7" },
    { value: "sunday", label: "Chủ nhật" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt thông báo</h1>
          <p className="text-gray-600">Tùy chỉnh các thông báo và nhắc nhở</p>
        </div>

        <div className="space-y-8">
          {/* Workout Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhắc nhở tập luyện</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Nhắc nhở buổi tập</p>
                  <p className="text-sm text-gray-600">Nhận thông báo trước giờ tập luyện</p>
                </div>
                <button
                  onClick={() => handleToggle('workoutReminders')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.workoutReminders ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.workoutReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.workoutReminders && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian nhắc nhở
                    </label>
                    <input
                      type="time"
                      value={settings.workoutReminderTime}
                      onChange={(e) => handleInputChange('workoutReminderTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày trong tuần
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {days.map(day => (
                        <button
                          key={day.value}
                          onClick={() => handleDayToggle(day.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            settings.workoutReminderDays.includes(day.value)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông báo tiến độ</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cập nhật tiến độ</p>
                  <p className="text-sm text-gray-600">Thông báo khi có cập nhật tiến độ</p>
                </div>
                <button
                  onClick={() => handleToggle('progressUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.progressUpdates ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.progressUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Báo cáo hàng tuần</p>
                  <p className="text-sm text-gray-600">Tóm tắt tiến độ tuần</p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyProgress')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.weeklyProgress ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.weeklyProgress ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Báo cáo hàng tháng</p>
                  <p className="text-sm text-gray-600">Tóm tắt tiến độ tháng</p>
                </div>
                <button
                  onClick={() => handleToggle('monthlyProgress')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.monthlyProgress ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.monthlyProgress ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Thông báo thành tích</p>
                  <p className="text-sm text-gray-600">Khi đạt được thành tích mới</p>
                </div>
                <button
                  onClick={() => handleToggle('achievementAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.achievementAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.achievementAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* App Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông báo ứng dụng</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Cập nhật ứng dụng</p>
                  <p className="text-sm text-gray-600">Thông báo khi có phiên bản mới</p>
                </div>
                <button
                  onClick={() => handleToggle('appUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.appUpdates ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.appUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Tính năng mới</p>
                  <p className="text-sm text-gray-600">Giới thiệu tính năng mới</p>
                </div>
                <button
                  onClick={() => handleToggle('newFeatures')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.newFeatures ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.newFeatures ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Bảo trì hệ thống</p>
                  <p className="text-sm text-gray-600">Thông báo bảo trì định kỳ</p>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông báo email</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Nhắc nhở tập luyện qua email</p>
                  <p className="text-sm text-gray-600">Gửi email nhắc nhở buổi tập</p>
                </div>
                <button
                  onClick={() => handleToggle('emailWorkoutReminders')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailWorkoutReminders ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailWorkoutReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Báo cáo tiến độ qua email</p>
                  <p className="text-sm text-gray-600">Gửi báo cáo tiến độ định kỳ</p>
                </div>
                <button
                  onClick={() => handleToggle('emailProgressReports')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailProgressReports ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailProgressReports ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Newsletter</p>
                  <p className="text-sm text-gray-600">Tin tức và mẹo fitness</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNewsletter')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNewsletter ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNewsletter ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Giờ yên tĩnh</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Bật giờ yên tĩnh</p>
                  <p className="text-sm text-gray-600">Không nhận thông báo trong giờ nghỉ</p>
                </div>
                <button
                  onClick={() => handleToggle('quietHoursEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.quietHoursEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.quietHoursEnabled && (
                <div className="ml-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bắt đầu
                      </label>
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => handleInputChange('quietHoursStart', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kết thúc
                      </label>
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => handleInputChange('quietHoursEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Áp dụng cuối tuần</p>
                      <p className="text-sm text-gray-600">Giờ yên tĩnh cũng áp dụng cho cuối tuần</p>
                    </div>
                    <button
                      onClick={() => handleToggle('quietHoursWeekends')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.quietHoursWeekends ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.quietHoursWeekends ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
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
