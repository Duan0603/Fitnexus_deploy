import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyGoogleOtpApi, resendGoogleOtpApi } from "../../lib/api.js";
import { useAuth } from "../../context/auth.context.jsx";

const DIGIT_COUNT = 6;
const RESEND_COOLDOWN = 60;

export default function GoogleOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { oauthLogin, redirectAfterAuth } = useAuth();

  const [otpToken, setOtpToken] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRef = useRef(null);
  const digits = useMemo(
    () => Array.from({ length: DIGIT_COUNT }, (_, i) => code[i] || ""),
    [code]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("otpToken");
    const mail = params.get("email") || "";
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setOtpToken(token);
    setEmail(mail);
    setCooldown(RESEND_COOLDOWN);
  }, [location.search, navigate]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(
      () => setCooldown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [otpToken]);

  const updateCode = (value) => {
    const sanitized = value.replace(/\D/g, "").slice(0, DIGIT_COUNT);
    setCode(sanitized);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text") || "";
    updateCode(text);
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      updateCode(text);
      inputRef.current?.focus();
    } catch {
      setMessage({
        type: "error",
        text: "Không thể đọc clipboard. Hãy dán bằng Ctrl+V hoặc Cmd+V.",
      });
    }
  };

  const formattedCooldown = () => {
    const mm = String(Math.floor(cooldown / 60)).padStart(2, "0");
    const ss = String(cooldown % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!otpToken) {
      setMessage({
        type: "error",
        text: "Phiên OTP đã hết hạn, vui lòng đăng nhập lại bằng Google.",
      });
      return;
    }
    if (code.length !== DIGIT_COUNT) {
      setMessage({ type: "error", text: "Mã OTP gồm 6 chữ số." });
      return;
    }
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      const res = await verifyGoogleOtpApi(code, otpToken);
      await oauthLogin(true);
      const target = res?.data?.redirectTo;
      if (target) navigate(target, { replace: true });
      else await redirectAfterAuth(navigate);
    } catch (err) {
      const text =
        err?.response?.data?.message || "Không thể xác thực OTP. Vui lòng thử lại.";
      setMessage({ type: "error", text });
      if (err?.response?.status === 429) {
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpToken || cooldown > 0) return;
    try {
      await resendGoogleOtpApi(otpToken);
      setMessage({
        type: "success",
        text: "Đã gửi lại mã OTP. Kiểm tra hộp thư của bạn.",
      });
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      const text =
        err?.response?.data?.message ||
        "Không thể gửi lại OTP. Vui lòng đăng nhập lại bằng Google.";
      setMessage({ type: "error", text });
    }
  };

  const handleBack = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-sky-200 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-200 blur-[140px]" />
      </div>

      <div className="relative max-w-xl w-full">
        <div className="rounded-[28px] border border-white/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/80">
          <div className="flex items-center justify-between px-8 pt-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Fitnexus Secure
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Xác thực bằng OTP
              </h1>
            </div>
            <button
              onClick={handleBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition"
            >
              Đăng nhập cách khác
            </button>
          </div>

          <form className="p-8 pt-4 space-y-6" onSubmit={handleSubmit}>
            <p className="text-sm text-slate-600">
              Nhập mã gồm 6 chữ số đã gửi tới{" "}
              <span className="text-slate-900 font-semibold">
                {email || "email của bạn"}
              </span>
            </p>

            {message.text ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm border ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <div className="relative cursor-text">
              <div
                className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6"
                onClick={() => inputRef.current?.focus()}
              >
                {digits.map((digit, idx) => (
                  <div
                    key={idx}
                    className="flex h-16 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-slate-900 shadow-lg shadow-slate-200 border border-slate-100"
                  >
                    {digit || <span className="text-slate-300">•</span>}
                  </div>
                ))}
              </div>
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => updateCode(e.target.value)}
                onPaste={handlePaste}
                maxLength={DIGIT_COUNT}
                className="absolute inset-0 w-full h-full opacity-0"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 disabled:opacity-60"
              >
                {loading ? "Đang xác thực..." : "Xác nhận"}
              </button>
              <button
                type="button"
                onClick={handlePasteButton}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Dán
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              {cooldown > 0 ? (
                <span>Gửi lại sau {formattedCooldown()}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-sky-600 hover:text-sky-800"
                >
                  Gửi lại mã
                </button>
              )}
              <a
                href="/support"
                className="font-semibold text-sky-600 hover:text-sky-800"
              >
                Liên hệ hỗ trợ
              </a>
            </div>

            <p className="text-xs text-center text-slate-400">
              OTP sẽ hết hạn trong thời gian ngắn. Hãy giữ trang này mở và hoàn tất
              xác thực ngay khi nhận được mã.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
