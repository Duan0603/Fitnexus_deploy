import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context.jsx';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import TextInput from '../../components/form/TextInput.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import Checkbox from '../../components/form/Checkbox.jsx';
import DividerWithText from '../../components/common/DividerWithText.jsx';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons.jsx';
import Alert from '../../components/common/Alert.jsx';
import { validatePassword } from '../../lib/passwordValidation.js';
import { validateUsername } from '../../lib/usernameValidation.js';
import { validateFullname } from '../../lib/fullnameValidation.js';
import { validatePhone } from '../../lib/phoneValidation.js';
import { validateEmail } from '../../lib/emailValidation.js';
import { useAvailabilityCheck } from '../../hooks/useAvailabilityCheck.js';
import logo from '../../assets/branch/logo.png';
//import { openOAuthPopup } from "../lib/openOAuthPopup.js";

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    agree: false,
  });
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Kiểm tra availability cho từng field
  const usernameCheck = useAvailabilityCheck(form.username, 'username');
  const emailCheck = useAvailabilityCheck(form.email, 'email');
  const phoneCheck = useAvailabilityCheck(form.phone, 'phone');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ===== Đăng ký bằng form truyền thống =====
  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setLocalError(null);

    // Validate username
    const usernameValidation = validateUsername(form.username);
    if (!usernameValidation.isValid) {
      setLocalError(usernameValidation.message);
      return;
    }

    // Kiểm tra username availability
    if (usernameCheck.isAvailable === false) {
      setLocalError(usernameCheck.error || 'Username đã tồn tại');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.message);
      return;
    }

    // Validate fullname
    if (form.fullName) {
      const fullnameValidation = validateFullname(form.fullName);
      if (!fullnameValidation.isValid) {
        setLocalError(fullnameValidation.message);
        return;
      }
    }

    // Validate phone
    if (form.phone) {
      const phoneValidation = validatePhone(form.phone);
      if (!phoneValidation.isValid) {
        setLocalError(phoneValidation.message);
        return;
      }
      // Kiểm tra phone availability
      if (phoneCheck.isAvailable === false) {
        setLocalError(phoneCheck.error || 'Số điện thoại đã tồn tại');
        return;
      }
    }

    // Validate email
    const emailValidation = validateEmail(form.email);
    if (!emailValidation.isValid) {
      setLocalError(emailValidation.message);
      return;
    }

    // Kiểm tra email availability
    if (emailCheck.isAvailable === false) {
      setLocalError(emailCheck.error || 'Email đã tồn tại');
      return;
    }

    if (!form.agree) {
      setLocalError('Bạn cần đồng ý với Điều khoản và Chính sách riêng tư.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
      };
      const res = await register(payload);
      setSuccess(res?.message || 'Registered successfully');
      navigate('/login?registered=1', { replace: true });
    } catch (_) {
      // error handled via context
    }
  };

  // ===== Đăng ký/đăng nhập bằng Google (popup, không reload) =====
 const handleGoogleRegister = (e) => {
    e.preventDefault();
    const be = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    window.location.href = `${be}/auth/google`;
  };

  return (
    <AuthLayout ratio='1/3'>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sign up</h1>
            <p className="mt-2 text-sm text-gray-500">
              Let's get you all set up so you can access your personal account.
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-900">
            <div>
              <img src={logo} alt="FITNEXUS" className="object-contain w-36 h-36 rounded-xl" />
            </div>
            <span className="text-lg font-semibold">FITNEXUS</span>
          </div>
        </div>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {localError && <div className="mt-3"><Alert type="error">{localError}</Alert></div>}
      {error && <div className="mt-3"><Alert type="error">{error.message || 'Registration failed'}</Alert></div>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <TextInput
          label="Username"
          name="username"
          value={form.username}
          onChange={onChange}
          placeholder="johnny"
          required
          showValidationIcon={true}
          isValid={validateUsername(form.username).isValid && usernameCheck.isAvailable !== false}
          error={
            usernameCheck.isAvailable === false
              ? usernameCheck.error
              : !validateUsername(form.username).isValid && form.username
              ? validateUsername(form.username).message
              : null
          }
          loading={usernameCheck.isChecking}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            placeholder="John Doe"
            showValidationIcon={true}
            isValid={validateFullname(form.fullName).isValid}
            error={
              !validateFullname(form.fullName).isValid && form.fullName
                ? validateFullname(form.fullName).message
                : null
            }
          />
          <TextInput
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="0123 456 789"
            showValidationIcon={true}
            isValid={validatePhone(form.phone).isValid && phoneCheck.isAvailable !== false}
            error={
              phoneCheck.isAvailable === false
                ? phoneCheck.error
                : !validatePhone(form.phone).isValid && form.phone
                ? validatePhone(form.phone).message
                : null
            }
            loading={phoneCheck.isChecking}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="john.doe@gmail.com"
              required
              showValidationIcon={true}
              isValid={validateEmail(form.email).isValid && emailCheck.isAvailable !== false}
              error={
                emailCheck.isAvailable === false
                  ? emailCheck.error
                  : !validateEmail(form.email).isValid && form.email
                  ? validateEmail(form.email).message
                  : null
              }
              loading={emailCheck.isChecking}
            />
          </div>
        </div>

        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••••••"
          required
          showStrengthIndicator={true}
        />
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="••••••••••"
          required
          isValid={form.confirmPassword === form.password && form.confirmPassword}
          error={
            form.confirmPassword && form.confirmPassword !== form.password
              ? 'Mật khẩu xác nhận không khớp'
              : null
          }
        />

        <div className="flex items-center justify-between">
          <Checkbox
            name="agree"
            checked={form.agree}
            onChange={(v) => setForm({ ...form, agree: v })}
            label={
              <span>
                Tôi đồng ý với tất cả{" "}
                <a className="text-blue-600 hover:underline" href="#" onClick={(e)=>e.preventDefault()}>Terms</a>
                {" "}and{" "}
                <a className="text-blue-600 hover:underline" href="#" onClick={(e)=>e.preventDefault()}>Privacy Policies</a>
              </span>
            }
          />
        </div>

        <button
          disabled={loading}
          className="w-full py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-blue-600 hover:underline">Login</a>
        </p>

        <DividerWithText>Or Sign up with</DividerWithText>

        <SocialAuthButtons
          onFacebook={() => {}}
          onGoogle={handleGoogleRegister}
          onApple={() => {}}
        />
      </form>
    </AuthLayout>
  );
}
