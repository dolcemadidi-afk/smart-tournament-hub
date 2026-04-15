import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  LayoutDashboard,
  Trophy,
  Users,
  CalendarDays,
  BarChart3,
  UserSquare2,
  Newspaper,
  Menu,
  User,
  LogOut,
} from "lucide-react";

function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const loadInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("initial auth user id:", user?.id);
      console.log("initial auth user email:", user?.email);

      setUser(user || null);
    };

    loadInitialUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;

      console.log("auth state change user id:", nextUser?.id);
      console.log("auth state change user email:", nextUser?.email);

      setUser(nextUser);
    });

    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    const handleWindowClick = () => {
      setProfileOpen(false);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleWindowClick);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  useEffect(() => {
    const loadProfileRole = async () => {
      if (!user) {
        setUserRole(null);
        setRoleLoaded(true);
        return;
      }

      try {
        setRoleLoaded(false);

        console.log("before profile query");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", user.id)
          .maybeSingle();

        console.log("profile query result:", profile);
        console.log("profile query error:", error);
        console.log("after profile query");

        if (error) {
          setUserRole(null);
          setRoleLoaded(true);
          return;
        }

        setUserRole(profile?.role || null);
        setRoleLoaded(true);
      } catch (err) {
        console.error("profile query crashed:", err);
        setUserRole(null);
        setRoleLoaded(true);
      }
    };

    loadProfileRole();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const allNavItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Tournaments", path: "/tournaments", icon: Trophy },
    { label: "Teams", path: "/teams", icon: Users },
    { label: "Matches", path: "/matches", icon: CalendarDays },
    { label: "Standings", path: "/standings", icon: BarChart3 },
    { label: "Players", path: "/add-player", icon: UserSquare2 },
    { label: "News", path: "/news", icon: Newspaper },
  ];

  let navItems = allNavItems;

  if (roleLoaded) {
    if (userRole === "team_manager") {
      navItems = allNavItems.filter(
        (item) => !["/tournaments", "/teams"].includes(item.path)
      );
    } else if (userRole === "audience") {
      navItems = allNavItems.filter(
        (item) => !["/tournaments", "/teams", "/add-player"].includes(item.path)
      );
    }
  }

  const tickerText =
    "الدوري الوطني لكرة القدم الخماسية للشركات ـ جهة الدار البيضاء 2026";

  const tickerItems = Array.from({ length: 8 }, (_, index) => (
    <span key={index} style={tickerItemStyle} className="ssc-ticker-item">
      ⚽ {tickerText}
    </span>
  ));

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    return name[0].toUpperCase();
  };

  if (!roleLoaded) {
    return <div style={{ height: "110px" }} />;
  }

  return (
    <>
      <style>
        {`
          @keyframes sscTickerLoop {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @media (max-width: 900px) {
            .ssc-header-topbar {
              padding: 10px 14px !important;
            }

            .ssc-header-logo {
              width: 64px !important;
            }

            .ssc-desktop-nav {
              display: none !important;
            }

            .ssc-mobile-toggle {
              display: inline-flex !important;
            }

            .ssc-mobile-menu {
              display: flex !important;
            }

            .ssc-ticker-bar {
              height: 28px !important;
            }

            .ssc-ticker-track {
              animation-duration: 55s !important;
            }

            .ssc-ticker-item {
              font-size: 12px !important;
              padding-right: 22px !important;
            }
          }

          @media (min-width: 901px) {
            .ssc-mobile-toggle {
              display: none !important;
            }

            .ssc-mobile-menu {
              display: none !important;
            }
          }
        `}
      </style>

      <div style={tickerWrapperStyle} className="ssc-ticker-bar">
        <div style={tickerViewportStyle}>
          <div style={tickerTrackStyle} className="ssc-ticker-track">
            {tickerItems}
            {tickerItems}
          </div>
        </div>
      </div>

      <header style={headerStyle}>
        <div style={topBarOuterStyle}>
          <div style={topBarStyle} className="ssc-header-topbar">
            <div style={leftWrapStyle}>
              <img
                src="/logo-smart-sport-consulting.jpg"
                alt="Smart Sport Consulting"
                style={logoStyle}
                className="ssc-header-logo"
              />
            </div>

            <div style={rightStyle}>
              {user && (
                <div
                  style={{ position: "relative" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setProfileOpen((prev) => !prev)}
                    style={avatarBtn}
                    aria-label="Open profile menu"
                  >
                    {getInitials()}
                  </button>

                  {profileOpen && (
                    <div style={dropdownStyle}>
                      <div style={dropdownUserStyle}>
                        {user.user_metadata?.full_name || user.email}
                      </div>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        style={dropdownItemStyle}
                      >
                        <span style={dropdownIconTextStyle}>
                          <User size={16} />
                          Profile
                        </span>
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{ ...dropdownItemStyle, color: "#cf2136" }}
                      >
                        <span style={dropdownIconTextStyle}>
                          <LogOut size={16} />
                          Logout
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isMobile && (
                <button
                  style={hamburgerStyle}
                  className="ssc-mobile-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileMenuOpen((prev) => !prev);
                  }}
                  aria-label="Open mobile menu"
                >
                  <Menu size={22} />
                </button>
              )}
            </div>
          </div>
        </div>

        {!isMobile && (
          <div style={desktopNavOuterStyle}>
            <nav style={desktopNavStyle} className="ssc-desktop-nav">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      ...desktopLinkStyle,
                      ...(active ? activeDesktopLinkStyle : {}),
                    }}
                  >
                    <span style={linkInnerStyle}>
                      <Icon size={16} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {isMobile && mobileMenuOpen && (
          <div style={mobileMenuOuterStyle}>
            <div style={mobileMenuStyle} className="ssc-mobile-menu">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      ...mobileLinkStyle,
                      ...(active ? activeMobileLinkStyle : {}),
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span style={linkInnerStyle}>
                      <Icon size={18} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

const tickerWrapperStyle = {
  width: "100%",
  background: "#1476b6",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  overflow: "hidden",
  height: "34px",
  display: "flex",
  alignItems: "center",
  position: "sticky",
  top: 0,
  zIndex: 1001,
};

const tickerViewportStyle = {
  width: "100%",
  overflow: "hidden",
  position: "relative",
};

const tickerTrackStyle = {
  display: "flex",
  alignItems: "center",
  width: "max-content",
  minWidth: "200%",
  animation: "sscTickerLoop 28s linear infinite",
  willChange: "transform",
};

const tickerItemStyle = {
  flexShrink: 0,
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "13px",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  paddingRight: "28px",
};

const headerStyle = {
  background: "#1476b6",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  position: "sticky",
  top: "34px",
  zIndex: 1000,
};

const topBarOuterStyle = {
  width: "100%",
};

const topBarStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 18px",
};

const leftWrapStyle = {
  display: "flex",
  alignItems: "center",
};

const logoStyle = {
  width: "78px",
  height: "auto",
  objectFit: "contain",
};

const rightStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const avatarBtn = {
  background: "#109847",
  color: "#fff",
  border: "2px solid rgba(255,255,255,0.9)",
  borderRadius: "50%",
  width: "38px",
  height: "38px",
  cursor: "pointer",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const hamburgerStyle = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  width: "38px",
  height: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
};

const desktopNavOuterStyle = {
  width: "100%",
  background: "#ffffff",
  borderTop: "1px solid rgba(0,0,0,0.04)",
};

const desktopNavStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  padding: "10px 16px",
  flexWrap: "wrap",
};

const desktopLinkStyle = {
  padding: "10px 12px",
  textDecoration: "none",
  color: "#111827",
  borderRadius: "10px",
  fontWeight: "600",
  whiteSpace: "nowrap",
  transition: "0.2s ease",
};

const activeDesktopLinkStyle = {
  background: "#109847",
  color: "#fff",
};

const mobileMenuOuterStyle = {
  width: "100%",
  background: "#ffffff",
  borderTop: "1px solid rgba(0,0,0,0.06)",
};

const mobileMenuStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
};

const mobileLinkStyle = {
  padding: "14px 16px",
  color: "#111827",
  textDecoration: "none",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "600",
  background: "#fff",
};

const activeMobileLinkStyle = {
  background: "#109847",
  color: "#fff",
};

const linkInnerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const dropdownStyle = {
  position: "absolute",
  right: 0,
  top: "46px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
  overflow: "hidden",
  minWidth: "200px",
  border: "1px solid #e5e7eb",
};

const dropdownUserStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "700",
  color: "#111827",
  fontSize: "14px",
};

const dropdownItemStyle = {
  padding: "12px 14px",
  border: "none",
  background: "#fff",
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  color: "#111827",
  fontSize: "14px",
};

const dropdownIconTextStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

export default AppHeader;