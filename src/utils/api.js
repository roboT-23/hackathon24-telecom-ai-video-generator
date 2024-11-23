import axios from 'axios';

// Načtení API endpointů z prostředí
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const api = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Funkce pro volání API
export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API:', error);
    throw error;
  }
};

export default api;
