import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const API = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 5000,
});

export default API;
