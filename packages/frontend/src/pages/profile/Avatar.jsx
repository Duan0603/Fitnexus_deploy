import React, { useState } from "react";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { api, endpoints } from "../../lib/api.js";

export default function Avatar() {
  const { user, updateUserData } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState({ type: null, text: "" });

  const getInitial = (u) => {
    const src = u?.fullName || u?.username || u?.email || "U";
    const letter = src.trim()[0] || "U";
    return String(letter).toUpperCase();
  };
  const isMailProviderAvatar = (url = "") => /googleusercontent|gravatar|ggpht|gmail|gstatic/i.test(url);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "Vui lòng chọn file ảnh hợp lệ" });
      return;
    }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", text: "Kích thước file không được vượt quá 5MB" });
      return;
    }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload of the file
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      // Backend expects field name 'avatar'
      formData.append("avatar", selectedFile);

      // Use existing auth endpoint which returns { success, data: { user } }
      const response = await api.post(endpoints.auth.avatar, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response?.data?.data?.user;
      if (response?.data?.success && updatedUser) {
        updateUserData(updatedUser);
        setNotice({ type: "success", text: "Ảnh đại diện đã được cập nhật thành công" });
        setSelectedFile(null);
        setPreview(null);
      } else {
        setNotice({ type: "error", text: response?.data?.message || "Tải ảnh thất bại" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setNotice({ type: "error", text: "Có lỗi xảy ra khi tải lên ảnh" });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle removing the avatar
  const handleRemoveAvatar = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh đại diện?")) return;
    try {
      const response = await api.delete(endpoints.auth.avatar);
      if (response?.data?.success && response?.data?.data?.user) {
        updateUserData(response.data.data.user);
        setNotice({ type: "success", text: "Ảnh đại diện đã được xóa" });
        setSelectedFile(null);
        setPreview(null);
      } else {
        setNotice({ type: "error", text: response?.data?.message || "Xóa ảnh thất bại" });
      }
    } catch (err) {
      console.error("Remove avatar error:", err);
      setNotice({ type: "error", text: "Có lỗi xảy ra khi xóa ảnh" });
    }
  };

  // Remove avatar without browser confirm dialog
  const handleRemoveAvatarNoConfirm = async () => {
    try {
      const response = await api.delete(endpoints.auth.avatar);
      if (response?.data?.success && response?.data?.data?.user) {
        updateUserData(response.data.data.user);
        setNotice({ type: "success", text: "Ảnh đại diện đã được xóa" });
        setSelectedFile(null);
        setPreview(null);
      } else {
        const serverMsg = typeof response?.data?.message === 'string' ? response.data.message : null;
        setNotice({ type: "error", text: serverMsg || "Xóa ảnh thất bại" });
      }
    } catch (err) {
      console.error("Remove avatar error:", err);
      setNotice({ type: "error", text: "Có lỗi xảy ra khi xóa ảnh" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Ảnh đại diện</h1>
            <p className="text-gray-600">Cập nhật ảnh đại diện của bạn</p>
          </div>

          <div className="p-6">
            {notice?.type && (
              <div
                className={`${notice.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border rounded-md px-4 py-3 mb-4`}
                role="alert"
              >
                {notice.text}
              </div>
            )}
            {/* Current Avatar */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ảnh hiện tại</h3>
              <div className="inline-block relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {(() => {
                    if (preview) return <img src={preview} alt="Preview" className="w-full h-full object-cover" />;
                    const be = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
                    const raw = user?.avatarUrl || "";
                    let src = null;
                    if (raw) {
                      const abs = raw.startsWith("http") ? raw : `${be}${raw}`;
                      if (!isMailProviderAvatar(abs)) src = abs;
                    }
                    if (src) return <img src={src} alt="Avatar" className="w-full h-full object-cover" />;
                    return (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold rounded-full bg-gradient-to-r from-blue-400 to-blue-600">
                        {getInitial(user)}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {preview ? "Ảnh mới sẽ được áp dụng" : user?.avatarUrl ? "" : "Chưa có ảnh đại diện"}
              </p>
            </div>

            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ảnh mới</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Tải lên ảnh</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF lên đến 5MB</p>
                  </div>
                </div>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">File đã chọn: {selectedFile.name}</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Loại: {selectedFile.type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Đang tải lên..." : "Tải lên ảnh"}
                </button>

                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                )}
              </div>

              {/* Remove Avatar */}
              <div className="pt-6 border-t border-gray-200">
                <div className="text-center">
                  <button
                    onClick={handleRemoveAvatarNoConfirm}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Xóa ảnh đại diện
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Ảnh đại diện sẽ được thay thế bằng chữ cái đầu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
