import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import dotenv from "dotenv";

dotenv.config();

const customers = [
  {
    customerIdentity: "CUST3425 - Pramod",
    customerCountryCode: "+91",
    customerPhoneNumber: "7123456890",
    customerEmail: "pramod@email.com",
  },
  {
    customerIdentity: "CUST189408 - maloth",
    customerCountryCode: "+91",
    customerPhoneNumber: "9999999999",
    customerEmail: "mvish@techmahindra.com",
  },
  {
    customerIdentity: "CUST250250 - Aryan",
    customerCountryCode: "+91",
    customerPhoneNumber: "9999999988",
    customerEmail: "aryan@email.com",
  },
  {
    customerIdentity: "CUST001 - Raj",
    customerCountryCode: "+91",
    customerPhoneNumber: "1234567890",
    customerEmail: "raj@email.com",
  },
];

async function seedCustomers() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const result = await Customer.insertMany(customers, { ordered: false });
    console.log("Inserted customers:", result);
  } catch (err) {
    console.error("Error inserting customers:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedCustomers();