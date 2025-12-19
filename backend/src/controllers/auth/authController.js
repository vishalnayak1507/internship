import User from "../../models/User.js"
import Ticket from "../../models/Ticket.js";
import mongoose from "mongoose";
import { HTTP_STATUS, MESSAGES } from '../../constants.js';
import { autoAssignQueue } from "../../scripts/autoAssignQueue.js";


async function generateUniqueUserId() {
  let unique = false;
  let newUserId;
  while (!unique) {
    const randomNum = Math.floor(11100000 + Math.random() * 8999999);
    newUserId = String(randomNum);

    // Check uniqueness
    const existing = await User.findOne({ userId: newUserId });
    if (!existing) unique = true;
  }
  return newUserId;
}

const register = async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.EMAIL_ALREADY_EXISTS
      });
    }
    const userId = await generateUniqueUserId();
    // Create new user
    const user = new User({
      name,
      email,
      password,
      department,
      role,
      userId,
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.USER_REGISTERED,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || MESSAGES.SERVER_ERROR // <-- show error message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user and check password
    console.log("Login attempt with email:", email);

    const user = await User.findByCredentials(email, password);
    console.log("User found:", user ? user.email : "No user found");
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.EMAIL_NOT_FOUND
      });
    }
    //update isactive status
    user.isActive = true;
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    // Generate token
    const token = user.generateAuthToken();
    //set token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',  //means cookie is available to all routes of my domain 
      maxAge: 60 * 60 * 1000 * 24 //24 hour 
    })
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER_LOGGED_IN,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

const logout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.log("No authenticated user found, clearing cookie only");
      res.clearCookie("token", {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: MESSAGES.USER_LOGGED_OUT
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND
      });
    }

    // Special handling for analyst role
    if (user.role === "analyst") {
      const openTickets = await Ticket.find({
        assignedTo: userId,
        status: { $in: ["Open", "In Progress"] }
      });
      const ticketCount = openTickets.length;
      const decision = req.body?.decision;

      if (ticketCount > 0 && decision === undefined) {
        console.log("Decision needed, returning pendingDecision response");
        return res.status(HTTP_STATUS.OK).json({
          success: false,
          pendingDecision: true,
          ticketCount: ticketCount,
          message: `You have ${ticketCount} pending ticket(s). Do you want to continue working on them after login?`
        });
      }

      if (decision === "solve") {
        user.isActive = true;
      } else if (decision === "reassign") {
        user.isActive = false;
        await user.save(); // Save status before reassigning

        // --- Begin Transaction and Pause Queue ---
        await autoAssignQueue.pause();
        session.startTransaction();
        try {
          for (const ticket of openTickets) {
            const ticketId = ticket._id;
            await Ticket.findByIdAndUpdate(ticketId, {
              assignedTo: null,
              status: "Open"
            }, { new: true, session });
            await User.findByIdAndUpdate(userId, {
              $inc: { InProgressTickets: -1 }
            }, { new: true, session });
            await autoAssignQueue.add('assign', {
              ticketId: ticketId,
              department: user.department,
            }, {
              priority: ticket.priority === "P1" ? 1 : ticket.priority === "P2" ? 2 : 3,
              attempts: 5,
              backoff: {
                type: 'exponential',
                delay: 5000
              }
            });
          }
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error(`Error reassigning tickets:`, error);
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
          });
        } finally {
          session.endSession();
          await autoAssignQueue.resume();
        }
      } else {
        user.isActive = true;
      }
    } else {
      // For non-analyst roles, always set isActive to false
      user.isActive = false;
    }
    // Save the updated isActive status
    await user.save();
    // Clear the authentication cookie
    res.clearCookie("token", {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER_LOGGED_OUT,
      isActive: user.isActive
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error('Logout error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND,
      });
    }
    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      userid: user.userId,
      canUpload: user.canUpload,
      department: user.department,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    // Only add these fields if analyst
    if (user.role === "analyst") {
      profile.avgResolutionTime = user.avgResolutionTime;
      profile.resolvedTicketCount = user.resolvedTicketCount;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
    });
  }
};

const getAllAnalysts = async (req, res) => {
  try {
    // Allow both admin and superadmin
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Superadmins only.",
      });
    }

    let departmentFilter = { role: "analyst" };

    if (req.user.role === "admin") {
      // Admins: only their own department
      departmentFilter.department = req.user.department;
    } else if (req.user.role === "superadmin" && req.query.department) {
      // Superadmins: filter by query param if provided
      departmentFilter.department = req.query.department;
    }
    // If superadmin and no department query, show all analysts

    const users = await User.find(departmentFilter);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch analysts",
      error: error.message,
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};


export {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  getAllAnalysts
};
