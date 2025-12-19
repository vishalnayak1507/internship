/* eslint-disable no-unused-vars */
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/tech-mahindra-logo.png";
// import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useState, useEffect } from "react";
import axiosClient from "../../utils/AxiosClient";

const LoginCard = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    setButtonDisabled(!(email.trim() && password.trim()));
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      console.log("Login response:", response.data);

      const { user, token } = response.data.data;

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      if(user.role === "analyst"){
        localStorage.setItem("analystLoginTime", Date.now());
      }

      // Handle navigation based on role
      handleLoginSuccess(user);

      toast.success("Login successful!");
      const role = user.role;
      switch(role){
        case "admin || superadmin":
          navigate("/admindashboard");
          break;
        case "analyst":
          navigate("/analyst");
          break;
        case "maker":
          navigate("/manualentry");
          break;
        default:
          navigate("/admindashboard");
        
      }
      // navigate("/profile");
    } catch (error) {
      console.error("Login failed", error);
      console.log("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed";

      if (errorMessage.toLowerCase().includes("email doesn't exist")) {
        toast.error("Email doesn't exist");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // New function to handle successful login
  const handleLoginSuccess = (userData) => {
    const role = userData.role;

    // If superadmin, initialize selected department
    if (role === "superadmin") {
      // Initially set to their assigned department or blank
      localStorage.setItem("selectedDepartment", userData.department || "");
    }

    // Navigate based on role
    switch (role) {
      case "admin":
        navigate("/admindashboard");
        break;
      case "superadmin":
        navigate("/admindashboard");
        break;
      case "analyst":
        navigate("/analyst");
        break;
      case "maker":
        navigate("/manualentry");
        break;
      default:
        navigate("/admindashboard");
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
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-blue-100 rounded-3xl shadow-lg px-6 py-8 space-y-6 mx-auto mt-8">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src={logo} alt="Tech Mahindra" className="w-[270px]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-800">
          Log in to continue
        </h2>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowIcon(true)} // Show icon when focused
                onBlur={() => setShowIcon(password.length > 0)} // Hide icon if empty
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              {showIcon && ( // Conditionally render the eye icon
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ fontSize: "20px" }} // Adjust the size of the icon
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={buttonDisabled || loading}
            className={`w-full py-2 text-white font-semibold rounded-xl transition shadow-md ${
              loading || buttonDisabled
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-700 mt-2">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-2">
          © Tech Mahindra. All rights reserved.
        </p>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default LoginCard;
