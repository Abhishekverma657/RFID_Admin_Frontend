import axiosClient from "./axios_client";

export const fetchRosters = async () => {
    const res = await axiosClient.get("/roster");
    return res.data; // { success: true, data: [...] }
};

export const saveRoster = async (rosterData) => {
    const res = await axiosClient.post("/roster", rosterData);
    return res.data;
};

export const deleteRoster = async (id) => {
    const res = await axiosClient.delete(`/roster/${id}`);
    return res.data;
};

export const fetchTeachers = async () => {
    const res = await axiosClient.get("/teachers");
    return res.data;
};

export const fetchClasses = async () => {
    const res = await axiosClient.get("/classes");
    return res.data;
};

export const fetchSubjects = async () => {
    const res = await axiosClient.get("/subjects");
    return res.data;
};
