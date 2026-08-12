export const isJobExpired = (job) => {
  if (!job) return false;

  if (job.is_expired === true) return true;
  if (job.status === "hết hạn") return true;

  
  if (!job.deadline) return false;

  const [day, month, year] = String(job.deadline).split("-").map(Number);
  if (!day || !month || !year) return false;

  const deadlineDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadlineDate < today;
};
