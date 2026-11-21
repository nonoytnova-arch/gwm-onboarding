const API_BASE = 'http://localhost:5000/api';

function getAdminToken() {
  return localStorage.getItem('gwm_admin_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.auth) {
    const token = getAdminToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data.errors && data.errors[0]?.message) || data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

async function uploadFile(path, file, extraFields = {}) {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

export const api = {
  // Public form
  getCaptcha: () => request('/captcha'),
  sendOtp: (mobile) => request('/otp/send', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOtp: (mobile, code) => request('/otp/verify', { method: 'POST', body: JSON.stringify({ mobile, code }) }),

  createDraft: (role, subRole, mobile, email, language) =>
    request('/submissions', { method: 'POST', body: JSON.stringify({ role, subRole, mobile, email, language }) }),
  getDraft: (id, draftToken) => request(`/submissions/${id}?draftToken=${encodeURIComponent(draftToken)}`),
  updateDraft: (id, draftToken, fields) =>
    request(`/submissions/${id}`, { method: 'PUT', body: JSON.stringify({ draftToken, ...fields }) }),
  submitFinal: (id, draftToken, captchaId, captchaAnswer) =>
    request(`/submissions/${id}/submit`, { method: 'POST', body: JSON.stringify({ draftToken, captchaId, captchaAnswer }) }),

  uploadDocument: (submissionId, file, { draftToken, docType, relatedVehicleId, relatedDriverId, expiryDate }) =>
    uploadFile(`/submissions/${submissionId}/documents`, file, { draftToken, docType, relatedVehicleId, relatedDriverId, expiryDate }),
  deleteDocument: (docId, draftToken) =>
    request(`/submissions/documents/${docId}`, { method: 'DELETE', body: JSON.stringify({ draftToken }) }),

  // Admin
  adminLogin: (email, password) => request('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getSubmissions: (filters) => {
    const params = new URLSearchParams(Object.entries(filters || {}).filter(([, v]) => v));
    return request(`/admin/submissions?${params.toString()}`, { auth: true });
  },
  getSubmission: (id) => request(`/admin/submissions/${id}`, { auth: true }),
  updateSubmissionStatus: (id, status, comment) =>
    request(`/admin/submissions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, comment }), auth: true }),
  getExpiryDashboard: (withinDays) => request(`/admin/expiry-dashboard?withinDays=${withinDays || 30}`, { auth: true }),

  // A plain <a href> or window.open() can't attach an Authorization header,
  // and these endpoints are intentionally admin-only (they serve identity
  // documents and the full approved-partner list) — so both go through an
  // authenticated fetch that turns the response into a blob the browser can
  // open/download, rather than exposing them as unauthenticated URLs.
  async openDocumentFile(docId) {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE}/admin/documents/${docId}/file`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Could not load document');
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  },

  async downloadApprovedExport() {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE}/admin/export/approved`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gwm-approved-partners-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
