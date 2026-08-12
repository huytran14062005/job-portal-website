
const PUBLIC_URL = process.env.PUBLIC_URL || "";

export const DEFAULT_APPLICANT_AVATAR = `${PUBLIC_URL}/default-applicant-avatar.svg`;
export const DEFAULT_COMPANY_LOGO = `${PUBLIC_URL}/office-building.jpg`;

const isBlank = (url) => !url || typeof url !== "string" || !url.trim();


export const getApplicantAvatar = (url) =>
  isBlank(url) ? DEFAULT_APPLICANT_AVATAR : url;


export const getCompanyLogo = (url) =>
  isBlank(url) ? DEFAULT_COMPANY_LOGO : url;


export const getAvatarByRole = (url, role) =>
  role === "nhatuyendung" ? getCompanyLogo(url) : getApplicantAvatar(url);


const handleImageError = (e, fallback) => {
  if (!e?.target || e.target.dataset.fallbackApplied === "true") return;
  e.target.dataset.fallbackApplied = "true";
  e.target.src = fallback;
};

export const onApplicantAvatarError = (e) =>
  handleImageError(e, DEFAULT_APPLICANT_AVATAR);

export const onCompanyLogoError = (e) =>
  handleImageError(e, DEFAULT_COMPANY_LOGO);
