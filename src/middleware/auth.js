// auth.middleware.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { User } = require("../models");
dotenv.config();

exports.auth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.body?.token || (req.header("Authorization")?.startsWith("Bearer ") ? req.header("Authorization").replace("Bearer ", "") : null);

        if (!token) return res.status(401).json({ success: false, message: "Token missing" });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Token is invalid" });
        }

        // Attach user id and role to req.user
        req.user = decoded; // decoded should include id and role
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ success: false, message: "Failed to validate token" });
    }
};

exports.authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ success: false, message: "Not authorized" });
            }

            const userDetails = await User.findByPk(req.user.id);

            if (!userDetails) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (!roles.includes(userDetails.role)) {
                return res.status(403).json({ success: false, message: `Access restricted to ${roles.join(", ")}` });
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            return res.status(500).json({ success: false, message: "Unable to verify user role" });
        }
    };
};
