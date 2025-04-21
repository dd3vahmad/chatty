import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.PUBLIC_SERVER_API_V1_URL,
  withCredentials: true,
});

export const getUser = async (id?: string) => {
  try {
    const response = await axiosInstance.get(`/users/${id || ""}`);
    const data = response.data;

    return data.data;
  } catch (error) {
    console.log("Error fetching user", error);
    return null;
  }
};

export default axiosInstance;
