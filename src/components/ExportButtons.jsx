import React from "react";
import { exportPDF, exportPNG } from "../utils/exportUtils";

export default function ExportButtons({ visible }) {
  if (!visible) return null;

  return (
    <div className="flex gap-4 justify-center my-8">
      <button
        onClick={exportPDF}
        className="bg-red-600 text-white px-8 py-3 rounded"
      >
        Export PDF
      </button>

      <button
        onClick={exportPNG}
        className="bg-green-600 text-white px-8 py-3 rounded"
      >
        Export PNG
      </button>
    </div>
  );
}
