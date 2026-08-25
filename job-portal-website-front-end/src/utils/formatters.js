const parseDate = (value, dayFirst) => {
  if (!dayFirst) return new Date(value);

  const [datePart, timePart = ""] = String(value).split(" ");
  const dateParts = datePart.split("-");

  if (dateParts.length !== 3) return new Date(value);

  const [day, month, year] = dateParts.map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = timePart
    .split(":")
    .filter(Boolean)
    .map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const formatDate = (
  value,
  { fallback = "—", dayFirst = false, twoDigit = false } = {},
) => {
  if (!value) return fallback;

  const date = parseDate(value, dayFirst);
  if (Number.isNaN(date.getTime())) return String(value);

  const options = twoDigit
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : undefined;

  return date.toLocaleDateString("vi-VN", options);
};

export const formatDateTime = (
  value,
  { fallback = "—", dayFirst = false } = {},
) => {
  if (!value) return fallback;

  const date = parseDate(value, dayFirst);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("vi-VN");
};

export const formatDateOnly = (value, fallback = "N/A") => {
  if (!value) return fallback;
  return String(value).split(" ")[0];
};

export const formatSalary = (
  min,
  max,
  { valuesInMillions = false, compact = false } = {},
) => {
  if (!min && !max) return "Thỏa thuận";

  const formatValue = (value) => {
    if (compact) return `${(value / 1000000).toFixed(0)} triệu`;

    const amount = valuesInMillions ? value * 1000000 : value;
    return amount.toLocaleString("vi-VN");
  };

  const currency = compact ? "" : " VNĐ";

  if (min && max) return `${formatValue(min)} - ${formatValue(max)}${currency}`;
  if (min) return `Từ ${formatValue(min)}${currency}`;
  return `Đến ${formatValue(max)}${currency}`;
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
