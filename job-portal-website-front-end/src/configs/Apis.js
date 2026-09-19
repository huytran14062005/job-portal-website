import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const endpoints = {
  jobs: "/jobs",
  locations: "/locations",
  "job-types": "/job-types",
  "job-details": (jobId) => `/jobs/${jobId}`,
  "saved-jobs": "/jobs/saved",
  "save-job": (jobId) => `/jobs/${jobId}/save`,
  "check-saved": (jobId) => `/jobs/${jobId}/check-saved`,
  "saved-job-statuses": "/jobs/saved-statuses",
  "related-jobs": (jobId) => `/jobs/${jobId}/related`,
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  "forgot-password-request": "/auth/forgot-password/request",
  "forgot-password-verify": "/auth/forgot-password/verify",
  "forgot-password-reset": "/auth/forgot-password/reset",
  "ai-cv-match": "/ai/cv-match",
  "current-user": "/profile/me",
  "update-profile": "/profile/me",
  "company-profile": "/company/profile",
  "firebase-token": "/auth/firebase-token",
  companies: "/companies",
  "company-detail": (companyId) => `/companies/${companyId}`,
  "company-jobs": (companyId) => `/companies/${companyId}/jobs`,
  "company-chat-access": (companyId) =>
    `/companies/${companyId}/chat-access`,
  "apply-job": (jobId) => `/jobs/${jobId}/apply`,
  "check-applied": (jobId) => `/jobs/${jobId}/check-applied`,
  "my-applications": "/applications/candidate",
  "company-my-jobs": "/company/jobs",
  "company-job-detail": (jobId) => `/company/jobs/${jobId}`,
  "company-job-update": (jobId) => `/company/jobs/${jobId}`,
  "company-job-status": (jobId) => `/company/jobs/${jobId}/status`,
  "company-applications": "/company/applications",
  "company-application-detail": (applicationId) =>
    `/company/applications/${applicationId}`,
  "company-application-status": (applicationId) =>
    `/company/applications/${applicationId}/status`,
  cvs: "/cvs",
  "cv-rename": (cvId) => `/cvs/${cvId}`,
  "cv-delete-bulk": "/cvs",
  notifications: "/notifications",
  "unread-count": "/notifications/unread-count",
  "mark-notification-read": (notificationId) =>
    `/notifications/${notificationId}/read`,
  "mark-all-read": "/notifications/mark-all-read",
  "delete-notification": (notificationId) => `/notifications/${notificationId}`,
  "admin-users": "/admin/users",
  "admin-user-detail": (userId) => `/admin/users/${userId}`,
  "admin-user-lock": (userId) => `/admin/users/${userId}/lock`,
  "admin-user-profile": (userId) => `/admin/users/${userId}/profile`,
  "admin-companies": "/admin/companies",
  "admin-companies-pending": "/admin/companies/pending",
  "admin-company-detail": (companyId) => `/admin/companies/${companyId}`,
  "admin-company-approve": (companyId) =>
    `/admin/companies/${companyId}/approve`,
  "admin-company-reject": (companyId) => `/admin/companies/${companyId}/reject`,
  "admin-jobs": "/admin/jobs",
  "admin-job-detail": (jobId) => `/admin/jobs/${jobId}`,
  "admin-job-status": (jobId) => `/admin/jobs/${jobId}/status`,
  "admin-stats-companies": "/admin/stats/companies",
  "admin-stats-users": "/admin/stats/users",
  "job-reviews": (jobId) => `/jobs/${jobId}/reviews`,
  "my-job-review": (jobId) => `/jobs/${jobId}/reviews/mine`,
  "update-review": (jobId, reviewId) => `/jobs/${jobId}/reviews/${reviewId}`,
  "delete-review": (jobId, reviewId) => `/jobs/${jobId}/reviews/${reviewId}`,
  "follow-company": (companyId) => `/companies/${companyId}/follow`,
  "check-followed": (companyId) => `/companies/${companyId}/check-followed`,
  "followers-count": (companyId) => `/companies/${companyId}/followers-count`,
  "export-applications": "/export/applications",
};

const publicApi = axios.create({
  baseURL,
  withCredentials: true,
});

const authenticatedApi = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshRequest = null;

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth:logout"));
};

authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

authenticatedApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hasAccessToken = Boolean(localStorage.getItem("token"));

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      !hasAccessToken
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshRequest) {
      refreshRequest = publicApi
        .post(endpoints.refresh)
        .then((response) => {
          const token = response.data.token;
          localStorage.setItem("token", token);
          return token;
        })
        .finally(() => {
          refreshRequest = null;
        });
    }

    try {
      const token = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return authenticatedApi(originalRequest);
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status;

      if (refreshStatus === 401 || refreshStatus === 403) {
        clearSession();

        if (window.location.hash !== "#/login") {
          window.location.hash = "#/login";
        }
      }

      return Promise.reject(refreshError);
    }
  },
);

export const authApis = () => {
  return authenticatedApi;
};

export default publicApi;
