import mongoose from "mongoose";
import User from "../models/User.js";

const department = process.argv[2]; // Pass department name as argument

async function deactivateDepartmentUsers() {
    if (!department) {
        console.error("Please provide a department name as an argument.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://techMahindra:techMahindra@clustertechm.1dsekxg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTechM");
    const result = await User.updateMany({ department }, { $set: { isActive: true } });
    console.log(`Updated ${result.modifiedCount} users in department "${department}": set isActive=true`);
    await mongoose.disconnect();
}

deactivateDepartmentUsers().catch(console.error);