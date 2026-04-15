import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get("token") || "";

  const [inviteData, setInviteData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteToken) {
        setFetchingInvite(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_manager_invites")
        .select("*")
        .eq("invite_token", inviteToken)
        .maybeSingle();

      if (error) {
        console.error("Invite fetch error:", error);
        setFetchingInvite(false);
        return;
      }

      if (data) {
        setInviteData(data);
        setEmail(data.email || "");
      }

      setFetchingInvite(false);
    };

    fetchInvite();
  }, [inviteToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }

      const user = authData.user;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setLoading(false);
        alert(profileError.message);
        return;
      }

      if (!profile) {
        setLoading(false);
        alert("Profile not found.");
        return;
      }

      // =========================
      // INVITE FLOW
      // =========================
      if (inviteToken && inviteData) {
        if (profile.role !== "team_manager") {
          setLoading(false);
          alert("This invitation is only for team manager accounts.");
          return;
        }

        // If invite was already accepted, try to send manager directly to their team
        if (inviteData.status === "accepted") {
          const { data: existingTeam, error: teamError } = await supabase
            .from("teams")
            .select("id")
            .eq("manager_id", user.id)
            .maybeSingle();

          if (teamError) {
            console.error("Team lookup error:", teamError.message);
          }

          if (existingTeam?.id) {
            navigate(
              `/add-player?teamId=${existingTeam.id}&tournamentId=${inviteData.tournament_id}&inviteId=${inviteData.id}`
            );
            return;
          }
        }

        navigate(`/accept-invite?token=${inviteToken}`);
        return;
      }

      // =========================
      // ROLE-BASED REDIRECT
      // =========================
      if (profile.role === "organizer") {
        navigate("/");
        return;
      }

      if (profile.role === "team_manager") {
        if (profile.team_id) {
          const { data: teamData, error: teamError } = await supabase
            .from("teams")
            .select("id, tournament_id")
            .eq("id", profile.team_id)
            .maybeSingle();

          if (teamError) {
            console.error("Team fetch error:", teamError.message);
          }

          if (teamData?.id) {
            navigate(
              `/add-player?teamId=${teamData.id}${
                teamData.tournament_id
                  ? `&tournamentId=${teamData.tournament_id}`
                  : ""
              }`
            );
            return;
          }
        }

        navigate("/teams");
        return;
      }

      if (profile.role === "audience") {
        navigate("/");
        return;
      }

      navigate("/");
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      alert("Something went wrong during login.");
    }
  };

  const currentMode = inviteToken ? "team_manager" : "default";

  const badgeText =
    currentMode === "team_manager" ? "Team invitation login" : "SSC access";

  const headingText =
    currentMode === "team_manager" ? "Welcome back manager" : "Welcome back";

  const descriptionText =
    currentMode === "team_manager"
      ? "Sign in to continue your team invitation and manage your squad."
      : "Sign in to access your dashboard, matches, standings, and team tools.";

  if (fetchingInvite) {
    return (
      <div style={pageStyle}>
        <div style={loadingCardStyle}>Loading login...</div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          @keyframes floatPlayer {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ssc-input:focus {
            border-color: #1476b6 !important;
            box-shadow: 0 0 0 4px rgba(20, 118, 182, 0.12);
          }

          .ssc-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 16px 32px rgba(20, 118, 182, 0.22);
          }

          @media (max-width: 980px) {
            .login-shell {
              max-width: 460px !important;
              border-radius: 28px !important;
            }

            .login-grid {
              grid-template-columns: 1fr !important;
            }

            .login-visual {
              min-height: 250px !important;
              border-radius: 28px 28px 0 0 !important;
            }

            .login-form-wrap {
              padding: 0 !important;
              background: transparent !important;
            }

            .login-form-card {
              width: calc(100% - 24px) !important;
              margin: -26px auto 12px !important;
              border-radius: 24px !important;
              padding: 22px 18px 18px !important;
              box-shadow: 0 14px 40px rgba(15, 23, 42, 0.10) !important;
            }

            .login-player {
              width: 170px !important;
              max-height: 150px !important;
            }

            .login-hero-title {
              font-size: 28px !important;
              line-height: 1.05 !important;
            }

            .login-hero-text {
              font-size: 13px !important;
              line-height: 1.55 !important;
              max-width: 260px !important;
            }

            .login-title {
              font-size: 28px !important;
            }

            .login-subtitle {
              font-size: 13px !important;
              line-height: 1.55 !important;
            }

            .login-field {
              margin-bottom: 12px !important;
            }

            .login-label {
              font-size: 13px !important;
              margin-bottom: 6px !important;
            }

            .login-footer {
              margin-top: 14px !important;
            }
          }

          @media (max-width: 560px) {
            .login-page {
              padding: 12px !important;
            }

            .login-shell {
              border-radius: 24px !important;
            }

            .login-visual {
              min-height: 220px !important;
            }

            .login-visual-content {
              padding: 18px 18px 14px !important;
              align-items: center !important;
              text-align: center !important;
            }

            .login-player-wrap {
              min-height: 115px !important;
              margin-top: 4px !important;
            }

            .login-player {
              width: 145px !important;
              max-height: 125px !important;
            }

            .login-badge {
              font-size: 11px !important;
              padding: 7px 10px !important;
            }

            .login-hero-title {
              font-size: 24px !important;
              max-width: 280px !important;
            }

            .login-hero-text {
              font-size: 12px !important;
              max-width: 280px !important;
            }

            .login-form-card {
              width: calc(100% - 16px) !important;
              margin: -22px auto 10px !important;
              padding: 18px 14px 16px !important;
              border-radius: 20px !important;
            }

            .login-title {
              font-size: 24px !important;
            }

            .ssc-input {
              padding: 12px 14px !important;
              font-size: 14px !important;
              border-radius: 12px !important;
            }

            .ssc-password-input {
              padding: 12px 42px 12px 14px !important;
            }

            .ssc-submit {
              padding: 13px 14px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>

      <div className="login-page" style={pageStyle}>
        <div className="login-shell login-grid" style={wrapperStyle}>
          <div className="login-visual" style={visualPanelStyle}>
            <div style={visualOverlayStyle} />
            <div style={visualShapeOneStyle} />
            <div style={visualShapeTwoStyle} />
            <div style={visualShapeThreeStyle} />

            <div className="login-visual-content" style={visualContentStyle}>
              <div style={topVisualInfoStyle}>
                <span className="login-badge" style={heroBadgeStyle}>
                  {badgeText}
                </span>

                <h2 className="login-hero-title" style={heroTitleStyle}>
                  {headingText}
                </h2>

                <p className="login-hero-text" style={heroTextStyle}>
                  {descriptionText}
                </p>
              </div>

              <div className="login-player-wrap" style={playerWrapStyle}>
                <img
                  src="/Joueur-de-football-en-action.png"
                  alt="Football Player"
                  className="login-player"
                  style={playerImageStyle}
                />
              </div>
            </div>
          </div>

          <div className="login-form-wrap" style={formSideStyle}>
            <div
              className="login-form-card"
              style={{ ...formCardStyle, animation: "fadeUp 0.5s ease" }}
            >
              <div style={headerBlockStyle}>
                <Link
                  to={inviteToken ? `/signup?token=${inviteToken}` : "/signup"}
                  style={backLinkStyle}
                >
                  ← Back to sign up
                </Link>

                <h1 className="login-title" style={titleStyle}>
                  Sign In
                </h1>

                <p className="login-subtitle" style={subtitleStyle}>
                  Access your SSC tournament space and continue where you left off.
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="login-field" style={fieldBlockStyle}>
                  <label className="login-label" style={labelStyle}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={inputStyle}
                    className="ssc-input"
                    required
                  />
                </div>

                <div className="login-field" style={fieldBlockStyle}>
                  <label className="login-label" style={labelStyle}>
                    Password
                  </label>

                  <div style={passwordWrapperStyle}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={passwordInputStyle}
                      className="ssc-input ssc-password-input"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={eyeButtonStyle}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ssc-submit"
                  style={{
                    ...submitButtonStyle,
                    opacity: loading ? 0.82 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div style={dividerWrapStyle}>
                <div style={dividerLineStyle} />
                <span style={dividerTextStyle}>SSC tournament access</span>
                <div style={dividerLineStyle} />
              </div>

              <p className="login-footer" style={footerTextStyle}>
                Don’t have an account?{" "}
                <Link
                  to={inviteToken ? `/signup?token=${inviteToken}` : "/signup"}
                  style={footerLinkStyle}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, rgba(20,118,182,0.08) 0%, rgba(16,152,71,0.06) 55%, rgba(207,33,54,0.06) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
};

const wrapperStyle = {
  width: "100%",
  maxWidth: "1120px",
  display: "grid",
  gridTemplateColumns: "430px 1fr",
  background: "#ffffff",
  borderRadius: "34px",
  overflow: "hidden",
  boxShadow: "0 28px 70px rgba(15, 23, 42, 0.12)",
  border: "1px solid rgba(255,255,255,0.75)",
};

const visualPanelStyle = {
  position: "relative",
  minHeight: "700px",
  overflow: "hidden",
  background: "linear-gradient(155deg, #1476b6 0%, #109847 58%, #0f6d35 100%)",
};

const visualOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
};

const visualShapeOneStyle = {
  position: "absolute",
  top: "-60px",
  left: "-40px",
  width: "170px",
  height: "170px",
  borderRadius: "48%",
  background: "rgba(255,255,255,0.16)",
};

const visualShapeTwoStyle = {
  position: "absolute",
  right: "-40px",
  bottom: "40px",
  width: "160px",
  height: "160px",
  borderRadius: "40%",
  background: "rgba(255,255,255,0.12)",
};

const visualShapeThreeStyle = {
  position: "absolute",
  right: "40px",
  top: "90px",
  width: "110px",
  height: "110px",
  borderRadius: "50%",
  background: "rgba(207,33,54,0.20)",
  filter: "blur(6px)",
};

const visualContentStyle = {
  position: "relative",
  zIndex: 2,
  height: "100%",
  padding: "28px 28px 24px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const topVisualInfoStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "12px",
};

const heroBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.18)",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.2px",
  backdropFilter: "blur(4px)",
};

const heroTitleStyle = {
  margin: 0,
  color: "#ffffff",
  fontSize: "40px",
  lineHeight: 1.05,
  fontWeight: "800",
  maxWidth: "320px",
};

const heroTextStyle = {
  margin: 0,
  color: "rgba(255,255,255,0.92)",
  fontSize: "14px",
  lineHeight: 1.7,
  maxWidth: "300px",
};

const playerWrapStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  minHeight: "330px",
};

const playerImageStyle = {
  width: "320px",
  maxWidth: "100%",
  maxHeight: "300px",
  objectFit: "contain",
  animation: "floatPlayer 4.5s ease-in-out infinite",
  filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.18))",
};

