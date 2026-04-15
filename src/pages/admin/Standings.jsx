import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  Trophy,
  ChevronDown,
  BarChart3,
  Users,
  Shield,
  Goal,
  Medal,
} from "lucide-react";

function Standings() {
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [goals, setGoals] = useState([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [openGroups, setOpenGroups] = useState({});

  const [activeTab, setActiveTab] = useState("overall");
  const [activeDrawStage, setActiveDrawStage] = useState("quarterfinal");

  const [userRole, setUserRole] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);

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

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error.message);
      return;
    }

    setGoals(data || []);
  };

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
    fetchMatches();
    fetchPlayers();
    fetchGoals();
  }, []);

  useEffect(() => {
    const loadUserContext = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, team_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      if (!profile) return;

      setUserRole(profile.role || null);
      setUserTeamId(profile.team_id || null);

      if (profile.role === "team_manager" && profile.team_id) {
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("tournament_id")
          .eq("id", profile.team_id)
          .maybeSingle();

        if (teamError) {
          console.error("Error fetching team tournament:", teamError.message);
          return;
        }

        if (teamData?.tournament_id) {
          setSelectedTournamentId(teamData.tournament_id);
        }
      }
    };

    loadUserContext();
  }, []);

  const selectedTournament = tournaments.find(
    (t) => String(t.id) === String(selectedTournamentId)
  );

  const tournamentTeams = useMemo(() => {
    return teams.filter(
      (team) => String(team.tournament_id) === String(selectedTournamentId)
    );
  }, [teams, selectedTournamentId]);

  const tournamentTeamIds = useMemo(() => {
    return tournamentTeams.map((team) => team.id);
  }, [tournamentTeams]);

  const groupMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        String(match.tournament_id) === String(selectedTournamentId) &&
        match.stage === "group" &&
        match.status === "finished"
    );
  }, [matches, selectedTournamentId]);

  const knockoutMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        String(match.tournament_id) === String(selectedTournamentId) &&
        ["quarterfinal", "semifinal", "final", "third_place"].includes(match.stage)
    );
  }, [matches, selectedTournamentId]);

  const groupedStandings = useMemo(() => {
    const groupsMap = {};

    tournamentTeams.forEach((team) => {
      const groupName = team.group_name || "Ungrouped";

      if (!groupsMap[groupName]) {
        groupsMap[groupName] = {};
      }

      groupsMap[groupName][team.id] = {
        team_id: team.id,
        team_name: team.company_name || team.team_name,
        logo_url: team.logo_url || "",
        group_name: groupName,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        form: [],
      };
    });

    groupMatches.forEach((match) => {
      const groupName = match.group_name || "Ungrouped";

      if (!groupsMap[groupName]) return;

      const home = groupsMap[groupName][match.team_a_id];
      const away = groupsMap[groupName][match.team_b_id];

      if (!home || !away) return;

      const homeGoals = Number(match.team_a_score || 0);
      const awayGoals = Number(match.team_b_score || 0);

      home.mp += 1;
      away.mp += 1;

      home.gf += homeGoals;
      home.ga += awayGoals;

      away.gf += awayGoals;
      away.ga += homeGoals;

      if (homeGoals > awayGoals) {
        home.w += 1;
        away.l += 1;
        home.pts += 3;
        home.form.push("W");
        away.form.push("L");
      } else if (homeGoals < awayGoals) {
        away.w += 1;
        home.l += 1;
        away.pts += 3;
        away.form.push("W");
        home.form.push("L");
      } else {
        home.d += 1;
        away.d += 1;
        home.pts += 1;
        away.pts += 1;
        home.form.push("D");
        away.form.push("D");
      }
    });

    Object.keys(groupsMap).forEach((groupName) => {
      Object.values(groupsMap[groupName]).forEach((team) => {
        team.gd = team.gf - team.ga;
        team.form = team.form.slice(-5).reverse();
      });
    });

    const sortedGroups = {};

    Object.keys(groupsMap)
      .sort()
      .forEach((groupName) => {
        sortedGroups[groupName] = Object.values(groupsMap[groupName]).sort(
          (a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.team_name.localeCompare(b.team_name);
          }
        );
      });

    return sortedGroups;
  }, [tournamentTeams, groupMatches]);

  useEffect(() => {
    const nextState = {};
    Object.keys(groupedStandings).forEach((groupName) => {
      nextState[groupName] = true;
    });
    setOpenGroups(nextState);
  }, [selectedTournamentId, groupedStandings]);

  const totalGroups = Object.keys(groupedStandings).length;
  const totalFinishedMatches = groupMatches.length;
  const totalTeams = tournamentTeams.length;

  const toggleGroup = (groupName) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const renderLogo = (team) => {
    return (
      <div style={logoWrapStyle}>
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.team_name}
            style={logoImageStyle}
          />
        ) : (
          <span style={logoFallbackStyle}>
            {team.team_name?.charAt(0)?.toUpperCase() || "T"}
          </span>
        )}
      </div>
    );
  };

  const getFormStyle = (value) => {
    if (value === "W") {
      return { background: "#16a34a", color: "#fff" };
    }
    if (value === "D") {
      return { background: "#f59e0b", color: "#fff" };
    }
    return { background: "#dc2626", color: "#fff" };
  };

  const getTeamNameById = (teamId) => {
    const team = teams.find((t) => String(t.id) === String(teamId));
    return team ? team.company_name || team.team_name || "TBD" : "TBD";
  };

  const getTeamLogoById = (teamId) => {
    const team = teams.find((t) => String(t.id) === String(teamId));
    return team?.logo_url || "";
  };

  const getPlayerNameById = (playerId) => {
    const player = players.find((p) => String(p.id) === String(playerId));
    return player?.full_name || "Unknown";
  };

  const topScorers = useMemo(() => {
    const goalsInTournament = goals.filter((goal) => {
      const player = players.find((p) => String(p.id) === String(goal.player_id));
      if (!player) return false;
      return tournamentTeamIds.includes(player.team_id);
    });

    const scorerMap = {};

    goalsInTournament.forEach((goal) => {
      const key = String(goal.player_id);
      if (!scorerMap[key]) {
        const player = players.find((p) => String(p.id) === key);
        scorerMap[key] = {
          player_id: key,
          full_name: getPlayerNameById(key),
          team_name: player ? getTeamNameById(player.team_id) : "-",
          team_logo: player ? getTeamLogoById(player.team_id) : "",
          goals: 0,
        };
      }
      scorerMap[key].goals += 1;
    });

    return Object.values(scorerMap)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  }, [goals, players, tournamentTeamIds]);

  const visibleKnockoutMatches = useMemo(() => {
    return knockoutMatches
      .filter((match) => match.stage === activeDrawStage)
      .sort((a, b) => {
        const aDate = new Date(
          `${a.match_date || "1970-01-01"}T${a.match_time || "00:00"}`
        ).getTime();
        const bDate = new Date(
          `${b.match_date || "1970-01-01"}T${b.match_time || "00:00"}`
        ).getTime();
        return aDate - bDate;
      });
  }, [knockoutMatches, activeDrawStage]);

  const winnersData = useMemo(() => {
    const finalMatch = knockoutMatches.find((m) => m.stage === "final");
    const thirdPlaceMatch = knockoutMatches.find((m) => m.stage === "third_place");

    let champion = null;
    let runnerUp = null;
    let thirdPlace = null;

    if (finalMatch?.winner_team_id) {
      champion = {
        label: "Champion",
        team_id: finalMatch.winner_team_id,
      };

      const loserId =
        String(finalMatch.winner_team_id) === String(finalMatch.team_a_id)
          ? finalMatch.team_b_id
          : finalMatch.team_a_id;

      if (loserId) {
        runnerUp = {
          label: "Runner-up",
          team_id: loserId,
        };
      }
    }

    if (thirdPlaceMatch?.winner_team_id) {
      thirdPlace = {
        label: "Third Place",
        team_id: thirdPlaceMatch.winner_team_id,
      };
    }

    return [champion, runnerUp, thirdPlace].filter(Boolean);
  }, [knockoutMatches]);

  const renderMobileTeamCard = (team, index) => {
    return (
      <div
        key={team.team_id}
        style={{
          ...mobileTeamCardStyle,
          background: index < 2 ? "#f7fbff" : "#fff",
        }}
      >
        <div style={mobileTeamTopStyle}>
          <div style={mobileRankWrapStyle}>
            <div
              style={{
                ...mobileRankStyle,
                background: index < 2 ? "#0b4d8d" : "#eef2f7",
                color: index < 2 ? "#fff" : "#111827",
              }}
            >
              {index + 1}
            </div>
          </div>

          <div style={mobileTeamMainStyle}>
            <div style={mobileTeamIdentityStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {renderLogo(team)}
                <div style={mobileTeamNameStyle}>{team.team_name}</div>
              </div>

              <div style={mobilePointsStyle}>{team.pts} pts</div>
            </div>

            <div style={mobileCompactStatsRowStyle}>
              <span style={mobileCompactStatStyle}>GP: {team.mp}</span>
              <span style={mobileCompactStatStyle}>
                G: {team.gf}:{team.ga}
              </span>
              <span style={mobileCompactStatStyle}>PTS: {team.pts}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDrawMatchCard = (match) => {
    const teamAName = getTeamNameById(match.team_a_id);
    const teamBName = getTeamNameById(match.team_b_id);
    const teamALogo = getTeamLogoById(match.team_a_id);
    const teamBLogo = getTeamLogoById(match.team_b_id);

    const teamAScore = match.team_a_score ?? 0;
    const teamBScore = match.team_b_score ?? 0;
    const teamAPenalties = match.team_a_penalties ?? null;
    const teamBPenalties = match.team_b_penalties ?? null;

    const showPenalties =
      teamAPenalties !== null &&
      teamAPenalties !== undefined &&
      teamBPenalties !== null &&
      teamBPenalties !== undefined;

    const winnerName = match.winner_team_id
      ? getTeamNameById(match.winner_team_id)
      : null;

    return (
      <button
        key={match.id}
        type="button"
        onClick={() => navigate(`/matches/${match.id}`)}
        style={drawMatchCardButtonStyle}
        className="draw-match-mobile"
      >
        <div style={drawMatchCardStyle}>
          <div style={drawMetaBarStyle}>
            <span>{match.match_date || "-"}</span>
            <span>{match.match_time || "-"}</span>
            <span>{match.field || "No field"}</span>
          </div>

          <div style={drawTeamsWrapStyle}>
            <div style={drawTeamRowStyle}>
              <div style={drawTeamLeftStyle}>
                <div style={logoWrapStyle}>
                  {teamALogo ? (
                    <img src={teamALogo} alt={teamAName} style={logoImageStyle} />
                  ) : (
                    <span style={logoFallbackStyle}>
                      {teamAName?.charAt(0)?.toUpperCase() || "T"}
                    </span>
                  )}
                </div>
                <span style={drawTeamNameStyle} className="draw-team-name-mobile">
                  {teamAName}
                </span>
              </div>
              <span style={drawScoreStyle} className="draw-score-mobile">
                {teamAScore}
                {showPenalties && ` (${teamAPenalties})`}
              </span>
            </div>

            <div style={drawTeamRowStyle}>
              <div style={drawTeamLeftStyle}>
                <div style={logoWrapStyle}>
                  {teamBLogo ? (
                    <img src={teamBLogo} alt={teamBName} style={logoImageStyle} />
                  ) : (
                    <span style={logoFallbackStyle}>
                      {teamBName?.charAt(0)?.toUpperCase() || "T"}
                    </span>
                  )}
                </div>
                <span style={drawTeamNameStyle} className="draw-team-name-mobile">
                  {teamBName}
                </span>
              </div>
              <span style={drawScoreStyle} className="draw-score-mobile">
                {teamBScore}
                {showPenalties && ` (${teamBPenalties})`}
              </span>
            </div>

            {winnerName && (
              <div style={drawWinnerBadgeStyle}>
                Winner: {winnerName}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderWinnerCard = (item, index) => {
    const teamName = getTeamNameById(item.team_id);
    const teamLogo = getTeamLogoById(item.team_id);

    const accentMap = {
      Champion: "#f59e0b",
      "Runner-up": "#64748b",
      "Third Place": "#b45309",
    };

    const softMap = {
      Champion: "rgba(245,158,11,0.12)",
      "Runner-up": "rgba(100,116,139,0.12)",
      "Third Place": "rgba(180,83,9,0.12)",
    };

    return (
      <div key={`${item.label}-${item.team_id}`} style={winnerCardStyle}>
        <div style={winnerLeftStyle}>
          <div
            style={{
              ...winnerBadgeIconStyle,
              background: softMap[item.label] || "rgba(20,118,182,0.12)",
              color: accentMap[item.label] || "#1476b6",
            }}
          >
            <Medal size={18} />
          </div>

          <div style={winnerIdentityStyle}>
            <div style={winnerLabelStyle}>{item.label}</div>
            <div style={winnerTeamWrapStyle}>
              <div style={logoWrapStyle}>
                {teamLogo ? (
                  <img src={teamLogo} alt={teamName} style={logoImageStyle} />
                ) : (
                  <span style={logoFallbackStyle}>
                    {teamName?.charAt(0)?.toUpperCase() || "T"}
                  </span>
                )}
              </div>
              <span style={winnerTeamNameStyle}>{teamName}</span>
            </div>
          </div>
        </div>

        <div style={winnerRankBoxStyle}>{index + 1}</div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .standings-page {
              padding: 14px !important;
            }

            .standings-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .standings-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .standings-stats-grid {
              grid-template-columns: 1fr !important;
            }

            .standings-filter-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .standings-select {
              width: 100% !important;
              min-width: 100% !important;
            }

            .standings-tab-row {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 6px !important;
            }

            .standings-tab-row button {
              padding: 8px 6px !important;
              font-size: 11px !important;
              border-radius: 10px !important;
              white-space: nowrap !important;
            }

            .standings-subtab-row {
              flex-wrap: wrap !important;
            }

            .desktop-standings-table {
              display: none !important;
            }

            .mobile-standings-list {
              display: grid !important;
            }

            .draw-stage-wrap {
              gap: 10px !important;
            }

            .draw-match-mobile {
              border-radius: 12px !important;
            }

            .draw-team-name-mobile {
              font-size: 14px !important;
            }

            .draw-score-mobile {
              font-size: 18px !important;
            }

            .draw-subtabs-mobile {
              gap: 8px !important;
              flex-wrap: wrap !important;
            }

            .draw-subtabs-mobile button {
              padding: 8px 12px !important;
              font-size: 13px !important;
            }
          }

          @media (min-width: 769px) {
            .mobile-standings-list {
              display: none !important;
            }

            .desktop-standings-table {
              display: block !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="standings-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="standings-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="standings-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Standings</h1>
                <p style={heroTextStyle}>
                  Track tournament groups, rankings, points, knockout stages,
                  top scorers, and final winners in one clean dashboard.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <BarChart3 size={16} />
                Live Rankings
              </div>
            </div>
          </div>

          <div style={statsGridStyle} className="standings-stats-grid">
            <MiniStatCard
              icon={<Trophy size={18} />}
              title="Tournament"
              value={selectedTournament ? "Selected" : "None"}
              accent="#1476b6"
              soft="rgba(20,118,182,0.10)"
            />
            <MiniStatCard
              icon={<Users size={18} />}
              title="Teams"
              value={totalTeams}
              accent="#109847"
              soft="rgba(16,152,71,0.10)"
            />
            <MiniStatCard
              icon={<Shield size={18} />}
              title="Finished Matches"
              value={totalFinishedMatches}
              accent="#cf2136"
              soft="rgba(207,33,54,0.10)"
            />
            <MiniStatCard
              icon={<BarChart3 size={18} />}
              title="Groups"
              value={totalGroups}
              accent="#7c3aed"
              soft="rgba(124,58,237,0.10)"
            />
          </div>

          <div style={filterCardStyle}>
            <div style={filterRowStyle} className="standings-filter-row">
              <div>
                <div style={sectionTitleStyle}>Select Tournament</div>
                <div style={sectionSubtitleStyle}>
                  {userRole === "team_manager"
                    ? "You are viewing the tournament linked to your team"
                    : "Choose a tournament to view standings, draw, scorers, and winners"}
                </div>
              </div>

              {userRole !== "team_manager" ? (
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  style={selectStyle}
                  className="standings-select"
                >
                  <option value="">Select tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={fixedTournamentBoxStyle}>
                  {selectedTournament?.name || "Your Tournament"}
                </div>
              )}
            </div>

            {selectedTournament && (
              <div style={selectedTournamentBadgeStyle}>
                <Trophy size={14} />
                {selectedTournament.name}
              </div>
            )}

            <div style={tabsRowStyle} className="standings-tab-row">
              <button
                type="button"
                onClick={() => setActiveTab("overall")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "overall" ? activeTabStyle : {}),
                }}
              >
                Overall
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("draw")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "draw" ? activeTabStyle : {}),
                }}
              >
                Draw
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("scorers")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "scorers" ? activeTabStyle : {}),
                }}
              >
                Top Scorers
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("winners")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "winners" ? activeTabStyle : {}),
                }}
              >
                Winners
              </button>
            </div>

            {activeTab === "draw" && (
              <div
                style={subTabsRowStyle}
                className="standings-subtab-row draw-subtabs-mobile"
              >
                <button
                  type="button"
                  onClick={() => setActiveDrawStage("quarterfinal")}
                  style={{
                    ...subTabButtonStyle,
                    ...(activeDrawStage === "quarterfinal" ? activeSubTabStyle : {}),
                  }}
                >
                  Quarter-Finals
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawStage("semifinal")}
                  style={{
                    ...subTabButtonStyle,
                    ...(activeDrawStage === "semifinal" ? activeSubTabStyle : {}),
                  }}
                >
                  Semi-Finals
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawStage("third_place")}
                  style={{
                    ...subTabButtonStyle,
                    ...(activeDrawStage === "third_place" ? activeSubTabStyle : {}),
                  }}
                >
                  Third Place
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawStage("final")}
                  style={{
                    ...subTabButtonStyle,
                    ...(activeDrawStage === "final" ? activeSubTabStyle : {}),
                  }}
                >
                  Final
                </button>
              </div>
            )}
          </div>

          {activeTab === "overall" && (
            <div style={{ display: "grid", gap: "22px" }}>
              {Object.keys(groupedStandings).length === 0 ? (
                <div style={emptyStateStyle}>No group standings available yet.</div>
              ) : (
                Object.entries(groupedStandings).map(([groupName, standings]) => (
                  <div key={groupName} style={groupCardStyle}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupName)}
                      style={groupHeaderButtonStyle}
                    >
                      <div style={groupHeaderLeftStyle}>
                        <div style={groupHeaderIconStyle}>
                          <Trophy size={16} />
                        </div>
                        <div>
                          <div style={groupTitleStyle}>Group {groupName}</div>
                          <div style={groupSubtitleStyle}>
                            {standings.length} teams ranked
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          ...groupChevronWrapStyle,
                          transform: openGroups[groupName]
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {openGroups[groupName] && (
                      <>
                        <div className="desktop-standings-table">
                          <div style={tableHeaderStyle}>
                            <div>#</div>
                            <div>Team</div>
                            <div style={{ textAlign: "center" }}>MP</div>
                            <div style={{ textAlign: "center" }}>W</div>
                            <div style={{ textAlign: "center" }}>D</div>
                            <div style={{ textAlign: "center" }}>L</div>
                            <div style={{ textAlign: "center" }}>G</div>
                            <div style={{ textAlign: "center" }}>GD</div>
                            <div style={{ textAlign: "center" }}>PTS</div>
                            <div style={{ textAlign: "center" }}>Form</div>
                          </div>

                          {standings.map((team, index) => (
                            <div
                              key={team.team_id}
                              style={{
                                ...tableRowStyle,
                                background: index < 2 ? "#f7fbff" : "#fff",
                                borderBottom:
                                  index !== standings.length - 1
                                    ? "1px solid #eef0f2"
                                    : "none",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    ...rankBoxStyle,
                                    background: index < 2 ? "#0b4d8d" : "#eef2f7",
                                    color: index < 2 ? "#fff" : "#111827",
                                  }}
                                >
                                  {index + 1}
                                </div>
                              </div>

                              <div style={teamCellStyle}>
                                {renderLogo(team)}
                                <span style={teamCellNameStyle}>
                                  {team.team_name}
                                </span>
                              </div>

                              <div style={{ textAlign: "center" }}>{team.mp}</div>
                              <div style={{ textAlign: "center" }}>{team.w}</div>
                              <div style={{ textAlign: "center" }}>{team.d}</div>
                              <div style={{ textAlign: "center" }}>{team.l}</div>
                              <div style={{ textAlign: "center" }}>
                                {team.gf}:{team.ga}
                              </div>
                              <div style={{ textAlign: "center" }}>{team.gd}</div>
                              <div style={pointsCellStyle}>{team.pts}</div>

                              <div style={formWrapStyle}>
                                {team.form.length === 0 ? (
                                  <div
                                    style={{
                                      ...formBoxStyle,
                                      background: "#d1d5db",
                                      color: "#fff",
                                    }}
                                  >
                                    -
                                  </div>
                                ) : (
                                  team.form.map((item, idx) => (
                                    <div
                                      key={`${team.team_id}-${idx}`}
                                      style={{
                                        ...formBoxStyle,
                                        ...getFormStyle(item),
                                      }}
                                    >
                                      {item}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mobile-standings-list">
                          <div style={mobileListWrapStyle}>
                            {standings.map((team, index) =>
                              renderMobileTeamCard(team, index)
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "draw" && (
            <div
              style={{ display: "grid", gap: "12px" }}
              className="draw-stage-wrap"
            >
              {visibleKnockoutMatches.length === 0 ? (
                <div style={emptyStateStyle}>No matches available for this stage yet.</div>
              ) : (
                visibleKnockoutMatches.map((match) => renderDrawMatchCard(match))
              )}
            </div>
          )}

          {activeTab === "scorers" && (
            <div style={scorersCardStyle}>
              <div style={scorersHeaderStyle}>
                <div style={groupHeaderLeftStyle}>
                  <div style={groupHeaderIconStyle}>
                    <Goal size={16} />
                  </div>
                  <div>
                    <div style={groupTitleStyle}>Top Scorers</div>
                    <div style={groupSubtitleStyle}>
                      Ranking by goals scored
                    </div>
                  </div>
                </div>
              </div>

              {topScorers.length === 0 ? (
                <div style={emptyStateStyle}>No scorers available yet.</div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {topScorers.map((scorer, index) => (
                    <div key={scorer.player_id} style={scorerRowStyle}>
                      <div style={scorerLeftStyle}>
                        <div
                          style={{
                            ...rankBoxStyle,
                            background: index < 3 ? "#0b4d8d" : "#eef2f7",
                            color: index < 3 ? "#fff" : "#111827",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div style={logoWrapStyle}>
                          {scorer.team_logo ? (
                            <img
                              src={scorer.team_logo}
                              alt={scorer.team_name}
                              style={logoImageStyle}
                            />
                          ) : (
                            <span style={logoFallbackStyle}>
                              {scorer.team_name?.charAt(0)?.toUpperCase() || "T"}
                            </span>
                          )}
                        </div>

                        <div>
                          <div style={scorerNameStyle}>{scorer.full_name}</div>
                          <div style={scorerTeamStyle}>{scorer.team_name}</div>
                        </div>
                      </div>

                      <div style={scorerGoalsBoxStyle}>
                        {scorer.goals}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "winners" && (
            <div style={winnersCardStyle}>
              <div style={scorersHeaderStyle}>
                <div style={groupHeaderLeftStyle}>
                  <div style={groupHeaderIconStyle}>
                    <Medal size={16} />
                  </div>
                  <div>
                    <div style={groupTitleStyle}>Winners</div>
                    <div style={groupSubtitleStyle}>
                      Champion, Runner-up, and Third Place
                    </div>
                  </div>
                </div>
              </div>

              {winnersData.length === 0 ? (
                <div style={emptyStateStyle}>
                  Final and third place results are not ready yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {winnersData.map((item, index) => renderWinnerCard(item, index))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MiniStatCard({ icon, title, value, accent, soft }) {
  return (
    <div style={miniStatCardStyle}>
      <div style={miniStatTopStyle}>
        <div>
          <div style={miniStatTitleStyle}>{title}</div>
          <div style={miniStatValueStyle}>{value}</div>
        </div>

        <div
          style={{
            ...miniStatIconWrapStyle,
            color: accent,
            background: soft,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          ...miniStatBottomBarStyle,
          background: accent,
        }}
      />
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const miniStatCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const miniStatTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
};

const miniStatTitleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "700",
};

const miniStatValueStyle = {
  fontSize: "28px",
  fontWeight: "900",
  color: "#111827",
  marginTop: "8px",
};

const miniStatIconWrapStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const miniStatBottomBarStyle = {
  height: "5px",
  borderRadius: "999px",
  marginTop: "18px",
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

const fixedTournamentBoxStyle = {
  minWidth: "280px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(20,118,182,0.15)",
  background: "rgba(20,118,182,0.08)",
  color: "#1476b6",
  fontWeight: "700",
  boxSizing: "border-box",
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

const tabsRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
};

const tabButtonStyle = {
  padding: "10px 16px",
  borderRadius: "999px",
  border: "none",
  fontWeight: "800",
  cursor: "pointer",
  background: "#eef2f7",
  color: "#334155",
};

const activeTabStyle = {
  background: "#ff1455",
  color: "#fff",
};

const subTabsRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "14px",
};

const subTabButtonStyle = {
  padding: "9px 14px",
  borderRadius: "999px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
  background: "#f3f4f6",
  color: "#334155",
};

const activeSubTabStyle = {
  background: "#1476b6",
  color: "#fff",
};

const groupCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const groupHeaderButtonStyle = {
  width: "100%",
  background: "#eef4fb",
  border: "none",
  borderBottom: "1px solid #e5e7eb",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  cursor: "pointer",
};

const groupHeaderLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const groupHeaderIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  background: "#fff",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #dbe7f4",
};

const groupTitleStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#111827",
  textAlign: "left",
};

const groupSubtitleStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
  textAlign: "left",
};

const groupChevronWrapStyle = {
  color: "#6b7280",
  transition: "transform 0.2s ease",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns:
    "55px 1.8fr 70px 55px 55px 55px 90px 70px 80px 200px",
  alignItems: "center",
  padding: "12px 14px",
  background: "#f3f4f6",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "13px",
  fontWeight: "700",
  color: "#111827",
  textTransform: "uppercase",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "55px 1.8fr 70px 55px 55px 55px 90px 70px 80px 200px",
  alignItems: "center",
  padding: "12px 14px",
};

const rankBoxStyle = {
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "16px",
};

const teamCellStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const teamCellNameStyle = {
  fontWeight: "700",
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const pointsCellStyle = {
  textAlign: "center",
  fontWeight: "800",
  color: "#111827",
};

const formWrapStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "6px",
};

const formBoxStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "13px",
};

const logoWrapStyle = {
  width: "22px",
  height: "22px",
  minWidth: "22px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const logoFallbackStyle = {
  fontSize: "10px",
  fontWeight: "700",
  color: "#6b7280",
};

const mobileListWrapStyle = {
  display: "grid",
  gap: "12px",
  padding: "12px",
};

const mobileTeamCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px",
};

const mobileTeamTopStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
};

const mobileRankWrapStyle = {
  flexShrink: 0,
};

const mobileRankStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "15px",
};

const mobileTeamMainStyle = {
  flex: 1,
  minWidth: 0,
};

const mobileTeamIdentityStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const mobileTeamNameStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#111827",
};

const mobilePointsStyle = {
  fontSize: "13px",
  color: "#1476b6",
  fontWeight: "800",
};

const mobileCompactStatsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "12px",
  flexWrap: "wrap",
};

const mobileCompactStatStyle = {
  fontSize: "13px",
  color: "#374151",
  fontWeight: "700",
};

const drawMatchCardButtonStyle = {
  padding: 0,
  background: "transparent",
  border: "none",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
};

const drawMatchCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const drawMetaBarStyle = {
  padding: "8px 12px",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
};

const drawTeamsWrapStyle = {
  padding: "10px 12px",
  display: "grid",
  gap: "8px",
};

const drawTeamRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const drawTeamLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  flex: 1,
};

const drawTeamNameStyle = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#111827",
  lineHeight: "1.2",
};

const drawScoreStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#111827",
  minWidth: "18px",
  textAlign: "right",
};

const drawWinnerBadgeStyle = {
  marginTop: "6px",
  width: "fit-content",
  background: "rgba(16,152,71,0.10)",
  color: "#109847",
  border: "1px solid rgba(16,152,71,0.18)",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: "800",
};

const scorersCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const winnersCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const scorersHeaderStyle = {
  marginBottom: "16px",
};

const scorerRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "12px 14px",
  background: "#fafafa",
};

const scorerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const scorerNameStyle = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#111827",
};

const scorerTeamStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "3px",
};

const scorerGoalsBoxStyle = {
  minWidth: "46px",
  height: "46px",
  borderRadius: "12px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "20px",
};

const winnerCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px 16px",
  background: "#fafafa",
};

const winnerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0,
};

const winnerBadgeIconStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const winnerIdentityStyle = {
  display: "grid",
  gap: "6px",
};

const winnerLabelStyle = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const winnerTeamWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const winnerTeamNameStyle = {
  fontSize: "17px",
  fontWeight: "800",
  color: "#111827",
};

const winnerRankBoxStyle = {
  minWidth: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "18px",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  color: "#6b7280",
};

export default Standings;