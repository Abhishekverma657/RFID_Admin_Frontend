import axiosClient from "./axios_client";

export const fetchClasses = async () => {
    const res = await axiosClient.get("/classes");
    return res.data; // { success: true, data: [...] }
};

export const addClass = async (classData) => {
    const res = await axiosClient.post("/classes", classData);
    return res.data;
};

export const deleteClass = async (id) => {
    const res = await axiosClient.delete(`/classes/${id}`);
    return res.data;
};
