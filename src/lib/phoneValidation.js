export const validatePhone = (phone) => {
  // Phone validation rules:
  // - Vietnamese phone number format
  // - Starts with 0 or +84
  // - 10-11 digits total
  
  if (!phone) {
    return {
      isValid: false,
      message: 'Số điện thoại không được để trống'
    };
  }

  // Remove all spaces and special characters except + for international format
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Vietnamese phone number patterns:
  // - Domestic: 0xxxxxxxxx (10 digits starting with 0)
  // - International: +84xxxxxxxxx (12 digits starting with +84)
  const domesticPattern = /^0[3-9]\d{8}$/;
  const internationalPattern = /^\+84[3-9]\d{8}$/;
  
  if (!domesticPattern.test(cleanPhone) && !internationalPattern.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0123456789 hoặc +84123456789)'
    };
  }

  return {
    isValid: true,
    message: null
  };
};
