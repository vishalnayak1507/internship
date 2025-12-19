import express from "express";
import Customer from "../../models/Customer.js";

const router = express.Router();

// Fetch customer details by phone number
router.get("/customer/search", async (req, res) => {
  try {
    const searchTerm = req.query.q; // Get the search term from query params
    const customers = await Customer.find({
      customerIdentity: { $regex: searchTerm, $options: "i" }, // Case-insensitive partial match
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/create-and-modify", async (req, res) => {
  try {
    const { customerIdentity, countryCode, customerPhoneNumber, customerEmail } = req.body;

    const [customerId, customerName] = customerIdentity.split(" - ");

    let customer = await Customer.findOne({ customerIdentity: { $regex: `^${customerId} - ` } });

    if (customer) {
      // Update customer details
      customer.customerIdentity = `${customerId} - ${customerName}`; // Update customerIdentity with new name
      customer.customerCountryCode = countryCode || customer.customerCountryCode; // Update country code if provided
      customer.customerPhoneNumber = customerPhoneNumber;
      customer.customerEmail = customerEmail;
      await customer.save();
    } else {
      // Create a new customer
      customer = new Customer({
        customerIdentity: `${customerId || `CUST${Date.now().toString().slice(-6)}`} - ${customerName}`,
        customerCountryCode: countryCode || "+91", // Default to +91 if not provided
        customerPhoneNumber,
        customerEmail,
      });

      await customer.save();
    }

    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error("Error in create-and-modify customer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;