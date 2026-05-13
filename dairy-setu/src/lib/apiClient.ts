import axios from 'axios';
import { auth as firebaseAuth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    if (user.email) {
      config.headers['X-Dev-Auth-Email'] = user.email;
    }
    config.headers['X-Dev-Auth-Uid'] = user.uid;
  }
  const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('ds_admin_token') : null;
  if (adminToken) {
    config.headers = config.headers ?? {};
    config.headers['X-Admin-Token'] = adminToken;
  }
  return config;
});
