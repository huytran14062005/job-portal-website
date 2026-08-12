import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import MySpinner from "../../components/MySpinner";
import SearchableSelect from "../../components/SearchableSelect";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/Toast";
import { MyUserContext } from "../../configs/Contexts";
import { renderStars } from "../../utils/renderStars";
import { getSavedJobStatusMap } from "./savedJobStatus";
import { isJobExpired } from "../../utils/jobExpiry";
import { getApiError } from "../../utils/apiError";

const Jobs = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useContext(MyUserContext);
  const [savedJobs, setSavedJobs] = useState({});
  const [savingJobs, setSavingJobs] = useState({});

  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [locationId, setLocationId] = useState("");
  const [jobTypeId, setJobTypeId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [validationWarning, setValidationWarning] = useState("");

  
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  
  const debounceTimerRef = useRef(null);
  
  const isFirstRenderRef = useRef(true);

  const loadJobs = useCallback(
    async (
      keyword = "",
      minSal = "",
      maxSal = "",
      page = 1,
      locId = "",
      typeId = "",
    ) => {
      try {
        setIsSearching(true);

        const params = { page };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (minSal) params.min_salary = parseInt(minSal);
        if (maxSal) params.max_salary = parseInt(maxSal);
        if (locId) params.location_id = parseInt(locId);
        if (typeId) params.job_type_id = parseInt(typeId);

        const api = user ? authApis() : Apis;
        const response = await api.get(endpoints.jobs, { params });
        setJobs(response.data.jobs || []);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          totalPages: response.data.total_pages,
        });
        setError(null);
      } catch (err) {
        setError(getApiError(err, "Không thể tải danh sách công việc"));
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    },
    [user],
  );

  
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadJobs("", "", "", 1);
      setLoading(false);
    };

    initialLoad();
  }, [loadJobs]);

  
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [locationRes, jobTypeRes] = await Promise.all([
          Apis.get(endpoints.locations),
          Apis.get(endpoints["job-types"]),
        ]);

        setLocations(locationRes.data.locations || []);
        setJobTypes(jobTypeRes.data.job_types || []);
      } catch (err) {
        console.error("Error loading filter options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    
    debounceTimerRef.current = setTimeout(() => {
      
      if (minSalary && maxSalary) {
        const min = parseInt(minSalary);
        const max = parseInt(maxSalary);
        if (min > max) {
          setValidationWarning(
            "Mức lương tối thiểu không được lớn hơn mức lương tối đa",
          );
          return; 
        }
      }

      
      setValidationWarning("");

      
      loadJobs(searchKeyword, minSalary, maxSalary, 1, locationId, jobTypeId);
    }, 500); 

    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    searchKeyword,
    minSalary,
    maxSalary,
    locationId,
    jobTypeId,
    loadJobs,
  ]);

  const checkSavedJobs = useCallback(async () => {
    if (!user || user.role !== "ungvien" || jobs.length === 0) {
      setSavedJobs({});
      return;
    }

    try {
      const api = authApis();
      const savedStatus = await getSavedJobStatusMap(api, jobs.map((job) => job.id));
      setSavedJobs(savedStatus);
    } catch (err) {
      console.error("Error checking saved jobs:", err);
    }
  }, [jobs, user]);

  useEffect(() => {
    checkSavedJobs();
  }, [checkSavedJobs]);

  const handleSearch = (e) => {
    e.preventDefault();

    
    if (minSalary && maxSalary) {
      const min = parseInt(minSalary);
      const max = parseInt(maxSalary);
      if (min > max) {
        setValidationWarning(
          "Mức lương tối thiểu không được lớn hơn mức lương tối đa",
        );
        return; 
      }
    }

    
    setValidationWarning("");
    loadJobs(searchKeyword, minSalary, maxSalary, 1, locationId, jobTypeId);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (newPage === pagination.page) return;

    loadJobs(
      searchKeyword,
      minSalary,
      maxSalary,
      newPage,
      locationId,
      jobTypeId,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  
  const formatSalary = (minSalary, maxSalary) => {
    if (!minSalary && !maxSalary) return "Thỏa thuận";
    
    const formatNumber = (num) => {
      return num.toLocaleString("vi-VN");
    };

    if (minSalary && maxSalary) {
      return `${formatNumber(minSalary)} - ${formatNumber(maxSalary)} VNĐ`;
    }
    if (minSalary) return `Từ ${formatNumber(minSalary)} VNĐ`;
    if (maxSalary) return `Đến ${formatNumber(maxSalary)} VNĐ`;
    return "Thỏa thuận";
  };

  const handleSaveJob = async (job, e) => {
    e.stopPropagation();

    const jobId = job.id;

    if (!user) {
      toast.warning("Vui lòng đăng nhập để lưu công việc!");
      return;
    }

    if (user.role !== "ungvien") {
      toast.warning("Chỉ ứng viên mới có thể lưu công việc!");
      return;
    }

    
    
    setSavingJobs((prev) => ({ ...prev, [jobId]: true }));

    try {
      const api = authApis();
      const response = await api.post(endpoints["save-job"](jobId));

      
      setSavedJobs((prev) => ({
        ...prev,
        [jobId]: response.data.is_saved,
      }));

      if (response.data.is_saved) {
        toast.success("Đã lưu công việc!");
      } else {
        toast.info("Đã bỏ lưu công việc!");
      }
    } catch (err) {
      console.error("Error saving job:", err);
      toast.error(
        getApiError(err, "Có lỗi xảy ra khi lưu công việc!"),
      );
    } finally {
      setSavingJobs((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  if (loading) {
    return <MySpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <h1 className="jobs-title">Danh sách công việc</h1>

      
      <div className="jobs-search-card">
        <form onSubmit={handleSearch} className="jobs-search-form">
          <div className="search-fields-grid">
            <div className="search-field-equal">
              <label htmlFor="keyword">Tìm kiếm theo tên</label>
              <input
                id="keyword"
                type="text"
                placeholder="Tên công việc, công ty..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>

            <SearchableSelect
              label="Địa điểm"
              placeholder="Tất cả địa điểm"
              options={locations}
              value={locationId}
              onChange={setLocationId}
              disabled={loadingOptions}
            />

            <SearchableSelect
              label="Hình thức làm việc"
              placeholder="Tất cả hình thức"
              options={jobTypes}
              value={jobTypeId}
              onChange={setJobTypeId}
              disabled={loadingOptions}
            />

            <div className="search-field-equal">
              <label htmlFor="minSalary">Lương tối thiểu</label>
              <input
                id="minSalary"
                type="number"
                placeholder="10,000,000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="search-field-equal">
              <label htmlFor="maxSalary">Lương tối đa</label>
              <input
                id="maxSalary"
                type="number"
                placeholder="20,000,000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="search-actions-grid">
              <button
                type="submit"
                className="btn-search-inline"
                disabled={isSearching}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </div>

          
          {validationWarning && (
            <div className="validation-warning">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {validationWarning}
            </div>
          )}
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {pagination.total > 0 && (
        <div className="jobs-result-count">
          {pagination.totalPages > 1 && (
            <span className="jobs-result-page">
              {" "}
              <strong>Trang {pagination.page}/{pagination.totalPages}</strong> 
            </span>
          )}
        </div>
      )}

      <div className="jobs-grid">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              key={job.id}
              className="job-card"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <h3 className="job-title">{job.title}</h3>
              <p className="job-company">Công ty: {job.company_name}</p>
              <p className="job-salary">
                Lương: {formatSalary(job.min_salary, job.max_salary)}
              </p>
              <p className="job-deadline">Hạn nộp đơn: {job.deadline}</p>
              
              
              {job.avg_rating > 0 && (
                <div className="job-rating">
                  {renderStars(job.avg_rating)}
                </div>
              )}

              
              <button
                className={`job-save-btn ${savedJobs[job.id] ? "saved" : ""} ${
                  !savedJobs[job.id] && isJobExpired(job) ? "expired" : ""
                }`}
                onClick={(e) => handleSaveJob(job, e)}
                disabled={savingJobs[job.id]}
                title={
                  savedJobs[job.id]
                    ? "Bỏ lưu"
                    : isJobExpired(job)
                      ? "Bài đăng đã hết hạn, không thể lưu tin"
                      : "Lưu công việc"
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={savedJobs[job.id] ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <p className="empty-text">Chưa có công việc nào</p>
        )}
      </div>

      
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        disabled={isSearching}
      />
    </div>
  );
};

export default Jobs;
