import React, { useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import AdminLayout from "../layouts/AdminLayout";
import FileUploadBox from "../components/FileUploadBox";
import PreviewTable from "../components/PreviewTable";
import SampleDownloadBox from "../components/SampleDownloadBox";
import { importStudents } from "../api/institute_admin/students_api";

export default function ImportStudents() {
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
    const classSectionRollSet = new Set();
    const rfidSet = new Set();

    rows.forEach((r, i) => {
      // 🔹 normalize column access (case-safe)
      const cls = String(r.ClassName ?? r.className ?? "").trim();
      const sec = String(r.Section ?? r.section ?? "").trim();
      const roll = String(r.RollNo ?? r.rollNo ?? "").trim();
      const rfid = String(
        r.RfidCardId ?? r.RFIDCardId ?? r.rfidCardId ?? ""
      ).trim();

      // 1️⃣ required
      if (!cls || !sec || !roll || !rfid) {
        err[i] = "Class, Section, RollNo & RFID required";
        return;
      }

      // 2️⃣ Roll unique per Class + Section
      const rollKey = `${cls}-${sec}-${roll}`;
      if (classSectionRollSet.has(rollKey)) {
        err[i] = `Duplicate RollNo ${roll} in Class ${cls} Section ${sec}`;
        return;
      }
      classSectionRollSet.add(rollKey);

      // 3️⃣ RFID globally unique
      if (rfidSet.has(rfid)) {
        err[i] = "Duplicate RFID";
        return;
      }
      rfidSet.add(rfid);
    });

    setErrors(err);
    return Object.keys(err).length === 0;
  };


  const normalizeRows = (rows) => {
    return rows.map((r) => ({
      RollNo: String(r.RollNo ?? r.rollNo ?? "").trim(),
      Name: String(r.Name ?? r.name ?? "").trim(),
      ClassName: String(r.ClassName ?? r.Class ?? r.class ?? "").trim(),
      Section: String(r.Section ?? r.section ?? "").trim(),
      Email: r.Email ?? "",
      Phone: r.Phone ?? "",
      RfidCardId: String(
        r.RfidCardId ?? r.RFID ?? r.rfid ?? ""
      ).trim(),
      FaceId: r.FaceId ?? null, // optional → null ok
    }));
  };



  // FINAL IMPORT
  const handleImport = async () => {
    const normalized = normalizeRows(preview);

    if (!validate(normalized)) {
      toast.error("Fix validation errors first");
      return;
    }

    try {
      await importStudents({ students: normalized });
      toast.success("Students imported successfully");
      setPreview([]);
    } catch (err) {
      toast.error("Import failed");
    }
  };


  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Import Students</h1>

      <SampleDownloadBox
        title="Student Excel Sample"
        fileUrl="/Student_sample.xlsx"
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
            Import Students
          </button>
        </>
      )}
    </>
  );
}
