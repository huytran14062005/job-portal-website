import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { authApis, endpoints } from "../../configs/Apis";
import Apis from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import { useToast } from "../../components/Toast";
import { CompanyStatus } from "../../configs/constants";
import { useSocket } from "../../contexts/SocketContext";
import { getApiError } from "../../utils/apiError";
import "../../css/PostJob.css";

const PostJob = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useContext(MyUserContext);
  const { companyStatusUpdate } = useSocket();

  const [loading, setLoading] = useState(false);
  const [checkingCompanyStatus, setCheckingCompanyStatus] = useState(true);
  const [companyStatus, setCompanyStatus] = useState(null);
  const [companyStatusError, setCompanyStatusError] = useState("");
  const [locations, setLocations] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    min_salary: "",
    max_salary: "",
    description: "",
    requirements: "",
    benefits: "",
    deadline: "",
    location_id: "",
    job_type_id: "",
  });

  useEffect(() => {
    
    if (!user || user.role !== "nhatuyendung") {
      toast.error("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    const loadCompanyStatus = async () => {
      try {
        setCheckingCompanyStatus(true);
        setCompanyStatusError("");

        const response = await authApis().get(endpoints["company-profile"]);
        const status = response.data?.status;
        setCompanyStatus(status);

        
        if (status === CompanyStatus.REJECT) return;

        await Promise.all([fetchLocations(), fetchJobTypes()]);
      } catch (error) {
        console.error("Error checking company status:", error);
        setCompanyStatusError(
          getApiError(error, "Không thể kiểm tra trạng thái công ty."),
        );
      } finally {
        setCheckingCompanyStatus(false);
      }
    };

    loadCompanyStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (companyStatusUpdate?.status) {
      setCompanyStatus(companyStatusUpdate.status);
    }
  }, [companyStatusUpdate]);

  const fetchLocations = async () => {
    try {
      const response = await Apis.get(endpoints["locations"]);
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error(getApiError(error, "Không thể tải danh sách địa điểm!"));
    }
  };

  const fetchJobTypes = async () => {
    try {
      const response = await Apis.get(endpoints["job-types"]);
      setJobTypes(response.data.job_types || []);
    } catch (error) {
      console.error("Error fetching job types:", error);
      toast.error(getApiError(error, "Không thể tải danh sách loại công việc!"));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const toBackendDate = (value) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    
    
    try {
      setLoading(true);

      const payload = {
        title: formData.title,
        min_salary: formData.min_salary,
        max_salary: formData.max_salary,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        deadline: toBackendDate(formData.deadline),
        location_id: formData.location_id,
        job_type_id: formData.job_type_id,
      };

      await authApis().post(endpoints["company-my-jobs"], payload);

      toast.success("Đăng bài tuyển dụng thành công!");
      navigate("/company/my-jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <button className="btn-back" onClick={() => navigate(-1)}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quay lại
      </button>

      <div className="post-job-header">
        <h1>Đăng bài tuyển dụng</h1>
      </div>

      {checkingCompanyStatus ? (
        <div className="post-job-status-message">
          Đang kiểm tra trạng thái công ty...
        </div>
      ) : companyStatusError ? (
        <div className="alert alert-error post-job-company-rejected">
          {companyStatusError}
        </div>
      ) : companyStatus === CompanyStatus.REJECT ? (
        <div className="alert alert-error post-job-company-rejected">
          Tài khoản công ty đã bị từ chối nên không thể sử dụng chức năng này. Vui lòng cập nhật lại hồ sơ công ty.
        </div>
      ) : (
        <form className="post-job-form" onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label htmlFor="title" className="form-label required">
            Tiêu đề công việc
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            placeholder="Ví dụ: Backend Developer (Python/Java)"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location_id" className="form-label required">
              Địa điểm làm việc
            </label>
            <select
              id="location_id"
              name="location_id"
              className="form-select"
              value={formData.location_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn địa điểm --</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="job_type_id" className="form-label required">
              Loại công việc
            </label>
            <select
              id="job_type_id"
              name="job_type_id"
              className="form-select"
              value={formData.job_type_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn loại công việc --</option>
              {jobTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="min_salary" className="form-label">
              Mức lương tối thiểu (VNĐ)
            </label>
            <input
              type="number"
              id="min_salary"
              name="min_salary"
              className="form-input"
              placeholder="Ví dụ: 15000000"
              value={formData.min_salary}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="max_salary" className="form-label">
              Mức lương tối đa (VNĐ)
            </label>
            <input
              type="number"
              id="max_salary"
              name="max_salary"
              className="form-input"
              placeholder="Ví dụ: 25000000"
              value={formData.max_salary}
              onChange={handleChange}
            />
          </div>
        </div>

        
        <div className="form-group">
          <label htmlFor="deadline" className="form-label required">
            Hạn nộp hồ sơ
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            className="form-input"
            value={formData.deadline}
            onChange={handleChange}
          />
        </div>

        
        <div className="form-group">
          <label htmlFor="description" className="form-label required">
            Mô tả công việc
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            placeholder="Mô tả chi tiết về công việc, nhiệm vụ, trách nhiệm..."
            value={formData.description}
            onChange={handleChange}
            rows={6}
          />
        </div>

        
        <div className="form-group">
          <label htmlFor="requirements" className="form-label">
            Yêu cầu ứng viên
          </label>
          <textarea
            id="requirements"
            name="requirements"
            className="form-textarea"
            placeholder="Ví dụ:&#10;- Tốt nghiệp Đại học chuyên ngành CNTT&#10;- 2+ năm kinh nghiệm Python/Java&#10;- Kiến thức về SQL, REST API"
            value={formData.requirements}
            onChange={handleChange}
            rows={6}
          />
        </div>

        
        <div className="form-group">
          <label htmlFor="benefits" className="form-label">
            Quyền lợi ứng viên
          </label>
          <textarea
            id="benefits"
            name="benefits"
            className="form-textarea"
            placeholder="Ví dụ:&#10;- Lương tháng 13, thưởng theo hiệu suất&#10;- Bảo hiểm đầy đủ&#10;- Môi trường làm việc chuyên nghiệp"
            value={formData.benefits}
            onChange={handleChange}
            rows={6}
          />
        </div>

        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Hủy
          </button>
          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Đang đăng...
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Đăng bài
              </>
            )}
          </button>
        </div>
        </form>
      )}
    </div>
  );
};

export default PostJob;
