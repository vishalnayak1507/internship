import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  customerIdentity: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerCountryCode: {
    type: String,
    default: "+91", 
    required: true,
  },
  customerPhoneNumber: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true
  },
});

export default mongoose.model("Customer", CustomerSchema);
