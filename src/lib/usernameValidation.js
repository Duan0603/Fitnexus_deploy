export const validateUsername = (username) => {
  // Username validation rules:
  // - At least 3 characters
  // - Only alphanumeric characters and underscores
  // - Cannot start with a number
  // - Cannot contain spaces
  
  if (!username) {
    return {
      isValid: false,
      message: 'Username không được để trống'
    };
  }

  if (username.length < 3) {
    return {
      isValid: false,
      message: 'Username phải có ít nhất 3 ký tự'
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: 'Username không được quá 20 ký tự'
    };
  }

  if (!/^[a-zA-Z]/.test(username)) {
    return {
      isValid: false,
      message: 'Username phải bắt đầu bằng chữ cái'
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
    };
  }

  return {
    isValid: true,
    message: null
  };
};
