import { useState, useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import { authApis, endpoints } from "../configs/Apis";
import { getApiError } from "../utils/apiError";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartTooltip,
);


const SERIES = [
  { key: "ungvien", label: "Ứng viên", color: "#2a78d6" },
  { key: "nhatuyendung", label: "Nhà tuyển dụng", color: "#eb6834" },
];

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const AdminUserChart = () => {
  const [points, setPoints] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await authApis().get(endpoints["admin-stats-users"], {
          params: {
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
          },
        });

        setPoints(response.data.points || []);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError(
          getApiError(err, "Không thể tải thống kê người dùng. Vui lòng thử lại sau."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [fromDate, toDate]);

  
  useEffect(() => {
    if (!canvasRef.current || points.length === 0) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: points.map((p) => p.label),
        datasets: SERIES.map((serie) => ({
          label: serie.label,
          data: points.map((p) => p[serie.key]),
          backgroundColor: serie.color,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 26,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) =>
                ` ${context.dataset.label}: ${formatNumber(context.parsed.y)} tài khoản`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#898781" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#e1e0d9" },
            border: { display: false },
            ticks: { color: "#898781", precision: 0 },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points]);

  
  const totalByKey = {
    ungvien: points.reduce((sum, p) => sum + (p.ungvien || 0), 0),
    nhatuyendung: points.reduce((sum, p) => sum + (p.nhatuyendung || 0), 0),
  };

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      
      <div className="as-metrics">
        
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
      </div>

      <div className="as-card">
        <div className="as-chart-head">
          <h2 className="as-card-title">Người dùng đăng ký theo tháng</h2>
        </div>

        {loading && points.length === 0 ? (
          <div className="au-loading">
            <div className="au-spinner"></div>
            <p>Đang tải thống kê người dùng...</p>
          </div>
        ) : (
          <>
            <div className="as-bar-box">
              <canvas ref={canvasRef}></canvas>
            </div>

            <div className="as-bar-legend">
              {SERIES.map((serie) => (
                <div className="as-bar-legend-item" key={serie.key}>
                  <span
                    className="as-legend-chip"
                    style={{ backgroundColor: serie.color }}
                  ></span>
                  <span className="as-legend-name">{serie.label}</span>
                  <span className="as-legend-value">
                    {formatNumber(totalByKey[serie.key])} tài khoản
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminUserChart;
