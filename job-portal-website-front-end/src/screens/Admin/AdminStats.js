import { useState, useEffect, useRef, useMemo } from "react";
import {
  Chart,
  PieController,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { authApis, endpoints } from "../../configs/Apis";
import { CompanyStatus, ApplicationStatus } from "../../configs/constants";
import AdminUserChart from "../../components/AdminUserChart";
import "../../css/AdminUsers.css";
import "../../css/AdminStats.css";
import { getApiError } from "../../utils/apiError";

Chart.register(PieController, ArcElement, ChartTooltip);



const CHART_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
];

const MAX_SLICES = 6; 

const METRICS = [
  {
    key: "application_count",
    label: "Số đơn ứng tuyển",
    tableHeader: "Số đơn ứng tuyển",
    title: "Thống kê theo đơn ứng tuyển theo công ty",
    unit: "đơn",
    type: "company",
  },
  {
    key: "application_status",
    label: "Trạng thái đơn ứng tuyển",
    tableHeader: "Số đơn ứng tuyển",
    title: "Đơn ứng tuyển theo trạng thái",
    unit: "đơn",
    type: "application_status",
  },
  {
    key: "job_count",
    label: "Số bài đăng",
    tableHeader: "Số bài đăng",
    title: "Bài đăng tuyển dụng theo công ty",
    unit: "bài",
    type: "company",
  },
  {
    key: "avg_salary",
    label: "Mức lương",
    tableHeader: "Lương trung bình",
    title: "Công ty theo mức lương trung bình",
    unit: "công ty",
    type: "salary",
  },
  {
    key: "status",
    label: "Trạng thái duyệt",
    tableHeader: "Trạng thái duyệt",
    title: "Công ty theo trạng thái duyệt",
    unit: "công ty",
    type: "status",
  },
];


const SALARY_BANDS = [
  { label: "Dưới 10 triệu", test: (v) => v > 0 && v < 10000000 },
  { label: "10 - 20 triệu", test: (v) => v >= 10000000 && v < 20000000 },
  { label: "20 - 30 triệu", test: (v) => v >= 20000000 && v < 30000000 },
  { label: "Từ 30 triệu", test: (v) => v >= 30000000 },
  { label: "Chưa có dữ liệu lương", test: (v) => !v },
];


const SECTIONS = [
  { key: "companies", label: "Thống kê công ty" },
  { key: "users", label: "Thống kê người dùng" },
];


const APPLICATION_STATUS_ORDER = [
  ApplicationStatus.DA_NOP,
  ApplicationStatus.DA_DUYET,
  ApplicationStatus.TU_CHOI,
];


const STATUS_ORDER = [
  CompanyStatus.APPROVED,
  CompanyStatus.PENDING,
  CompanyStatus.REJECT,
];

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatSalary = (value) => {
  if (!value) return "—";
  return `${(value / 1000000).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })} triệu`;
};

