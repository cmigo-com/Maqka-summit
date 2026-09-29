// In dev, Vite's proxy (vite.config.js) forwards '/api' and '/uploads' to the local
// backend, so the relative default works with no configuration. In production, where
// the frontend (e.g. on Vercel) and backend (e.g. on Render/Railway) are on different
// domains, set VITE_API_BASE_URL to the deployed backend's full URL, e.g.
// https://your-backend.onrender.com/api -- see frontend/.env.example.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

// Adventure/mountain images live in the frontend's own /public/images and stay relative.
// Files uploaded through the admin Gallery live on the BACKEND (multer) under /uploads/*,
// so once frontend and backend are on separate domains those paths need the backend's
// origin prefixed. Always render image_url fields through this helper, never raw.
export function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  return url;
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

async function uploadFormData(path, formData, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
}

function toQueryString(params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  updateProfile: (payload, token) => request('/auth/me', { method: 'PUT', body: payload, token }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  getMountains: () => request('/mountains'),
  getMountain: (slug) => request(`/mountains/${slug}`),
  getAdventureFilters: () => request('/adventures/meta/filters'),

  getAdventures: (params = {}) => request(`/adventures${toQueryString(params)}`),
  getAdventure: (slug) => request(`/adventures/${slug}`),
  createAdventure: (payload, token) => request('/adventures', { method: 'POST', body: payload, token }),
  updateAdventure: (id, payload, token) => request(`/adventures/${id}`, { method: 'PUT', body: payload, token }),
  deleteAdventure: (id, token) => request(`/adventures/${id}`, { method: 'DELETE', token }),
  addTripDate: (adventureId, payload, token) =>
    request(`/adventures/${adventureId}/trip-dates`, { method: 'POST', body: payload, token }),

  createBooking: (payload, token) => request('/bookings', { method: 'POST', body: payload, token }),
  getMyBookings: (token) => request('/bookings/mine', { token }),
  getAllBookings: (token, params = {}) => request(`/bookings${toQueryString(params)}`, { token }),
  updateBooking: (id, payload, token) => request(`/bookings/${id}`, { method: 'PUT', body: payload, token }),
  approveBooking: (id, token) => request(`/bookings/${id}/approve`, { method: 'PUT', token }),
  cancelBooking: (id, token) => request(`/bookings/${id}/cancel`, { method: 'PUT', token }),
  completeBooking: (id, token) => request(`/bookings/${id}/complete`, { method: 'PUT', token }),
  recordPayment: (id, payload, token) => request(`/bookings/${id}/payments`, { method: 'POST', body: payload, token }),
  sendPaymentReminder: (id, token) => request(`/bookings/${id}/remind`, { method: 'POST', token }),

  getMyNotifications: (token) => request('/notifications/mine', { token }),
  markNotificationRead: (id, token) => request(`/notifications/${id}/read`, { method: 'PUT', token }),
  markAllNotificationsRead: (token) => request('/notifications/read-all', { method: 'PUT', token }),

  getAdminStats: (token) => request('/admin/stats', { token }),
  getClients: (token) => request('/admin/clients', { token }),

  submitContactMessage: (payload) => request('/contact', { method: 'POST', body: payload }),
  getContactMessages: (token, params = {}) => request(`/contact${toQueryString(params)}`, { token }),
  getContactMessage: (id, token) => request(`/contact/${id}`, { token }),
  markMessageRead: (id, token) => request(`/contact/${id}/read`, { method: 'PUT', token }),
  markMessageUnread: (id, token) => request(`/contact/${id}/unread`, { method: 'PUT', token }),
  setMessageStatus: (id, status, token) => request(`/contact/${id}/status`, { method: 'PUT', body: { status }, token }),
  replyToMessage: (id, reply_text, token) => request(`/contact/${id}/reply`, { method: 'POST', body: { reply_text }, token }),
  deleteMessage: (id, token) => request(`/contact/${id}`, { method: 'DELETE', token }),

  getFaqs: (topic) => request(`/faqs${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`),
  getAllFaqs: (token) => request('/faqs/all', { token }),
  getFaqTopics: () => request('/faqs/topics'),
  createFaq: (payload, token) => request('/faqs', { method: 'POST', body: payload, token }),
  updateFaq: (id, payload, token) => request(`/faqs/${id}`, { method: 'PUT', body: payload, token }),
  deleteFaq: (id, token) => request(`/faqs/${id}`, { method: 'DELETE', token }),
  reorderFaqs: (order, token) => request('/faqs/reorder/bulk', { method: 'PUT', body: { order }, token }),

  getAchievements: () => request('/achievements'),
  getAllAchievements: (token) => request('/achievements/all', { token }),
  createAchievement: (payload, token) => request('/achievements', { method: 'POST', body: payload, token }),
  updateAchievement: (id, payload, token) => request(`/achievements/${id}`, { method: 'PUT', body: payload, token }),
  deleteAchievement: (id, token) => request(`/achievements/${id}`, { method: 'DELETE', token }),

  createMountain: (payload, token) => request('/mountains', { method: 'POST', body: payload, token }),
  updateMountain: (id, payload, token) => request(`/mountains/${id}`, { method: 'PUT', body: payload, token }),
  deleteMountain: (id, token) => request(`/mountains/${id}`, { method: 'DELETE', token }),

  getChecklist: () => request('/checklist'),
  getAllChecklist: (token) => request('/checklist/all', { token }),
  createChecklistItem: (payload, token) => request('/checklist', { method: 'POST', body: payload, token }),
  updateChecklistItem: (id, payload, token) => request(`/checklist/${id}`, { method: 'PUT', body: payload, token }),
  deleteChecklistItem: (id, token) => request(`/checklist/${id}`, { method: 'DELETE', token }),
  reorderChecklist: (order, token) => request('/checklist/reorder/bulk', { method: 'PUT', body: { order }, token }),

  getRouteComparisonCards: () => request('/route-comparison'),
  getAllRouteComparisonCards: (token) => request('/route-comparison/all', { token }),
  createRouteComparisonCard: (payload, token) => request('/route-comparison', { method: 'POST', body: payload, token }),
  updateRouteComparisonCard: (id, payload, token) => request(`/route-comparison/${id}`, { method: 'PUT', body: payload, token }),
  deleteRouteComparisonCard: (id, token) => request(`/route-comparison/${id}`, { method: 'DELETE', token }),

  getParkFees: () => request('/park-fees'),
  getAllParkFees: (token) => request('/park-fees/all', { token }),
  createParkFee: (payload, token) => request('/park-fees', { method: 'POST', body: payload, token }),
  updateParkFee: (id, payload, token) => request(`/park-fees/${id}`, { method: 'PUT', body: payload, token }),
  deleteParkFee: (id, token) => request(`/park-fees/${id}`, { method: 'DELETE', token }),

  getGallery: (params = {}) => request(`/gallery${toQueryString(params)}`),
  getGalleryCategories: () => request('/gallery/categories'),
  uploadGalleryPhotos: (formData, token) => uploadFormData('/gallery', formData, token),
  updateGalleryImage: (id, payload, token) => request(`/gallery/${id}`, { method: 'PUT', body: payload, token }),
  deleteGalleryImage: (id, token) => request(`/gallery/${id}`, { method: 'DELETE', token }),
  reorderGallery: (order, token) => request('/gallery/reorder/bulk', { method: 'PUT', body: { order }, token }),
};
