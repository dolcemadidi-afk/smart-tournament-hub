import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function AcceptInvite() {
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [teamId, setTeamId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setErrorMessage("Invite token is missing.");
          setLoading(false);
          return;
        }

        const { data: inviteData, error: inviteError } = await supabase
          .from("team_manager_invites")
          .select("*")
          .eq("invite_token", token)
          .maybeSingle();

        if (inviteError) {
          setErrorMessage(inviteError.message);
          setLoading(false);
          return;
        }

        if (!inviteData) {
          setErrorMessage("Invalid or expired invite.");
          setLoading(false);
          return;
        }

        setInvite(inviteData);

        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", inviteData.tournament_id)
          .maybeSingle();

        if (tournamentError) {
          setErrorMessage(tournamentError.message);
          setLoading(false);
          return;
        }

        if (!tournamentData) {
          setErrorMessage("Tournament not found.");
          setLoading(false);
          return;
        }

        setTournament(tournamentData);

        // If invite already accepted before, optionally find team for continue button
        if (inviteData.status === "accepted") {
          const { data: existingTeam } = await supabase
            .from("teams")
            .select("id")
            .eq("manager_email", inviteData.email)
            .eq("tournament_id", inviteData.tournament_id)
            .maybeSingle();

          if (existingTeam?.id) {
            setTeamId(existingTeam.id);
            setSuccessMessage("Invitation already accepted. Continue your team setup.");
          }
        }
      } catch (error) {
        console.error("Accept invite error:", error);
        setErrorMessage("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, []);

  const isFinalized =
    invite?.status === "accepted" || invite?.status === "expired";

  const goToTeamSetup = () => {
    if (!teamId || !invite) return;

    navigate(
      `/add-player?teamId=${teamId}&tournamentId=${invite.tournament_id}&inviteId=${invite.id}`
    );
  };

  const handleAcceptInvite = async () => {
    if (!invite || invite.status === "expired") return;

    // IMPORTANT:
    // Do not mark accepted here.
    // Just send manager to signup page.
    navigate(`/signup?token=${invite.invite_token}`);
  };

  const handleDeclineInvite = async () => {
    if (!invite || isFinalized) return;

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("team_manager_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      if (error) {
        setErrorMessage(error.message);
        setActionLoading(false);
        return;
      }

      setInvite((prev) => ({ ...prev, status: "expired" }));
      setSuccessMessage("Invitation declined.");
    } catch (error) {
      console.error("Decline action error:", error);
      setErrorMessage("Failed to decline invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Loading invitation...</div>
      </div>
    );
  }

  if (errorMessage && !invite) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <LogoBlock />
          <h2 style={{ color: "#dc2626", textAlign: "center" }}>Error</h2>
          <p style={{ textAlign: "center" }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={fadeInStyle}>
            <LogoBlock />

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ marginBottom: "10px", color: "#0f172a" }}>
                Welcome to{" "}
                <span style={{ color: "#2563eb" }}>
                  {tournament?.name || "the tournament"}
                </span>{" "}
                ⚽
              </h2>

              <p style={paragraphStyle}>
                Welcome to <strong>{tournament?.name}</strong>. You have been
                invited as the official team manager for your team. By accepting
                this invitation, you will continue to account creation, then set
                up your squad, register players, and prepare your team for the
                tournament.
              </p>
            </div>

            <hr style={{ margin: "20px 0" }} />

            <h3 style={{ textAlign: "center", marginBottom: "16px" }}>
              Invitation Details
            </h3>

            {invite.logo_url && (
              <div style={{ textAlign: "center", margin: "15px 0" }}>
                <img
                  src={invite.logo_url}
                  alt="Team logo"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    objectFit: "cover",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}

            <div style={{ textAlign: "center", lineHeight: "1.8" }}>
              <p>
                <strong>Manager:</strong> {invite.manager_name}
              </p>
              <p>
                <strong>Email:</strong> {invite.email}
              </p>
              <p>
                <strong>Phone:</strong> {invite.manager_phone || "-"}
              </p>
              <p>
                <strong>Team:</strong> {invite.team_name || "-"}
              </p>
              <p>
                <strong>Status:</strong> {invite.status}
              </p>
            </div>

            {errorMessage && <div style={errorBox}>{errorMessage}</div>}

            {successMessage && (
              <>
                <div style={successBox}>{successMessage}</div>

                {teamId && invite?.status === "accepted" && (
                  <div style={{ marginTop: "15px", textAlign: "center" }}>
                    <button onClick={goToTeamSetup} style={continueBtn}>
                      ➜ Go to Team Setup
                    </button>
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleAcceptInvite}
                disabled={actionLoading || isFinalized}
                style={{
                  ...btn,
                  background: isFinalized ? "#9ca3af" : "#16a34a",
                  cursor:
                    actionLoading || isFinalized ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Processing..." : "Accept"}
              </button>

              <button
                onClick={handleDeclineInvite}
                disabled={actionLoading || isFinalized}
                style={{
                  ...btn,
                  background: isFinalized ? "#9ca3af" : "#dc2626",
                  cursor:
                    actionLoading || isFinalized ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Processing..." : "Decline"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LogoBlock() {
  return (
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <img
        src="/logo-smart-sport-consulting.jpg"
        alt="Smart Sport Consulting"
        onError={(e) => {
          e.currentTarget.src = "/FAVICON.png";
        }}
        style={{ maxWidth: "200px", width: "100%", height: "auto" }}
      />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f3f4f6",
  padding: "24px",
};

const cardStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "10px",
  width: "100%",
  maxWidth: "600px",
  boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
};

const fadeInStyle = {
  animation: "fadeInUp 0.6s ease-out",
};

const paragraphStyle = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  maxWidth: "500px",
  margin: "0 auto",
};

const btn = {
  flex: 1,
  color: "#fff",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
};

const continueBtn = {
  padding: "12px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: "10px",
  marginTop: "15px",
  textAlign: "center",
  borderRadius: "8px",
  border: "1px solid #86efac",
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "10px",
  marginTop: "15px",
  textAlign: "center",
  borderRadius: "8px",
  border: "1px solid #fca5a5",
};

export default AcceptInvite;