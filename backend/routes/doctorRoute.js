import express from 'express';

// --- Imports ---
// 1. Import ONLY from the doctorController.
//    Payment functions belong in a different route file.
import { 
  loginDoctor,
  doctorList,
  changeAvailablity,
  doctorProfile,
  updateDoctorProfile,
  getDoctorChats,
  doctorDashboard,
  doctorReplyToChat
} from '../controllers/doctorController.js';

// 2. Import the authentication middleware for doctors.
import authDoctor from '../middleware/authDoctor.js';

// --- Router Setup ---
// Use a single, clear router for all doctor-related endpoints.
const doctorRouter = express.Router();

// --- Public Routes (No Authentication Needed) ---
// These are routes that anyone can access, like patients looking for a doctor.
doctorRouter.post('/login', loginDoctor);
doctorRouter.get('/list', doctorList);
doctorRouter.get('/profile/:id', doctorProfile); // Public profile view

// --- Protected Doctor Routes (Doctor Must Be Logged In) ---
// All routes below this line will require a valid doctor token.
doctorRouter.use(authDoctor);

// Profile and Availability Management
doctorRouter.patch('/availability', changeAvailablity);
doctorRouter.patch('/profile', updateDoctorProfile);

// Dashboard
doctorRouter.get('/dashboard', doctorDashboard);

// Chat Management for the Logged-in Doctor
doctorRouter.get('/chats', getDoctorChats);
doctorRouter.post('/chats/reply', doctorReplyToChat);


// --- Export the Router ---
export default doctorRouter;