const formSideStyle = {
  padding: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffffff",
};

const formCardStyle = {
  width: "100%",
  maxWidth: "520px",
  background: "#ffffff",
  borderRadius: "30px",
  padding: "34px 34px 28px",
  border: "1px solid #eef2f7",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
};

const headerBlockStyle = {
  marginBottom: "20px",
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: "16px",
  color: "#1476b6",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "700",
};

const titleStyle = {
  margin: 0,
  fontSize: "38px",
  lineHeight: 1.05,
  color: "#0f172a",
};

const subtitleStyle = {
  marginTop: "10px",
  marginBottom: 0,
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.7",
  maxWidth: "460px",
};

const fieldBlockStyle = {
  marginBottom: "14px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#111827",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: "14px",
  border: "1px solid #dbe3ec",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
};

const passwordWrapperStyle = {
  position: "relative",
};

const passwordInputStyle = {
  width: "100%",
  padding: "13px 44px 13px 15px",
  borderRadius: "14px",
  border: "1px solid #dbe3ec",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s ease",
};

const eyeButtonStyle = {
  position: "absolute",
  top: "50%",
  right: "12px",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "16px",
  padding: 0,
};

const submitButtonStyle = {
  width: "100%",
  padding: "14px 16px",
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(90deg, #1476b6 0%, #109847 100%)",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "15px",
  boxShadow: "0 12px 28px rgba(20, 118, 182, 0.18)",
  transition: "all 0.2s ease",
};

const dividerWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "20px",
};

const dividerLineStyle = {
  flex: 1,
  height: "1px",
  background: "#e5e7eb",
};

const dividerTextStyle = {
  color: "#9ca3af",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const footerTextStyle = {
  textAlign: "center",
  marginTop: "16px",
  color: "#6b7280",
  fontSize: "14px",
};

const footerLinkStyle = {
  color: "#109847",
  fontWeight: "700",
  textDecoration: "none",
};

const loadingCardStyle = {
  background: "#ffffff",
  padding: "28px 34px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
};

export default Login;