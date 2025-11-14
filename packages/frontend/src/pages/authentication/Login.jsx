import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import loginImg from "../../assets/login.png";
import logo from "../../assets/logo.png";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import Alert from "../../components/common/Alert.jsx";
import api, { endpoints } from "../../lib/api.js";
import { setTokens } from "../../lib/tokenManager.js";
import openOAuthPopup from "../../lib/openOAuthPopup.js";
import { env } from "../../config/env.js";

function OAuthNotFoundModal({ email, onClose, onSignup }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-[420px] text-center">
        <h2 className="mb-2 text-lg font-semibold">Không tìm thấy tài khoản</h2>
        <p className="mb-4 text-sm text-gray-600">
          Tài khoản Google {email ? <b>{email}</b> : "vừa dùng"} chưa liên kết
          với FITNEXUS.
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
            onClick={onClose}
          >
            Đăng nhập bằng cách khác
          </button>
          <button
            className="flex-1 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            onClick={onSignup}
          >
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}

/** 🔒 Modal hiển thị khi tài khoản bị khóa */
function LockedAccountModal({ email, reason, lockedAt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-[480px]">
        <h2 className="mb-1 text-lg font-semibold">Tài khoản đã bị khóa</h2>
        {email ? (
          <p className="mb-3 text-sm text-gray-600">
            Email: <b>{email}</b>
          </p>
        ) : null}

        <div className="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          <div className="font-medium">Lý do:</div>
          <div className="italic">{reason || "Không có lý do cụ thể."}</div>
          {lockedAt ? (
            <div className="mt-2 text-gray-600">
              Thời điểm khóa: {new Date(lockedAt).toLocaleString()}
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Vui lòng liên hệ quản trị viên để được mở khóa.
        </p>

        <div className="mt-4 text-right">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    remember: false,
  });
  const [oauthLoading, setOauthLoading] = useState(false);

  const { login, loading, error, oauthLogin, redirectAfterAuth } = useAuth();

  const navigate = useNavigate();

  const [showNotFound, setShowNotFound] = useState(false);
  const [nfEmail, setNfEmail] = useState("");

  // ⬇️ State cho modal "bị khóa"
  const [lockedInfo, setLockedInfo] = useState({
    open: false,
    email: "",
    reason: "",
    lockedAt: "",
  });
  const openLocked = (info) => setLockedInfo({ open: true, ...info });
  const closeLocked = () =>
    setLockedInfo({ open: false, email: "", reason: "", lockedAt: "" });

  const location = useLocation();
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("googleOtp") === "1") {
      navigate(`/login/otp?${q.toString()}`, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("oauth") === "not_found") {
      setShowNotFound(true);
      setNfEmail(q.get("email") || "");
      const url = new URL(window.location.href);
      url.searchParams.delete("oauth");
      url.searchParams.delete("email");
      window.history.replaceState({}, "", url.toString());
    }
  }, [location.search]);

  // 🔊 Lắng nghe thông điệp trả về từ popup /auth/google/callback
  useEffect(() => {
    function onMessage(e) {
      const be = env.backendUrl;
      const origin = (() => {
        try {
          return new URL(be).origin;
        } catch {
          return "*";
        }
      })();
      if (origin !== "*" && e.origin !== origin) return;

      const data = e.data || {};
      if (data?.source === "oauth" && data?.provider === "google") {
        if (data.status === "success" && data.token) {
          setTokens(data.token, null, true);
          const role = data?.user?.role;
          if (role === "ADMIN") navigate("/admin", { replace: true });
          else navigate("/dashboard", { replace: true });
        } else if (data.status === "not_found") {
          setShowNotFound(true);
          setNfEmail(data.email || "");
        } else if (data.status === "locked") {
          // ⬅️ Khi BE báo locked qua popup, mở modal lý do
          openLocked({
            email: data.email || "",
            reason: data.reason || data.lockReason || "",
            lockedAt: data.lockedAt || "",
          });
        }
        setOauthLoading(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  const closeNotFound = () => setShowNotFound(false);
  const goSignup = () => {
    setShowNotFound(false);
    navigate(
      `/register${nfEmail ? `?email=${encodeURIComponent(nfEmail)}` : ""}`
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ====== Submit bằng email/username + password ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(
        {
          identifier: form.identifier,
          password: form.password,
          rememberMe: form.remember,
        },
        navigate,
        // Nếu tới từ một trang cụ thể (vd: /plans/new) thì điều hướng về đó sau login
        (location.state && typeof location.state.from === 'string') ? location.state.from : null
      );
    } catch (e) {
      // ⬇️ Nếu BE trả 423 Locked, mở modal kèm lý do
      const st = e?.response?.status;
      const payload = e?.response?.data || {};
      const extra = payload?.data || {}; // BE của bạn đặt lockReason/lockedAt trong data
      if (st === 423) {
        openLocked({
          email: form.identifier || payload?.email || "",
          reason: extra?.lockReason || payload?.lockReason || "",
          lockedAt: extra?.lockedAt || payload?.lockedAt || "",
        });
        return;
      }
      // các lỗi khác đã được context xử lý để Alert hiển thị
    }
  };

  // ====== Đăng nhập bằng Google ======
  const handleGoogleLogin = () => {
    setOauthLoading(true);
    const be = env.backendUrl;

    // chuyển sang BE để bắt đầu OAuth, kèm from nếu có (chuỗi path)
    const from = (location.state && typeof location.state.from === 'string') ? location.state.from : "";
    const url = `${be}/auth/google${from ? `?from=${encodeURIComponent(from)}` : ""}`;
    window.location.href = url;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex w-full max-w-4xl p-8 bg-white shadow-xl rounded-xl">
        {/* Left */}
        <div className="w-1/2 pr-8">
          <div className="text-base/6 text-zinc-950 dark:text-white hover:underline -m-1.5 p-1.5 shrink-0">
            <img src={logo} alt="Fitnexus logo" className="h-48" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Login
          </h2>

          {error && (
            <div className="mt-4">
              <Alert type="error">{error.message || "Login failed"}</Alert>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={form.identifier}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="mr-2"
                />
                Remember me
              </label>
              <span
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-sm text-gray-500">or continue with</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              className="flex items-center justify-center flex-1 gap-2 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-60"
            >
              <FcGoogle size={20} />
              {oauthLoading ? "Đang chuyển hướng…" : "Google"}
            </button>

            <button className="flex items-center justify-center flex-1 gap-2 py-2 border rounded-lg hover:bg-gray-50">
              <FaApple size={20} /> Apple
            </button>
          </div>

          <p className="mt-4 text-sm text-center text-gray-500">
            Don’t have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Sign up
            </span>
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center w-1/2">
          <img src={loginImg} alt="Login Illustration" className="w-3/4" />
        </div>
      </div>

      {showNotFound && (
        <OAuthNotFoundModal
          email={nfEmail}
          onClose={closeNotFound}
          onSignup={goSignup}
        />
      )}

      {lockedInfo.open && (
        <LockedAccountModal
          email={lockedInfo.email}
          reason={lockedInfo.reason}
          lockedAt={lockedInfo.lockedAt}
          onClose={closeLocked}
        />
      )}
    </div>
  );
}
