import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  // --- Core Relationship ---
  // CRITICAL: The 'ref' names ("User" and "Doctor") MUST match your model names exactly.
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", // We will confirm this name from your userModel.js
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "doctor", // We will confirm this name from your doctorModel.js
    required: true 
  },

  // --- Payment & Access Control ---
  paymentStatus: { 
    type: Boolean, 
    default: false, 
    required: true 
  },
  // RECOMMENDED: Store both IDs for better record-keeping.
  paymentDetails: {
      orderId: { type: String, required: true },
      paymentId: { type: String },
      signature: { type: String }
  },
  // RECOMMENDED: Store the amount paid.
  amount: {
      type: Number,
      required: true
  },
  expiresAt: { 
    type: Date 
  },

  // --- Chat History ---
  messages: [{
    sender: { type: String, enum: ["user", "doctor"], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;