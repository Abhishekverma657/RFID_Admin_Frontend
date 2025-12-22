// Authentication API functions
import axiosClient from "./axios_client";

export const login = async (credentials) => {
  const response = await axiosClient.post("/auth/login", credentials);
  return response.data;
};

// export const logout = async () => {
//   const response = await axiosClient.post("/auth/logout");
//   return response.data;
// };

