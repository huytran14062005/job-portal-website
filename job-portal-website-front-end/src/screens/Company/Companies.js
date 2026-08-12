import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Pagination from "../../components/Pagination";
import "../../css/Companies.css";
import { getApiError } from "../../utils/apiError";
import {
  getCompanyLogo,
  onCompanyLogoError,
} from "../../utils/defaultImages";

const Companies = () => {
  const navigate = useNavigate();
  const [user] = useContext(MyUserContext);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [industryKeyword, setIndustryKeyword] = useState("");
  const [followFilter, setFollowFilter] = useState(""); 
  const [isSearching, setIsSearching] = useState(false);
  const hasActiveFilters = Boolean(
    searchKeyword.trim() || industryKeyword.trim() || followFilter,
  );

  
  const debounceTimerRef = useRef(null);
  const isFirstRenderRef = useRef(true);

  const fetchCompanies = useCallback(
    async (keyword = "", industry = "", page = 1, followFilter = "") => {
      try {
        setIsSearching(true);
        setError("");

        const params = { page };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (industry.trim()) params.industry = industry.trim();
        if (followFilter) params.follow_filter = followFilter;

        
        
        const api = user ? authApis() : Apis;
        const response = await api.get(endpoints.companies, { params });

        setCompanies(response.data.companies || []);
        setPagination({
          page: response.data.current_page,
          total: response.data.total,
          pages: response.data.pages,
        });
        setError("");
      } catch (err) {
        console.error("Error fetching companies:", err);
        setError(
          getApiError(err, "Không thể tải danh sách công ty. Vui lòng thử lại sau."),
        );
      } finally {
        setIsSearching(false);
      }
    },
    [user],
  );

  
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchCompanies("", "", 1, "");
      setLoading(false);
    };

    initialLoad();
  }, [fetchCompanies]);

  
  useEffect(() => {
    if (!user || user.role !== "ungvien") {
      setFollowFilter("");
    }
  }, [user]);

  
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    
    debounceTimerRef.current = setTimeout(() => {
      
      fetchCompanies(searchKeyword, industryKeyword, 1, followFilter);
    }, 500); 

    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchKeyword, industryKeyword, followFilter, fetchCompanies]);

  const handleViewCompany = (companyId) => {
    navigate(`/companies/${companyId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    if (newPage === pagination.page) return;

    fetchCompanies(searchKeyword, industryKeyword, newPage, followFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies(searchKeyword, industryKeyword, 1, followFilter);
  };

  const formatCompanySize = (size) => {
    if (!size) return null;
    return `${size.toLocaleString("vi-VN")} nhân viên`;
  };

  if (loading) {
    return (
      <div className="companies-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách công ty...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="companies-container">
        <div className="error-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => fetchCompanies(searchKeyword, industryKeyword, 1)}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="companies-container">
      
      <div className="companies-header">
        <h1 className="companies-title">Công ty đang tuyển dụng</h1>
      </div>

      
      <div className="companies-search-card">
        <form onSubmit={handleSearch} className="companies-search-form">
          <div className="search-fields-row">
            <div className="search-field-grow">
              <label htmlFor="keyword">Tìm kiếm theo tên công ty</label>
              <input
                id="keyword"
                type="text"
                placeholder="Tên công ty..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="search-field-grow">
              <label htmlFor="industry">Tìm kiếm theo lĩnh vực</label>
              <input
                id="industry"
                type="text"
                placeholder="Lĩnh vực..."
                value={industryKeyword}
                onChange={(e) => setIndustryKeyword(e.target.value)}
                className="search-input"
              />
            </div>

            
            {user && user.role === "ungvien" && (
              <div className="search-field-medium">
                <label htmlFor="followFilter">Trạng thái theo dõi</label>
                <select
                  id="followFilter"
                  value={followFilter}
                  onChange={(e) => setFollowFilter(e.target.value)}
                  className="search-input"
                >
                  <option value="">Tất cả</option>
                  <option value="followed">Đã theo dõi</option>
                  <option value="not_followed">Chưa theo dõi</option>
                </select>
              </div>
            )}

            <div className="search-actions">
              <button
                type="submit"
                className="btn-search"
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
        </form>
      </div>

      
      {pagination.total > 0 && (
        <div className="companies-result-count">
          Tìm thấy <strong>{pagination.total}</strong> công ty
          {pagination.pages > 1 && (
            <span className="companies-result-page">
              {" "}
              - Trang{" "}
              <strong>
                {pagination.page}/{pagination.pages}
              </strong>
            </span>
          )}
        </div>
      )}

      {companies.length === 0 ? (
        <div className="empty-state">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
          >
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" strokeWidth="1.5" />
          </svg>
          <h3>Chưa có công ty nào</h3>
          <p>
            {hasActiveFilters
              ? "Không tìm thấy công ty phù hợp với bộ lọc"
              : "Hiện chưa có công ty nào đang đăng tin tuyển dụng"}
          </p>
          <button
            className="btn-browse-jobs"
            onClick={() => navigate("/jobs")}
          >
            Xem tất cả việc làm
          </button>
        </div>
      ) : (
        <>
          <div className="companies-grid">
            {companies.map((company) => (
              <div
                key={company.id}
                className="company-card"
                onClick={() => handleViewCompany(company.id)}
              >
                
                <div className="company-card-head">
                  <div className="company-card-logo">
                    <img
                      src={getCompanyLogo(company.logo_url)}
                      alt={company.company_name}
                      className="company-card-logo-img"
                      onError={onCompanyLogoError}
                    />
                  </div>
                  
                  
                  {company.is_followed && (
                    <div className="company-card-following-badge">
                    
                      Đang theo dõi
                    </div>
                  )}
                </div>

                
                <div className="company-card-body">
                  <h3 className="company-card-name">{company.company_name}</h3>

                  {company.industry && (
                    <span className="company-card-industry">
                      {company.industry}
                    </span>
                  )}
                </div>

                
                <div className="company-card-meta">
                  {formatCompanySize(company.company_size) && (
                    <div className="company-card-meta-item">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{formatCompanySize(company.company_size)}</span>
                    </div>
                  )}

                  {company.address && (
                    <div className="company-card-meta-item">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{company.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Companies;
