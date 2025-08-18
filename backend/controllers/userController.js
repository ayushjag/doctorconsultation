import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import Chat from "../models/Chat.js";
import { v2 as cloudinary } from 'cloudinary';
import razorpay from 'razorpay';
import crypto from 'crypto';
import sendEmail from "../utils/sendEmail.js"; // <-- ADD THIS LINE

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// === Chat Payment System (Corrected for New Schema) ===

const initiateChatPayment = async (req, res) => {
    try {
        // SECURITY FIX: Get userId from the auth token, not the body.
        const userId = req.user.id;
        const { doctorId } = req.body;

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor || !doctor.available) {
            return res.status(400).json({ success: false, message: 'Doctor is not available for chat.' });
        }

        const amount = doctor.fees * 100; // Amount in paise
        const options = {
            amount,
            currency: 'INR',
            receipt: `receipt_chat_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        // LOGIC FIX: Create a chat document that matches our new Chat.js schema.
        // We create it with paymentStatus: false. It will be updated upon successful verification.
        await Chat.create({
            userId,
            doctorId,
            amount: doctor.fees,
            paymentStatus: false,
            paymentDetails: {
                orderId: order.id,
                paymentId: null, // To be added after verification
                signature: null  // To be added after verification
            }
        });

        res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Payment initiation failed:", error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

const verifyChatPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, doctorId } = req.body;
        // SECURITY FIX: Get userId from the auth token.
        const userId = req.user.id;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // LOGIC FIX: Find the chat by the orderId and update it to match our new schema.
        const updatedChat = await Chat.findOneAndUpdate(
            { 
                userId: userId,
                doctorId: doctorId,
                "paymentDetails.orderId": razorpay_order_id 
            },
            { 
                paymentStatus: true,
                "paymentDetails.paymentId": razorpay_payment_id,
                "paymentDetails.signature": razorpay_signature,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24-hour access
            },
            { new: true } // Return the updated document
        ).populate('doctorId', 'name speciality image');

        if (!updatedChat) {
            return res.status(404).json({ success: false, message: 'Chat session not found' });
        }

        res.json({ success: true, message: 'Chat access granted', chat: updatedChat });
    } catch (error) {
        console.error("Payment verification failed:", error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};


// === User Profile Management (Corrected for Security) ===

const getProfile = async (req, res) => {
    try {
        // SECURITY FIX: Get the userId from the authenticated token.
        const userId = req.user.id;
        const userData = await userModel.findById(userId).select('-password');
        res.json({ success: true, userData });
    } catch (error)
        {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        // SECURITY FIX: Get the userId from the authenticated token.
        const userId = req.user.id;
        const { name, phone, address, dob, gender } = req.body;
        // ... rest of the function is good ...
        const imageFile = req.file;
        if (!name || !phone || !dob || !gender) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const updateData = { name, phone, dob, gender };
        if (address) {
            updateData.address = JSON.parse(address);
        }
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image", folder: "user_profiles"});
            updateData.image = imageUpload.secure_url;
        }
        await userModel.findByIdAndUpdate(userId, updateData);
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// --- The functions below are already perfect. No changes were needed. ---

const sendChatMessage = async (req, res) => {
    try {
        const { chatId, text } = req.body;
        const userId = req.user.id;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Message cannot be empty" });
        }
        const chat = await Chat.findOne({_id: chatId, userId, paymentStatus: true, expiresAt: { $gt: new Date() }});
        if (!chat) {
            return res.status(403).json({ success: false, message: "Chat not found or access denied" });
        }
        chat.messages.push({ sender: 'user', text, createdAt: new Date()});
        await chat.save();
        res.json({ success: true, message: "Message sent", chat});
    } catch (error) {
        console.error("Message send error:", error);
        res.status(500).json({ success: false, message: "Error sending message" });
    }
};

const getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await Chat.find({ userId, paymentStatus: true}).populate('doctorId', 'name image speciality').sort({ updatedAt: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        console.error("Chat history error:", error);
        res.status(500).json({ success: false, message: "Error fetching chats" });
    }
};
const getSingleChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const chat = await Chat.findOne({ _id: chatId, userId: userId })
            .populate('doctorId', 'name image speciality');
        
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found." });
        }
        res.json({ success: true, chat });
    } catch (error) {
        console.error("Get single chat error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};


const requestUserRegistrationOTP = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing Details' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        // Check if a VERIFIED user with this email already exists
        const existingUser = await userModel.findOne({ email, isVerified: true });
        if (existingUser) {
            return res.json({ success: false, message: "User with this email already exists." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create or update the unverified user record
        await userModel.findOneAndUpdate(
            { email, isVerified: false },
            { name, email, password: hashedPassword, otp: hashedOTP, otpExpires, isVerified: false },
            { upsert: true, new: true }
        );

        // Send OTP to user's email
        const message = `<p>Your OTP for HealthLife registration is: <h2><b>${otp}</b></h2> This is valid for 10 minutes.</p>`;
        await sendEmail({ email, subject: 'HealthLife - Email Verification', message });

        res.json({ success: true, message: "OTP sent to your email. Please verify." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error sending OTP." });
    }
};

const verifyUserOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Signup process not initiated for this email." });
        }
        if (user.isVerified) {
            return res.json({ success: false, message: "This email is already verified." });
        }
        if (user.otpExpires < new Date()) {
            return res.json({ success: false, message: "OTP has expired. Please try signing up again." });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid OTP." });
        }

        // Verification successful
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        // You can optionally generate a token here if you want to auto-login,
        // but as per your last request, we will not.
        res.json({ success: true, message: "Email verified successfully!" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error during verification." });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// === Final Export List ===
export {
    loginUser,
     requestUserRegistrationOTP, // <-- ADD THIS
    verifyUserOTP, // <-- AND THIS,
    getProfile,
    updateProfile,
    initiateChatPayment,
    verifyChatPayment,
    getUserChats,
    sendChatMessage,
    getSingleChat
};