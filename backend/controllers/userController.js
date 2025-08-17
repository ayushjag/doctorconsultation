import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import Chat from "../models/Chat.js";
import { v2 as cloudinary } from 'cloudinary';
import razorpay from 'razorpay';
import crypto from 'crypto';

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

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing Details' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = { name, email, password: hashedPassword };
        const newUser = new userModel(userData);
        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
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
    registerUser,
    getProfile,
    updateProfile,
    initiateChatPayment,
    verifyChatPayment,
    getUserChats,
    sendChatMessage,
    getSingleChat
};