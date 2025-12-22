import React from "react";

export default function SlotDropdown({ value, onChange, disabled, teachers = [], subjects = [] }) {
  // value might be { teacherId, teacherName, subjectId, subjectName }

  // Safe accessors for object-populated fields
  const getSubjectId = (v) => v?.subjectId?._id || v?.subjectId || "";
  const getTeacherId = (v) => v?.teacherId?._id || v?.teacherId || "";

  const currentSubjectId = getSubjectId(value);
  const currentTeacherId = getTeacherId(value);

  // Filter teachers based on selected subject
  // IMPORTANT: Teacher model has `subjects` as array of STRINGS (names)
  // Subject model has `_id` and `name`.
  // So we match teacher.subjects (string) with selectedSubject.name
  const selectedSubject = subjects.find(s => s._id === currentSubjectId);

  const filteredTeachers = selectedSubject
    ? teachers.filter(t => t.subjects && t.subjects.some(sub => sub.toLowerCase() === selectedSubject.name.toLowerCase()))
    : [];

  const handleSubjectChange = (e) => {
    const newSubId = e.target.value;
    const subObj = subjects.find(s => s._id === newSubId);

    // Reset teacher when subject changes
    onChange({
      subjectId: newSubId,
      subjectName: subObj?.name,
      teacherId: null,
      teacherName: null
    });
  };

  const handleTeacherChange = (e) => {
    const newTeachId = e.target.value;
    const teachObj = teachers.find(t => t._id === newTeachId);

    onChange({
      ...value,
      teacherId: newTeachId,
      teacherName: teachObj?.name,
      // Ensure subject info persists (though it should be in value)
      subjectId: currentSubjectId,
      subjectName: selectedSubject?.name
    });
  };

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      {/* Subject Dropdown */}
      <select
        value={currentSubjectId}
        disabled={disabled}
        onChange={handleSubjectChange}
        className="w-full p-1 border rounded text-[10px] bg-blue-50 focus:ring-1 focus:ring-blue-300"
      >
        <option value="">Subject?</option>
        {subjects.map(s => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      {/* Teacher Dropdown */}
      <select
        value={currentTeacherId}
        disabled={disabled || !currentSubjectId}
        onChange={handleTeacherChange}
        className={`w-full p-1 border rounded text-[10px] ${!currentSubjectId ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
      >
        <option value="">Teacher?</option>
        {filteredTeachers.map(t => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
        {filteredTeachers.length === 0 && currentSubjectId && (
          <option disabled>No teachers</option>
        )}
      </select>
    </div>
  );
}
