import axios, { AxiosInstance} from 'axios';

const baseURL =  'https://courrierappbackend.onrender.com'
//const baseURL =  'http://localhost:3000/'
const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance