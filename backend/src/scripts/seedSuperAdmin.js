import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js'; // Adjust path if needed

dotenv.config();

const MONGO_URI = 'mongodb+srv://techMahindra:techMahindra@clustertechm.1dsekxg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTechM'


const createSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@techmahindra.com' });
    
    if (existingSuperAdmin) {
      console.log('SuperAdmin user already exists');
    } else {
      // Create a hashed password
      const password = 'Admin@123'; // Change this to a secure password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create superadmin user
      const superAdmin = new User({
        email: 'superadmin@techmahindra.com',
        name: 'Super Admin',
        role: 'superadmin',
        password: hashedPassword,
        department: 'GLS' // Default department
      });
      
      await superAdmin.save();
      console.log('SuperAdmin user created successfully!');
      console.log('Email: superadmin@techmahindra.com');
      console.log('Password:', password); 
      console.log('Role: superadmin');
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
//   console.log('Done completed');
};

createSuperAdmin();