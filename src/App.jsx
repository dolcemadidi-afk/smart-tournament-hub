import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Dashboard from "./pages/admin/Dashboard";
import Tournaments from "./pages/admin/Tournaments";
import Teams from "./pages/admin/Teams";
import Matches from "./pages/admin/Matches";
import MatchDetailsPage from "./pages/admin/MatchDetailsPage";
import Standings from "./pages/admin/Standings";
import AddPlayer from "./pages/manager/AddPlayer";
import AddGoal from "./pages/admin/AddGoal";
import NewsPage from "./pages/admin/AdminNewsPage";
import NewsDetailsPage from "./pages/admin/NewsDetailsPage";

import AcceptInvite from "./pages/AcceptInvite";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import AppHeader from "./components/AppHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import AppFooter from "./components/AppFooter";

function AppLayout() {
  const location = useLocation();

  const hideHeaderRoutes = [
    "/accept-invite",
    "/signup",
    "/login",
    "/organizer-signup",
  ];

  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!shouldHideHeader && <AppHeader />}

      <div style={{ flex: 1 }}>
        <Routes>
          {/* ================= SHARED: ORGANIZER + STAFF + TEAM MANAGER + AUDIENCE ================= */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/matches"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <Matches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/matches/:id"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <MatchDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/standings"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <Standings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/news"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <NewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/news/:id"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <NewsDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* ================= SHARED: ORGANIZER + STAFF + TEAM MANAGER ================= */}
          <Route
            path="/add-player"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager"]}
              >
                <AddPlayer />
              </ProtectedRoute>
            }
          />

          {/* ================= PROFILE / ACCOUNT DATA ================= */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={["organizer", "staff", "team_manager", "audience"]}
              >
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN AREA: ORGANIZER + STAFF ================= */}
          <Route
            path="/tournaments"
            element={
              <ProtectedRoute allowedRoles={["organizer", "staff"]}>
                <Tournaments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={["organizer", "staff"]}>
                <Teams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-goal"
            element={
              <ProtectedRoute allowedRoles={["organizer", "staff"]}>
                <AddGoal />
              </ProtectedRoute>
            }
          />

          {/* ================= PUBLIC ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/organizer-signup" element={<Signup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
        </Routes>
      </div>

      {!shouldHideHeader && <AppFooter />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;