import axiosClient from "./axios_client";

export const fetchSubjects = async () => {
    const res = await axiosClient.get("/subjects");
    return res.data; // { success: true, data: [...] }
};

export const addSubject = async (subjectData) => {
    const res = await axiosClient.post("/subjects", subjectData);
    return res.data;
};

export const deleteSubject = async (id) => {
    const res = await axiosClient.delete(`/subjects/${id}`);
    return res.data;
};
