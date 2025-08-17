import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async (req, res, next) => {
    // 1. Look for the standard 'Authorization' header.
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Not Authorized, no token." });
    }

    try {
        // 2. Extract the token from the "Bearer <token>" string.
        const token = authorization.split(' ')[1];

        // 3. Verify the token using your JWT_SECRET.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Find the user in the database to ensure they still exist.
        //    Attach their ID to the main request object.
        req.user = await userModel.findById(decoded.id).select('_id');
        
        // 5. If the user is found, proceed to the controller function.
        if (req.user) {
            next();
        } else {
            return res.status(401).json({ success: false, message: "Not Authorized, user not found." });
        }
        
    } catch (error) {
        console.error("User Auth Error:", error);
        res.status(401).json({ success: false, message: "Not Authorized, token failed." });
    }
};

export default authUser;