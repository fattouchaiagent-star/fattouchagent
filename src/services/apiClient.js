const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
const rawFetch = fetch;
let csrfToken = '';
let csrfRequest = null;
async function getCsrfToken() { if (csrfToken) return csrfToken; if (!csrfRequest) csrfRequest = rawFetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' }).then(response => { if (!response.ok) throw new Error(`csrf_failed:${response.status}`); return response.json(); }).then(result => { csrfToken = result.data.token; return csrfToken; }).finally(() => { csrfRequest = null; }); return csrfRequest; }
async function request(url, options = {}) { const method = String(options.method || 'GET').toUpperCase(); const headers = { ...(options.headers || {}) }; if (['POST', 'PATCH', 'DELETE'].includes(method) && !url.endsWith('/api/auth/login') && !url.endsWith('/api/auth/register')) headers['x-csrf-token'] = await getCsrfToken(); return rawFetch(url, { ...options, headers }); }

export async function registerUser({ name, email, password }) { const response = await request(`${API_BASE}/api/auth/register`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, email, password }) }); if (!response.ok) throw new Error(`register_failed:${response.status}`); return response.json(); }
export async function loginUser({ email, password }) { const response = await request(`${API_BASE}/api/auth/login`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error(`login_failed:${response.status}`); return response.json(); }
export async function logoutUser() { const response = await request(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }); if (!response.ok) throw new Error(`logout_failed:${response.status}`); return response.json(); }
export async function getCurrentUser() { const response = await request(`${API_BASE}/api/auth/me`, { credentials: 'include' }); if (!response.ok) return null; return (await response.json()).data; }

export function mediaUrl(path) { return path?.startsWith('http') ? path : `${API_BASE}${path}`; }

export async function uploadImage({ name, dataUrl }) { const response = await request(`${API_BASE}/api/uploads`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, dataUrl }) }); if (!response.ok) throw new Error(`upload_failed:${response.status}`); return response.json(); }

export async function deleteUpload(filename) { const response = await request(`${API_BASE}/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE', credentials: 'include' }); if (!response.ok) throw new Error(`upload_delete_failed:${response.status}`); return response.json(); }

export async function createListing({ type, fields, expiryDays = 10, conversationId, visibility = 'matched_users' }) {
  const response = await request(`${API_BASE}/api/listings`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, fields, expiryDays, conversationId, visibility }) });
  if (!response.ok) throw new Error(`listing_create_failed:${response.status}`);
  return response.json();
}

export async function requestListingContact({ listingId, conversationId }) {
  const response = await request(`${API_BASE}/api/contact-requests`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ listingId, conversationId }) });
  if (!response.ok) throw new Error(`contact_request_failed:${response.status}`);
  return response.json();
}

export async function listAdminListings(status = 'active') { const response = await request(`${API_BASE}/api/admin/listings?status=${encodeURIComponent(status)}`, { credentials: 'include' }); if (!response.ok) throw new Error(`admin_listings_failed:${response.status}`); return response.json(); }
export async function reviewAdminListing(id, decision) { const response = await request(`${API_BASE}/api/admin/listings/${id}/review`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) }); if (!response.ok) throw new Error(`admin_listing_review_failed:${response.status}`); return response.json(); }
export async function listAdminReports() { const response = await request(`${API_BASE}/api/admin/reports`, { credentials: 'include' }); if (!response.ok) throw new Error(`admin_reports_failed:${response.status}`); return response.json(); }
export async function reviewAdminReport(id, status) { const response = await request(`${API_BASE}/api/admin/reports/${id}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error(`admin_report_review_failed:${response.status}`); return response.json(); }
export async function listAdminPayments(status) { const query = status ? `?status=${encodeURIComponent(status)}` : ''; const response = await request(`${API_BASE}/api/admin/payments${query}`, { credentials: 'include' }); if (!response.ok) throw new Error(`admin_payments_failed:${response.status}`); return response.json(); }
export async function reviewAdminPayment(id, status) { const response = await request(`${API_BASE}/api/admin/payments/${id}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error(`admin_payment_review_failed:${response.status}`); return response.json(); }
export async function listAdminAudit() { const response = await request(`${API_BASE}/api/admin/audit`, { credentials: 'include' }); if (!response.ok) throw new Error(`admin_audit_failed:${response.status}`); return response.json(); }
export async function listNotifications() { const response = await request(`${API_BASE}/api/notifications`, { credentials: 'include' }); if (!response.ok) throw new Error(`notifications_failed:${response.status}`); return response.json(); }
export async function markNotificationRead(id) { const response = await request(`${API_BASE}/api/notifications/read`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) }); if (!response.ok) throw new Error(`notification_read_failed:${response.status}`); return response.json(); }
export async function listSources() { const response = await request(`${API_BASE}/api/sources`, { credentials: 'include' }); if (!response.ok) throw new Error(`sources_failed:${response.status}`); return response.json(); }

export async function listContactMessages(requestId) { const response = await request(`${API_BASE}/api/contact-requests/${requestId}/messages`, { credentials: 'include' }); if (!response.ok) throw new Error(`message_list_failed:${response.status}`); return response.json(); }
export async function markContactMessagesRead(requestId) { const response = await request(`${API_BASE}/api/contact-requests/${requestId}/messages/read`, { method: 'POST', credentials: 'include' }); if (!response.ok) throw new Error(`message_read_failed:${response.status}`); return response.json(); }
export async function reportContact(requestId, reason) { const response = await request(`${API_BASE}/api/contact-requests/${requestId}/report`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) }); if (!response.ok) throw new Error(`report_failed:${response.status}`); return response.json(); }
export async function blockContact(requestId) { const response = await request(`${API_BASE}/api/contact-requests/${requestId}/block`, { method: 'POST', credentials: 'include' }); if (!response.ok) throw new Error(`block_failed:${response.status}`); return response.json(); }
export async function sendContactMessage(requestId, body) { const response = await request(`${API_BASE}/api/contact-requests/${requestId}/messages`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body }) }); if (!response.ok) throw new Error(`message_send_failed:${response.status}`); return response.json(); }

export async function listContactRequests() { const response = await request(`${API_BASE}/api/contact-requests`, { credentials: 'include' }); if (!response.ok) throw new Error(`contact_list_failed:${response.status}`); return response.json(); }
export async function updateContactRequest(id, decision) { const response = await request(`${API_BASE}/api/contact-requests/${id}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) }); if (!response.ok) throw new Error(`contact_update_failed:${response.status}`); return response.json(); }

