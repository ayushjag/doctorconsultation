import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import Chat from "../models/Chat.js";
import sendEmail from "../utils/sendEmail.js";

// --- Doctor Registration: Step 1 ---
// Handles initial signup request and sends an OTP to the doctor's email.
const requestDoctorRegistrationOTP = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if a VERIFIED doctor with this email already exists
        const existingDoctor = await doctorModel.findOne({ email, isVerified: true });
        if (existingDoctor) {
            return res.json({ success: false, message: "Doctor with this email already exists." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create or update the unverified doctor record. The profileStatus defaults to 'incomplete'.
        await doctorModel.findOneAndUpdate(
            { email, isVerified: false },
            { name, email, password: hashedPassword, otp: hashedOTP, otpExpires, isVerified: false },
            { upsert: true, new: true }
        );

        const message = `<p>Your One-Time Password (OTP) for HealthLife registration is:</p><h2><b>${otp}</b></h2><p>This OTP is valid for 10 minutes.</p>`;
        
        await sendEmail({
            email: email,
            subject: 'HealthLife - Verify Your Email',
            message
        });

        res.json({ success: true, message: "OTP sent to your email. Please verify." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error sending OTP." });
    }
};

// --- Doctor Registration: Step 2 ---
// Verifies the OTP and finalizes the account creation without logging in.
const verifyDoctorOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const doctor = await doctorModel.findOne({ email });

        if (!doctor) {
            return res.json({ success: false, message: "Signup process not initiated for this email." });
        }
        if (doctor.isVerified) {
            return res.json({ success: false, message: "This email is already verified." });
        }
        if (doctor.otpExpires < new Date()) {
            return res.json({ success: false, message: "OTP has expired. Please try signing up again." });
        }

        const isMatch = await bcrypt.compare(otp, doctor.otp);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid OTP." });
        }

        // Verification successful: update the doctor's record
        doctor.isVerified = true;
        doctor.otp = undefined;
        doctor.otpExpires = undefined;
        await doctor.save();
        
        // --- FIX: Do not return a token. Prompt user to log in. ---
        res.json({ success: true, message: "Email verified successfully! Please log in to continue." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error during verification." });
    }
};

// --- Doctor Login ---
// Handles login and checks if the doctor's profile is complete.
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // --- FIX: Fetch profileStatus and isVerified to check them ---
        const user = await doctorModel.findOne({ email }).select('+password +profileStatus +isVerified');

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // --- FIX: Add check to ensure email has been verified via OTP ---
        if (!user.isVerified) {
            return res.json({ success: false, message: "Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            // --- FIX: Send profileStatus to the frontend for redirection logic ---
            res.json({ success: true, token, profileStatus: user.profileStatus });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// --- Update Doctor Profile ---
// Handles profile updates and marks the profile as 'complete'.
const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.doctor.id;
        const { speciality, degree, experience, about, fees, available } = req.body;

        let updateFields = { speciality, degree, experience, about, fees, available };

        // --- FIX: When the profile is updated, mark it as complete. ---
        // This stops the forced redirect to the profile page on subsequent logins.
        updateFields.profileStatus = 'complete';

        if (req.file) {
            updateFields.image = req.file.path; // Cloudinary URL
        }

        const updatedDoctor = await doctorModel.findByIdAndUpdate(docId, 
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: "Doctor not found." });
        }

        res.json({ success: true, message: 'Profile Updated Successfully', profileData: updatedDoctor });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


// === All other controller functions remain the same ===

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
        const docId = req.doctor.id;
        const profileData = await doctorModel.findById(docId).select('-password');
        if (!profileData) {
            return res.status(404).json({ success: false, message: "Doctor profile not found." });
        }
        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const doctorDashboard = async (req, res) => {
    try {
        const doctorId = req.doctor.id;
        const allPaidChats = await Chat.find({ doctorId: doctorId, paymentStatus: true });
        const totalEarnings = allPaidChats.reduce((sum, chat) => sum + (chat.amount || 0), 0);
        const patientIds = new Set(allPaidChats.map(chat => chat.userId.toString()));
        const totalPatients = patientIds.size;
        const activeChatCount = await Chat.countDocuments({ doctorId: doctorId, paymentStatus: true, expiresAt: { $gt: new Date() } });
        const dashData = { earnings: totalEarnings, activeChats: activeChatCount, totalPatients: totalPatients, latestChats: allPaidChats.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5) };
        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const getDoctorChats = async (req, res) => {
    try {
        const doctorId = req.doctor.id;
        const chats = await Chat.find({ doctorId: doctorId, paymentStatus: true }).populate('userId', 'name email image').sort({ updatedAt: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const getSingleDoctorChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const doctorId = req.doctor.id;
        const chat = await Chat.findOne({ _id: chatId, doctorId: doctorId }).populate('userId', 'name email image').populate('doctorId', 'name speciality image');
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found or access denied." });
        }
        res.json({ success: true, chat });
    } catch (error) {
        console.error("Error fetching single doctor chat:", error);
        res.status(500).json({ success: false, message: "Failed to fetch chat." });
    }
};

const doctorReplyToChat = async (req, res) => {
    try {
        const { chatId, text } = req.body;
        const doctorId = req.doctor.id; 
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Reply cannot be empty." });
        }
        const chat = await Chat.findOne({ _id: chatId, doctorId: doctorId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat session not found or access denied." });
        }
        chat.messages.push({ sender: 'doctor', text: text, createdAt: new Date() });
        await chat.save();
        res.json({ success: true, message: "Reply sent successfully.", chat });
    } catch (error) {
        console.error("Doctor reply error:", error);
        res.status(500).json({ success: false, message: "Error sending reply." });
    }
};

// --- Updated Export List ---
export {
    requestDoctorRegistrationOTP,
    verifyDoctorOTP,
    loginDoctor,
    doctorList,
    changeAvailablity,
    doctorProfile,
    updateDoctorProfile,
    getDoctorChats,
    doctorDashboard,
    doctorReplyToChat,
    getSingleDoctorChat,
};