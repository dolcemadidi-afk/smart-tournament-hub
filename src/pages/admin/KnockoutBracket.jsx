import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  Trophy,
  Medal,
  Award,
  ChevronRight,
  GitBranch,
  CalendarDays,
  Shield,
} from "lucide-react";

function KnockoutBracket() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const navigate = useNavigate();

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error.message);
      return;
    }

    setTournaments(data || []);

    if (!selectedTournamentId && data?.length) {
      setSelectedTournamentId(data[0].id);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teams:", error.message);
      return;
    }

    setTeams(data || []);
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error.message);
      return;
    }

    setMatches(data || []);
  };

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
    fetchMatches();
  }, []);

  const selectedTournament = tournaments.find(
    (t) => t.id === selectedTournamentId
  );

  const knockoutMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        match.tournament_id === selectedTournamentId &&
        ["quarterfinal", "semifinal", "final", "third_place"].includes(
          match.stage
        )
    );
  }, [matches, selectedTournamentId]);

  const quarterfinals = useMemo(() => {
    return knockoutMatches
      .filter((m) => m.stage === "quarterfinal")
      .sort((a, b) => Number(a.round_number || 0) - Number(b.round_number || 0));
  }, [knockoutMatches]);

  const semifinals = useMemo(() => {
    return knockoutMatches
      .filter((m) => m.stage === "semifinal")
      .sort((a, b) => Number(a.round_number || 0) - Number(b.round_number || 0));
  }, [knockoutMatches]);

  const finalMatch = useMemo(() => {
    return knockoutMatches.find((m) => m.stage === "final") || null;
  }, [knockoutMatches]);

  const thirdPlaceMatch = useMemo(() => {
    return knockoutMatches.find((m) => m.stage === "third_place") || null;
  }, [knockoutMatches]);

  const getTeam = (teamId) => teams.find((team) => team.id === teamId);

  const getTeamName = (teamId) => {
    const team = getTeam(teamId);
    return team ? team.company_name || team.team_name || "TBD" : "TBD";
  };

  const getTeamLogo = (teamId) => {
    const team = getTeam(teamId);
    return team?.logo_url || "";
  };

  const getWinnerName = (match) => {
    if (!match?.winner_team_id) return "";
    return getTeamName(match.winner_team_id);
  };

  const getLoserTeamId = (match) => {
    if (!match?.winner_team_id) return null;
    return match.winner_team_id === match.team_a_id
      ? match.team_b_id
      : match.team_a_id;
  };

  const podium = useMemo(() => {
    let champion = null;
    let runnerUp = null;
    let third = null;

    if (finalMatch?.status === "finished" && finalMatch?.winner_team_id) {
      champion = finalMatch.winner_team_id;
      runnerUp = getLoserTeamId(finalMatch);
    }

    if (
      thirdPlaceMatch?.status === "finished" &&
      thirdPlaceMatch?.winner_team_id
    ) {
      third = thirdPlaceMatch.winner_team_id;
    }

    return { champion, runnerUp, third };
  }, [finalMatch, thirdPlaceMatch]);

  const getStatusBadgeStyle = (status) => {
    if (status === "finished") {
      return {
        background: "#e8f7ee",
        color: "#15803d",
      };
    }

    if (status === "live") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (status === "break") {
      return {
        background: "#fef3c7",
        color: "#d97706",
      };
    }

    return {
      background: "#eef2f7",
      color: "#475569",
    };
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 1100px) {
            .bracket-main-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 768px) {
            .bracket-page {
              padding: 14px !important;
            }

            .bracket-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .bracket-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .bracket-podium-grid {
              grid-template-columns: 1fr !important;
            }

            .bracket-main-grid {
              grid-template-columns: 1fr !important;
            }

            .bracket-filter-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .bracket-select {
              min-width: 100% !important;
              width: 100% !important;
            }

            .bracket-column {
              padding: 14px !important;
            }

            .bracket-match-card {
              border-radius: 12px !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="bracket-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="bracket-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="bracket-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Knockout Bracket</h1>
                <p style={heroTextStyle}>
                  Track quarter-finals, semi-finals, final, and third place
                  matches in one clean bracket dashboard.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <GitBranch size={16} />
                Knockout Stage
              </div>
            </div>
          </div>

          <div style={filterCardStyle}>
            <div style={filterRowStyle} className="bracket-filter-row">
              <div>
                <div style={sectionTitleStyle}>Select Tournament</div>
                <div style={sectionSubtitleStyle}>
                  Choose a tournament to view its knockout stage
                </div>
              </div>

              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                style={selectStyle}
                className="bracket-select"
              >
                <option value="">Select tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTournament && (
              <div style={selectedTournamentBadgeStyle}>
                <Trophy size={14} />
                {selectedTournament.name} — Knockout Bracket
              </div>
            )}
          </div>

          {selectedTournamentId && (
            <div style={podiumGridStyle} className="bracket-podium-grid">
              <PodiumCard
                title="Champion"
                medal="🥇"
                icon={<Trophy size={18} />}
                teamId={podium.champion}
                getTeamName={getTeamName}
                getTeamLogo={getTeamLogo}
                accent="#d97706"
                soft="rgba(217,119,6,0.10)"
              />

              <PodiumCard
                title="Runner-up"
                medal="🥈"
                icon={<Medal size={18} />}
                teamId={podium.runnerUp}
                getTeamName={getTeamName}
                getTeamLogo={getTeamLogo}
                accent="#64748b"
                soft="rgba(100,116,139,0.10)"
              />

              <PodiumCard
                title="3rd Place"
                medal="🥉"
                icon={<Award size={18} />}
                teamId={podium.third}
                getTeamName={getTeamName}
                getTeamLogo={getTeamLogo}
                accent="#b45309"
                soft="rgba(180,83,9,0.10)"
              />
            </div>
          )}

          {!selectedTournamentId ? (
            <EmptyState text="Please select a tournament." />
          ) : (
            <div style={mainGridStyle} className="bracket-main-grid">
              <StageColumn title="Quarter-finals">
                {quarterfinals.length === 0 ? (
                  <EmptyStageText />
                ) : (
                  quarterfinals.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      getTeamName={getTeamName}
                      getTeamLogo={getTeamLogo}
                      getWinnerName={getWinnerName}
                      getStatusBadgeStyle={getStatusBadgeStyle}
                      onOpen={() => navigate(`/matches/${match.id}`)}
                    />
                  ))
                )}
              </StageColumn>

              <StageColumn title="Semi-finals">
                {semifinals.length === 0 ? (
                  <EmptyStageText />
                ) : (
                  semifinals.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      getTeamName={getTeamName}
                      getTeamLogo={getTeamLogo}
                      getWinnerName={getWinnerName}
                      getStatusBadgeStyle={getStatusBadgeStyle}
                      onOpen={() => navigate(`/matches/${match.id}`)}
                    />
                  ))
                )}
              </StageColumn>

              <StageColumn title="Final">
                {!finalMatch ? (
                  <EmptyStageText />
                ) : (
                  <MatchCard
                    match={finalMatch}
                    getTeamName={getTeamName}
                    getTeamLogo={getTeamLogo}
                    getWinnerName={getWinnerName}
                    getStatusBadgeStyle={getStatusBadgeStyle}
                    highlight
                    onOpen={() => navigate(`/matches/${finalMatch.id}`)}
                  />
                )}
              </StageColumn>

              <StageColumn title="3rd Place">
                {!thirdPlaceMatch ? (
                  <EmptyStageText />
                ) : (
                  <MatchCard
                    match={thirdPlaceMatch}
                    getTeamName={getTeamName}
                    getTeamLogo={getTeamLogo}
                    getWinnerName={getWinnerName}
                    getStatusBadgeStyle={getStatusBadgeStyle}
                    onOpen={() => navigate(`/matches/${thirdPlaceMatch.id}`)}
                  />
                )}
              </StageColumn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PodiumCard({
  title,
  medal,
  icon,
  teamId,
  getTeamName,
  getTeamLogo,
  accent,
  soft,
}) {
  const name = teamId ? getTeamName(teamId) : "TBD";
  const logo = teamId ? getTeamLogo(teamId) : "";

  return (
    <div
      style={{
        ...podiumCardStyle,
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div style={podiumHeaderStyle}>
        <div
          style={{
            ...podiumIconWrapStyle,
            color: accent,
            background: soft,
          }}
        >
          {icon}
        </div>

        <div>
          <div style={podiumTitleStyle}>
            {medal} {title}
          </div>
          <div style={podiumSubtitleStyle}>Knockout result</div>
        </div>
      </div>

      <div style={podiumTeamWrapStyle}>
        <div style={teamLogoWrapLargeStyle}>
          {logo ? (
            <img
              src={logo}
              alt={name}
              style={teamLogoLargeStyle}
            />
          ) : (
            <span style={teamLogoFallbackLargeStyle}>
              {name?.charAt(0)?.toUpperCase() || "T"}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: teamId ? "#111827" : "#94a3b8",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}

function StageColumn({ title, children }) {
  return (
    <div style={stageColumnStyle} className="bracket-column">
      <div style={stageHeaderStyle}>{title}</div>
      <div style={{ display: "grid", gap: "14px" }}>{children}</div>
    </div>
  );
}

function MatchCard({
  match,
  getTeamName,
  getTeamLogo,
  getWinnerName,
  getStatusBadgeStyle,
  onOpen,
  highlight = false,
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        ...matchCardStyle,
        border: highlight ? "2px solid #dc2626" : "1px solid #e5e7eb",
        background: highlight ? "#fffafa" : "#fafafa",
      }}
      className="bracket-match-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={matchTopStyle}>
        <span style={matchDateStyle}>
          <CalendarDays size={13} />
          {match.match_date || "-"}
        </span>

        <span
          style={{
            ...statusBadgeStyle,
            ...getStatusBadgeStyle(match.status),
          }}
        >
          {match.status || "scheduled"}
        </span>
      </div>

      <div style={{ padding: "12px" }}>
        <TeamRow
          name={getTeamName(match.team_a_id)}
          logo={getTeamLogo(match.team_a_id)}
          score={match.team_a_score ?? 0}
          isWinner={match.winner_team_id === match.team_a_id}
        />

        <TeamRow
          name={getTeamName(match.team_b_id)}
          logo={getTeamLogo(match.team_b_id)}
          score={match.team_b_score ?? 0}
          isWinner={match.winner_team_id === match.team_b_id}
        />

        <div style={matchMetaStyle}>
          <span>{match.field || "No field"}</span>
          <span>{match.match_time || "-"}</span>
        </div>

        {match.winner_team_id && (
          <div style={winnerBadgeStyle}>
            Winner: {getWinnerName(match)}
          </div>
        )}

        <div style={openMatchStyle}>
          Open Match <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

function TeamRow({ name, logo, score, isWinner }) {
  return (
    <div style={teamRowStyle}>
      <div style={teamRowLeftStyle}>
        <div style={teamLogoWrapSmallStyle}>
          {logo ? (
            <img
              src={logo}
              alt={name}
              style={teamLogoSmallStyle}
            />
          ) : (
            <span style={teamLogoFallbackSmallStyle}>
              {name?.charAt(0)?.toUpperCase() || "T"}
            </span>
          )}
        </div>

        <span
          style={{
            ...teamNameStyle,
            fontWeight: isWinner ? "800" : "600",
            color: isWinner ? "#111827" : "#334155",
          }}
        >
          {name}
        </span>
      </div>

      <div
        style={{
          ...scoreStyle,
          color: isWinner ? "#dc2626" : "#111827",
        }}
      >
        {score}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={emptyStateStyle}>{text}</div>;
}

function EmptyStageText() {
  return (
    <div
      style={{
        color: "#94a3b8",
        fontSize: "14px",
        padding: "8px 0",
      }}
    >
      No matches yet.
    </div>
  );
}

const pageStyle = {
  padding: "32px 20px",
  background: "#f3f4f6",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
};

const heroCardStyle = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
  background: "linear-gradient(135deg, #1476b6 0%, #109847 55%, #cf2136 100%)",
  boxShadow: "0 18px 40px rgba(17,24,39,0.12)",
};

const heroOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 30%)",
};

const heroRowStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const heroEyebrowStyle = {
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#fff",
  opacity: 0.92,
  marginBottom: "8px",
  fontWeight: "700",
};

const heroTitleStyle = {
  margin: 0,
  color: "#fff",
  fontSize: "34px",
  fontWeight: "800",
};

const heroTextStyle = {
  marginTop: "10px",
  color: "rgba(255,255,255,0.92)",
  maxWidth: "640px",
  lineHeight: 1.7,
  fontSize: "15px",
};

const heroBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "#fff",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const filterCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  marginBottom: "24px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const filterRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#111827",
};

const sectionSubtitleStyle = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "4px",
};

const selectStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  minWidth: "280px",
  background: "#fff",
  fontWeight: "600",
};

