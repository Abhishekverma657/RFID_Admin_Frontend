import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const createInstitute = async (instituteData) => {
  try {
    const response = await axiosClient.post(
      "/institutes",
      instituteData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};