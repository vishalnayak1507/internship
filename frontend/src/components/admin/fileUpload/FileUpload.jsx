
import React, { useState, useRef } from "react";
import { FileSpreadsheet, FileText, FileCheck, Upload, Eye, Trash2, Loader, X, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Info } from "lucide-react";

// Helper: Format for preview (handles Excel serials, ISO, and strings)
function formatDateForPreview(cell) {
  // Excel serial number (typical range)
  if (!isNaN(cell) && Number(cell) > 59 && Number(cell) < 60000) {
    const excelDate = XLSX.SSF.parse_date_code(Number(cell));
    if (excelDate) {
      const jsDate = new Date(
        excelDate.y,
        excelDate.m - 1,
        excelDate.d,
        excelDate.H,
        excelDate.M,
        excelDate.S
      );
      return jsDate.toLocaleString();
    }
  }
  // ISO string
  if (typeof cell === "string" && cell.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(cell).toLocaleString();
  }
  // Try to parse as JS Date
  const parsed = new Date(cell);
  if (!isNaN(parsed.getTime())) return parsed.toLocaleString();
  return cell;
}


const FileUpload = ({
  onUpload, // function(file)
  uploadStatus, // 'idle' | 'uploading' | 'success' | 'error'
  statusMessage, // string
  setStatusMessage, // function to update status message
  previewData, // array of arrays (rows)
  setPreviewData, // function
  showModal,
  setShowModal,
  layout: LayoutComponent, // optional layout wrapper
  fileName,
  setFileName,
}) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [samplePreviewData, setSamplePreviewData] = useState(null);
  const [sampleFileName, setSampleFileName] = useState("sample123.xlsx");
   const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

    const handleViewSample = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch("/samplefile/sample123.xlsx");
      const blob = await response.blob();
      setSampleFileName("sample123.xlsx");
      previewSampleFile(blob);
      setShowSampleModal(true);
    } catch (err) {
      setSamplePreviewData(null);
      setShowSampleModal(false);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const handleFile = (f) => {
    if (f.size > MAX_FILE_SIZE) {
      setStatusMessage && setStatusMessage("File size exceeds the 5 MB limit.");
      setFile(null);
      setFileName && setFileName("");
      setPreviewData && setPreviewData(null);
      return;
    }
    setFile(f);
    setFileName && setFileName(f.name);
    // Clear status message when a new file is selected
    setStatusMessage && setStatusMessage("");
    if (setPreviewData) previewFile(f);
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

  // Robust preview logic (from adminupload)
  const previewFile = async (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get precise dimensions from the worksheet
        // Process only cells that have actual data
        let jsonData = [];
        let maxCol = 0;
        const rows = {};
        Object.keys(worksheet).forEach((cell) => {
          if (cell[0] !== "!") {
            // Skip metadata (keys starting with !)
            const cellAddress = XLSX.utils.decode_cell(cell);
            const rowIndex = cellAddress.r;
            const colIndex = cellAddress.c;
            // Track max column with actual data
            if (
              worksheet[cell].v !== undefined &&
              worksheet[cell].v !== null &&
              worksheet[cell].v !== ""
            ) {
              maxCol = Math.max(maxCol, colIndex);
              // Initialize row if needed
              if (!rows[rowIndex]) rows[rowIndex] = [];
            }
          }
        });
        // Build the data array with only meaningful columns
        const maxRow = Math.max(...Object.keys(rows).map(Number), 0);
        // Create headers row first
        const headers = [];
        for (let c = 0; c <= maxCol; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
          headers.push(worksheet[cellAddress]?.v || "");
        }
        jsonData.push(headers);
        // Add data rows
        for (let r = 1; r <= maxRow; r++) {
          const row = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
            row.push(worksheet[cellAddress]?.v || "");
          }
          // Only add rows that have at least one non-empty cell
          if (row.some((cell) => cell !== "")) {
            jsonData.push(row);
          }
        }
        setPreviewData && setPreviewData(jsonData);
      } catch (err) {
        console.error("Error parsing file:", err);
        setPreviewData && setPreviewData(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  
  // Preview logic for sample file (reuse previewFile logic)
  const previewSampleFile = (fileBlob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonData = [];
        let maxCol = 0;
        const rows = {};
        Object.keys(worksheet).forEach((cell) => {
          if (cell[0] !== "!") {
            const cellAddress = XLSX.utils.decode_cell(cell);
            const rowIndex = cellAddress.r;
            const colIndex = cellAddress.c;
            if (
              worksheet[cell].v !== undefined &&
              worksheet[cell].v !== null &&
              worksheet[cell].v !== ""
            ) {
              maxCol = Math.max(maxCol, colIndex);
              if (!rows[rowIndex]) rows[rowIndex] = [];
            }
          }
        });
        const maxRow = Math.max(...Object.keys(rows).map(Number), 0);
        const headers = [];
        for (let c = 0; c <= maxCol; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
          headers.push(worksheet[cellAddress]?.v || "");
        }
        jsonData.push(headers);
        for (let r = 1; r <= maxRow; r++) {
          const row = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
            row.push(worksheet[cellAddress]?.v || "");
          }
          if (row.some((cell) => cell !== "")) {
            jsonData.push(row);
          }
        }
        setSamplePreviewData(jsonData);
      } catch (err) {
        setSamplePreviewData(null);
      }
    };
    reader.readAsArrayBuffer(fileBlob);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    // Clear status before upload
    setStatusMessage && setStatusMessage("");
    if (onUpload) await onUpload(file);
    setIsUploading(false);
  };

  const removeFile = () => {
    setFile(null);
    setFileName && setFileName("");
    setPreviewData && setPreviewData(null);
    // Clear status when file is removed
    setStatusMessage && setStatusMessage("");
  };

  const Wrapper = LayoutComponent || React.Fragment;

  return (
    <Wrapper>
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Header section with gradient background */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-8 px-6 text-center">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
              <div className="relative">
                <FileSpreadsheet className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-4">
              Ticket File Upload
            </h2>
          </div>

          <div className="p-6">
            {/* Drag & drop area */}
                        <div className="flex justify-center mb-4 gap-2">
              <button
                type="button"
                className="text-sm bg-blue-50 text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                onClick={handleViewSample}
              >
                <Eye className="h-4 w-4" />
                View Sample File
              </button>
               <button
                type="button"
                className="text-sm bg-blue-50 text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                onClick={() => setShowGuidelinesModal(true)}
              >
                <Info className="h-4 w-4" />
                File Upload Guidelines
              </button>
            </div>

            <div
              className={`border-2 rounded-xl p-8 mb-6 transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-50 scale-[0.99]"
                  : "border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center py-4">
                {file ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <FileCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>

                    {/* File action buttons */}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        className="text-sm bg-blue-50 text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModal && setShowModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>

                      <button
                        type="button"
                        className="text-sm bg-red-50 text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Simplified icon area - single upload icon */}
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-800 text-lg">
                      Drag & drop your file here
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      or click to browse
                    </p>
                  </>
                )}
                {/* Professional file requirements info - separate lines */}
                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Supported formats:</span>
                  <span className="font-medium">.csv, .xlsx, .xls</span>
                </div>
                <div className="flex items-center justify-center mt-1 text-xs text-gray-500">
                  <span>Maximum file size: 5 MB</span>
                </div>
              </div>

              <input
                type="file"
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
              />
            </div>
            {/* Action buttons - Single upload button */}
            <div className="flex justify-center">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="py-3 px-8 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 w-full max-w-xs"
                type="button"
              >
                {isUploading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload File
                  </>
                )}
              </button>
            </div>

            {/* Status message */}
            {statusMessage && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  uploadStatus === "success"
                    ? "bg-green-100 text-green-800"
                    : uploadStatus === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {uploadStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : uploadStatus === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Preview Modal with properly fixed header */}
      {showModal && file && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl max-h-[90vh] w-full max-w-4xl flex flex-col">
            {/* Fixed modal header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-30 rounded-t-xl">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-blue-700">
                  File Preview: {file?.name}
                </h3>
              </div>
              <button
                className="bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>

            {/* Table with fixed header */}
            <div className="flex-1 overflow-auto">
              {previewData && previewData.length > 0 ? (
                <div className="px-4 py-2">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-blue-50 shadow-sm">
                      <tr>
                        {previewData[0].map((cell, j) => (
                          <th
                            key={j}
                            className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800"
                          >
                            {cell || "—"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(1).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="border border-gray-300 px-4 py-2 text-gray-700"
                            >
                              {cell === "" ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                (() => {
                                  const header = previewData[0][j]?.toLowerCase();
                                  if (header && (header.includes("date") || header.includes("time"))) {
                                    return formatDateForPreview(cell);
                                  }
                                  return cell;
                                })()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertCircle className="h-10 w-10 text-yellow-500 mb-2" />
                  <p className="text-gray-600">No data available to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

           {/* --- SAMPLE PREVIEW MODAL --- */}
      {showSampleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 backdrop-blur-sm" onClick={() => setShowGuidelinesModal(false)}>
          <div className="bg-white rounded-xl max-h-[90vh] w-full max-w-4xl flex flex-col">
            {/* Fixed modal header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-30 rounded-t-xl">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-blue-700">
                  Sample File Preview:
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-blue-50 text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = "/samplefile/sample123.xlsx";
                    link.download = "samplefileupload.xlsx";
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Sample
                </button>
                <button
                  className="bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  onClick={() => setShowSampleModal(false)}
                >
                  <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
                </button>
              </div>
            </div>
            {/* Table with fixed header */}
            <div className="flex-1 overflow-auto">
              {samplePreviewData && samplePreviewData.length > 0 ? (
                <div className="px-4 py-2">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-blue-50 shadow-sm">
                      <tr>
                        {samplePreviewData[0].map((cell, j) => (
                          <th
                            key={j}
                            className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800"
                          >
                            {cell || "—"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {samplePreviewData.slice(1).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="border border-gray-300 px-4 py-2 text-gray-700"
                            >
                              {cell === "" ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                (() => {
                                  const header = samplePreviewData[0][j]?.toLowerCase();
                                  if (header && (header.includes("date") || header.includes("time"))) {
                                    return formatDateForPreview(cell);
                                  }
                                  return cell;
                                })()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertCircle className="h-10 w-10 text-yellow-500 mb-2" />
                  <p className="text-gray-600">No data available to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- END SAMPLE PREVIEW MODAL --- */}
      
      {/* --- GUIDELINES MODAL --- */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={() => setShowSampleModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-700">
                  File Upload Guidelines
                </h3>
              </div>
              <button
                className="bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setShowGuidelinesModal(false)}
              >
                <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
            <div className="text-gray-700 text-sm space-y-3">
              <div>
                <span className="font-semibold">Required Fields:</span> Only <span className="font-mono">ticketNumber</span>, <span className="font-mono">description</span>, and <span className="font-mono">customerName</span> are mandatory.
              </div>
              <div>
                <span className="font-semibold">ticketNumber:</span> Can be any string value.
              </div>
              <div>
                <span className="font-semibold">moduleId</span> and <span className="font-semibold">categoryId:</span> Should be numeric. Their values can be updated in the <span className="font-mono">ticketMaster</span> collection.
              </div>
              <div>
                <span className="font-semibold">status:</span> Acceptable values are <span className="font-mono">open</span>, <span className="font-mono">closed</span>, or <span className="font-mono">resolved</span>. Any other value will default to <span className="font-mono">open</span>.
              </div>
              <div>
                <span className="font-semibold">slaStatusFlag:</span> Must be a boolean (<span className="font-mono">true</span> or <span className="font-mono">false</span>).
              </div>
              <div>
                <span className="font-semibold">Field Names:</span> Column titles are not case sensitive.
              </div>
            </div>
          </div>
        </div>
        
      )}
      {/* --- END GUIDELINES MODAL --- */}

    </Wrapper>
  );
};

export default FileUpload;
