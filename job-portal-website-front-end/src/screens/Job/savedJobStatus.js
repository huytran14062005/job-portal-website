import { endpoints } from "../../configs/Apis";

export const getSavedJobStatusMap = async (api, jobIds) => {
  const uniqueJobIds = [...new Set(jobIds)]
    .map(Number)
    .filter((jobId) => Number.isInteger(jobId) && jobId > 0);

  if (uniqueJobIds.length === 0) {
    return {};
  }

  const response = await api.get(endpoints["saved-job-statuses"], {
    params: { job_ids: uniqueJobIds.join(",") },
  });
  const savedJobIds = new Set(response.data.saved_job_ids || []);

  return Object.fromEntries(
    uniqueJobIds.map((jobId) => [jobId, savedJobIds.has(jobId)]),
  );
};
