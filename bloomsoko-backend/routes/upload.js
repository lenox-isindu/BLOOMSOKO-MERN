import express from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import stream from 'stream';
import dotenv from 'dotenv';


dotenv.config();

console.log(' Cloudinary Config Check:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? ' Set' : 'Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : ' Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? ' Set' : 'Missing');

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error(' Cloudinary configuration is incomplete!');
  console.error('Please check your .env file and ensure all Cloudinary variables are set.');
} else {
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
}

const router = express.Router();

//  multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload image to Cloudinary 
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary configuration is missing. Please check your .env file.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'bloomsoko',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log(' Image uploaded to Cloudinary:', result.secure_url);
          resolve(result);
        }
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

// Upload single image
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log(' Uploading image to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer);
    
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ 
      message: 'Failed to upload image', 
      error: error.message,
      details: 'Please check your Cloudinary configuration in the .env file'
    });
  }
});

// Upload multiple images
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    console.log(` Uploading ${req.files.length} images to Cloudinary...`);
    const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.json({
      images: uploadedImages,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error(' Upload error:', error.message);
    res.status(500).json({ 
      message: 'Failed to upload images', 
      error: error.message,
      details: 'Please check your Cloudinary configuration in the .env file'
    });
  }
});

export default router;