const API_BASE = 'http://localhost:4000';

let authToken = localStorage.getItem('tr_token') || null;

export function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('tr_token', token);
    console.log('🔑 Token set:', token.slice(0, 20) + '...');
  } else {
    localStorage.removeItem('tr_token');
    console.log('🔑 Token cleared');
  }
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  headers['Content-Type'] = 'application/json';
  
  const fullUrl = `${API_BASE}${path}`;
  console.log(`📡 ${options.method || 'GET'} ${fullUrl}`);
  
  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers
    });
    const json = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const error = new Error(json.message || `Request failed: ${res.status}`);
      console.error(`❌ ${res.status}:`, json.message || json);
      throw error;
    }
    
    console.log(`✓ Response:`, json);
    return json;
  } catch (err) {
    console.error(`❌ Request error:`, err.message);
    throw err;
  }
}

export function register(email, password, displayName) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName })
  });
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function startSession() {
  return request('/sessions/start', { method: 'POST' });
}

export function sendLocation(sessionId, { lat, lng, accuracy, timestamp }) {
  return request('/sessions/location', {
    method: 'POST',
    body: JSON.stringify({ sessionId, lat, lng, accuracy, timestamp })
  });
}

export function endSession(sessionId) {
  return request('/sessions/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
}

export function fetchTerritories(bounds) {
  const params = new URLSearchParams(bounds);
  return request(`/territories?${params.toString()}`);
}

export function fetchLeaderboards() {
  return request('/leaderboards');
}
