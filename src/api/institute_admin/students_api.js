import axiosClient from "../axios_client";
import { getToken } from "../../context/AppContext";

export const importStudents = async (payload) => {
  const token = getToken();

  try {
    const response = await axiosClient.post(
      "/students/import",
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

export const getStudents = async () => {
  const token = getToken();
  const response = await axiosClient.get("/students", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateStudent = async (id, payload) => {
  const token = getToken();
  const response = await axiosClient.put(`/students/${id}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteStudent = async (id) => {
  const token = getToken();
  const response = await axiosClient.delete(`/students/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};