const AdminStats = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState(SECTIONS[0].key);
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const [showMetricMenu, setShowMetricMenu] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [appStatus, setAppStatus] = useState("");
  const [showAppStatusMenu, setShowAppStatusMenu] = useState(false);

  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const metricDropdownRef = useRef(null);
  const appStatusDropdownRef = useRef(null);

  const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];

  
  const supportsDateRange = metric.type !== "status";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await authApis().get(
          endpoints["admin-stats-companies"],
          {
            params: {
              from_date: fromDate || undefined,
              to_date: toDate || undefined,
            },
          },
        );
        setCompanies(response.data.companies || []);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(
          getApiError(err, "Không thể tải dữ liệu thống kê. Vui lòng thử lại sau."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [fromDate, toDate]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        metricDropdownRef.current &&
        !metricDropdownRef.current.contains(event.target)
      ) {
        setShowMetricMenu(false);
      }

      if (
        appStatusDropdownRef.current &&
        !appStatusDropdownRef.current.contains(event.target)
      ) {
        setShowAppStatusMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowMetricMenu(false);
        setShowAppStatusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  
  const slices = useMemo(() => {
    if (companies.length === 0) return [];

    if (metric.type === "salary") {
      return SALARY_BANDS.map((band) => ({
        label: band.label,
        value: companies.filter((c) => band.test(c.avg_salary)).length,
      })).filter((item) => item.value > 0);
    }

    if (metric.type === "status") {
      return STATUS_ORDER.map((status) => ({
        label: status,
        value: companies.filter((c) => c.status === status).length,
      })).filter((item) => item.value > 0);
    }

    if (metric.type === "application_status") {
      
      if (appStatus) {
        const sortedByStatus = [...companies]
          .map((c) => ({
            label: c.company_name,
            value: c.application_status?.[appStatus] || 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value);

        const top = sortedByStatus.slice(0, MAX_SLICES - 1);
        const rest = sortedByStatus.slice(MAX_SLICES - 1);

        if (rest.length > 0) {
          top.push({
            label: `Khác (${rest.length} công ty)`,
            value: rest.reduce((sum, item) => sum + item.value, 0),
          });
        }

        return top;
      }

      
      return APPLICATION_STATUS_ORDER.map((status) => ({
        label: status,
        value: companies.reduce(
          (sum, c) => sum + (c.application_status?.[status] || 0),
          0,
        ),
      })).filter((item) => item.value > 0);
    }

    const sorted = [...companies]
      .filter((c) => c[metric.key] > 0)
      .sort((a, b) => b[metric.key] - a[metric.key]);

    const top = sorted.slice(0, MAX_SLICES - 1);
    const rest = sorted.slice(MAX_SLICES - 1);

    const items = top.map((c) => ({
      label: c.company_name,
      value: c[metric.key],
    }));

    if (rest.length > 0) {
      items.push({
        label: `Khác (${rest.length} công ty)`,
        value: rest.reduce((sum, c) => sum + c[metric.key], 0),
      });
    }

    return items;
  }, [companies, metric, appStatus]);

  const totalValue = slices.reduce((sum, item) => sum + item.value, 0);

  
  useEffect(() => {
    if (!canvasRef.current || slices.length === 0) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "pie",
      data: {
        labels: slices.map((item) => item.label),
        datasets: [
          {
            data: slices.map((item) => item.value),
            backgroundColor: slices.map(
              (_, i) => CHART_COLORS[i % CHART_COLORS.length],
            ),
            
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const percent = totalValue
                  ? ((value / totalValue) * 100).toFixed(1)
                  : 0;
                return ` ${formatNumber(value)} ${metric.unit} (${percent}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    
    
  }, [slices, metric, totalValue, section]);

  
  const sortedCompanies = useMemo(() => {
    const list = [...companies];

    
    if (metric.type === "status") {
      return list.sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
          a.company_name.localeCompare(b.company_name, "vi"),
      );
    }

    
    if (metric.type === "application_status") {
      if (appStatus) {
        return list.sort(
          (a, b) =>
            (b.application_status?.[appStatus] || 0) -
            (a.application_status?.[appStatus] || 0),
        );
      }

      return list.sort(
        (a, b) => (b.application_count || 0) - (a.application_count || 0),
      );
    }

    return list.sort((a, b) => (b[metric.key] || 0) - (a[metric.key] || 0));
  }, [companies, metric, appStatus]);

  
  const renderCellValue = (company) => {
    if (metric.type === "salary") return formatSalary(company.avg_salary);
    if (metric.type === "status") return company.status || "—";
    return formatNumber(company[metric.key]);
  };

  
  if (loading && companies.length === 0 && section === "companies") {
    return (
      <div className="au-page as-root">
        <div className="au-loading">
          <div className="au-spinner"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="au-page as-root">
      <div className="au-header">
        <h1 className="au-title">
          {section === "users" ? "Thống kê người dùng" : "Thống kê công ty"}
        </h1>
      </div>

      <div className="as-shell">
        
        <div className="as-sidebar">
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`as-sidebar-item ${
                section === item.key ? "active" : ""
              }`}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="as-content">
          {section === "users" ? (
            <AdminUserChart />
          ) : (
            <>
              {error && <div className="alert alert-error">{error}</div>}

              
              <div className="as-metrics">
        <span className="as-metrics-label">Loại thống kê:</span>

        <div className="au-dropdown" ref={metricDropdownRef}>
          <button
            type="button"
            className={`au-dropdown-toggle ${showMetricMenu ? "open" : ""}`}
            onClick={() => setShowMetricMenu(!showMetricMenu)}
          >
            <span>{metric.label}</span>
            <svg
              className={`au-dropdown-arrow ${showMetricMenu ? "open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline
                points="6 9 12 15 18 9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showMetricMenu && (
            <div className="au-dropdown-menu">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`au-dropdown-item ${
                    metricKey === m.key ? "active" : ""
                  }`}
                  onClick={() => {
                    setMetricKey(m.key);
                    setShowMetricMenu(false);
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {supportsDateRange && (
          <>
            
            <span className="as-metrics-label">Từ ngày:</span>
            <input
              type="date"
              className="as-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <span className="as-metrics-label">Đến ngày:</span>
            <input
              type="date"
              className="as-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            {(fromDate || toDate) && (
              <button
                type="button"
                className="au-btn au-btn-ghost"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Xóa lọc ngày
              </button>
            )}
          </>
        )}
      </div>

      <div className="as-card">
        <div className="as-layout">
          
          <div className="as-chart-col">
            <div className="as-chart-head">
              <h2 className="as-card-title">
                {metric.type === "application_status" && appStatus
                  ? `Đơn "${appStatus}" theo công ty`
                  : metric.title}
              </h2>

              {metric.type === "application_status" && (
                <div className="au-dropdown" ref={appStatusDropdownRef}>
                  <button
                    type="button"
                    className={`au-dropdown-toggle ${
                      showAppStatusMenu ? "open" : ""
                    }`}
                    onClick={() => setShowAppStatusMenu(!showAppStatusMenu)}
                  >
                    <span>{appStatus || "Tất cả trạng thái"}</span>
                    <svg
                      className={`au-dropdown-arrow ${
                        showAppStatusMenu ? "open" : ""
                      }`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polyline
                        points="6 9 12 15 18 9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {showAppStatusMenu && (
                    <div className="au-dropdown-menu">
                      {["", ...APPLICATION_STATUS_ORDER].map((status) => (
                        <button
                          key={status || "all"}
                          type="button"
                          className={`au-dropdown-item ${
                            appStatus === status ? "active" : ""
                          }`}
                          onClick={() => {
                            setAppStatus(status);
                            setShowAppStatusMenu(false);
                          }}
                        >
                          {status || "Tất cả trạng thái"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {slices.length === 0 ? (
              <div className="au-empty">
                <h3>Chưa có dữ liệu để thống kê</h3>
                <p>Cần có công ty và bài đăng trước khi vẽ biểu đồ</p>
              </div>
            ) : (
              <>
                <div className="as-chart-box">
                  <canvas ref={canvasRef}></canvas>
                </div>

                <div className="as-legend">
                  {slices.map((item, i) => (
                    <div className="as-legend-row" key={item.label}>
                      <span
                        className="as-legend-chip"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      ></span>
                      <span className="as-legend-name" title={item.label}>
                        {item.label}
                      </span>
                      <span className="as-legend-value">
                        {`${formatNumber(item.value)} ${metric.unit}`}
                      </span>
                      <span className="as-legend-percent">
                        {totalValue
                          ? `${((item.value / totalValue) * 100).toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          
          <div className="as-table-col">
            <h2 className="as-table-title">
              Số liệu chi tiết ({sortedCompanies.length} công ty)
            </h2>

            <div className="au-table-wrapper">
              <table
                className={`au-table ${
                  metric.type === "application_status" && !appStatus
                    ? "as-table-multi"
                    : ""
                }`}
              >
                <thead>
                  <tr>
                    <th>Công ty</th>
                    {metric.type === "application_status" && !appStatus ? (
                      APPLICATION_STATUS_ORDER.map((status) => (
                        <th className="as-num" key={status}>
                          {status}
                        </th>
                      ))
                    ) : (
                      <th className="as-num">
                        {metric.type === "application_status" && appStatus
                          ? `Đơn "${appStatus}"`
                          : metric.tableHeader}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedCompanies.map((c) => (
                    <tr key={c.id}>
                      <td className="au-username">{c.company_name}</td>
                      {metric.type === "application_status" && !appStatus ? (
                        APPLICATION_STATUS_ORDER.map((status) => (
                          <td className="as-num" key={status}>
                            {formatNumber(c.application_status?.[status] || 0)}
                          </td>
                        ))
                      ) : (
                        <td className="as-num">
                          {metric.type === "application_status" && appStatus
                            ? formatNumber(
                                c.application_status?.[appStatus] || 0,
                              )
                            : renderCellValue(c)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
