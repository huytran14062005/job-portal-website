import axios from "axios";

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
  "update-review": (jobId, reviewId) => `/jobs/${jobId}/reviews/${reviewId}`,
  "delete-review": (jobId, reviewId) => `/jobs/${jobId}/reviews/${reviewId}`,
  "follow-company": (companyId) => `/companies/${companyId}/follow`,
  "check-followed": (companyId) => `/companies/${companyId}/check-followed`,
  "followers-count": (companyId) => `/companies/${companyId}/followers-count`,
  "export-applications": "/export/applications",
};

export const authApis = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});
