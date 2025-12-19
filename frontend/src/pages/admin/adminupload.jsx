import React, { useState } from "react";
import FileUpload from "../../components/admin/fileUpload/FileUpload";
import AdminMainLayout from "../../components/admin/layoutComponents/AdminMainLayout";

const UploadCSV = () => {
  const [status, setStatus] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
      uploadStatus={
        isUploading
          ? "uploading"
          : status.startsWith("✅")
          ? "success"
          : status.startsWith("❌")
          ? "error"
          : "idle"
      }
      statusMessage={status}
      setStatusMessage={setStatus}
      previewData={previewData}
      setPreviewData={setPreviewData}
      showModal={showModal}
      setShowModal={setShowModal}
      layout={AdminMainLayout}
    />
  );
};

export default UploadCSV;