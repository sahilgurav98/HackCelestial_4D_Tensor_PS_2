const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function token() {
  return localStorage.getItem("travelguard_token");
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.error?.message || "TravelGuard service unavailable");
    error.status = response.status;
    error.code = body.error?.code;
    throw error;
  }
  return body.data;
}

export const signup = (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
export const login = (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const me = () => request("/auth/me");
export const logout = () => request("/auth/logout", { method: "POST" });
export const getItinerary = (tripId) => request(`/itineraries/${tripId}`);
export const listItineraries = () => request("/itineraries");
export const createItinerary = (tripId, legs) => request("/itineraries", { method: "POST", body: JSON.stringify({ tripId, legs }) });
export const getDependencies = (tripId) => request(`/itineraries/${tripId}/dependencies`);
export const checkDisruption = (tripId) => request(`/itineraries/${tripId}/check-disruption`, { method: "POST" });
export const getAffected = (tripId) => request(`/itineraries/${tripId}/affected`);
export const getRecovery = (tripId) => request(`/itineraries/${tripId}/recovery`);
export const simulateDelay = (tripId, transportId, delayMinutes) => request(`/itineraries/${tripId}/simulate-delay`, { method: "POST", body: JSON.stringify({ transportId, delayMinutes }) });
export const selectRecovery = (tripId, transportId) => request(`/itineraries/${tripId}/recovery/select`, { method: "POST", body: JSON.stringify({ transportId }) });
