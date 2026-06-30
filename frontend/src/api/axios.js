import axios from 'axios';

// Create an Axios instance with base configuration
const API = axios.create({
  // Read VITE_API_URL or default to the standard backend server port
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // withCredentials: true ensures that httpOnly JWT session cookies are
  // automatically attached to every request and received in responses.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Interceptor to inject the token from localStorage into the Authorization header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default API;
