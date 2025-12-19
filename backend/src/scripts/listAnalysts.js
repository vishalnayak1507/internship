import mongoose from "mongoose";
import User from "../models/User.js";

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://techMahindra:techMahindra@clustertechm.1dsekxg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTechM';

async function listAnalysts() {
  try {
    await mongoose.connect(MONGO_URI);

    const analysts = await User.find({ role: "analyst" }, { userId: 1, department: 1, _id: 0 }).lean();

    console.log("Analysts (userId & department):");
    console.log(analysts);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error fetching analysts:", err);
    process.exit(1);
  }
}

listAnalysts();