import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";

const authDoctor = async (req, res, next) => {
    // 1. Look for the standard 'Authorization' header.
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Doctor not authorized, no token." });
    }

    try {
        // 2. Extract the token.
        const token = authorization.split(' ')[1];

        // 3. Verify the token against the JWT_SECRET.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Find the doctor in the database using the ID from the token.
        //    Attach the doctor's ID to the main request object. This is safer than modifying req.body.
        req.doctor = await doctorModel.findById(decoded.id).select('_id');
        
        // 5. If the doctor is found, proceed to the controller function.
        if (req.doctor) {
            next();
        } else {
            return res.status(401).json({ success: false, message: "Doctor not authorized, doctor not found." });
        }
        
    } catch (error) {
        console.error("Doctor Auth Error:", error);
        res.status(401).json({ success: false, message: "Doctor not authorized, token failed." });
    }
};

export default authDoctor;