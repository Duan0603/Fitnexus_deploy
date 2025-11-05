// src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordInput from "../../components/form/PasswordInput.jsx";
import Alert from "../../components/common/Alert.jsx";
import { validatePassword } from "../../lib/passwordValidation.js";
import api from "../../lib/api.js";
import lockImg from "../../assets/forgot.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const passVal = validatePassword(form.password);
  const mismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Thiếu token khôi phục mật khẩu. Vui lòng mở lại liên kết trong email.");
      return;
    }
    if (!passVal.isValid) {
      setError(passVal.message || "Mật khẩu chưa đáp ứng yêu cầu.");
      return;
    }
    if (mismatch) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/auth/reset-password", {
        token,
        newPassword: form.password,
      });
      setSuccess("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không đặt lại được mật khẩu. Liên kết có thể đã hết hạn.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl p-10">
        <div className="grid gap-12 md:grid-cols-2 items-start">
          {/* LEFT */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
            <p className="mt-3 text-base text-gray-500">
              Nhập mật khẩu mới và xác nhận để tiếp tục.
            </p>

            {error && (
              <div className="mt-5">
                <Alert type="error">{error}</Alert>
              </div>
            )}
            {success && (
              <div className="mt-5">
                <Alert type="success">{success}</Alert>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <PasswordInput
                  label="Mật khẩu mới"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••••"
                  required
                  showStrengthIndicator={true}
                  error={form.password && !passVal.isValid ? passVal.message : null}
                  // Tăng chiều cao input (nếu PasswordInput nhận prop classNameInput)
                  classNameInput="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  placeholder="••••••••••"
                  required
                  isValid={
                    form.confirmPassword === form.password &&
                    Boolean(form.confirmPassword)
                  }
                  error={
                    form.confirmPassword && mismatch
                      ? "Mật khẩu xác nhận không khớp"
                      : null
                  }
                  classNameInput="h-12 text-base"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-blue-600 text-white text-lg font-semibold
                           hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
              </button>
            </form>
          </div>

          {/* RIGHT illustration */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-md bg-gray-100 rounded-2xl p-10 flex items-center justify-center">
              <img src={lockImg} alt="Reset password" className="w-[88%] object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
