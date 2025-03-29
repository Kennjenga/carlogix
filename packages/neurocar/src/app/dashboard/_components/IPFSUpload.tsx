"use client";

// components/IPFSUpload.tsx
import React, { useState } from "react";
import Image from "next/image";
import { Upload, AlertCircle, Loader, CheckCircle } from "lucide-react";

interface IPFSUploadProps {
  onUploadComplete: (url: string) => void;
}

const IPFSUpload: React.FC<IPFSUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  // Handle file upload using Pinata Cloud API via server route
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Make a POST request to our API route that will handle the Pinata upload
      const response = await fetch("/api/pinata-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Construct IPFS URI from the returned CID
      const ipfsUri = `ipfs://${data.cid}`;

      // Set success message
      setSuccessMessage(`File uploaded successfully! Gateway URL: ${data.url}`);

      // Call the onUploadComplete callback with the IPFS URL
      onUploadComplete(ipfsUri);
    } catch (err) {
      console.error("Error uploading to Pinata:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 border border-green-200">
          <div className="flex">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
        {preview ? (
          <div className="mb-4 max-h-48 overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              className="max-h-full object-contain"
              width={300}
              height={300}
            />
          </div>
        ) : (
          <Upload size={40} className="text-gray-400 mb-4" />
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            {file ? file.name : "Drag & drop a file or click to browse"}
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: Images, PDFs, and documents
          </p>
        </div>

        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          className="hidden"
        />

        <label
          htmlFor="fileInput"
          className="mt-4 cursor-pointer py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Select File
        </label>
      </div>

      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle size={16} className="mr-1" />
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          !file || uploading
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        {uploading ? (
          <>
            <Loader size={16} className="animate-spin mr-2" />
            Uploading to IPFS...
          </>
        ) : (
          <>
            <Upload size={16} className="mr-2" />
            Upload to IPFS
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Using Pinata Cloud for IPFS storage
      </p>
    </div>
  );
};

export default IPFSUpload;
