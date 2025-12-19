import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { HTTP_STATUS, MESSAGES } from '../../constants.js';
import mongoose from 'mongoose';

// Auth middleware (auth check)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ACCESS_DENIED
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_TOKEN
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.TOKEN_EXPIRED
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_TOKEN
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

const authMiddleware_cookie = async  (req,res,next) => {
    const token = req.cookies.token;
    if(!token){
       return res.status(401).json({success : false , message : "Unauthorized : No token Provided"})
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findOne({email : decoded.email});
        if(!user){
            return res.status(404).json({success : false, message : "User Not Found"})
        }
        req.user = user;
        return next();
    }catch(error){
        if(error.name === "TokenExpiredError"){
            return res.status(401).json({success : true, message : "Token Expired"})
        }
        return res.status(401).json({success : false, message : "Invalid Token"})
    }
};

const userExistMiddleware = async (req,res,next) => {
    const userId = req.params.userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    try{
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({success : false, message : "User not found"})
        }
        next();
        return res.status(200).json({success : true,message : `user with role ${user.role} is found`, user})
    }catch(err){
        console.error(err)
        return res.status(500).json({success : false, message : "Internal Server Error"})
    }
}

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

export {
  authMiddleware,
  adminMiddleware,
  authMiddleware_cookie,
  userExistMiddleware
};