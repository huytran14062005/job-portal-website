
export const getApiError = (
  err,
  fallback = "Không thể kết nối máy chủ. Vui lòng thử lại.",
) => {
  const message = err?.response?.data?.error;

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
};


export const getBlobApiError = async (
  err,
  fallback = "Không thể kết nối máy chủ. Vui lòng thử lại.",
) => {
  const data = err?.response?.data;

  if (!(data instanceof Blob)) {
    return getApiError(err, fallback);
  }

  try {
    const message = JSON.parse(await data.text())?.error;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  } catch {
    
  }

  return fallback;
};
