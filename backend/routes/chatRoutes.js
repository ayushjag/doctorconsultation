import express from "express";
import authUser from "../middleware/authUser.js";

// --- Imports ---
// We will import ALL chat-related functions that a USER can perform
// from the userController, where they are already defined.
import { 
    initiateChatPayment, 
    verifyChatPayment,
    getUserChats,
    sendChatMessage,
    getSingleChat
} from "../controllers/userController.js";

const chatRouter = express.Router();

// --- Middleware ---
// All routes in this file are for a logged-in user.
// So, we can apply the authUser middleware to the entire router.
chatRouter.use(authUser);
chatRouter.get("/single/:chatId", getSingleChat);

// --- Payment Routes ---
// These routes handle the start and verification of a paid chat session.
chatRouter.post("/initiate", initiateChatPayment);
chatRouter.post("/verify", verifyChatPayment);

// --- Chat Management Routes ---
// This route gets the list of all chat histories for the logged-in user.
// A GET request to /api/chats/ will trigger this.
chatRouter.get("/", getUserChats);

// This route allows a user to send a message.
// The controller expects the chatId and text in the request body.
chatRouter.post("/message", sendChatMessage);

// --- NOTE ---
// The route for a doctor to reply has been REMOVED from this file.
// It belongs in 'doctorRoute.js' and is handled by the 'doctorReplyToChat' function.

export default chatRouter;