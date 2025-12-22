import React, { useState } from "react";
import * as XLSX from "xlsx";
import AdminLayout from "../layouts/AdminLayout";
import FileUploadBox from "../components/FileUploadBox";
import PreviewTable from "../components/PreviewTable";
import SampleDownloadBox from "../components/SampleDownloadBox";
import { importTeachers } from "../api/institute_admin/teacher_api";

export default function ImportTeachers() {
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});

  const handleFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
      setPreview(rows);
      validate(rows);
    };

    reader.readAsBinaryString(file);
  };

  // Edit cell
  const handleEdit = (rowIdx, col, value) => {
    const updated = [...preview];
    updated[rowIdx] = { ...updated[rowIdx], [col]: value };
    setPreview(updated);
    validate(updated);
  };

  // Add row
  const handleAddRow = () => {
    if (!preview.length) return;
    const emptyRow = {};
    Object.keys(preview[0]).forEach((k) => (emptyRow[k] = ""));
    const updated = [...preview, emptyRow];
    setPreview(updated);
    validate(updated);
  };

  // VALIDATION
  const validate = (rows) => {
    const err = {};
    const empIdSet = new Set();

    rows.forEach((r, i) => {
      const empId = String(r.EmployeeId ?? r.employeeId ?? "").trim();
      const name = String(r.Name ?? r.name ?? "").trim();

      // 1️⃣ required
      if (!empId || !name) {
        err[i] = "EmployeeId & Name required";
        return;
      }

      // 2️⃣ EmployeeId unique
      if (empIdSet.has(empId)) {
        err[i] = `Duplicate EmployeeId ${empId}`;
        return;
      }
      empIdSet.add(empId);
    });

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // NORMALIZE
  const normalizeRows = (rows) => {
    return rows.map((r) => ({
      EmployeeId: String(r.EmployeeId ?? r.employeeId ?? "").trim(),
      Name: String(r.Name ?? r.name ?? "").trim(),
      Email: r.Email ?? r.email ?? "",
      Phone: r.Phone ?? r.phone ?? "",
      Subjects: Array.isArray(r.Subjects)
        ? r.Subjects
        : typeof r.Subjects === "string"
        ? r.Subjects.split(",").map((s) => s.trim())
        : [],
    }));
  };

  // FINAL IMPORT
  const handleImport = async () => {
    const normalized = normalizeRows(preview);

    if (!validate(normalized)) {
      alert("Fix validation errors first");
      return;
    }

    try {
      await importTeachers({ teachers: normalized });
      alert("Teachers imported successfully");
      setPreview([]);
    } catch (err) {
      alert("Import failed");
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Import Teachers</h1>

      <SampleDownloadBox
        title="Teacher Excel Sample"
        fileUrl="/teacher_sample.xlsx"
      />

      <FileUploadBox onFileSelect={handleFile} />

      {preview.length > 0 && (
        <>
          <PreviewTable
            rows={preview}
            errors={errors}
            onEdit={handleEdit}
            onAddRow={handleAddRow}
          />

          <button
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
            onClick={handleImport}
            disabled={Object.keys(errors).length > 0}
          >
            Import Teachers
          </button>
        </>
      )}
    </>
  );
}
