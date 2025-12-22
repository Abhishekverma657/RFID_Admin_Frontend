import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const getInstituteStats = async (instituteId) => {
  const res = await axiosClient.get(`/institutes/${instituteId}/stats`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data.stats;
};