import jwt from "jsonwebtoken";

const authAdmin = async (req, res, next) => {
    // 1. Look for the standard 'Authorization' header.
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Admin not authorized, no token." });
    }

    try {
        // 2. Extract the token.
        const token = authorization.split(' ')[1];

        // 3. Verify the token against the JWT_SECRET.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Check if the decoded payload has the admin identifier.
        if (decoded.isAdmin === true) {
            // If the token is a valid admin token, proceed.
            next();
        } else {
            return res.status(401).json({ success: false, message: "Admin not authorized, invalid token." });
        }
        
    } catch (error) {
        console.error("Admin Auth Error:", error);
        res.status(401).json({ success: false, message: "Admin not authorized, token failed." });
    }
};

export default authAdmin;