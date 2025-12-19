import mongoose from "mongoose";
import User from "../models/User.js";

const defaultFields = {
  InProgressTickets: 0,
  isActive: false,
  avgResolutionTime: 0,
  resolvedTicketCount: 0,
};

const defaultAnalysts = [
  // Add analyst objects here if you want to ensure their existence
  // Example:
  // { email: "analyst1@example.com", name: "Analyst 1", role: "analyst" },
  // { email: "analyst2@example.com", name: "Analyst 2", role: "analyst" },
];

async function resetAllUsers() {
  await mongoose.connect(
    process.env.MONGO_URI ||
      "mongodb+srv://TechnoRiseIntern:TechnoRiseIntern@techmahindra.bwn37yk.mongodb.net/"
  );

  // Update all users
  const result = await User.updateMany({}, { $set: defaultFields });
  console.log(
    `Updated ${result.modifiedCount} users: set InProgressTickets=0, isActive=false, avgResolutionTime=0, resolvedTicketCount=0`
  );

  // Ensure default analysts exist
  for (const analyst of defaultAnalysts) {
    const found = await User.findOne({ email: analyst.email });
    if (!found) {
      await User.create({ ...analyst, ...defaultFields });
      console.log(`Created analyst: ${analyst.email}`);
    }
  }

  await mongoose.disconnect();
}

resetAllUsers().catch(console.error);