import axios from 'axios';

// Set up Axios instance for making requests to your backend
const api = axios.create({
  baseURL: 'https://test-backend-d88x.onrender.com/api', // Your backend URL
});

// Use this Axios instance in your requests
export default api;
