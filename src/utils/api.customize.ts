import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleRefreshToken = async () => {
  const res = await api.post("/api/auth/refresh");
  if (res && res.data) return res.data;
  else return null;
};

// Add a request interceptor
api.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const token = localStorage.getItem("access_token");
    const auth = token ? `Bearer ${token}` : "";
    config.headers["Authorization"] = auth;
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.config && error.response && +error.response.status === 401) {
      const access_token = await handleRefreshToken();
      const data = access_token.data;
      console.log(data);
      if (data) {
        error.config.headers["Authorization"] = `Bearer ${data}`;
        localStorage.setItem("access_token", data);
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);
export default api;
