import axios from 'axios';

// Dev এ Vite proxy ব্যবহার হয় ('/api'), তাই localhost এর পাশাপাশি ফোন/অন্য device থেকেও কাজ করে।
// আলাদা server এ deploy করলে client/.env এ VITE_API_URL=https://your-api.com/api দিন
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token expire হলে বা invalid হলে পুরো app কে জানানো হয়, যাতে user কে login এ পাঠানো যায়
// (login/register এর ভুল password এর 401 কে এখানে ধরা হয় না)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/') && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('cc:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
