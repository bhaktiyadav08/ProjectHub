import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminGroup from "./pages/AdminGroup";
import AdminGroupManage from "./pages/AdminGroupManage";
import { AuthProvider } from "./context/AuthContext";
import CreateAccount from "./pages/CreateAccount";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import GroupChat from "./pages/GroupChat";
import GroupFiles from "./pages/GroupFiles";
import Home from "./pages/Home";
import LeaderGroup from "./pages/LeaderGroup";
import LeaderTaskBoard from "./pages/LeaderTaskBoard";
import Login from "./pages/Login";
import MemberGroup from "./pages/MemberGroup";
import MemberTaskBoard from "./pages/MemberTaskBoard";
import ProjectProgress from "./pages/ProjectProgress";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />

          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-group"
            element={
              <ProtectedRoute>
                <AdminGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader-group"
            element={
              <ProtectedRoute>
                <LeaderGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member-group"
            element={
              <ProtectedRoute>
                <MemberGroup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProjectProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-group/:groupId"
            element={
              <ProtectedRoute adminOnly>
                <AdminGroupManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader-tasks"
            element={
              <ProtectedRoute>
                <LeaderTaskBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member-tasks"
            element={
              <ProtectedRoute>
                <MemberTaskBoard />
              </ProtectedRoute>
            }
          />
           <Route
            path="/files"
            element={
              <ProtectedRoute>
                <GroupFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
export default App;
