import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../common/LoadingSpinner"; 

const NotAdmin = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-gray-700">Sorry, but you are not an admin.</p>
    </div>
  </div>
);

const AdminRoute = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.data.user || data.data);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  if (loadingProfile) return <LoadingSpinner />;
  if (!profile || profile.role !== "admin") return <NotAdmin />;
  return children;
};

export default AdminRoute;