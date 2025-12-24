import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const deleteInstitute = async (id) => {
    const response = await axiosClient.delete(`/institutes/${id}`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return response.data;
};
