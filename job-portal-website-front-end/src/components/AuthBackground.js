import React from "react";


const AuthBackground = () => {
  return (
    <div className="auth-bg" aria-hidden="true">
      <img
        className="auth-bg-image"
        src={`${process.env.PUBLIC_URL}/image_company.jpg`}
        alt=""
      />
      <div className="auth-bg-overlay"></div>
    </div>
  );
};

export default AuthBackground;
