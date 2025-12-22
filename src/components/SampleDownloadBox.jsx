import React from "react";
import { Download } from "lucide-react";

export default function SampleDownloadBox({ title, fileUrl }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 
                    flex items-center justify-between shadow-md">

      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm">
          Use this sample file for correct Excel upload format.
        </p>
      </div>

      <a
        href={fileUrl}
        download
        className="flex items-center gap-2 bg-blue-600 text-white 
                   px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
      >
        <Download size={18} /> Download
      </a>

    </div>
  );
}
