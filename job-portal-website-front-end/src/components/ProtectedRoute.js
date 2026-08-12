import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { MyUserContext } from "../configs/Contexts";

const ProtectedRoute = ({ children, roles }) => {
  const [user] = useContext(MyUserContext);

  if (!user) {
    
    return <Navigate to="/login" replace />;
  }

  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
