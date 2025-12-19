import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { USER_ROLES } from "../constants.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxLength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@techmahindra\.com$/,
      "Please enter a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [6, "Password must be at least 6 characters long"],
    select: false, // Exclude password from queries by default
  },
  role: {
    type: String,
    enum: ["superadmin", "admin", "analyst", "maker"],
    required: [true, "Role is required"],
  },
  otherModeText: { type: String, maxlength: 30 },
  department: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: function () {
      return this.role !== "superadmin";
    },
    // Only validate enum if department is present
    validate: {
      validator: function (value) {
        if (this.role === "superadmin") return true;
        return Object.values(USER_ROLES).includes(value);
      },
      message: "Invalid department",
    },
  },
  isActive: {
    type: Boolean,
  },
  lastLogin: {
    type: Date,
  },
  canUpload: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  canUpload: {
    type: Boolean,
    default: false, // Default value is false
  },
  userId: {
    type: String,
    unique: true,
    required: false,
  },
  InProgressTickets: {
    type: Number,
    default: 0,
  },
  avgResolutionTime: {
    type: Number, // in seconds
    default: 0
  },
  resolvedTicketCount: {
    type: Number,
    default: 0
  }
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Ensure only analysts can have canUpload set to true
userSchema.pre("save", function (next) {
  if (this.role !== "analyst" && this.canUpload) {
    return next(new Error("Only analysts can have canUpload set to true"));
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Static method to find user by email with password
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return null;
  }

  return user;
};

// Transform JSON output (remove sensitive data)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
