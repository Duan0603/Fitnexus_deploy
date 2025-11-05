export const validateFullname = (fullname) => {
  // Fullname validation rules:
  // - At least 2 characters
  // - Only letters, spaces, and common name characters (hyphens, apostrophes)
  // - Cannot be empty
  
  if (!fullname) {
    return {
      isValid: false,
      message: 'Họ tên không được để trống'
    };
  }

  if (fullname.length < 2) {
    return {
      isValid: false,
      message: 'Họ tên phải có ít nhất 2 ký tự'
    };
  }

  if (fullname.length > 50) {
    return {
      isValid: false,
      message: 'Họ tên không được quá 50 ký tự'
    };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-ZÀ-ỹ\s\-']+$/.test(fullname)) {
    return {
      isValid: false,
      message: 'Họ tên chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu nháy đơn'
    };
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(fullname)) {
    return {
      isValid: false,
      message: 'Họ tên không được có nhiều khoảng trắng liên tiếp'
    };
  }

  return {
    isValid: true,
    message: null
  };
};
