import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import Chat from "../models/Chat.js";

// --- CODE CLEANUP: Razorpay and Crypto are not needed here. ---
// Payment logic belongs in the userController.

// API for doctor Login 
const loginDoctor = async (req, res) => {
    // This function is perfect. No changes needed.
    try {
        const { email, password } = req.body;
        const user = await doctorModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// === NEW, CRITICAL FUNCTION: Doctor Reply ===
const doctorReplyToChat = async (req, res) => {
    try {
        const { chatId, text } = req.body;
        // SECURITY: Get the doctor's ID from the token, not the body.
        const doctorId = req.doctor.id; 

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Reply cannot be empty." });
        }

        // Find the chat and ensure this doctor is assigned to it.
        const chat = await Chat.findOne({ _id: chatId, doctorId: doctorId });

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat session not found or access denied." });
        }

        // Add the doctor's message to the messages array.
        chat.messages.push({
            sender: 'doctor',
            text: text,
            createdAt: new Date()
        });

        await chat.save();
        res.json({ success: true, message: "Reply sent successfully.", chat });

    } catch (error) {
        console.error("Doctor reply error:", error);
        res.status(500).json({ success: false, message: "Error sending reply." });
    }
};

// API to get active chats for doctor
const getDoctorChats = async (req, res) => {
    try {
        // SECURITY: Get doctorId from the authenticated token.
        const doctorId = req.doctor.id;
        
        const chats = await Chat.find({
            doctorId: doctorId,
            paymentStatus: true,
        }).populate('userId', 'name email image').sort({ updatedAt: -1 });
        
        res.json({ success: true, chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        // SECURITY: Get doctorId from the authenticated token.
        const doctorId = req.doctor.id;

        const allPaidChats = await Chat.find({ doctorId: doctorId, paymentStatus: true });

        // Total earnings from all chats
        const totalEarnings = allPaidChats.reduce((sum, chat) => sum + (chat.amount || 0), 0);

        // PERFORMANCE: Use a Set to efficiently count unique patients.
        const patientIds = new Set(allPaidChats.map(chat => chat.userId.toString()));
        const totalPatients = patientIds.size;

        // Count only chats that have not expired.
        const activeChatCount = await Chat.countDocuments({
            doctorId: doctorId,
            paymentStatus: true,
            expiresAt: { $gt: new Date() }
        });

        const dashData = {
            earnings: totalEarnings,
            activeChats: activeChatCount,
            totalPatients: totalPatients,
            latestChats: allPaidChats.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


// --- These functions below are also perfect. No changes needed. ---

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: 'Availability Changed' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel.findById(docId).select('-password');
        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body;
        await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


// --- Finally, update your exports to include the new reply function ---
export {
    loginDoctor,
    doctorList,
    changeAvailablity,
    doctorProfile,
    updateDoctorProfile,
    getDoctorChats,
    doctorDashboard,
    doctorReplyToChat // Add the new function here
};