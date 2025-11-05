export const validateEmail = (email) => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email không được để trống'
    };
  }

  // Regex cơ bản: check email chuẩn (có cả local part và domain)
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(email)) {
    return {
      isValid: false,
      message: 'Email không đúng định dạng (ví dụ: example@gmail.com)'
    };
  }

  return {
    isValid: true,
    message: null
  };
};
