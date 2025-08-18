import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "doctor_profiles", // Folder in Cloudinary to store images
        format: async (req, file) => "png", // supports promises as well
        public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
    },
});

const upload = multer({ storage: storage });

export default upload;
