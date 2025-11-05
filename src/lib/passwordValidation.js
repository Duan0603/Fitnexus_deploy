export const validatePassword = (password) => {
  const conditions = {
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumberOrSpecial: /[0-9#?!@$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/.test(password),
    hasMinLength: password.length >= 10
  };

  const isValid = Object.values(conditions).every(condition => condition);

  return {
    isValid,
    conditions,
    message: isValid ? null : 'Mật khẩu không đáp ứng các yêu cầu bảo mật'
  };
};

export const getPasswordStrength = (password) => {
  const { conditions } = validatePassword(password);
  const metConditions = Object.values(conditions).filter(Boolean).length;
  
  if (metConditions === 0) return 'weak';
  if (metConditions === 1) return 'fair';
  if (metConditions === 2) return 'good';
  if (metConditions === 3) return 'strong';
  
  return 'weak';
};
