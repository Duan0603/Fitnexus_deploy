// packages/backend/routes/users.routes.js
import express from 'express';
import multer from 'multer';
import authGuard from '../middleware/auth.guard.js';
import User from '../models/user.model.js';
import { uploadBuffer } from '../utils/cloudinary.js';

const router = express.Router();

// Cấu hình multer để nhận file ảnh
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file size tối đa là 5MB
});

// Route upload avatar
router.post(
  '/me/avatar',
  authGuard, // Xác thực người dùng
  upload.single('file'), // Xử lý việc upload file với tên trường là 'file'
  async (req, res, next) => {
    try {
      // Kiểm tra xem file đã được tải lên chưa
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Kiểm tra loại file (chỉ chấp nhận ảnh)
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Unsupported file type' });
      }

      // Upload ảnh lên Cloudinary
      const folder = `users/${req.userId}`;
      const result = await uploadBuffer(req.file.buffer, { folder });

      // Lấy thông tin người dùng từ cơ sở dữ liệu
      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Cập nhật URL ảnh vào cơ sở dữ liệu của người dùng
      user.avatarUrl = result.secure_url;
      await user.save();

      // Trả về URL ảnh đã được upload thành công
      return res.json({ success: true, url: result.secure_url });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
