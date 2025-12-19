import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { USER_ROLES } from "../constants.js"; // Import allowed roles/departments

dotenv.config();
const MONGO_URI = 'mongodb+srv://TechnoRiseIntern:TechnoRiseIntern@techmahindra.bwn37yk.mongodb.net/';

// Function to generate unique user IDs (similar to what's in authController.js)
async function generateUniqueUserId() {
  let unique = false;
  let newUserId;
  while (!unique) {
    // Generate a random number between 11100000 and 11199999
    const randomNum = Math.floor(11100000 + Math.random() * 8999999);
    newUserId = String(randomNum);

    // Check uniqueness
    const existing = await User.findOne({ userId: newUserId });
    if (!existing) unique = true;
  }
  return newUserId;
}

// Use departments that are defined in USER_ROLES instead of arbitrary ones
const departments = Object.values(USER_ROLES);
console.log("Valid departments:", departments);

const password = "TechMahindra@123";

// Create array of user objects without userIds initially
const userTemplates = [
  {
    name: "Superadmin",
    email: "superadmin@techmahindra.com",
    password,
    role: "superadmin",
    department: departments[0],
    isActive: true, // Changed to true
  },
];

// Add 2 admins and 5 analysts per department
departments.forEach((dept) => {
  // Admins
  for (let i = 1; i <= 2; i++) {
    userTemplates.push({
      name: `${dept} Admin ${i}`, // Added space before number
      email: `admin${i}.${dept.toLowerCase()}@techmahindra.com`, // Added dot between name and department
      password,
      role: "admin",
      department: dept,
      canUpload: false,
      isActive: false, // Changed to true
    });
  }
  // Analysts
  for (let i = 1; i <= 5; i++) {
    userTemplates.push({
      name: `${dept} Analyst ${i}`, // Added space before number
      email: `analyst${i}.${dept.toLowerCase()}@techmahindra.com`, // Added dot between name and department
      password,
      role: "analyst",
      department: dept,
      canUpload: false, // First 3 analysts can upload
      isActive: false, // Changed to true
    });
  }
});

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Optional: Remove all existing users
    await User.deleteMany({});
    console.log("Old users removed.");

    // Create users one by one WITHOUT pre-hashing passwords
    let successCount = 0;
    
    for (const template of userTemplates) {
      try {
        // Generate unique userId
        const userId = await generateUniqueUserId();
        
        // Create a new user document
        const user = new User({
          ...template,
          userId
        });
        
        // Manually set the password to bypass the pre-save hook
        // This directly stores the hashed password
        user.password = await bcrypt.hash(password, 12);
        
        // Save using special method that bypasses middleware
        await User.collection.insertOne(user);
        successCount++;
        console.log(`✓ User created: ${template.email}`);
      } catch (error) {
        console.error(`✗ Failed to create user ${template.email}:`, error.message);
      }
    }

    console.log(`Inserted users: ${successCount} of ${userTemplates.length}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();