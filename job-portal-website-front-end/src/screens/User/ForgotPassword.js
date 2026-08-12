import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";
import AuthBackground from "../../components/AuthBackground";
import { getApiError } from "../../utils/apiError";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [challengeToken, setChallengeToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);
      
      
      const response = await Apis.post(endpoints["forgot-password-request"], {
        email: formData.email,
      });
      const token =
        response.data?.challengeToken || response.data?.challenge_token;

      if (!token) {
        throw new Error("Backend chưa trả về mã xác thực OTP.");
      }

      setChallengeToken(token);
      setStep("otp");
      setMessage(
        response.data?.message ||
          "Mã OTP đã được gửi. Mã có hiệu lực trong 5 phút.",
      );
    } catch (requestError) {
      setError(getApiError(requestError, requestError.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      
      
      const response = await Apis.post(endpoints["forgot-password-verify"], {
        email: formData.email,
        otp: formData.otp,
        challenge_token: challengeToken,
      });
      const token =
        response.data?.resetToken ||
        response.data?.reset_token ||
        response.data?.verificationToken;

      if (!token) {
        throw new Error("Backend chưa trả về reset token.");
      }

      setResetToken(token);
      setStep("reset");
    } catch (verifyError) {
      setError(getApiError(verifyError, verifyError.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      
      
      await Apis.post(endpoints["forgot-password-reset"], {
        reset_token: resetToken,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      setStep("success");
    } catch (resetError) {
      setError(getApiError(resetError));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === "success") {
      return (
        <div className="forgot-password-success">
          <div className="forgot-password-success-icon">✓</div>
          <h3>Đổi mật khẩu thành công</h3>
          <p>Bạn có thể sử dụng mật khẩu mới để đăng nhập.</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      );
    }

    if (step === "email") {
      return (
        <form onSubmit={handleRequestOtp} className="auth-form forgot-password-form">
          <div className="form-group">
            <label htmlFor="forgot-email">Email tài khoản</label>
            <input
              type="text"
              id="forgot-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập email đã đăng ký"
              autoComplete="email"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </form>
      );
    }

    if (step === "otp") {
      return (
        <form onSubmit={handleVerifyOtp} className="auth-form forgot-password-form">
          <div className="form-group">
            <label htmlFor="forgot-otp">Mã OTP 6 số</label>
            <input
              type="text"
              id="forgot-otp"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              className="form-control otp-input"
              inputMode="numeric"
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác nhận OTP"}
          </button>
          <button
            type="button"
            className="forgot-password-back-btn"
            onClick={() => {
              setStep("email");
              setError("");
              setMessage("");
            }}
          >
            Đổi email
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="auth-form forgot-password-form">
        <div className="form-group">
          <label htmlFor="new-password">Mật khẩu mới</label>
          <input
            type="password"
            id="new-password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="form-control"
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Nhập lại mật khẩu mới</label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-control"
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
        </button>
      </form>
    );
  };

  return (
    <div className="auth-container">
      <AuthBackground />
      <div className="auth-card forgot-password-card">
        <h2 className="auth-title">
          {step === "success" ? "Hoàn tất" : "Quên mật khẩu"}
        </h2>
        {step !== "success" && (
          <p className="forgot-password-description">
            {step === "email" && "Nhập email để nhận mã OTP khôi phục mật khẩu."}
            {step === "otp" && "Nhập mã OTP đã được gửi đến email của bạn."}
            {step === "reset" && "Tạo mật khẩu mới cho tài khoản của bạn."}
          </p>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-info">{message}</div>}
        {renderStep()}
        {step !== "success" && (
          <button
            type="button"
            className="forgot-password-back-btn"
            onClick={() => navigate("/login")}
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
