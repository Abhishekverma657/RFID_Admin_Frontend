import axiosClient from "./axios_client";
import { getToken } from "../context/AppContext";

export const changePassword = async (passwords) => {
    const response = await axiosClient.post("/auth/change-password", passwords, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return response.data;
};
