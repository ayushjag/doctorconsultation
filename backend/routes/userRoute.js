import express from 'express';
import { 
  loginUser,
  getProfile,
  updateProfile,
  requestUserRegistrationOTP,
  verifyUserOTP
  // --- REMOVED chat and payment functions ---
} from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';

const userRouter = express.Router(); // Renamed to userRouter for clarity

// --- Authentication Routes ---
userRouter.post('/register/request-otp', requestUserRegistrationOTP); // <-- ADD THIS
userRouter.post('/register/verify-otp', verifyUserOTP);
userRouter.post('/login', loginUser);

// --- All routes below require a user to be logged in ---
userRouter.use(authUser);

// --- Profile Management Routes ---
userRouter.get('/profile', getProfile);
userRouter.patch('/profile', upload.single('image'), updateProfile);

// --- Chat routes have been MOVED to chatRoutes.js for better organization ---

export default userRouter;