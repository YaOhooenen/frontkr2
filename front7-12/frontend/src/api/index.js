import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
});

// Автоматически подставляем токен в каждый запрос
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Автоматически обновляем токен при 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!accessToken || !refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
      try {
        const response = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  refresh: async (refreshToken) => {
    return axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
  },
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },
  createProduct: async (product) => {
    const response = await apiClient.post('/products', product);
    return response.data;
  },
  updateProduct: async (id, product) => {
    const response = await apiClient.put(`/products/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id) => {
    await apiClient.delete(`/products/${id}`);
  },
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    await apiClient.delete(`/users/${id}`);
  },
};