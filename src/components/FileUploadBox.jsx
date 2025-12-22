import React from "react";
import { Upload } from "lucide-react";

export default function FileUploadBox({ onFileSelect }) {
  return (
    <label
      className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center 
                 cursor-pointer bg-gray-50 hover:bg-gray-100 transition shadow"
    >
      <Upload size={40} className="text-blue-600 mb-3" />
      <strong>Upload Excel File (.xlsx)</strong>

      <input
        type="file"
        className="hidden"
        accept=".xlsx,.xls"
        onChange={(e) => onFileSelect(e.target.files[0])}
      />
    </label>
  );
}
