import axios from 'axios';

const api = axios.create({
  baseURL: 'http://18.118.15.148:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
