import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import RosterForm from "../components/RosterForm";
import RosterTable from "../components/RosterTable";
import DisplayRoster from "../components/DisplayRoster";
import ExportButtons from "../components/ExportButtons";
import { fetchRosters, fetchTeachers, saveRoster, deleteRoster, fetchClasses, fetchSubjects } from "../api/rosterApi";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

export default function RosterPage() {
  const [rosters, setRosters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]); // [ { _id, name }, ... ]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, tRes, cRes, sRes] = await Promise.all([
        fetchRosters(),
        fetchTeachers(),
        fetchClasses(),
        fetchSubjects()
      ]);
      setRosters(rRes.data || []);
      setTeachers(tRes.data || []);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Draft Management
  const handleCreateDraft = (rosterData) => {
    // Create a temporary ID for the draft
    const draft = {
      ...rosterData,
      _id: "DRAFT_" + Date.now(),
      isDraft: true
    };
    setRosters(prev => [draft, ...prev]);
  };

  const handleSave = async (rosterId) => {
    // Find the roster in state
    const rosterToSave = rosters.find(r => r._id === rosterId);
    if (!rosterToSave) return;

    try {
      // If it exists in DB (not isDraft), it's an update not implemented yet, or re-save
      // For now we assume this is primarily for saving the Draft.

      // Clean up draft properties before sending if needed, though backend ignores extra fields usually.
      // We need to map 'schedule' back to 'weekSchedule' format if it was flattened for UI?
      // In RosterTable we mapped 'weekSchedule' -> 'schedule'.
      // In RosterForm we created 'weekSchedule' inside 'rosterData'.
      // RosterTable editSlot updates 'weekSchedule' ideally.

      const payload = {
        ...rosterToSave,
        // If we want to remove _id if it's "DRAFT_..."
        _id: rosterToSave.isDraft ? undefined : rosterToSave._id
      };

      await saveRoster(payload);

      // Reload to get real ID and confirmed data
      loadData();
      toast.success("Roster Saved to Database!");
    } catch (err) {
      console.error(err);
      toast.error("Error saving roster: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    // If draft, just remove from state
    if (String(id).startsWith("DRAFT_")) {
      setRosters(prev => prev.filter(r => r._id !== id));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this roster from Database?")) return;
    try {
      await deleteRoster(id);
      setRosters(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const editSlot = (roster, day, slotKey, value) => {
    setRosters(prev =>
      prev.map(r => {
        if (r._id !== roster._id) return r;

        // Find the index of this slotKey in the definition to match with periods array
        let periodIndex = r.timeSlots?.findIndex(ts => ts.key === slotKey);

        // Fallback for legacy data or if key is just slot_Index
        if (periodIndex === -1 || periodIndex === undefined) {
          const parsedIdx = parseInt(slotKey.replace("slot_", ""));
          if (!isNaN(parsedIdx)) {
            periodIndex = parsedIdx;
          }
        }

        if (periodIndex === -1 || periodIndex === undefined) return r;

        // Update the underlying structure
        const newSchedule = r.weekSchedule ? r.weekSchedule.map(d => {
          if (d.day === day) {
            if (d.periods) {
              const newPeriods = [...d.periods];
              // Ensure object exists
              if (!newPeriods[periodIndex]) newPeriods[periodIndex] = {};

              if (value === null) {
                // Clear slot
                newPeriods[periodIndex] = {
                  ...newPeriods[periodIndex],
                  teacherId: null,
                  subjectId: null,
                  teacherName: null,
                  subjectName: null
                };
              } else {
                // Update teacher info
                newPeriods[periodIndex] = {
                  ...newPeriods[periodIndex],
                  teacherId: value.teacherId,
                  subjectId: value.subjectId,
                  // Store names for UI convenience if needed (though UI usually derives from ID + Teachers List)
                  teacherName: value.teacherName,
                  subjectName: value.subjectName
                };
              }

              return { ...d, periods: newPeriods };
            }
          }
          return d;
        }) : [];

        return { ...r, weekSchedule: newSchedule };
      })
    )
  };

  const exportAllRostersToPDF = async () => {
    const savedRosters = rosters.filter(r => !r.isDraft);
    if (savedRosters.length === 0) {
      toast.error("No saved rosters to export");
      return;
    }

    try {
      const allTables = document.querySelectorAll('[data-roster-table]');
      if (allTables.length === 0) {
        toast.error("No roster tables found");
        return;
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a4'
      });

      let isFirstPage = true;

      for (const table of allTables) {
        const dataUrl = await toPng(table, {
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          cacheBust: true,
        });

        const img = new Image();
        img.src = dataUrl;

        await new Promise((resolve) => {
          img.onload = () => {
            if (!isFirstPage) {
              pdf.addPage();
            }

            // Calculate dimensions to fit page
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;

            let finalWidth, finalHeight;
            if (imgRatio > pageRatio) {
              finalWidth = pageWidth;
              finalHeight = pageWidth / imgRatio;
            } else {
              finalHeight = pageHeight;
              finalWidth = pageHeight * imgRatio;
            }

            pdf.addImage(dataUrl, "PNG", 0, 0, finalWidth, finalHeight);
            isFirstPage = false;
            resolve();
          };
        });
      }

      pdf.save(`all-rosters-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Export all PDF failed:", error);
      toast.error("Failed to export all rosters as PDF: " + error.message);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <button onClick={() => console.log("Current Rosters:", rosters)} className="bg-gray-800 text-white p-2 mb-4 rounded text-xs">Debug Rosters</button>
        <h1 className="text-3xl font-bold text-center mb-6">
          Class Roster Management
        </h1>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <RosterForm
          onCreate={handleCreateDraft}
          classes={classes}
          teachers={teachers}
        />

        <div id="all-rosters">
          {loading ? <p className="text-center">Loading rosters...</p> : rosters.map((r) => (
            <DisplayRoster
              key={r._id}
              roster={r}
              rosters={rosters}
              teachers={teachers}
              subjects={subjects}
              onEdit={editSlot}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Export All Button */}
        {rosters.filter(r => !r.isDraft).length > 1 && (
          <div className="flex justify-center mt-8 mb-8">
            <button
              onClick={exportAllRostersToPDF}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg shadow-lg hover:from-red-700 hover:to-orange-700 font-bold text-lg flex items-center gap-3 transition-all"
            >
              📄 Export All Rosters to PDF ({rosters.filter(r => !r.isDraft).length} tables)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
