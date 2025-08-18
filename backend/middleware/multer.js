import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Multer will first store files locally in /uploads
const upload = multer({ dest: "uploads/" });

// Helper function: upload file to Cloudinary and delete temp file
export const uploadToCloudinary = async (file, folder = "doctor_profiles") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      public_id: `${file.fieldname}-${Date.now()}`,
      format: "png", // Force PNG format
    });

    // remove local file after upload
    fs.unlinkSync(file.path);

    return result.secure_url;
  } catch (error) {
    throw error;
  }
};

export default upload;
