import { useState } from "react";
import logo from "../../assets/tech-mahindra-logo.png";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from 'lucide-react';

// import { toast } from "react-hot-toast";

// import { toast,ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css'
const SignupCard = () => {
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "",
  });

  const [showRules, setShowRules] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state
  const [showIcon, setShowIcon] = useState(false);
  const [showIcon2, setShowIcon2] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/; // Only allows letters and spaces
    return nameRegex.test(name);
  };

  const getPasswordRules = (password) => ({
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  });

  const passwordRules = getPasswordRules(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, department, role } = formData;

    // Validation checks
    if (!name || !email || !password || !confirmPassword || !department || !role) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    if (!validateName(name)) {
      toast.error("Name should not contain digits or special characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, department, role }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("SignUp successful!");
        navigate("/login");
      } else {
        toast.error(data.message || "Signup failed. Try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  return (
    <div>
        <style>
        {`
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }
        `}
      </style>
    <div className="w-full bg-white/90 backdrop-blur-md border border-blue-100 rounded-3xl shadow-lg px-6 py-8 space-y-6 max-w-lg mx-auto mt-6 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-center mb-3">
        <img src={logo} alt="Tech Mahindra" className="w-[270px]" />
      </div>

      <h2 className="text-xl font-semibold text-center text-gray-800">
        Create your account
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee Email ID <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@techmahindra.com"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Create Password <span className="text-red-500">*</span>
          </label>
          {/* <input
            //type="password"
             type={showPassword ? "text" : "password"}
            name="password"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          /> */}
        <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleChange}
      onFocus={() => setShowIcon(true)} // Show icon when focused
      onBlur={() => setShowIcon(formData.password.length > 0)} // Hide icon if empty
      
      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
    {showIcon && ( // Conditionally render the eye icon
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setShowPassword(!showPassword)}
        style={{ fontSize: "20px" }} 
      >
        {showPassword ? <EyeOff size={20}  /> : <Eye size={20} />}
      </button>
    )}
  </div>

          <div className="mt-2">
            <label className="flex items-center text-sm text-gray-700 space-x-2">
              <input
                type="checkbox"
                checked={showRules}
                onChange={() => setShowRules(!showRules)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span>Show password rules</span>
            </label>
          </div>

          {showRules && (
            <div className="text-xs mt-2 space-y-1 text-gray-700 bg-gray-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className={passwordRules.minLength ? "text-green-600" : "text-red-600"}>
                • At least 6 characters
              </p>
              <p className={passwordRules.hasUppercase ? "text-green-600" : "text-red-600"}>
                • One uppercase letter (A–Z)
              </p>
              <p className={passwordRules.hasLowercase ? "text-green-600" : "text-red-600"}>
                • One lowercase letter (a–z)
              </p>
              <p className={passwordRules.hasNumber ? "text-green-600" : "text-red-600"}>
                • One number (0–9)
              </p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          {/* <input
            type="password"
            name="confirmPassword"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          /> */}
           <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      name="confirmPassword"
      value={formData.confirmPassword}
      onChange={handleChange}
      onFocus={() => setShowIcon2(true)} // Show icon when focused
      onBlur={() => setShowIcon2(formData.confirmPassword.length > 0)} // Hide icon if empty
      className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
    {showIcon2 && ( // Conditionally render the eye icon
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        style={{ fontSize: "20px" }} // Adjust the size of the icon
      >
        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    )}
  </div>
        </div>
      

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            name="department"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Department</option>
            {/* TODO: Fetch department options from backend instead of hardcoding */}
            {departments && departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="maker">Maker</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2 font-semibold rounded-xl shadow-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Sign up
        </button>
      </form>

      <p className="text-center text-sm text-gray-700 mt-2">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          Log in
        </Link>
      </p>

      <p className="text-center text-xs text-gray-400 pt-2">
        © Tech Mahindra. All rights reserved.
      </p>
     <ToastContainer position="top-right" autoClose={3000} />
    </div>
    </div>
    
  );
};

export default SignupCard;
