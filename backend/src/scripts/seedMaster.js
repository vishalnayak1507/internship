import mongoose from "mongoose";
 
// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://TechnoRiseIntern:TechnoRiseIntern@techmahindra.bwn37yk.mongodb.net/", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
 
// Data to be added
const categories = [
  // CMD Department
  { department: "CMD", categoryId: 1, moduleId: 1, categoryName: "Account Management", moduleName: "Account Creation", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "CMD", categoryId: 1, moduleId: 2, categoryName: "Account Management", moduleName: "Account Closure", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 1, moduleId: 3, categoryName: "Account Management", moduleName: "Account Modification", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 2, moduleId: 1, categoryName: "Transaction Issues", moduleName: "Failed Transactions", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "CMD", categoryId: 2, moduleId: 2, categoryName: "Transaction Issues", moduleName: "Delayed Transactions", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 2, moduleId: 3, categoryName: "Transaction Issues", moduleName: "Unauthorized Transactions", severity: "Medium", priority: "P2", expected_SLA: 8 },
  { department: "CMD", categoryId: 3, moduleId: 1, categoryName: "Customer Support", moduleName: "Complaint Registration", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "CMD", categoryId: 3, moduleId: 2, categoryName: "Customer Support", moduleName: "Feedback Submission", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "CMD", categoryId: 3, moduleId: 3, categoryName: "Customer Support", moduleName: "Query Resolution", severity: "Low", priority: "P3", expected_SLA: 4 },
  { department: "CMD", categoryId: 3, moduleId: 4, categoryName: "Customer Support", moduleName: "Escalation Handling", severity: "Low", priority: "P3", expected_SLA:  6},
  { department: "CMD", categoryId: 4, moduleId: 1, categoryName: "Loan Services", moduleName: "Loan Application", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 4, moduleId: 2, categoryName: "Loan Services", moduleName: "Loan Prepayment", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "CMD", categoryId: 4, moduleId: 3, categoryName: "Loan Services", moduleName: "Loan Cancellation", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "CMD", categoryId: 5, moduleId: 1, categoryName: "Corporate Services", moduleName: "Bulk Payments", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 5, moduleId: 2, categoryName: "Corporate Services", moduleName: "Corporate Account Setup", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "CMD", categoryId: 5, moduleId: 3, categoryName: "Corporate Services", moduleName: "Corporate Account Maintenance", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 5, moduleId: 4, categoryName: "Corporate Services", moduleName: "Corporate Tax Advisory", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "CMD", categoryId: 6, moduleId: 1, categoryName: "Audit and Compliance", moduleName: "Internal Audits", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "CMD", categoryId: 6, moduleId: 2, categoryName: "Audit and Compliance", moduleName: "Regulatory Compliance", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "CMD", categoryId: 6, moduleId: 3, categoryName: "Audit and Compliance", moduleName: "Fraud Detection", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "CMD", categoryId: 6, moduleId: 4, categoryName: "Audit and Compliance", moduleName: "Risk Assessment", severity: "Medium", priority: "P2", expected_SLA: 6 },
 
  // GLS Department
  { department: "GLS", categoryId: 1, moduleId: 1, categoryName: "International Transactions", moduleName: "Foreign Currency Exchange", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 1, moduleId: 2, categoryName: "International Transactions", moduleName: "SWIFT Transfers", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 2, moduleId: 1, categoryName: "NRI Services", moduleName: "NRI Account Opening", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "GLS", categoryId: 2, moduleId: 2, categoryName: "NRI Services", moduleName: "NRI Account Maintenance", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 3, moduleId: 1, categoryName: "Trade Finance", moduleName: "Letter of Credit", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 3, moduleId: 2, categoryName: "Trade Finance", moduleName: "Bank Guarantees", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 1, moduleId: 3, categoryName: "International Transactions", moduleName: "Cross-Border Payments", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 1, moduleId: 4, categoryName: "International Transactions", moduleName: "International Drafts", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 2, moduleId: 3, categoryName: "NRI Services", moduleName: "NRI Tax Advisory", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 2, moduleId: 4, categoryName: "NRI Services", moduleName: "NRI Investment Services", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "GLS", categoryId: 3, moduleId: 3, categoryName: "Trade Finance", moduleName: "Export Financing", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 3, moduleId: 4, categoryName: "Trade Finance", moduleName: "Import Financing", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 4, moduleId: 1, categoryName: "Global Investments", moduleName: "Foreign Investment Advisory", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 4, moduleId: 2, categoryName: "Global Investments", moduleName: "International Mutual Funds", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "GLS", categoryId: 4, moduleId: 3, categoryName: "Global Investments", moduleName: "Offshore Banking", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 4, moduleId: 4, categoryName: "Global Investments", moduleName: "Wealth Management", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 5, moduleId: 1, categoryName: "Compliance", moduleName: "Anti-Money Laundering Checks", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 5, moduleId: 2, categoryName: "Compliance", moduleName: "KYC for International Accounts", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 5, moduleId: 3, categoryName: "Compliance", moduleName: "Regulatory Reporting", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 5, moduleId: 4, categoryName: "Compliance", moduleName: "Sanctions Screening", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "GLS", categoryId: 6, moduleId: 1, categoryName: "Global Customer Support", moduleName: "International Complaint Resolution", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 6, moduleId: 2, categoryName: "Global Customer Support", moduleName: "24/7 Helpline", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "GLS", categoryId: 6, moduleId: 3, categoryName: "Global Customer Support", moduleName: "Multilingual Support", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "GLS", categoryId: 6, moduleId: 4, categoryName: "Global Customer Support", moduleName: "Priority Banking Services", severity: "High", priority: "P1", expected_SLA: 4 },
 
  // YONO Department
  { department: "YONO", categoryId: 1, moduleId: 1, categoryName: "Mobile Banking", moduleName: "App Registration", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 1, moduleId: 2, categoryName: "Mobile Banking", moduleName: "App Login Issues", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 2, moduleId: 1, categoryName: "Online Payments", moduleName: "UPI Transactions", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "YONO", categoryId: 2, moduleId: 2, categoryName: "Online Payments", moduleName: "Bill Payments", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 3, moduleId: 1, categoryName: "Account Services", moduleName: "Account Linking", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 3, moduleId: 2, categoryName: "Account Services", moduleName: "Account Statements", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 1, moduleId: 3, categoryName: "Mobile Banking", moduleName: "App Registration", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 1, moduleId: 4, categoryName: "Mobile Banking", moduleName: "App Login Issues", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 2, moduleId: 3, categoryName: "Online Payments", moduleName: "Subscription Payments", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 2, moduleId: 4, categoryName: "Online Payments", moduleName: "Refund Processing", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 3, moduleId: 3, categoryName: "Account Services", moduleName: "Account Freeze/Unfreeze", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 3, moduleId: 4, categoryName: "Account Services", moduleName: "Account Personalization", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 4, moduleId: 1, categoryName: "Digital Loans", moduleName: "Instant Loan Application", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "YONO", categoryId: 4, moduleId: 2, categoryName: "Digital Loans", moduleName: "Loan Eligibility Check", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 4, moduleId: 3, categoryName: "Digital Loans", moduleName: "Loan Repayment via App", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 4, moduleId: 4, categoryName: "Digital Loans", moduleName: "Loan Top-Up", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 4, moduleId: 5, categoryName: "Digital Loans", moduleName: "Loan Closure", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 5, moduleId: 1, categoryName: "Security", moduleName: "Password Reset", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 5, moduleId: 2, categoryName: "Security", moduleName: "Two-Factor Authentication", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "YONO", categoryId: 5, moduleId: 3, categoryName: "Security", moduleName: "Fraud Detection", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "YONO", categoryId: 5, moduleId: 4, categoryName: "Security", moduleName: "Device Authorization", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 5, moduleId: 5, categoryName: "Security", moduleName: "Biometric Login", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 6, moduleId: 1, categoryName: "Rewards and Offers", moduleName: "Cashback Offers", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "YONO", categoryId: 6, moduleId: 2, categoryName: "Rewards and Offers", moduleName: "Reward Points Management", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 6, moduleId: 3, categoryName: "Rewards and Offers", moduleName: "Partner Discounts", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "YONO", categoryId: 6, moduleId: 4, categoryName: "Rewards and Offers", moduleName: "Seasonal Promotions", severity: "Low", priority: "P3", expected_SLA: 8 },
 
  // SCFU Department
  { department: "SCFU", categoryId: 1, moduleId: 1, categoryName: "Microfinance", moduleName: "Loan Application for Small Businesses", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 1, moduleId: 2, categoryName: "Microfinance", moduleName: "Loan Repayment Plans", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 2, moduleId: 1, categoryName: "Agricultural Loans", moduleName: "Crop Loans", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 2, moduleId: 2, categoryName: "Agricultural Loans", moduleName: "Equipment Financing", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 3, moduleId: 1, categoryName: "Small Business Support", moduleName: "Business Account Setup", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 3, moduleId: 2, categoryName: "Small Business Support", moduleName: "Business Transaction Support", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 1, moduleId: 3, categoryName: "Microfinance", moduleName: "Loan Subsidies", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 1, moduleId: 4, categoryName: "Microfinance", moduleName: "Loan Renewal", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 1, moduleId: 5, categoryName: "Microfinance", moduleName: "Loan Default Management", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 2, moduleId: 3, categoryName: "Agricultural Loans", moduleName: "Subsidy Management", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 2, moduleId: 4, categoryName: "Agricultural Loans", moduleName: "Seasonal Loan Adjustments", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 2, moduleId: 5, categoryName: "Agricultural Loans", moduleName: "Disaster Relief Loans", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 3, moduleId: 3, categoryName: "Small Business Support", moduleName: "Business Advisory Services", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 3, moduleId: 4, categoryName: "Small Business Support", moduleName: "Business Growth Loans", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 3, moduleId: 5, categoryName: "Small Business Support", moduleName: "Business Insurance", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 4, moduleId: 1, categoryName: "Financial Literacy", moduleName: "Workshops and Training", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 4, moduleId: 2, categoryName: "Financial Literacy", moduleName: "Budgeting Tools", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 4, moduleId: 3, categoryName: "Financial Literacy", moduleName: "Savings Plans", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 4, moduleId: 4, categoryName: "Financial Literacy", moduleName: "Financial Planning", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 4, moduleId: 5, categoryName: "Financial Literacy", moduleName: "Debt Management", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 5, moduleId: 1, categoryName: "Government Schemes", moduleName: "PMJDY Account Opening", severity: "Low", priority: "P3", expected_SLA: 8 },
  { department: "SCFU", categoryId: 5, moduleId: 2, categoryName: "Government Schemes", moduleName: "Subsidy Disbursement", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 5, moduleId: 3, categoryName: "Government Schemes", moduleName: "Pension Schemes", severity: "Medium", priority: "P2", expected_SLA: 6 },
  { department: "SCFU", categoryId: 5, moduleId: 4, categoryName: "Government Schemes", moduleName: "Welfare Programs", severity: "High", priority: "P1", expected_SLA: 4 },
  { department: "SCFU", categoryId: 5, moduleId: 5, categoryName: "Government Schemes", moduleName: "Skill Development Loans", severity: "Medium", priority: "P2", expected_SLA: 6 },
];
// Remove duplicates based on categoryName and moduleName
const uniqueCategories = categories.filter(
  (item, index, self) =>
    index ===
    self.findIndex(
      (t) =>
        t.categoryName === item.categoryName &&
        t.moduleName === item.moduleName
    )
);
const insertData = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("ticketmasters");
    await collection.insertMany(uniqueCategories, { ordered: false });
    console.log("Categories and modules added successfully to the ticketmasters collection!");
  } catch (error) {
    console.error("Error adding categories and modules:", error);
  } finally {
    mongoose.connection.close();
  }
};
 
// Main function
const main = async () => {
  await connectDB();
  await insertData();
};
 
main();
 