
import React, { useState, useEffect, useRef } from "react";
import FileUpload from "../../components/admin/fileUpload/FileUpload";
import AnalystMainLayout from "../../components/analyst/analystMainLayout";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axiosClient from "../../utils/AxiosClient";
import { ToastContainer, toast } from "react-toastify";

const NotAnalyst = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h1>
      <p className="text-gray-700">You do not have the required permissions to access this page.</p>
    </div>
  </div>
);

const UploadCSV = () => {
  const [status, setStatus] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyst, setIsAnalyst] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkAnalystRole = async () => {
      try {
        const response = await axiosClient.get("/analyst", {
          withCredentials: true,
        });
        setIsAnalyst(response.data.success);
      } catch (error) {
        setIsAnalyst(false);
        toast.error("Failed to verify analyst role.");
      } finally {
        setLoading(false);
      }
    };
    checkAnalystRole();
  }, []);

  const handleFile = (f) => {
    setFile(f);
    setStatus("");
    previewFile(f);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const previewFile = async (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setPreviewData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("⚠️ Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setStatus(data.message || "✅ File uploaded successfully!");
      } else {
        setStatus(response.data.error || "❌ Upload failed. Please try again.");
        toast.error("Upload failed. Please try again.");
      }
    } catch (err) {
      setStatus("❌ Server error. Try again later.");
      console.error(err);
    }
    setIsUploading(false);
  };

  const removeFile = () => {
    setFile(null);
    setPreviewData(null);
    setStatus("");
  };

  if (isAnalyst === null || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAnalyst) {
    return <NotAnalyst />;
  }

  return (
    <FileUpload
      onUpload={async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
          const response = await fetch("http://localhost:8000/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (response.ok) {
            setStatus(data.message || "✅ File uploaded successfully!");
          } else {
            setStatus(data.error || "❌ Upload failed. Please try again.");
          }
        } catch (err) {
          setStatus("❌ Server error. Try again later.");
          console.error(err);
        }
        setIsUploading(false);
      }}
      uploadStatus={isUploading ? "uploading" : status.startsWith("✅") ? "success" : status.startsWith("❌") ? "error" : "idle"}
      statusMessage={status}
      setStatusMessage={setStatus}
      previewData={previewData}
      setPreviewData={setPreviewData}
      showModal={showModal}
      setShowModal={setShowModal}
      layout={AnalystMainLayout}
    />
  );
};

export default UploadCSV;
