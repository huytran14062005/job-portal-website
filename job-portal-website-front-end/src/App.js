import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useReducer } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import { ToastProvider } from "./components/Toast";
import { SocketProvider } from "./contexts/SocketContext";
import Home from "./screens/Home/Home";
import Jobs from "./screens/Job/Jobs";
import JobDetail from "./screens/Job/JobDetail";
import SavedJobs from "./screens/Job/SavedJobs";
import Companies from "./screens/Company/Companies";
import CompanyDetail from "./screens/Company/CompanyDetail";
import CompanyMyJobs from "./screens/Company/CompanyMyJobs";
import CompanyProfile from "./screens/Company/CompanyProfile";
import CompanyApplications from "./screens/Company/CompanyApplications";
import PostJob from "./screens/Job/PostJob";
import EditJob from "./screens/Job/EditJob";
import CompanyJobDetail from "./screens/Company/CompanyJobDetail";
import Login from "./screens/User/Login";
import ForgotPassword from "./screens/User/ForgotPassword";
import Register from "./screens/User/Register";
import Profile from "./screens/User/Profile";
import MyApplications from "./screens/User/MyApplications";
import AdminUsers from "./screens/Admin/AdminUsers";
import AdminCompanies from "./screens/Admin/AdminCompanies";
import AdminJobs from "./screens/Admin/AdminJobs";
import AdminStats from "./screens/Admin/AdminStats";
import { MyUserContext } from "./configs/Contexts";
import MyUserReducer from "./reducers/MyUserReducer";
import "./css/Style.css";

function App() {
  const [user, dispatch] = useReducer(
    MyUserReducer,
    JSON.parse(localStorage.getItem("user")) || null
  );

  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <SocketProvider>
        <ToastProvider>
          <Router>
            <div className="app-wrapper">
              <Header />
              <div className="main-content">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/:jobId" element={<JobDetail />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route
                      path="/companies/:companyId"
                      element={<CompanyDetail />}
                    />
                    <Route
                      path="/company/my-jobs"
                      element={
                        <ProtectedRoute>
                          <CompanyMyJobs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company/my-jobs/:jobId"
                      element={
                        <ProtectedRoute>
                          <CompanyJobDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company/my-jobs/edit/:jobId"
                      element={
                        <ProtectedRoute>
                          <EditJob />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company/profile"
                      element={
                        <ProtectedRoute>
                          <CompanyProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company/applications"
                      element={
                        <ProtectedRoute>
                          <CompanyApplications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/company/post-job"
                      element={
                        <ProtectedRoute>
                          <PostJob />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/saved-jobs"
                      element={
                        <ProtectedRoute>
                          <SavedJobs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-applications"
                      element={
                        <ProtectedRoute>
                          <MyApplications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/companies"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminCompanies />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/jobs"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminJobs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/stats"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <AdminStats />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </PageTransition>
              </div>
              <Footer />
              <BackToTop />
            </div>
          </Router>
        </ToastProvider>
      </SocketProvider>
    </MyUserContext.Provider>
  );
}

export default App;
