import express from 'express';
import upload from '../middleware/multer.js';
import authAdmin from '../middleware/authAdmin.js';

// --- Imports ---
// 1. Import the CORRECT functions from the adminController.
//    'appointmentsAdmin' and 'appointmentCancel' are replaced.
import { 
  loginAdmin,
  addDoctor,
  allDoctors,
  adminDashboard,
  getChatSessions // This is the new function
} from '../controllers/adminController.js';

// 2. We can also import this from the doctorController if the admin needs it.
import { changeAvailablity } from '../controllers/doctorController.js';

const adminRouter = express.Router();

// --- Public Route ---
adminRouter.post("/login", loginAdmin);

// --- Protected Admin Routes ---
// All routes below this line will require an admin to be logged in.
adminRouter.use(authAdmin);

// --- Dashboard ---
adminRouter.get("/dashboard", adminDashboard);

// --- Doctor Management ---
adminRouter.post("/add-doctor", addDoctor);
adminRouter.get("/all-doctors", allDoctors);
adminRouter.post("/change-availability", changeAvailablity); // Admin can change doctor availability

// --- Consultation / Chat Management ---
// This is the new route to get a list of all paid chat sessions.
adminRouter.get("/consultations", getChatSessions);

// The '/cancel-appointment' route has been removed as it is no longer needed.

export default adminRouter;