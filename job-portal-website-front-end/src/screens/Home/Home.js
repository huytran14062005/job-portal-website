import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MyUserContext } from "../../configs/Contexts";

const ABOUT_POINTS = [
  "Cơ hội việc làm đa dạng từ nhiều lĩnh vực",
  "Hệ thống tìm kiếm thông minh và chính xác",
  "Quy trình ứng tuyển đơn giản và nhanh chóng",
  "Hỗ trợ 24/7 từ đội ngũ chuyên nghiệp",
];

const CheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <polyline
      points="22 4 12 14.01 9 11.01"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const [user] = useContext(MyUserContext);
  const isAdmin = user?.role === "admin";

  return (
    <div className="home-container">
      
      <section className="home-hero">
        <video
          className="hero-video"
          src="/business.mp4"
          poster="/image_company.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              Hãy tìm kiếm công việc
              <br />
              mơ ước của bạn!
            </h1>
            <p className="hero-description">
              Hàng ngàn cơ hội việc làm từ các công ty uy tín, được cập nhật mỗi
              ngày. Tìm kiếm, ứng tuyển và theo dõi hồ sơ chỉ trên một nền tảng.
            </p>

            
            {!isAdmin && (
              <div className="hero-actions">
                <button
                  className="btn-hero-primary"
                  onClick={() => navigate("/jobs")}
                >
                  Tìm việc ngay
                </button>
                <button
                  className="btn-hero-ghost"
                  onClick={() => navigate("/companies")}
                >
                  Khám phá công ty
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      
      <section className="home-about">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">Về JobSearching</h2>
            <p className="section-description">
              JobSearching là nền tảng tìm kiếm việc làm hàng đầu Việt Nam, kết
              nối hàng nghìn ứng viên tài năng với các công ty uy tín. Chúng tôi
              cam kết mang đến trải nghiệm tuyển dụng tốt nhất cho cả ứng viên
              và nhà tuyển dụng.
            </p>
            <ul className="about-features">
              {ABOUT_POINTS.map((point) => (
                <li key={point}>
                  <CheckIcon />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="about-image">
            <img
              src="/job-searching-team.jpg"
              alt="JobSearching Team"
              className="about-img"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
