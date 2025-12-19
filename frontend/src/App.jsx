import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import CreateTicket from "./pages/maker/manual_entry";
// import FileUpload from "./pages/FileUpload"
import AdminDashboardPage from "./pages/admin/admindashboard.jsx";
import AdminUploadPage from "./pages/admin/adminupload.jsx";
import AdminTicket from "./pages/admin/adminTicket.jsx";
import AdminAnalyst from "./pages/admin/adminAnalyst.jsx";
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/common/ProtectedRoute';
import { DepartmentProvider } from './utils/admin/DepartmentContext'; // <-- Add this import
import AdminTicketExportPage from "./pages/admin/AdminTicketExportPage";
import AnalystUploadPage from "./pages/analyst/analystUpload";

import Analyst from './pages/analyst/analyst'
import MyTickets from './pages/analyst/myTickets'

const App = () => {
  return (
    <DepartmentProvider> {/* Wrap everything inside DepartmentProvider */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout" element={<Login />} />
        <Route path="/admindashboard" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/manualentry" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
        <Route path="/adminupload" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminUploadPage /></ProtectedRoute>} />
        <Route path="/adminTicket" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminTicket /></ProtectedRoute>} />
        <Route path="/adminAnalyst" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminAnalyst /></ProtectedRoute>} />
        <Route path="/analyst" element={<ProtectedRoute><Analyst /></ProtectedRoute>} />
        <Route path="/admin/export-tickets" element={<ProtectedRoute><AdminTicketExportPage /></ProtectedRoute>} />
        <Route path="/analyst/myTickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/analystupload" element={<ProtectedRoute><AnalystUploadPage /></ProtectedRoute>} />
        {/* Add more routes as needed */}
      </Routes>
      <ToastContainer position="top-center" style={{zIndex:2147483647}} />
    </DepartmentProvider>   
  );
};

export default App;