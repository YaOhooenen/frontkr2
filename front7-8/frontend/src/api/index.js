import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
});

export const api = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },
  createProduct: async (product, token) => {
    const response = await apiClient.post('/products', product, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  updateProduct: async (id, product, token) => {
    const response = await apiClient.put(`/products/${id}`, product, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  deleteProduct: async (id, token) => {
    await apiClient.delete(`/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};