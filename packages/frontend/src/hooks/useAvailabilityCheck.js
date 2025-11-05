import { useState, useEffect, useCallback } from 'react';
import { checkUsernameAvailability, checkEmailAvailability, checkPhoneAvailability } from '../lib/api.js';

// Hook để kiểm tra availability với debounce
export const useAvailabilityCheck = (value, type, delay = 500) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState(null);

  const checkAvailability = useCallback(async (val, checkType) => {
    if (!val || val.length < 2) {
      setIsAvailable(null);
      setError(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      let response;
      switch (checkType) {
        case 'username':
          response = await checkUsernameAvailability(val);
          break;
        case 'email':
          response = await checkEmailAvailability(val);
          break;
        case 'phone':
          response = await checkPhoneAvailability(val);
          break;
        default:
          throw new Error('Invalid check type');
      }

      setIsAvailable(response.available);
      if (!response.available) {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi kiểm tra');
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(value, type);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, type, delay, checkAvailability]);

  return {
    isChecking,
    isAvailable,
    error,
    checkAvailability: () => checkAvailability(value, type)
  };
};