export async function listSponsoredAds() { const response = await request(`${API_BASE}/api/sponsored-ads-atomic`, { credentials: 'include' }); if (!response.ok) throw new Error(`sponsored_ads_failed:${response.status}`); return response.json(); }
export async function recordSponsoredClick(id) { const response = await request(`${API_BASE}/api/sponsored-ads/${id}/click`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' } }); if (!response.ok) throw new Error(`sponsored_click_failed:${response.status}`); return response.json(); }
export async function getSponsoredStats(id) { const response = await request(`${API_BASE}/api/listings/${id}/ad-stats`, { credentials: 'include' }); if (!response.ok) throw new Error(`sponsored_stats_failed:${response.status}`); return response.json(); }

export async function searchListings(query, type = 'marketplace') {
  const response = await request(`${API_BASE}/api/listings/search`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, type }) });
  if (!response.ok) throw new Error(`listing_search_failed:${response.status}`);
  return response.json();
}

export async function listListings(type) {
  const response = await request(`${API_BASE}/api/listings${type ? `?type=${encodeURIComponent(type)}` : ''}`);
  if (!response.ok) throw new Error(`listing_list_failed:${response.status}`);
  return response.json();
}

export async function listOwnedListings() { const response = await request(`${API_BASE}/api/listings?mine=1`, { credentials: 'include' }); if (!response.ok) throw new Error(`owned_listing_list_failed:${response.status}`); return response.json(); }
export async function updateListing(id, { action, fields, expiryDays }) { const response = await request(`${API_BASE}/api/listings/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, fields, expiryDays }) }); if (!response.ok) throw new Error(`listing_update_failed:${response.status}`); return response.json(); }
export async function getListingPayment(id) { const response = await request(`${API_BASE}/api/listings/${id}/payment`, { credentials: 'include' }); if (!response.ok) throw new Error(`payment_get_failed:${response.status}`); return response.json(); }
export async function submitListingPayment(id, paymentReference, proofFilename = '') { const response = await request(`${API_BASE}/api/listings/${id}/payment/submit`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentReference, proofFilename }) }); if (!response.ok) throw new Error(`payment_submit_failed:${response.status}`); return response.json(); }

export async function createTask({ message, attachments = [], locale = 'ar-LB', conversationId }) {
  const response = await request(`${API_BASE}/api/tasks`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, attachments, locale, conversationId }) });
  if (!response.ok) throw new Error(`task_create_failed:${response.status}`);
  return response.json();
}

export async function approveTask(taskId, decision) {
  const response = await request(`${API_BASE}/api/tasks/${taskId}/approval`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) });
  if (!response.ok) throw new Error(`approval_failed:${response.status}`);
  return response.json();
}

export async function searchJobs(query, profile = {}) {
  const response = await request(`${API_BASE}/api/jobs/search`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, profile }) });
  if (!response.ok) throw new Error(`job_search_failed:${response.status}`);
  return response.json();
}

export async function getTaskEvents(taskId) {
  const response = await request(`${API_BASE}/api/tasks/${taskId}/events`, { credentials: 'include' });
  if (!response.ok) throw new Error(`events_get_failed:${response.status}`);
  return response.json();
}

export async function listConversations() {
  const response = await request(`${API_BASE}/api/conversations`, { credentials: 'include' });
  if (!response.ok) throw new Error(`conversation_list_failed:${response.status}`);
  return response.json();
}

export async function getConversation(id) {
  const response = await request(`${API_BASE}/api/conversations/${id}`, { credentials: 'include' });
  if (!response.ok) throw new Error(`conversation_get_failed:${response.status}`);
  return response.json();
}

export async function createConversation({ title = 'محادثة جديدة', locale = 'ar-LB' } = {}) {
  const response = await request(`${API_BASE}/api/conversations`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, locale }) });
  if (!response.ok) throw new Error(`conversation_create_failed:${response.status}`);
  return response.json();
}
