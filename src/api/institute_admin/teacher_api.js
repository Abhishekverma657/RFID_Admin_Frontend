import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const importTeachers = async (payload) => {
  const token = getToken();
  try {
    const response = await axiosClient.post(
      "/teachers/import",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getTeachers = async () => {
  const token = getToken();
  const response = await axiosClient.get("/teachers", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTeacher = async (id, payload) => {
  const token = getToken();
  const response = await axiosClient.put(`/teachers/${id}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteTeacher = async (id) => {
  const token = getToken();
  const response = await axiosClient.delete(`/teachers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
