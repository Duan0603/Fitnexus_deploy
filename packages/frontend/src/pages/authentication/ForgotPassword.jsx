import React, { useState } from "react";
import { Link } from "react-router-dom";
import forgotImg from "../../assets/forgot.png";
import api, { endpoints } from "../../lib/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice({ type: "", text: "" });
    setLoading(true);
    try {
      // Gọi BE gửi mail
      await api.post(
        endpoints.auth.forgot ?? "/api/auth/forgot-password",
        { email }
      );

      // BE trả message chung để tránh dò email
      setNotice({
      type: "success",
      text:
        "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (kể cả Spam).",
    });
  } catch (err) {
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.message;

    if (status === 404) {
      // Email chưa đăng ký
      setNotice({
        type: "error",
        text: "Email này chưa được đăng ký. Vui lòng đăng ký tài khoản trước khi đặt lại mật khẩu.",
      });
      // (tuỳ chọn) điều hướng sang trang đăng ký:
      // navigate("/register");
    } else {
      setNotice({
        type: "error",
        text: serverMsg || "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left */}
        <div className="p-8 md:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">FITNEXUS</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900">Quên mật khẩu?</h2>
          <p className="mt-2 text-gray-500">
            Nhập email của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
          </p>

          {notice.text && (
            <div
              className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {notice.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-gray-500">
                Liên kết đặt lại có hiệu lực trong ~15–30 phút.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            </button>

            <div className="text-sm text-gray-600 text-center">
              Nhớ mật khẩu rồi?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center justify-center bg-gray-50">
          <img
            src={forgotImg}
            alt="Forgot Password Illustration"
            className="w-4/5 max-w-sm"
          />
        </div>
      </div>
    </div>
  );
}
