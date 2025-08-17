import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
// --- THIS IS THE MOST LIKELY FIX: Correctly import from the file, not the folder ---
import Chat from "../models/Chat.js"; 

// === API for admin login ===
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const payload = { isAdmin: true };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: "Invalid admin credentials" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// === API for adding a pre-approved Doctor ===
const addDoctor = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDoctor = new doctorModel({ name, email, password: hashedPassword, profileStatus: 'incomplete' });
        await newDoctor.save();
        res.json({ success: true, message: 'Pre-approved doctor account created.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "A doctor with this email already exists." });
        }
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to create account." });
    }
};

// === API to get all doctors list ===
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to fetch doctors." });
    }
};

// === API to get all chat sessions ===
const getChatSessions = async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('userId', 'name email image')
            .populate('doctorId', 'name speciality image')
            .sort({ createdAt: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to fetch consultations." });
    }
};

// === API for Admin Dashboard ===
const adminDashboard = async (req, res) => {
    try {
        const doctorsCount = await doctorModel.countDocuments({});
        const patientsCount = await userModel.countDocuments({});
        const consultationsCount = await Chat.countDocuments({});
        
        const latestConsultations = await Chat.find({})
            .populate('userId', 'name image')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const dashData = {
            doctors: doctorsCount,
            patients: patientsCount,
            consultations: consultationsCount, 
            latestConsultations: latestConsultations
        };
        res.json({ success: true, dashData });
    } catch (error) {
        console.log("Dashboard Error:", error); // Add more detailed logging
        res.status(500).json({ success: false, message: "Failed to load dashboard data." });
    }
};

export {
    loginAdmin,
    getChatSessions,
    addDoctor,
    allDoctors,
    adminDashboard
}