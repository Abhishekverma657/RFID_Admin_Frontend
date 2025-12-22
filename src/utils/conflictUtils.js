export const hasConflict = (rosters, currentRoster, day, slotKey, teacherId) => {
  if (!teacherId) return false;

  // Extract index from "slot_X"
  const slotIdx = parseInt(slotKey.replace("slot_", ""));
  if (isNaN(slotIdx)) return false;

  return rosters.some(r => {
    if (r._id === currentRoster._id) return false; // Skip self

    // Check weekSchedule (Source of Truth)
    const daySchedule = r.weekSchedule?.find(d => d.day === day);
    if (!daySchedule?.periods) return false;

    const period = daySchedule.periods[slotIdx];
    if (!period) return false;

    // Check if teacher matches. Handle populated object or string ID.
    const pTeacherId = period.teacherId?._id || period.teacherId;

    // Normalize comparison
    return String(pTeacherId) === String(teacherId);
  });
};
