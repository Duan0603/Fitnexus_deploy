import { body, validationResult } from "express-validator";

// REGISTER VALIDATION (giữ nguyên như bạn có)
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters')
];

// LOGIN VALIDATION (thêm mới theo yêu cầu)
export const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Identifier (email or username) is required')
    .isLength({ max: 255 }).withMessage('Identifier must not exceed 255 characters'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  // Thêm validation cho rememberMe
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be boolean'),

  // middleware xử lý lỗi
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: 'Validation error',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }
    next();
  }
];
