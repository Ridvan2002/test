import axios from 'axios';

// Set up Axios instance for making requests to your backend
const api = axios.create({
  baseURL: 'https://test-backend-d88x.onrender.com/api', // Using localhost for your backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle potential errors globally
api.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  (error) => {
    console.error('API error occurred:', error.response ? error.response.data : error.message);
    return Promise.reject(error); // Re-throw the error to handle it in individual requests
  }
);

export default api;
