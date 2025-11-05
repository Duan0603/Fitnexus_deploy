// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
  }
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const { folder = 'uploads', public_id, resource_type = 'image' } = options;
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id, resource_type },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

export const deleteByPublicId = (publicId, options = {}) =>
  cloudinary.uploader.destroy(publicId, options);

export default cloudinary;
