import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-column footer-company">
            <h3 className="footer-title">
              Công ty Cổ phần JobSearching Việt Nam
            </h3>
            <div className="footer-info">
              <p>
                <strong>Giấy phép ĐKKD số:</strong> 0123456789 Cấp ngày
                15/01/2020, thay đổi lần thứ 5 ngày 10/03/2024 tại Sở Kế hoạch
                và Đầu tư Thành phố Hồ Chí Minh.
              </p>

              <p>
                <strong>Giấy phép hoạt động dịch vụ việc làm số:</strong>{" "}
                25/2024/SLĐTBXH-GP
              </p>

              <p>
                <strong>Trụ sở HN:</strong> Tòa nhà Innovation, Số 123 Đường
                Nguyễn Văn Cừ, Phường Long Biên, Quận Long Biên, Thành phố Hà
                Nội, Việt Nam
              </p>

              <p>
                <strong>Chi nhánh HCM:</strong> Tòa nhà TechHub, 456 Đường Điện
                Biên Phủ, Phường 25, Quận Bình Thạnh, TP HCM
              </p>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Liên hệ :</h3>
            <div className="footer-contact">
              <p>
                Hotline:<strong> 1900 1234</strong>
              </p>
              <p>
                Email: <strong>hoangrin0805@gmail.com</strong>
              </p>
              <p>
                Thời gian làm việc:<strong> 8:00 - 18:00, Thứ 2 - Thứ 6</strong>
              </p>
            </div>

            <div className="footer-social">
              <a
                href="https://www.facebook.com/profile.php?id=61582951222625"
                className="social-icon"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/in/h%C3%A0-tr%E1%BA%A7n-629815362/"
                className="social-icon"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              <a
                href="https://www.youtube.com/@HaTran-mg9iw"
                className="social-icon"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; 2026 JobSearching Việt Nam. Kết nối sự nghiệp & nhân tài. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
