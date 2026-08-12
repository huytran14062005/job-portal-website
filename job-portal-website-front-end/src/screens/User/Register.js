import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Apis, { endpoints } from "../../configs/Apis";
import { useToast } from "../../components/Toast";
import AuthBackground from "../../components/AuthBackground";
import { getApiError } from "../../utils/apiError";

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirm: "",
    email: "",
    role: "ungvien",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    
    try {
      setLoading(true);
      const response = await Apis.post(endpoints.register, {
        username: formData.username,
        password: formData.password,
        confirm: formData.confirm,
        email: formData.email,
        role: formData.role,
      });

      if (response.status === 201) {
        toast.success("Đăng ký thành công! Hãy tiến hành đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      setError(getApiError(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AuthBackground />
      <div className="auth-card">
        <h2 className="auth-title">Đăng ký tài khoản</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Xác nhận mật khẩu *</label>
            <input
              type="password"
              id="confirm"
              name="confirm"
              value={formData.confirm}
              onChange={handleChange}
              className="form-control"
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Loại tài khoản *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control"
            >
              <option value="ungvien">Ứng viên</option>
              <option value="nhatuyendung">Nhà tuyển dụng</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{" "}
            <span onClick={() => navigate("/login")} className="link-text">
              Đăng nhập ngay
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
