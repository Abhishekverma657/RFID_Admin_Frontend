import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const getInstitute = async () => {
  try {
    const response = await axiosClient.get("/institutes", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getInstituteDetails = async (id) => {
  try {
    const response = await axiosClient.get(`/institutes/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (err) {
    throw err;
  }
};
