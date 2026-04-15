import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const ORGANIZER_SECRET = "SSC2026";
const STAFF_SECRET = "SSCSTAFF2026";

function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get("token") || "";

  const [inviteData, setInviteData] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);

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
        console.error("Error fetching invite:", error.message);
      }

      if (data) {
        setInviteData(data);
        setFullName(data.manager_name || "");
        setEmail(data.email || "");
      }

      setFetchingInvite(false);
    };

    fetchInvite();
  }, [inviteToken]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedSecret = secretCode.trim();

      let role = "audience";

      // Priority:
      // 1. organizer by secret code
      // 2. staff by secret code
      // 3. team_manager by valid invite
      // 4. audience by normal signup
      if (normalizedSecret === ORGANIZER_SECRET) {
        role = "organizer";
      } else if (normalizedSecret === STAFF_SECRET) {
        role = "staff";
      } else if (inviteToken) {
        if (!inviteData) {
          alert("This invitation is invalid or no longer available.");
          setLoading(false);
          return;
        }
        role = "team_manager";
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // ORGANIZER FLOW
      if (role === "organizer") {
        const { error: organizerProfileError } = await supabase
          .from("profiles")
          .upsert([
            {
              id: user.id,
              full_name: fullName.trim(),
              email: normalizedEmail,
              role: "organizer",
              team_id: null,
            },
          ]);

        if (organizerProfileError) {
          alert(organizerProfileError.message);
          setLoading(false);
          return;
        }

        navigate("/");
        setLoading(false);
        return;
      }

      // STAFF FLOW
      if (role === "staff") {
        const { error: staffProfileError } = await supabase
          .from("profiles")
          .upsert([
            {
              id: user.id,
              full_name: fullName.trim(),
              email: normalizedEmail,
              role: "staff",
              team_id: null,
            },
          ]);

        if (staffProfileError) {
          alert(staffProfileError.message);
          setLoading(false);
          return;
        }

        navigate("/");
        setLoading(false);
        return;
      }

      // AUDIENCE FLOW
      if (role === "audience") {
        const { error: audienceProfileError } = await supabase
          .from("profiles")
          .upsert([
            {
              id: user.id,
              full_name: fullName.trim(),
              email: normalizedEmail,
              role: "audience",
              team_id: null,
            },
          ]);

        if (audienceProfileError) {
          alert(audienceProfileError.message);
          setLoading(false);
          return;
        }

        navigate("/");
        setLoading(false);
        return;
      }

      // TEAM MANAGER FLOW
      let teamId = inviteData.team_id || null;

      if (teamId) {
        const { error: updateExistingTeamError } = await supabase
          .from("teams")
          .update({
            manager_id: user.id,
            manager_name: fullName.trim(),
            manager_email: normalizedEmail,
            manager_phone: inviteData.manager_phone || null,
            logo_url: inviteData.logo_url || null,
          })
          .eq("id", teamId);

        if (updateExistingTeamError) {
          alert(updateExistingTeamError.message);
          setLoading(false);
          return;
        }
      } else {
        const { data: createdTeam, error: createTeamError } = await supabase
          .from("teams")
          .insert([
            {
              tournament_id: inviteData.tournament_id,
              team_name: inviteData.team_name || "New Team",
              manager_name: fullName.trim(),
              manager_email: normalizedEmail,
              manager_phone: inviteData.manager_phone || null,
              logo_url: inviteData.logo_url || null,
              manager_id: user.id,
            },
          ])
          .select("id")
          .single();

        if (createTeamError) {
          alert(createTeamError.message);
          setLoading(false);
          return;
        }

        teamId = createdTeam.id;
      }

      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: user.id,
          full_name: fullName.trim(),
          email: normalizedEmail,
          role: "team_manager",
          team_id: teamId,
        },
      ]);

      if (profileError) {
        alert(profileError.message);
        setLoading(false);
        return;
      }

      const { error: inviteUpdateError } = await supabase
        .from("team_manager_invites")
        .update({
          status: "accepted",
          manager_name: fullName.trim(),
          email: normalizedEmail,
          team_id: teamId,
        })
        .eq("id", inviteData.id);

      if (inviteUpdateError) {
        alert(inviteUpdateError.message);
        setLoading(false);
        return;
      }

      navigate(
        `/add-player?teamId=${teamId}&tournamentId=${inviteData.tournament_id}&inviteId=${inviteData.id}`
      );
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong during signup.");
    }

    setLoading(false);
  };

  const currentMode =
    secretCode.trim() === ORGANIZER_SECRET
      ? "organizer"
      : secretCode.trim() === STAFF_SECRET
      ? "staff"
      : inviteToken
      ? "team_manager"
      : "audience";

  const headingText =
    currentMode === "organizer"
      ? "Create organizer account"
      : currentMode === "staff"
      ? "Create staff account"
      : currentMode === "team_manager"
      ? "Create team manager account"
      : "Create your account";

  const descriptionText =
    currentMode === "organizer"
      ? "Use your organizer code to manage the tournament."
      : currentMode === "staff"
      ? "Use your staff code to help manage matches and tournament operations."
      : currentMode === "team_manager"
      ? "Complete your invitation and continue to manage your team."
      : "Join SSC and follow matches, standings, and news easily.";

  const badgeText =
    currentMode === "organizer"
      ? "Organizer access"
      : currentMode === "staff"
      ? "Staff access"
      : currentMode === "team_manager"
      ? "Team invitation"
      : "Audience access";

  if (fetchingInvite) {
    return (
      <div style={pageStyle}>
        <div style={loadingCardStyle}>Loading signup...</div>
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
            box-shadow: 0 16px 32px rgba(16, 152, 71, 0.25);
          }

          .ssc-secret-toggle:hover {
            border-color: #1476b6 !important;
            background: #f8fbff !important;
          }

          @media (max-width: 980px) {
            .signup-shell {
              max-width: 460px !important;
              border-radius: 28px !important;
            }

            .signup-grid {
              grid-template-columns: 1fr !important;
            }

            .signup-visual {
              min-height: 250px !important;
              border-radius: 28px 28px 0 0 !important;
            }

            .signup-form-wrap {
              padding: 0 !important;
              background: transparent !important;
            }

            .signup-form-card {
              width: calc(100% - 24px) !important;
              margin: -26px auto 12px !important;
              border-radius: 24px !important;
              padding: 22px 18px 18px !important;
              box-shadow: 0 14px 40px rgba(15, 23, 42, 0.10) !important;
            }

            .signup-player {
              width: 170px !important;
              max-height: 150px !important;
            }

            .signup-hero-title {
              font-size: 28px !important;
              line-height: 1.05 !important;
            }

            .signup-hero-text {
              font-size: 13px !important;
              line-height: 1.55 !important;
              max-width: 260px !important;
            }

            .signup-title {
              font-size: 28px !important;
            }

            .signup-subtitle {
              font-size: 13px !important;
              line-height: 1.55 !important;
            }

            .signup-field {
              margin-bottom: 12px !important;
            }

            .signup-label {
              font-size: 13px !important;
              margin-bottom: 6px !important;
            }

            .signup-footer {
              margin-top: 14px !important;
            }
          }

          @media (max-width: 560px) {
            .signup-page {
              padding: 12px !important;
            }

            .signup-shell {
              border-radius: 24px !important;
            }

            .signup-visual {
              min-height: 220px !important;
            }

            .signup-visual-content {
              padding: 18px 18px 14px !important;
              align-items: center !important;
              text-align: center !important;
            }

            .signup-player-wrap {
              min-height: 115px !important;
              margin-top: 4px !important;
            }

            .signup-player {
              width: 145px !important;
              max-height: 125px !important;
            }

            .signup-badge {
              font-size: 11px !important;
              padding: 7px 10px !important;
            }

            .signup-hero-title {
              font-size: 24px !important;
              max-width: 280px !important;
            }

            .signup-hero-text {
              font-size: 12px !important;
              max-width: 280px !important;
            }

            .signup-form-card {
              width: calc(100% - 16px) !important;
              margin: -22px auto 10px !important;
              padding: 18px 14px 16px !important;
              border-radius: 20px !important;
            }

            .signup-title {
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

            .ssc-secret-toggle {
              padding: 12px 14px !important;
              border-radius: 12px !important;
            }

            .secret-help {
              font-size: 12px !important;
            }
          }
        `}
      </style>

      <div className="signup-page" style={pageStyle}>
        <div className="signup-shell signup-grid" style={wrapperStyle}>
          <div className="signup-visual" style={visualPanelStyle}>
            <div style={visualOverlayStyle} />
            <div style={visualShapeOneStyle} />
            <div style={visualShapeTwoStyle} />
            <div style={visualShapeThreeStyle} />

            <div className="signup-visual-content" style={visualContentStyle}>
              <div style={topVisualInfoStyle}>
                <span className="signup-badge" style={heroBadgeStyle}>
                  {badgeText}
                </span>

                <h2 className="signup-hero-title" style={heroTitleStyle}>
                  Sign up with SSC
                </h2>

                <p className="signup-hero-text" style={heroTextStyle}>
                  Fast, clean, and mobile-friendly access for tournament management.
                </p>
              </div>

              <div className="signup-player-wrap" style={playerWrapStyle}>
                <img
                  src="/Joueur-de-football-en-action.png"
                  alt="Football Player"
                  className="signup-player"
                  style={playerImageStyle}
                />
              </div>
            </div>
          </div>

          <div className="signup-form-wrap" style={formSideStyle}>
            <div
              className="signup-form-card"
              style={{ ...formCardStyle, animation: "fadeUp 0.5s ease" }}
            >
              <div style={headerBlockStyle}>
                <Link to={`/login?token=${inviteToken}`} style={backLinkStyle}>
                  ← Back to login
                </Link>

                <h1 className="signup-title" style={titleStyle}>
                  {headingText}
                </h1>

                <p className="signup-subtitle" style={subtitleStyle}>
                  {descriptionText}
                </p>
              </div>

              <form onSubmit={handleSignup}>
                <div className="signup-field" style={fieldBlockStyle}>
                  <label className="signup-label" style={labelStyle}>
                    {inviteToken ? "Manager name" : "Full name"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={inviteToken ? "Enter manager name" : "Enter full name"}
                    style={inputStyle}
                    className="ssc-input"
                    required
                  />
                </div>

                <div className="signup-field" style={fieldBlockStyle}>
                  <label className="signup-label" style={labelStyle}>
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

                <div className="signup-field" style={fieldBlockStyle}>
                  <label className="signup-label" style={labelStyle}>
                    Password
                  </label>

                  <div style={passwordWrapperStyle}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
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

                <div style={{ marginBottom: "14px" }}>
                  <button
                    type="button"
                    className="ssc-secret-toggle"
                    onClick={() => setShowSecretCode((prev) => !prev)}
                    style={secretToggleStyle}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={secretTitleStyle}>
                        Access code (Organizer / Staff)
                      </span>
                      <span style={secretSubtitleStyle}>
                        Optional
                      </span>
                    </div>

                    <span style={secretIconStyle}>
                      {showSecretCode ? "−" : "+"}
                    </span>
                  </button>

                  {showSecretCode && (
                    <div style={secretRevealWrapStyle}>
                      <input
                        type="text"
                        placeholder="Enter access code"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        style={inputStyle}
                        className="ssc-input"
                      />
                      <p className="secret-help" style={secretHelperStyle}>
                        Use an organizer or staff code if you were given one.
                      </p>
                    </div>
                  )}
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
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              <div style={dividerWrapStyle}>
                <div style={dividerLineStyle} />
                <span style={dividerTextStyle}>SSC tournament access</span>
                <div style={dividerLineStyle} />
              </div>

              <p className="signup-footer" style={footerTextStyle}>
                Already have an account?{" "}
                <Link to={`/login?token=${inviteToken}`} style={footerLinkStyle}>
                  Login
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

const secretToggleStyle = {
  width: "100%",
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  borderRadius: "14px",
  padding: "13px 15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const secretTitleStyle = {
  color: "#111827",
  fontWeight: "700",
  fontSize: "14px",
};

const secretSubtitleStyle = {
  color: "#6b7280",
  fontSize: "12px",
};

const secretIconStyle = {
  color: "#1476b6",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: 1,
};

const secretRevealWrapStyle = {
  marginTop: "10px",
};

const secretHelperStyle = {
  marginTop: "7px",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.55",
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

export default Signup;