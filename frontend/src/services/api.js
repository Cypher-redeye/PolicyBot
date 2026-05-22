import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || '/api';

// Normalize absolute URLs that are missing the '/api' suffix
if (API_URL.startsWith('http') && !API_URL.endsWith('/api') && !API_URL.includes('/api/')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Broadcasts real client-server calls dynamically for instant UI consumption
export function logApiCall(method, url, status, latency) {
  const timestamp = new Date().toLocaleTimeString();
  
  // 1. Save to policybot_api_logs for Dashboard recent call logs table
  const apiLogs = JSON.parse(localStorage.getItem('policybot_api_logs') || '[]');
  const newApiLog = {
    timestamp,
    method: method.toUpperCase(),
    route: url,
    status: status,
    latency: `${latency}ms`
  };
  apiLogs.unshift(newApiLog);
  localStorage.setItem('policybot_api_logs', JSON.stringify(apiLogs.slice(0, 15)));

  // 2. Save to policybot_telemetry_logs for Sidebar system telemetry stream console
  const telemetryLogs = JSON.parse(localStorage.getItem('policybot_telemetry_logs') || '[]');
  let indicator = 'API';
  if (url.includes('auth')) indicator = 'DB';
  else if (url.includes('query')) indicator = 'RAG';
  else if (url.includes('documents')) indicator = 'SYS';

  const newTelemetry = `[${indicator}: ${status.includes('200') || status.includes('201') ? 'OK' : 'ERR'}] ${method.toUpperCase()} ${url} - ${latency}ms`;
  telemetryLogs.unshift(newTelemetry);
  localStorage.setItem('policybot_telemetry_logs', JSON.stringify(telemetryLogs.slice(0, 15)));

  // 3. Dispatch global custom event so active pages re-fetch from localStorage
  window.dispatchEvent(new Event('policybot_new_api_log'));
}

// Interceptor to inject JWT authentication tokens dynamically and track latency
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const startTime = response.config.metadata?.startTime || new Date();
    const latency = new Date() - startTime;
    let url = response.config.url || '';
    if (response.config.baseURL && url.startsWith(response.config.baseURL)) {
      url = url.slice(response.config.baseURL.length);
    }
    if (!url.startsWith('/')) url = '/' + url;
    // Prefix with /v1 if missing
    if (!url.startsWith('/v1')) {
      url = '/v1' + url;
    }
    logApiCall(response.config.method || 'GET', url, `${response.status} OK`, latency);
    return response;
  },
  (error) => {
    const startTime = error.config?.metadata?.startTime || new Date();
    const latency = new Date() - startTime;
    let url = error.config?.url || 'unknown';
    if (error.config?.baseURL && url.startsWith(error.config.baseURL)) {
      url = url.slice(error.config.baseURL.length);
    }
    if (!url.startsWith('/')) url = '/' + url;
    if (!url.startsWith('/v1')) {
      url = '/v1' + url;
    }
    const method = error.config?.method || 'unknown';
    const statusText = error.response ? `${error.response.status} ${error.response.statusText || 'Error'}` : 'Network Error';
    logApiCall(method, url, statusText, latency);
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const startTime = new Date();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    try {
      const response = await axios.post(`${API_URL}/v1/auth/login`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const latency = new Date() - startTime;
      logApiCall('POST', '/v1/auth/login', '200 OK', latency);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({ username }));
      }
      return response.data;
    } catch (err) {
      const latency = new Date() - startTime;
      const statusText = err.response ? `${err.response.status} ${err.response.statusText || 'Error'}` : 'Network Error';
      logApiCall('POST', '/v1/auth/login', statusText, latency);
      throw err;
    }
  },
  register: async (email, password) => {
    const startTime = new Date();
    try {
      const response = await axios.post(`${API_URL}/v1/auth/register`, {
        email,
        password,
      });
      const latency = new Date() - startTime;
      logApiCall('POST', '/v1/auth/register', '201 Created', latency);
      return response.data;
    } catch (err) {
      const latency = new Date() - startTime;
      const statusText = err.response ? `${err.response.status} ${err.response.statusText || 'Error'}` : 'Network Error';
      logApiCall('POST', '/v1/auth/register', statusText, latency);
      throw err;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const documentService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/v1/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getDocuments: async () => {
    const response = await api.get('/v1/documents/');
    return response.data;
  },
  deleteDocument: async (docId) => {
    await api.delete(`/v1/documents/${docId}`);
  },
};

export const queryService = {
  ask: async (queryText, session_id = null) => {
    const response = await api.post('/v1/query/', {
      question: queryText,
      session_id: session_id,
    });
    return response.data;
  },
  getRecentQueries: async (limit = 10) => {
    const response = await api.get(`/v1/query/history?limit=${limit}`);
    const data = response.data || [];
    return data.map((item) => ({
      ...item,
      query_text: item.query, // Support Dashboard.jsx mapping compatibility
    }));
  },
};

export default api;
