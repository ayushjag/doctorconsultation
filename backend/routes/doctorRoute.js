import express from 'express';

// --- Imports ---
import { 
  loginDoctor,
  doctorList,
  doctorProfile,
  updateDoctorProfile,
  getDoctorChats,
  doctorDashboard,
  doctorReplyToChat,
  getSingleDoctorChat,
  changeAvailablity, // Added this to the import list for completeness
  requestDoctorRegistrationOTP,
  verifyDoctorOTP
  // registerDoctor can be removed from imports as it's no longer used
} from '../controllers/doctorController.js';

import authDoctor from '../middleware/authDoctor.js';
import upload from '../middleware/multer.js';

// --- Router Setup ---
const doctorRouter = express.Router();


// --- Public Routes (No Authentication Needed) ---
// These are routes that anyone can access, like patients looking for a doctor.
// All registration-related routes MUST be here.
doctorRouter.post('/login', loginDoctor);
doctorRouter.post('/register/request-otp', requestDoctorRegistrationOTP); // <-- MOVED HERE
doctorRouter.post('/register/verify-otp', verifyDoctorOTP);             // <-- MOVED HERE
// doctorRouter.post('/register', registerDoctor); // <-- You should REMOVE this old route
doctorRouter.get('/list', doctorList);
doctorRouter.get('/public-profile/:id', doctorProfile);


// --- Protected Doctor Routes (Doctor Must Be Logged In) ---
// This middleware line protects ALL routes defined AFTER it.
doctorRouter.use(authDoctor);

// All routes below this line will now require a valid doctor token.
doctorRouter.get('/profile', doctorProfile);
doctorRouter.patch('/availability', changeAvailablity);
doctorRouter.patch('/profile', upload.single('image'), updateDoctorProfile);

// Dashboard
doctorRouter.get('/dashboard', doctorDashboard);

// Chat Management for the Logged-in Doctor
doctorRouter.get('/chats', getDoctorChats);
doctorRouter.get('/chats/single/:chatId', getSingleDoctorChat);
doctorRouter.post('/chats/reply', doctorReplyToChat);

// --- Export the Router ---
export default doctorRouter;