const selectedTournamentBadgeStyle = {
  marginTop: "14px",
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  border: "1px solid rgba(20,118,182,0.15)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "13px",
  fontWeight: "700",
};

const podiumGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "22px",
};

const podiumCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const podiumHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
};

const podiumIconWrapStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const podiumTitleStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#111827",
};

const podiumSubtitleStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
};

const podiumTeamWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const teamLogoWrapLargeStyle = {
  width: "52px",
  height: "52px",
  minWidth: "52px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const teamLogoLargeStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const teamLogoFallbackLargeStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#6b7280",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr",
  gap: "18px",
  alignItems: "start",
};

const stageColumnStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  minHeight: "220px",
};

const stageHeaderStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#111827",
  marginBottom: "14px",
};

const matchCardStyle = {
  borderRadius: "14px",
  overflow: "hidden",
  cursor: "pointer",
  transition: "0.2s ease",
};

const matchTopStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
};

const matchDateStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

const statusBadgeStyle = {
  fontSize: "11px",
  fontWeight: "800",
  padding: "5px 8px",
  borderRadius: "999px",
};

const teamRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "12px",
  padding: "8px 0",
};

const teamRowLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const teamLogoWrapSmallStyle = {
  width: "26px",
  height: "26px",
  minWidth: "26px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const teamLogoSmallStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const teamLogoFallbackSmallStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#6b7280",
};

const teamNameStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const scoreStyle = {
  fontSize: "22px",
  fontWeight: "700",
  minWidth: "20px",
  textAlign: "right",
};

const matchMetaStyle = {
  marginTop: "10px",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "600",
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
};

const winnerBadgeStyle = {
  marginTop: "10px",
  fontSize: "12px",
  fontWeight: "800",
  color: "#15803d",
  background: "#e8f7ee",
  padding: "8px 10px",
  borderRadius: "10px",
};

const openMatchStyle = {
  marginTop: "10px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#2563eb",
  textAlign: "right",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "4px",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  color: "#6b7280",
};

export default KnockoutBracket;