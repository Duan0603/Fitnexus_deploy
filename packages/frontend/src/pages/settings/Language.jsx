import React, { useState } from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function Language() {
  const [selectedLanguage, setSelectedLanguage] = useState("vi");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [currency, setCurrency] = useState("VND");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");

  const languages = [
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "th", name: "ไทย", flag: "🇹🇭" }
  ];

  const dateFormats = [
    { value: "dd/mm/yyyy", label: "DD/MM/YYYY", example: "15/01/2024" },
    { value: "mm/dd/yyyy", label: "MM/DD/YYYY", example: "01/15/2024" },
    { value: "yyyy-mm-dd", label: "YYYY-MM-DD", example: "2024-01-15" },
    { value: "dd-mm-yyyy", label: "DD-MM-YYYY", example: "15-01-2024" }
  ];

  const timeFormats = [
    { value: "12h", label: "12 giờ (AM/PM)", example: "2:30 PM" },
    { value: "24h", label: "24 giờ", example: "14:30" }
  ];

  const currencies = [
    { code: "VND", name: "Việt Nam Đồng", symbol: "₫" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "KRW", name: "Korean Won", symbol: "₩" }
  ];

  const timezones = [
    { value: "Asia/Ho_Chi_Minh", label: "Hà Nội (UTC+7)" },
    { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
    { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
    { value: "Asia/Seoul", label: "Seoul (UTC+9)" },
    { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
    { value: "America/New_York", label: "New York (UTC-5)" },
    { value: "Europe/London", label: "London (UTC+0)" },
    { value: "Australia/Sydney", label: "Sydney (UTC+10)" }
  ];

  const handleSave = () => {
    // TODO: Implement API call to save language settings
    console.log("Saving language settings:", {
      language: selectedLanguage,
      dateFormat,
      timeFormat,
      currency,
      timezone
    });
    alert("Cài đặt ngôn ngữ đã được lưu!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt ngôn ngữ</h1>
          <p className="text-gray-600">Tùy chỉnh ngôn ngữ và định dạng hiển thị</p>
        </div>

        <div className="space-y-8">
          {/* Language Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ngôn ngữ</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn ngôn ngữ hiển thị cho ứng dụng</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {languages.map(language => (
                <label
                  key={language.code}
                  className={`relative cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                    selectedLanguage === language.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={language.code}
                    checked={selectedLanguage === language.code}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <p className="font-medium text-gray-900">{language.name}</p>
                      <p className="text-sm text-gray-600">{language.code.toUpperCase()}</p>
                    </div>
                    {selectedLanguage === language.code && (
                      <div className="ml-auto">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Format */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Định dạng ngày tháng</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn cách hiển thị ngày tháng</p>
            
            <div className="space-y-3">
              {dateFormats.map(format => (
                <label
                  key={format.value}
                  className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    dateFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dateFormat"
                    value={format.value}
                    checked={dateFormat === format.value}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{format.label}</p>
                    <p className="text-sm text-gray-600">Ví dụ: {format.example}</p>
                  </div>
                  {dateFormat === format.value && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Time Format */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Định dạng thời gian</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn cách hiển thị thời gian</p>
            
            <div className="space-y-3">
              {timeFormats.map(format => (
                <label
                  key={format.value}
                  className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    timeFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeFormat"
                    value={format.value}
                    checked={timeFormat === format.value}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{format.label}</p>
                    <p className="text-sm text-gray-600">Ví dụ: {format.example}</p>
                  </div>
                  {timeFormat === format.value && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiền tệ</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn đơn vị tiền tệ hiển thị</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currencies.map(curr => (
                <label
                  key={curr.code}
                  className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    currency === curr.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value={curr.code}
                    checked={currency === curr.code}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{curr.name}</p>
                    <p className="text-sm text-gray-600">{curr.code} ({curr.symbol})</p>
                  </div>
                  {currency === curr.code && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Múi giờ</h3>
            <p className="text-sm text-gray-600 mb-4">Chọn múi giờ cho hiển thị thời gian</p>
            
            <div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xem trước</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Ngôn ngữ:</p>
                <p className="text-gray-900">
                  {languages.find(l => l.code === selectedLanguage)?.name}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Định dạng ngày:</p>
                <p className="text-gray-900">
                  {new Date().toLocaleDateString(selectedLanguage === 'vi' ? 'vi-VN' : 'en-US')}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Định dạng giờ:</p>
                <p className="text-gray-900">
                  {new Date().toLocaleTimeString(selectedLanguage === 'vi' ? 'vi-VN' : 'en-US', {
                    hour12: timeFormat === '12h'
                  })}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Tiền tệ:</p>
                <p className="text-gray-900">
                  {currencies.find(c => c.code === currency)?.symbol} 1,000
                </p>
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
