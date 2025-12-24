import React, { useState } from "react";
import toast from "react-hot-toast";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function RosterForm({ onCreate, classes = [] }) {
  const today = new Date();

  // Basic Info
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDays, setSelectedDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);

  // Customization Info
  const [sessionTitle, setSessionTitle] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [floorNo, setFloorNo] = useState("");

  const [batchName, setBatchName] = useState("");
  const [startDate, setStartDate] = useState(
    today.toISOString().split("T")[0]
  );

  const [endDate, setEndDate] = useState(
    new Date(
      today.getTime() + 6 * 24 * 60 * 60 * 1000
    ).toISOString().split("T")[0]
  );

  // const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  // const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  // Dynamic Time Slots
  // Defaulting to some slots similar to the image
  const [timeSlots, setTimeSlots] = useState([
    { label: "10:10 AM - 11:00 AM", key: "slot_0" },
    { label: "11:00 AM - 11:50 AM", key: "slot_1" },
    { label: "11:50 AM - 12:40 PM", key: "slot_2" },
  ]);

  const addSlot = () => {
    // Use timestamp to ensure unique keys even if slots are removed
    const uniqueKey = `slot_${Date.now()}`;
    setTimeSlots([
      ...timeSlots,
      { label: "New Slot", key: uniqueKey }
    ]);
  };

  const removeSlot = (idx) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== idx));
  };

  const updateSlotLabel = (idx, val) => {
    const newSlots = [...timeSlots];
    newSlots[idx].label = val;
    setTimeSlots(newSlots);
  };
  const getDateRangeWithDay = (start, end, allowedDays) => {
    const result = [];
    let d = new Date(start);
    const endDate = new Date(end);

    while (d <= endDate) {
      const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });

      if (allowedDays.includes(dayName)) {
        result.push({
          date: d.toISOString().split("T")[0],
          day: dayName,
        });
      }

      d.setDate(d.getDate() + 1);
    }

    return result;
  };


  const handleCreate = () => {
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }
    const selectedClass = classes.find(c => c._id === selectedClassId);

    // Generate initial empty schedule based on configured slots
    // Use weekSchedule format: { day, periods: [ {}, {}, ... ] }
    // Generate initial empty schedule based on configured slots
    // Use weekSchedule format: { day, periods: [ {}, {}, ... ] }
    // const weekSchedule = selectedDays.map(day => ({
    //   day,
    //   periods: timeSlots.map(() => ({})) // Empty objects for each slot
    // }));
    // ✅ DATE + DAY based rows
    const dateRows = getDateRangeWithDay(
      startDate,
      endDate,
      selectedDays
    );

    const weekSchedule = dateRows.map(d => ({
      date: d.date,
      day: d.day,
      periods: timeSlots.map(() => ({})),
    }));

    onCreate({
      classId: selectedClass._id,
      className: selectedClass.className || selectedClass.name || "Unknown", // Handle likely field names
      section: selectedClass.section || "A",
      classTitle: `${selectedClass.className || selectedClass.name} - ${selectedClass.section}`,
      sessionTitle,
      roomNo,
      floorNo,
      batchName,
      timeSlots, // Pass configuration to parent/table
      weekSchedule,
      academicFrom: startDate,
      academicTo: endDate
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg mb-6 shadow-md border-t-4 border-indigo-500">
      <h3 className="text-lg font-bold mb-4 text-gray-700">Create New Roster</h3>

      {/* 1. Basic Details */}
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Select Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Choose Class --</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>
                {c.className || c.name} - {c.section}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Batch Name (Optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="e.g. Early Elevate - Batch A"
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Session Start Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Session End Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Room & Header Info */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">Session Title (Header)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="e.g. Morning DOUBT'S & SELF STUDY Sessions"
            value={sessionTitle}
            onChange={e => setSessionTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Room No</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="501"
            value={roomNo}
            onChange={e => setRoomNo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Floor No</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="5"
            value={floorNo}
            onChange={e => setFloorNo(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Time Slots Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">Time Slots / Columns</label>
        <div className="space-y-2">
          {timeSlots.map((slot, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={slot.label}
                onChange={e => updateSlotLabel(idx, e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                onClick={() => removeSlot(idx)}
                className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            onClick={addSlot}
            className="text-sm text-indigo-600 font-medium hover:underline mt-1"
          >
            + Add Slot
          </button>
        </div>
      </div>

      <button
        onClick={handleCreate}
        className="w-full bg-indigo-600 text-white rounded px-6 py-3 font-semibold hover:bg-indigo-700 transition"
      >
        Create Roster Table
      </button>
    </div>
  );
}
