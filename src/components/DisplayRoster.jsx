import React, { useState, useRef } from "react";
import RosterTable from "./RosterTable";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

export default function DisplayRoster({ roster, rosters, teachers, subjects, onEdit, onSave, onDelete }) {
    const [isEditing, setIsEditing] = useState(roster.isDraft);
    const tableRef = useRef(null);

    const handleSaveClick = async () => {
        await onSave(roster._id);
        if (!roster.isDraft) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    // const exportAsPNG = async () => {
    //     if (!tableRef.current) return;

    //     try {
    //         const canvas = await html2canvas(tableRef.current, {
    //             scale: 2,
    //             useCORS: true,
    //             allowTaint: true,
    //             logging: false,
    //             backgroundColor: '#ffffff',
    //             ignoreElements: (element) => {
    //                 // Skip any problematic elements if needed
    //                 return false;
    //             }
    //         });

    //         const link = document.createElement('a');
    //         link.download = `roster-${roster.classTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
    //         link.href = canvas.toDataURL('image/png');
    //         link.click();
    //     } catch (error) {
    //         console.error('PNG export failed:', error);
    //         alert('Failed to export PNG: ' + error.message);
    //     }
    // };
    const exportAsPNG = async () => {
        if (!tableRef.current) return;

        try {
            const dataUrl = await toPng(tableRef.current, {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
                cacheBust: true,
            });

            const link = document.createElement("a");
            link.download = `roster-${roster.classTitle.replace(/\s+/g, "-")}-${new Date()
                .toISOString()
                .split("T")[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("PNG export failed:", error);
            toast.error("Failed to export PNG");
        }
    };

    // const exportAsPDF = async () => {
    //     if (!tableRef.current) return;

    //     try {
    //         const canvas = await html2canvas(tableRef.current, {
    //             scale: 2,
    //             useCORS: true,
    //             allowTaint: true,
    //             logging: false,
    //             backgroundColor: '#ffffff',
    //             ignoreElements: (element) => {
    //                 // Skip any problematic elements if needed
    //                 return false;
    //             }
    //         });

    //         const imgData = canvas.toDataURL('image/png');
    //         const pdf = new jsPDF({
    //             orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    //             unit: 'px',
    //             format: [canvas.width, canvas.height]
    //         });

    //         pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    //         pdf.save(`roster-${roster.classTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    //     } catch (error) {
    //         console.error('PDF export failed:', error);
    //         alert('Failed to export PDF: ' + error.message);
    //     }
    // };
    const exportAsPDF = async () => {
        if (!tableRef.current) return;

        try {
            const dataUrl = await toPng(tableRef.current, {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
                cacheBust: true,
            });

            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                const pdf = new jsPDF({
                    orientation: img.width > img.height ? "landscape" : "portrait",
                    unit: "px",
                    format: [img.width, img.height],
                });

                pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
                pdf.save(
                    `roster-${roster.classTitle.replace(/\s+/g, "-")}-${new Date()
                        .toISOString()
                        .split("T")[0]}.pdf`
                );
            };
        } catch (error) {
            console.error("PDF export failed:", error);
            toast.error("Failed to export PDF");
        }
    };


    return (
        <div className="relative group mb-12 border rounded-lg shadow-sm bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                <div>
                    <h3 className="font-bold text-lg text-gray-700">{roster.classTitle}</h3>
                    {roster.isDraft && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">DRAFT</span>}
                </div>

                <div className="flex gap-2">
                    {!roster.isDraft && (
                        <>
                            <button
                                onClick={exportAsPNG}
                                className="px-3 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 text-sm font-semibold flex items-center gap-1"
                                title="Export as PNG"
                            >
                                📷 PNG
                            </button>
                            <button
                                onClick={exportAsPDF}
                                className="px-3 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 text-sm font-semibold flex items-center gap-1"
                                title="Export as PDF"
                            >
                                📄 PDF
                            </button>
                        </>
                    )}

                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-semibold"
                        >
                            Edit Roster
                        </button>
                    )}

                    {isEditing && (
                        <>
                            <button
                                onClick={handleSaveClick}
                                className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 text-sm font-semibold"
                            >
                                Save & Finish
                            </button>
                            {!roster.isDraft && (
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            )}
                        </>
                    )}

                    <button
                        onClick={() => onDelete(roster._id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-semibold"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div ref={tableRef} data-roster-table style={{ backgroundColor: '#ffffff' }}>
                <RosterTable
                    roster={roster}
                    rosters={rosters}
                    teachers={teachers}
                    subjects={subjects}
                    onEdit={onEdit}
                    onSave={handleSaveClick}
                    isDraft={roster.isDraft}
                    readOnly={!isEditing}
                />
            </div>
        </div>
    );
}
