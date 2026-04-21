import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  CalendarDays,
  Trophy,
  Clock3,
  MapPin,
  PlayCircle,
  Trash2,
  Pencil,
  TimerReset,
  Shield,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function Matches() {
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userTournamentId, setUserTournamentId] = useState(null);
  const [, setTick] = useState(0);

  const [tournamentId, setTournamentId] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [field, setField] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [stage, setStage] = useState("round_1");
  const [statusFilter, setStatusFilter] = useState("all");

  const [firstHalfMinutes, setFirstHalfMinutes] = useState(22);
  const [secondHalfMinutes, setSecondHalfMinutes] = useState(22);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [loading, setLoading] = useState(false);

  const [editingTimeMatchId, setEditingTimeMatchId] = useState(null);
  const [editTime, setEditTime] = useState({
    first: "",
    second: "",
    break: "",
  });

  const [editingScheduleMatchId, setEditingScheduleMatchId] = useState(null);
  const [editSchedule, setEditSchedule] = useState({
    date: "",
    time: "",
    field: "",
  });

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateMatch, setShowCreateMatch] = useState(false);

  const fetchUserContext = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError.message);
      return;
    }

    if (!profile) return;

    setUserRole(profile.role);

    if (profile.role === "team_manager" && profile.team_id) {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", profile.team_id)
        .single();

      if (teamError) {
        console.error("Error fetching manager team:", teamError.message);
        return;
      }

      if (team) {
        setUserTournamentId(team.tournament_id);
        setTournamentId(String(team.tournament_id));
      }
    }
  };

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

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching players:", error.message);
      return;
    }

    setPlayers(data || []);
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })
      .order("match_time", { ascending: true });

    if (error) {
      console.error("Error fetching matches:", error.message);
      return;
    }

    setMatches(data || []);
  };

  useEffect(() => {
    const init = async () => {
      await fetchUserContext();
      await fetchTournaments();
      await fetchTeams();
      await fetchPlayers();
      await fetchMatches();
    };

    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const canManageMatches =
    userRole === "organizer" || userRole === "staff";
  const isOrganizer = userRole === "organizer";

  const visibleTournaments = useMemo(() => {
    if (userRole === "team_manager") {
      return tournaments.filter(
        (t) => String(t.id) === String(userTournamentId)
      );
    }

    return tournaments;
  }, [tournaments, userRole, userTournamentId]);

  const filteredTeams = teams.filter(
    (team) => String(team.tournament_id) === String(tournamentId)
  );

  const tournamentScopedMatches = useMemo(() => {
    if (userRole !== "team_manager") return matches;

    return matches.filter(
      (m) => String(m.tournament_id) === String(userTournamentId)
    );
  }, [matches, userRole, userTournamentId]);

  const filteredMatches = useMemo(() => {
    if (statusFilter === "all") return tournamentScopedMatches;

    return tournamentScopedMatches.filter((match) => match.status === statusFilter);
  }, [tournamentScopedMatches, statusFilter]);

  const getTeam = (teamId) =>
    teams.find((t) => String(t.id) === String(teamId));

  const getTeamName = (teamId) => {
    const team = teams.find((t) => String(t.id) === String(teamId));
    return team
      ? team.company_name || team.team_name || "Unknown Team"
      : "Unknown Team";
  };

  const getTeamLogo = (teamId) => {
    const team = teams.find((t) => String(t.id) === String(teamId));
    return team?.logo_url || "";
  };

  const getTournamentName = (id) => {
    const tournament = tournaments.find((t) => String(t.id) === String(id));
    return tournament ? tournament.name : "Unknown Tournament";
  };

  const getPlayerById = (playerId) => {
    return players.find((p) => String(p.id) === String(playerId)) || null;
  };

  const getMotmLabel = (match) => {
    if (!match?.man_of_the_match_player_id) return "";

    const player = getPlayerById(match.man_of_the_match_player_id);
    if (!player) return "Man of the Match selected";

    return `${player.full_name}${
      player.jersey_number ? ` #${player.jersey_number}` : ""
    }`;
  };

  const formatMMSS = (seconds) => {
    const safe = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const getElapsedSeconds = (isoDate) => {
    if (!isoDate) return 0;

    const startMs = new Date(isoDate).getTime();
    const nowMs = Date.now();

    if (!Number.isFinite(startMs)) return 0;

    const diff = Math.floor((nowMs - startMs) / 1000);

    if (!Number.isFinite(diff) || diff < 0) return 0;
    if (diff > 7200) return 0;

    return diff;
  };

  const getLiveElapsed = (match) => {
    if (!match || match.status !== "live") return 0;
    return getElapsedSeconds(match.live_started_at);
  };

  const getBreakElapsed = (match) => {
    if (!match || match.status !== "break") return 0;
    return getElapsedSeconds(match.break_started_at);
  };

  const getStatusText = (match) => {
    const breakSec = (match.break_minutes || 5) * 60;

    if (match.status === "live") {
      const liveElapsed = getLiveElapsed(match);
      const currentHalf = match.current_half || 1;
      const label = currentHalf === 2 ? "2H" : "1H";
      return `${label} ${formatMMSS(liveElapsed)}`;
    }

    if (match.status === "break") {
      const breakElapsed = getBreakElapsed(match);
      return `BREAK ${formatMMSS(Math.min(breakElapsed, breakSec))}`;
    }

    if (match.status === "finished") return "Finished";
    if (match.status === "postponed") return "Postponed";

    return match.match_time || "Scheduled";
  };

  const getStatusColor = (match) => {
    if (match.status === "live") return "#cf2136";
    if (match.status === "break") return "#f59e0b";
    if (match.status === "finished") return "#6b7280";
    if (match.status === "postponed") return "#7c3aed";
    return "#1476b6";
  };

  const getStatusSoftBg = (match) => {
    if (match.status === "live") return "rgba(207,33,54,0.10)";
    if (match.status === "break") return "rgba(245,158,11,0.12)";
    if (match.status === "finished") return "rgba(107,114,128,0.10)";
    if (match.status === "postponed") return "rgba(124,58,237,0.10)";
    return "rgba(20,118,182,0.10)";
  };

  const safeDateTimeValue = (date, time) => {
    if (!date) return Number.MAX_SAFE_INTEGER;

    const safeTime = time && String(time).trim() ? time : "23:59";
    const isoString = `${date}T${safeTime}`;
    const parsed = new Date(isoString).getTime();

    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      const aValue = safeDateTimeValue(a.match_date, a.match_time);
      const bValue = safeDateTimeValue(b.match_date, b.match_time);
      return aValue - bValue;
    });
  }, [filteredMatches]);

  const stageOrder = [
    "group",
    "round_1",
    "round_2",
    "round_3",
    "round_4",
    "round_5",
    "quarterfinal",
    "semifinal",
    "third_place",
    "final",
  ];

  const stageLabels = {
    group: "Group Stage",
    round_1: "Round 1",
    round_2: "Round 2",
    round_3: "Round 3",
    round_4: "Round 4",
    round_5: "Round 5",
    quarterfinal: "Quarterfinals",
    semifinal: "Semifinals",
    third_place: "Third Place",
    final: "Final",
  };

  const groupedMatches = useMemo(() => {
    const groups = {};

    stageOrder.forEach((stageKey) => {
      groups[stageKey] = [];
    });

    sortedMatches.forEach((match) => {
      const stageKey = match.stage || "round_1";
      if (!groups[stageKey]) groups[stageKey] = [];
      groups[stageKey].push(match);
    });

    return groups;
  }, [sortedMatches]);

  const orderedStageKeys = useMemo(() => {
    const existingDynamicStages = Object.keys(groupedMatches).filter(
      (stageKey) =>
        !stageOrder.includes(stageKey) &&
        groupedMatches[stageKey]?.length > 0
    );

    return [...stageOrder, ...existingDynamicStages];
  }, [groupedMatches]);

  const getStageLabel = (stageKey) => {
    if (stageLabels[stageKey]) return stageLabels[stageKey];

    return String(stageKey)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "scheduled", label: "Scheduled" },
    { key: "live", label: "Live" },
    { key: "finished", label: "Finished" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tournamentId) {
      alert("Please select a tournament");
      return;
    }

    if (!teamAId || !teamBId) {
      alert("Please select both teams");
      return;
    }

    if (teamAId === teamBId) {
      alert("Team A and Team B cannot be the same");
      return;
    }

    setLoading(true);

    const matchPayload = {
      tournament_id: tournamentId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      match_date: matchDate,
      match_time: matchTime,
      field,
      stage,
      status,
      elapsed_seconds: 0,
      team_a_score: 0,
      team_b_score: 0,
      current_half: 1,
      live_started_at: null,
      break_started_at: null,
      resumed_at: null,
      finished_at: null,
      first_half_minutes: Number(firstHalfMinutes),
      second_half_minutes: Number(secondHalfMinutes),
      break_minutes: Number(breakMinutes),
      man_of_the_match_player_id: null,
    };

    const { error } = await supabase.from("matches").insert([matchPayload]);

    if (error) {
      console.error("Error adding match:", error.message);
      alert("Failed to add match");
      setLoading(false);
      return;
    }

    if (userRole !== "team_manager") {
      setTournamentId("");
    }

    setTeamAId("");
    setTeamBId("");
    setMatchDate("");
    setMatchTime("");
    setField("");
    setStage("round_1");
    setStatus("scheduled");
    setFirstHalfMinutes(22);
    setSecondHalfMinutes(22);
    setBreakMinutes(5);

    await fetchMatches();
    setLoading(false);
    setShowCreateMatch(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this match?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("matches").delete().eq("id", id);

    if (error) {
      console.error("Error deleting match:", error.message);
      alert("Failed to delete match");
      return;
    }

    await fetchMatches();
  };

  const handleDeleteAllMatches = async () => {
    if (filteredMatches.length === 0) {
      alert("No matches to delete");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL matches? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const secondConfirm = window.prompt(
      'Type DELETE to confirm removing all matches'
    );
    if (secondConfirm !== "DELETE") {
      alert("Bulk delete cancelled");
      return;
    }

    const matchIds = filteredMatches.map((match) => match.id);

    const { error } = await supabase
      .from("matches")
      .delete()
      .in("id", matchIds);

    if (error) {
      console.error("Error deleting all matches:", error.message);
      alert("Failed to delete all matches");
      return;
    }

    await fetchMatches();
  };

  const handleStartMatch = async (matchId) => {
    const confirmStart = window.confirm("Start this match now?");
    if (!confirmStart) return;

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("matches")
      .update({
        status: "live",
        current_half: 1,
        live_started_at: nowIso,
        break_started_at: null,
        resumed_at: null,
        finished_at: null,
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
      })
      .eq("id", matchId);

    if (error) {
      console.error("Error starting match:", error.message);
      alert("Failed to start match");
      return;
    }

    await fetchMatches();
    navigate(`/matches/${matchId}`);
  };

  const handleEditTime = (match) => {
    if (match.status === "live" || match.status === "finished") return;

    setEditingScheduleMatchId(null);
    setEditingTimeMatchId(match.id);
    setEditTime({
      first: match.first_half_minutes || 22,
      second: match.second_half_minutes || 22,
      break: match.break_minutes || 5,
    });
  };

  const handleSaveTime = async (matchId) => {
    const { error } = await supabase
      .from("matches")
      .update({
        first_half_minutes: Number(editTime.first),
        second_half_minutes: Number(editTime.second),
        break_minutes: Number(editTime.break),
      })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match time:", error.message);
      alert("Error updating match time");
      return;
    }

    setEditingTimeMatchId(null);
    await fetchMatches();
  };

  const handleEditSchedule = (match) => {
    if (match.status === "live" || match.status === "finished") return;

    setEditingTimeMatchId(null);
    setEditingScheduleMatchId(match.id);
    setEditSchedule({
      date: match.match_date || "",
      time: match.match_time || "",
      field: match.field || "",
    });
  };

  const handleSaveSchedule = async (matchId) => {
    const { error } = await supabase
      .from("matches")
      .update({
        match_date: editSchedule.date || null,
        match_time: editSchedule.time || null,
        field: editSchedule.field || null,
      })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match schedule:", error.message);
      alert("Error updating match schedule");
      return;
    }

    setEditingScheduleMatchId(null);
    await fetchMatches();
  };

  const renderTeamLogo = (teamId) => {
    const logo = getTeamLogo(teamId);
    const team = getTeam(teamId);
    const displayName = team?.company_name || team?.team_name || "Team";

    return (
      <div style={teamLogoMiniWrapStyle}>
        {logo ? (
          <img src={logo} alt={displayName} style={teamLogoMiniStyle} />
        ) : (
          <span style={teamLogoMiniFallbackStyle}>
            {displayName?.charAt(0)?.toUpperCase() || "T"}
          </span>
        )}
      </div>
    );
  };

  const renderMatchCard = (match) => {
    const tournamentName = getTournamentName(match.tournament_id);
    const teamAScore = match.team_a_score ?? 0;
    const teamBScore = match.team_b_score ?? 0;

    const teamAPenalties = match.team_a_penalties ?? null;
    const teamBPenalties = match.team_b_penalties ?? null;

    const isKnockout = [
      "quarterfinal",
      "semifinal",
      "final",
      "third_place",
      "round_of_16",
      "round_of_32",
      "round_of_64",
    ].includes(match.stage);
    const isDraw = teamAScore === teamBScore;
    const showPenalties =
      isKnockout &&
      isDraw &&
      teamAPenalties !== null &&
      teamBPenalties !== null;

    const isEditLocked =
      match.status === "live" || match.status === "finished";
    const isMenuOpen = openMenuId === match.id;
    const motmText = getMotmLabel(match);

    return (
      <div key={match.id} style={matchCardStyle} className="matches-card">
        <div style={matchCardTopStyle} className="matches-card-top">
          <div style={matchTournamentStyle}>
            <Trophy size={14} />
            {tournamentName}
          </div>

          <div style={matchMetaTopStyle} className="matches-top-meta">
            <span style={matchMetaBadgeStyle}>
              <MapPin size={13} />
              {match.field || "No field"}
            </span>
            <span style={matchMetaBadgeStyle}>
              <CalendarDays size={13} />
              {match.match_date || "-"}
            </span>
            <span style={matchMetaBadgeStyle}>
              <Clock3 size={13} />
              {match.match_time || "-"}
            </span>
          </div>
        </div>

        <div style={matchCardBodyStyle} className="matches-card-body">
          <div style={statusActionRowStyle} className="matches-status-actions">
            <div
              style={{
                ...statusPillStyle,
                color: getStatusColor(match),
                background: getStatusSoftBg(match),
              }}
            >
              {getStatusText(match)}
            </div>

            <div
              style={{ position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId((prev) => (prev === match.id ? null : match.id));
                }}
                style={menuButtonStyle}
                aria-label="Open match actions"
              >
                <MoreVertical size={18} />
              </button>

              {isMenuOpen && (
                <div style={dropdownMenuStyle} className="matches-dropdown">
                  {canManageMatches ? (
                    <>
                      {match.status === "scheduled" ? (
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            handleStartMatch(match.id);
                          }}
                          style={dropdownItemStyle}
                        >
                          <PlayCircle size={14} />
                          Start Match
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/matches/${match.id}`);
                          }}
                          style={dropdownItemStyle}
                        >
                          <Shield size={14} />
                          Open Match
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          handleEditTime(match);
                        }}
                        disabled={isEditLocked}
                        style={{
                          ...dropdownItemStyle,
                          opacity: isEditLocked ? 0.5 : 1,
                          cursor: isEditLocked ? "not-allowed" : "pointer",
                        }}
                      >
                        <TimerReset size={14} />
                        Edit Time
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          handleEditSchedule(match);
                        }}
                        disabled={isEditLocked}
                        style={{
                          ...dropdownItemStyle,
                          opacity: isEditLocked ? 0.5 : 1,
                          cursor: isEditLocked ? "not-allowed" : "pointer",
                        }}
                      >
                        <Pencil size={14} />
                        Edit Schedule
                      </button>

                      {isOrganizer && (
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(match.id);
                          }}
                          style={{
                            ...dropdownItemStyle,
                            color: "#cf2136",
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        navigate(`/matches/${match.id}`);
                      }}
                      style={dropdownItemStyle}
                    >
                      <Shield size={14} />
                      Open Match
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={flashRowStyle} className="matches-flash-row">
            <div style={flashDateColStyle} className="matches-date-col">
              <div style={flashDateStyle}>{match.match_date || "-"}</div>
              <div style={flashTimeStyle}>{match.match_time || "-"}</div>
            </div>

            <div style={flashTeamsWrapStyle}>
              <div style={flashMetaLineStyle}>
                <span style={flashFieldLineStyle}>
                  <MapPin size={13} />
                  {match.field || "No field"}
                </span>
              </div>

              <div style={teamsColumnStyle}>
                <div style={teamRowAlignedStyle}>
                  <div style={teamInfoStyle}>
                    {renderTeamLogo(match.team_a_id)}
                    <span style={teamNameTextStyle} className="matches-team-name">
                      {getTeamName(match.team_a_id)}
                    </span>
                  </div>

                  <span style={scoreInlineStyle} className="matches-score">
                    {teamAScore}
                    {showPenalties && ` (${teamAPenalties})`}
                  </span>
                </div>

                <div style={teamRowAlignedStyle}>
                  <div style={teamInfoStyle}>
                    {renderTeamLogo(match.team_b_id)}
                    <span style={teamNameTextStyle} className="matches-team-name">
                      {getTeamName(match.team_b_id)}
                    </span>
                  </div>

                  <span style={scoreInlineStyle} className="matches-score">
                    {teamBScore}
                    {showPenalties && ` (${teamBPenalties})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {match.man_of_the_match_player_id && (
            <div style={motmChipStyle} className="matches-motm-chip">
              <span style={motmChipIconStyle}>
                <Trophy size={13} />
              </span>
              <span style={motmChipTextStyle} className="matches-motm-text">
                MOTM: {motmText}
              </span>
            </div>
          )}
        </div>

        {editingTimeMatchId === match.id && canManageMatches && (
          <div style={editPanelStyle}>
            <div style={editPanelTitleStyle}>
              <TimerReset size={16} />
              Update match time
            </div>

            <div style={editInputsGridStyle} className="matches-edit-grid">
              <input
                type="number"
                placeholder="1st half"
                value={editTime.first}
                onChange={(e) =>
                  setEditTime({ ...editTime, first: e.target.value })
                }
                style={smallInputStyle}
              />

              <input
                type="number"
                placeholder="2nd half"
                value={editTime.second}
                onChange={(e) =>
                  setEditTime({ ...editTime, second: e.target.value })
                }
                style={smallInputStyle}
              />

              <input
                type="number"
                placeholder="Break"
                value={editTime.break}
                onChange={(e) =>
                  setEditTime({ ...editTime, break: e.target.value })
                }
                style={smallInputStyle}
              />
            </div>

            <div style={editButtonsRowStyle} className="matches-edit-actions">
              <button
                onClick={() => handleSaveTime(match.id)}
                style={saveButtonStyle}
              >
                Save
              </button>

              <button
                onClick={() => setEditingTimeMatchId(null)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editingScheduleMatchId === match.id && canManageMatches && (
          <div style={editPanelStyle}>
            <div style={editPanelTitleStyle}>
              <Pencil size={16} />
              Update match schedule
            </div>

            <div style={scheduleEditGridStyle} className="matches-edit-grid">
              <input
                type="date"
                value={editSchedule.date}
                onChange={(e) =>
                  setEditSchedule({ ...editSchedule, date: e.target.value })
                }
                style={smallInputStyle}
              />

              <input
                type="time"
                value={editSchedule.time}
                onChange={(e) =>
                  setEditSchedule({ ...editSchedule, time: e.target.value })
                }
                style={smallInputStyle}
              />

              <input
                type="text"
                placeholder="Field / Venue"
                value={editSchedule.field}
                onChange={(e) =>
                  setEditSchedule({ ...editSchedule, field: e.target.value })
                }
                style={smallInputStyle}
              />
            </div>

            <div style={editButtonsRowStyle} className="matches-edit-actions">
              <button
                onClick={() => handleSaveSchedule(match.id)}
                style={saveButtonStyle}
              >
                Save
              </button>

              <button
                onClick={() => setEditingScheduleMatchId(null)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .matches-form-grid {
              grid-template-columns: 1fr !important;
            }

            .matches-submit-btn {
              grid-column: span 1 !important;
            }

            .matches-page {
              padding: 16px !important;
            }
          }

          @media (max-width: 768px) {
            .matches-page {
              padding: 14px !important;
            }

            .matches-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .matches-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .matches-card {
              padding: 0 !important;
            }

            .matches-card-top {
              flex-direction: column !important;
              align-items: flex-start !important;
            }

            .matches-card-body {
              gap: 12px !important;
            }

            .matches-top-meta {
              justify-content: flex-start !important;
            }

            .matches-status-actions {
              align-items: center !important;
            }

            .matches-flash-row {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }

            .matches-date-col {
              width: 100% !important;
              border-right: none !important;
              border-bottom: 1px solid #e5e7eb !important;
              padding-right: 0 !important;
              padding-bottom: 10px !important;
              min-width: 100% !important;
              text-align: left !important;
            }

            .matches-score {
              font-size: 18px !important;
              min-width: 24px !important;
            }

            .matches-team-name {
              font-size: 15px !important;
              line-height: 1.35 !important;
            }

            .matches-motm-chip {
              padding: 8px 10px !important;
              gap: 8px !important;
            }

            .matches-motm-text {
              font-size: 12px !important;
              line-height: 1.35 !important;
            }

            .matches-edit-grid {
              grid-template-columns: 1fr !important;
            }

            .matches-edit-actions {
              flex-direction: column !important;
            }

            .matches-edit-actions button {
              width: 100% !important;
            }

            .matches-dropdown {
              right: 0 !important;
              left: auto !important;
              min-width: 160px !important;
            }

            .matches-filter-row {
              flex-wrap: wrap !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="matches-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="matches-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="matches-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Matches Management</h1>
                <p style={heroTextStyle}>
                  Create matches, organize stages, manage time settings, and
                  quickly open live games from one clear dashboard.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <Shield size={16} />
                Match Control
              </div>
            </div>
          </div>

          {isOrganizer && (
            <>
              <div style={topActionBarStyle}>
                <button
                  onClick={handleDeleteAllMatches}
                  style={removeAllButtonStyle}
                >
                  <span style={buttonInnerStyle}>
                    <Trash2 size={14} />
                    Remove All Matches
                  </span>
                </button>
              </div>

              <div style={formCardStyle}>
                <div style={sectionHeaderRowStyle}>
                  <div style={sectionTitleWrapStyle}>
                    <div style={sectionIconStyle}>
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <div style={sectionTitleStyle}>Create Match</div>
                      <div style={sectionSubtitleStyle}>
                        Schedule a new match with tournament, teams, stage, and
                        time settings
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateMatch((prev) => !prev)}
                    style={collapseButtonStyle}
                  >
                    {showCreateMatch ? "Hide Form" : "Open Form"}
                    <span style={{ display: "inline-flex", marginLeft: "8px" }}>
                      {showCreateMatch ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </span>
                  </button>
                </div>

                {showCreateMatch && (
                  <form
                    onSubmit={handleSubmit}
                    style={formGridStyle}
                    className="matches-form-grid"
                  >
                    <select
                      value={tournamentId}
                      onChange={(e) => {
                        setTournamentId(e.target.value);
                        setTeamAId("");
                        setTeamBId("");
                      }}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select tournament</option>
                      {visibleTournaments.map((tournament) => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                      <option value="postponed">Postponed</option>
                    </select>

                    <select
                      value={teamAId}
                      onChange={(e) => setTeamAId(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select Team A</option>
                      {filteredTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.company_name || team.team_name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={teamBId}
                      onChange={(e) => setTeamBId(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select Team B</option>
                      {filteredTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.company_name || team.team_name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      style={inputStyle}
                    />

                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="group">Group Stage</option>
                      <option value="round_1">Round 1</option>
                      <option value="round_2">Round 2</option>
                      <option value="round_3">Round 3</option>
                      <option value="round_4">Round 4</option>
                      <option value="round_5">Round 5</option>
                      <option value="quarterfinal">Quarterfinals</option>
                      <option value="semifinal">Semifinals</option>
                      <option value="third_place">Third Place</option>
                      <option value="final">Final</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Field / Venue"
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="1st half minutes"
                      value={firstHalfMinutes}
                      onChange={(e) => setFirstHalfMinutes(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="2nd half minutes"
                      value={secondHalfMinutes}
                      onChange={(e) => setSecondHalfMinutes(e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="Break minutes"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(e.target.value)}
                      style={inputStyle}
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      style={submitButtonStyle}
                      className="matches-submit-btn"
                    >
                      {loading ? "Saving..." : "+ Add Match"}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          <div style={filterBarStyle} className="matches-filter-row">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setStatusFilter(option.key)}
                style={{
                  ...filterButtonStyle,
                  ...(statusFilter === option.key ? activeFilterButtonStyle : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {filteredMatches.length === 0 ? (
            <div style={emptyStateStyle}>No matches found for this filter.</div>
          ) : (
            <div style={{ display: "grid", gap: "24px" }}>
              {orderedStageKeys.map((stageKey) => {
                const stageMatches = groupedMatches[stageKey] || [];
                if (stageMatches.length === 0) return null;

                return (
                  <div key={stageKey}>
                    <div style={stageHeaderStyle}>
                      {getStageLabel(stageKey)}
                    </div>

                    <div style={{ display: "grid", gap: "16px" }}>
                      {stageMatches.map((match) => renderMatchCard(match))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  padding: "32px 20px",
  background: "#f3f4f6",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = {
  maxWidth: "1180px",
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

const topActionBarStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "16px",
};

const formCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  marginBottom: "20px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const sectionHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const sectionTitleWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const sectionIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

const collapseButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const inputStyle = {
  padding: "11px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  width: "100%",
};

const smallInputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  width: "100%",
};

const submitButtonStyle = {
  gridColumn: "span 2",
  background: "#111827",
  color: "#fff",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
};

const filterBarStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const filterButtonStyle = {
  background: "#e5e7eb",
  color: "#4b5563",
  border: "none",
  padding: "10px 14px",
  borderRadius: "999px",
  fontWeight: "700",
  cursor: "pointer",
};

const activeFilterButtonStyle = {
  background: "#ff1455",
  color: "#fff",
};

const stageHeaderStyle = {
  background: "#e5e7eb",
  borderRadius: "10px",
  padding: "10px 14px",
  marginBottom: "12px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#4b5563",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const matchCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "visible",
  position: "relative",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const matchCardTopStyle = {
  background: "#eef4fb",
  borderBottom: "1px solid #e5e7eb",
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
};

const matchTournamentStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#374151",
};

const matchMetaTopStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const matchMetaBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  color: "#6b7280",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "6px 10px",
};

const matchCardBodyStyle = {
  padding: "14px 16px 16px",
  display: "grid",
  gap: "12px",
};

const statusActionRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
};

const flashRowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "16px",
  alignItems: "stretch",
};

const flashDateColStyle = {
  minWidth: "120px",
  borderRight: "1px solid #e5e7eb",
  paddingRight: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  justifyContent: "center",
};

const flashDateStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#111827",
};

const flashTimeStyle = {
  fontSize: "15px",
  fontWeight: "900",
  color: "#111827",
};

const flashTeamsWrapStyle = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
};

const flashMetaLineStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
};

const flashFieldLineStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
};

const statusPillStyle = {
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: "800",
  fontSize: "12px",
};

const teamsColumnStyle = {
  display: "grid",
  gap: "10px",
};

const teamRowAlignedStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "2px 0",
};

const teamInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const teamNameTextStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#111827",
};

const scoreInlineStyle = {
  fontSize: "18px",
  fontWeight: "900",
  color: "#111827",
  lineHeight: 1,
  minWidth: "32px",
  textAlign: "right",
};

const teamLogoMiniWrapStyle = {
  width: "28px",
  height: "28px",
  minWidth: "28px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const teamLogoMiniStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const teamLogoMiniFallbackStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#6b7280",
};

const motmChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "rgba(245,158,11,0.10)",
  border: "1px solid rgba(245,158,11,0.22)",
};

const motmChipIconStyle = {
  width: "22px",
  height: "22px",
  minWidth: "22px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(245,158,11,0.18)",
  color: "#b45309",
};

const motmChipTextStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#92400e",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const matchFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
};

const menuButtonStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const dropdownMenuStyle = {
  position: "absolute",
  right: 0,
  top: "48px",
  minWidth: "180px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  padding: "8px",
  zIndex: 9999,
  display: "grid",
  gap: "6px",
};

const dropdownItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  color: "#111827",
  fontSize: "13px",
  fontWeight: "600",
  textAlign: "left",
};

const editPanelStyle = {
  padding: "14px",
  borderTop: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const editPanelTitleStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#374151",
  marginBottom: "12px",
};

const editInputsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
};

const scheduleEditGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
};

const editButtonsRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "12px",
};

const saveButtonStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const cancelButtonStyle = {
  background: "#6b7280",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const removeAllButtonStyle = {
  background: "#991b1b",
  color: "#fff",
  border: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "700",
};

const buttonInnerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  color: "#6b7280",
};

export default Matches;