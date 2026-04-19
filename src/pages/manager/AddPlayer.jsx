import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  Users,
  UserPlus,
  Shield,
  Trophy,
  Pencil,
  Trash2,
  Camera,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Search,
  Filter,
  Lock,
} from "lucide-react";

function AddPlayer() {
  const [searchParams] = useSearchParams();
  const selectedTeamIdFromUrl = searchParams.get("teamId");

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [editingPlayerId, setEditingPlayerId] = useState(null);

  const [tournamentId, setTournamentId] = useState("");
  const [teamId, setTeamId] = useState(selectedTeamIdFromUrl || "");
  const [fullName, setFullName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [role, setRole] = useState("");
  const [age, setAge] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);

  const [userRole, setUserRole] = useState(null);
  const [fixedTournamentId, setFixedTournamentId] = useState("");
  const [fixedTeamId, setFixedTeamId] = useState("");

  const [listTournamentId, setListTournamentId] = useState("");
  const [listTeamId, setListTeamId] = useState(selectedTeamIdFromUrl || "");
  const [listSearch, setListSearch] = useState("");
  const [listRole, setListRole] = useState("");

  const COUNTED_ROLES = ["player", "goalkeeper"];

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
    fetchPlayers();
    loadUserContext();
  }, []);

  useEffect(() => {
    if (
      !selectedTeamIdFromUrl ||
      teams.length === 0 ||
      userRole === "team_manager"
    ) {
      return;
    }

    const selectedTeamFromUrl = teams.find(
      (team) => String(team.id) === String(selectedTeamIdFromUrl)
    );

    if (selectedTeamFromUrl) {
      setTeamId(selectedTeamFromUrl.id);
      setListTeamId(selectedTeamFromUrl.id);
      setTournamentId(selectedTeamFromUrl.tournament_id || "");
      setListTournamentId(selectedTeamFromUrl.tournament_id || "");
    }
  }, [selectedTeamIdFromUrl, teams, userRole]);

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

    if (profile.role === "team_manager" && profile.team_id) {
      setFixedTeamId(profile.team_id);
      setTeamId(profile.team_id);
      setListTeamId(profile.team_id);

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("tournament_id")
        .eq("id", profile.team_id)
        .maybeSingle();

      if (teamError) {
        console.error("Error fetching manager team:", teamError.message);
        return;
      }

      if (teamData?.tournament_id) {
        setFixedTournamentId(teamData.tournament_id);
        setTournamentId(teamData.tournament_id);
        setListTournamentId(teamData.tournament_id);
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
      .select(`
        *,
        tournaments (
          id,
          name,
          min_players,
          max_players,
          start_date
        )
      `)
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
      .select(`
        *,
        teams (
          id,
          team_name,
          company_name,
          tournament_id,
          tournaments (
            id,
            name,
            min_players,
            max_players,
            start_date
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching players:", error.message);
      return;
    }

    setPlayers(data || []);
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(
      (team) => String(team.tournament_id) === String(tournamentId)
    );
  }, [teams, tournamentId]);

  const selectedTeam = useMemo(() => {
    return teams.find((team) => String(team.id) === String(teamId)) || null;
  }, [teams, teamId]);

  const selectedTournament = useMemo(() => {
    if (!selectedTeam) {
      return (
        tournaments.find((t) => String(t.id) === String(tournamentId)) || null
      );
    }

    return (
      tournaments.find(
        (t) => String(t.id) === String(selectedTeam.tournament_id)
      ) ||
      selectedTeam.tournaments ||
      null
    );
  }, [selectedTeam, tournaments, tournamentId]);

  const selectedTeamPlayers = useMemo(() => {
    return players.filter(
      (player) =>
        String(player.team_id) === String(teamId) &&
        COUNTED_ROLES.includes(String(player.role || "").toLowerCase())
    );
  }, [players, teamId]);

  const baseVisiblePlayers = useMemo(() => {
    if (userRole === "team_manager" && fixedTeamId) {
      return players.filter(
        (player) => String(player.team_id) === String(fixedTeamId)
      );
    }

    if (selectedTeamIdFromUrl) {
      return players.filter(
        (player) => String(player.team_id) === String(selectedTeamIdFromUrl)
      );
    }

    return players;
  }, [players, userRole, fixedTeamId, selectedTeamIdFromUrl]);

  const listFilteredTeams = useMemo(() => {
    if (userRole === "team_manager") {
      return teams.filter((team) => String(team.id) === String(fixedTeamId));
    }

    if (selectedTeamIdFromUrl) {
      return teams.filter(
        (team) => String(team.id) === String(selectedTeamIdFromUrl)
      );
    }

    if (!listTournamentId) return [];

    return teams.filter(
      (team) => String(team.tournament_id) === String(listTournamentId)
    );
  }, [teams, userRole, fixedTeamId, listTournamentId, selectedTeamIdFromUrl]);

  const visiblePlayers = useMemo(() => {
    let result = [...baseVisiblePlayers];

    if (userRole !== "team_manager" && listTournamentId) {
      result = result.filter(
        (player) =>
          String(player.teams?.tournament_id) === String(listTournamentId)
      );
    }

    if (userRole === "team_manager") {
      result = result.filter(
        (player) => String(player.team_id) === String(fixedTeamId)
      );
    } else if (listTeamId) {
      result = result.filter(
        (player) => String(player.team_id) === String(listTeamId)
      );
    }

    if (listRole) {
      result = result.filter(
        (player) => String(player.role || "") === String(listRole)
      );
    }

    if (listSearch.trim()) {
      const q = listSearch.trim().toLowerCase();
      result = result.filter((player) =>
        String(player.full_name || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [
    baseVisiblePlayers,
    userRole,
    listTournamentId,
    listTeamId,
    listRole,
    listSearch,
    fixedTeamId,
  ]);

  const countedVisiblePlayers = useMemo(() => {
    return visiblePlayers.filter((player) =>
      COUNTED_ROLES.includes(String(player.role || "").toLowerCase())
    );
  }, [visiblePlayers]);

  const currentTeamCount = selectedTeamPlayers.length;
  const minPlayersRequired = selectedTournament?.min_players ?? null;
  const maxPlayersAllowed = selectedTournament?.max_players ?? null;

  const isTeamBelowMinimum =
    teamId &&
    minPlayersRequired !== null &&
    Number(currentTeamCount) < Number(minPlayersRequired);

  const isTeamAtMaximum =
    teamId &&
    maxPlayersAllowed !== null &&
    Number(currentTeamCount) >= Number(maxPlayersAllowed);

  const remainingSpots =
    maxPlayersAllowed !== null
      ? Math.max(0, Number(maxPlayersAllowed) - Number(currentTeamCount))
      : null;

  const todayString = new Date().toISOString().split("T")[0];
  const tournamentStarted =
    !!selectedTournament?.start_date &&
    String(selectedTournament.start_date) <= todayString;

  const teamManagerLocked = userRole === "team_manager" && tournamentStarted;

  const isOrganizer = userRole === "organizer";
  const isStaff = userRole === "staff";
  const isTeamManager = userRole === "team_manager";

  const canEditPlayers =
    isOrganizer || isStaff || (isTeamManager && !teamManagerLocked);

  const canDeletePlayers = isOrganizer || isStaff;

  const resetForm = () => {
    setEditingPlayerId(null);

    if (userRole === "team_manager") {
      setTournamentId(fixedTournamentId);
      setTeamId(fixedTeamId);
    } else if (selectedTeamIdFromUrl) {
      const urlTeam = teams.find(
        (team) => String(team.id) === String(selectedTeamIdFromUrl)
      );
      setTeamId(selectedTeamIdFromUrl);
      setTournamentId(urlTeam?.tournament_id || "");
    } else {
      setTournamentId("");
      setTeamId("");
    }

    setFullName("");
    setJerseyNumber("");
    setRole("");
    setAge("");
    setPhotoFile(null);
  };

  const clearFilters = () => {
    if (userRole === "team_manager") {
      setListTournamentId(fixedTournamentId);
      setListTeamId(fixedTeamId);
    } else if (selectedTeamIdFromUrl) {
      const urlTeam = teams.find(
        (team) => String(team.id) === String(selectedTeamIdFromUrl)
      );
      setListTournamentId(urlTeam?.tournament_id || "");
      setListTeamId(selectedTeamIdFromUrl);
    } else {
      setListTournamentId("");
      setListTeamId("");
    }

    setListSearch("");
    setListRole("");
  };

  const uploadPhoto = async (file) => {
    if (!file) return null;

    const cleanName = file.name.replace(/\s+/g, "-");
    const fileName = `${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("player-photos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      alert("Failed to upload player photo");
      return null;
    }

    const { data } = supabase.storage
      .from("player-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canEditPlayers) {
      alert(
        "Player registration is locked because the tournament has already started."
      );
      return;
    }

    if (!tournamentId) {
      alert("Please select a tournament");
      return;
    }

    if (!teamId) {
      alert("Please select a team");
      return;
    }

    if (!fullName.trim()) {
      alert("Please enter player name");
      return;
    }

    if (!role) {
      alert("Please select a role");
      return;
    }

    const currentSelectedTeam = teams.find(
      (team) => String(team.id) === String(teamId)
    );

    const currentTournament =
      tournaments.find(
        (t) => String(t.id) === String(currentSelectedTeam?.tournament_id)
      ) || currentSelectedTeam?.tournaments;

    const teamPlayers = players.filter(
      (player) =>
        String(player.team_id) === String(teamId) &&
        COUNTED_ROLES.includes(String(player.role || "").toLowerCase())
    );

    const isCountedRole = COUNTED_ROLES.includes(
      String(role || "").toLowerCase()
    );
    const currentCount = teamPlayers.length;
    const maxAllowed = currentTournament?.max_players ?? null;

    const currentEditingPlayer = editingPlayerId
      ? players.find((p) => p.id === editingPlayerId)
      : null;

    const wasCountedRole = COUNTED_ROLES.includes(
      String(currentEditingPlayer?.role || "").toLowerCase()
    );

    if (
      !editingPlayerId &&
      isCountedRole &&
      maxAllowed !== null &&
      Number(currentCount) >= Number(maxAllowed)
    ) {
      alert("This team already reached the maximum number allowed.");
      return;
    }

    if (editingPlayerId && maxAllowed !== null) {
      let nextCount = currentCount;

      if (wasCountedRole && !isCountedRole) {
        nextCount = currentCount - 1;
      } else if (!wasCountedRole && isCountedRole) {
        nextCount = currentCount + 1;
      }

      if (Number(nextCount) > Number(maxAllowed)) {
        alert("This team already reached the maximum number allowed.");
        return;
      }
    }

    setLoading(true);

    let photoUrl = null;

    if (editingPlayerId) {
      const currentPlayer = players.find((p) => p.id === editingPlayerId);
      photoUrl = currentPlayer?.photo_url || null;
    }

    if (photoFile) {
      const uploadedPhotoUrl = await uploadPhoto(photoFile);

      if (!uploadedPhotoUrl) {
        setLoading(false);
        return;
      }

      photoUrl = uploadedPhotoUrl;
    }

    const payload = {
      team_id: teamId,
      full_name: fullName.trim(),
      jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
      role,
      age: age ? Number(age) : null,
      photo_url: photoUrl,
    };

    if (editingPlayerId) {
      const { error } = await supabase
        .from("players")
        .update(payload)
        .eq("id", editingPlayerId);

      if (error) {
        console.error("Error updating player:", error.message);
        alert("Failed to update player");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("players").insert([payload]);

      if (error) {
        console.error("Error adding player:", error.message);
        alert("Failed to add player");
        setLoading(false);
        return;
      }
    }

    resetForm();
    await fetchPlayers();
    setLoading(false);
    setShowPlayerForm(false);
  };

  const handleEdit = (player) => {
    if (!canEditPlayers) {
      alert(
        "Player registration is locked because the tournament has already started."
      );
      return;
    }

    setEditingPlayerId(player.id);
    setTournamentId(
      userRole === "team_manager"
        ? fixedTournamentId
        : player.teams?.tournament_id || ""
    );
    setTeamId(userRole === "team_manager" ? fixedTeamId : player.team_id || "");
    setFullName(player.full_name || "");
    setJerseyNumber(player.jersey_number || "");
    setRole(player.role || "");
    setAge(player.age || "");
    setPhotoFile(null);
    setShowPlayerForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!canDeletePlayers) {
      alert("Only organizer and staff can delete players.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this player?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("players").delete().eq("id", id);

    if (error) {
      console.error("Error deleting player:", error.message);
      alert("Failed to delete player");
      return;
    }

    if (editingPlayerId === id) {
      resetForm();
    }

    await fetchPlayers();
  };

  const handleDeleteAllPlayers = async () => {
    if (!canDeletePlayers) {
      alert("Only organizer and staff can delete players.");
      return;
    }

    if (visiblePlayers.length === 0) {
      alert("No players to delete.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL currently visible players?"
    );
    if (!confirmDelete) return;

    const secondConfirm = window.prompt(
      'Type DELETE to confirm removing all visible players'
    );
    if (secondConfirm !== "DELETE") {
      alert("Bulk delete cancelled");
      return;
    }

    const visiblePlayerIds = visiblePlayers.map((player) => player.id);

    const { error } = await supabase
      .from("players")
      .delete()
      .in("id", visiblePlayerIds);

    if (error) {
      console.error("Error deleting all players:", error.message);
      alert("Failed to delete all players");
      return;
    }

    if (
      editingPlayerId &&
      visiblePlayerIds.some((id) => String(id) === String(editingPlayerId))
    ) {
      resetForm();
      setShowPlayerForm(false);
    }

    await fetchPlayers();
    alert("Visible players deleted successfully.");
  };

  const totalPlayers = countedVisiblePlayers.length;
  const totalTeams = new Set(visiblePlayers.map((player) => player.team_id))
    .size;
  const totalGoalkeepers = visiblePlayers.filter(
    (player) => player.role === "goalkeeper"
  ).length;

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .players-form-grid {
              grid-template-columns: 1fr !important;
            }

            .players-filter-grid {
              grid-template-columns: 1fr 1fr !important;
            }

            .players-form-actions {
              grid-column: 1 / -1 !important;
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .players-form-actions button {
              width: 100% !important;
            }

            .players-limit-row {
              grid-column: 1 / -1 !important;
            }

            .players-warning-row {
              grid-column: 1 / -1 !important;
            }
          }

          @media (max-width: 768px) {
            .players-page {
              padding: 14px !important;
            }

            .players-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .players-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .players-stats-grid {
              grid-template-columns: 1fr !important;
            }

            .players-filter-grid {
              grid-template-columns: 1fr !important;
            }

            .players-section-card {
              padding: 16px !important;
              border-radius: 16px !important;
            }

            .players-card {
              flex-direction: column !important;
              align-items: stretch !important;
              padding: 12px !important;
              gap: 10px !important;
              border-radius: 14px !important;
            }

            .players-card-main {
              flex-direction: row !important;
              align-items: flex-start !important;
              gap: 10px !important;
            }

            .players-avatar {
              width: 48px !important;
              height: 48px !important;
              min-width: 48px !important;
            }

            .players-title-row {
              flex-direction: row !important;
              align-items: flex-start !important;
              justify-content: space-between !important;
              gap: 8px !important;
            }

            .players-name {
              font-size: 18px !important;
              line-height: 1.2 !important;
            }

            .players-role-badge {
              padding: 6px 10px !important;
              font-size: 11px !important;
            }

            .players-meta-row {
              gap: 6px !important;
              margin-top: 8px !important;
              flex-direction: row !important;
              align-items: center !important;
            }

            .players-meta-pill {
              padding: 6px 10px !important;
              font-size: 11px !important;
            }

            .players-details-grid {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 6px !important;
              margin-top: 8px !important;
            }

            .players-detail-box {
              padding: 8px !important;
              border-radius: 10px !important;
            }

            .players-detail-label {
              font-size: 9px !important;
            }

            .players-detail-value {
              font-size: 13px !important;
              margin-top: 2px !important;
            }

            .players-card-actions {
              min-width: 100% !important;
              width: 100% !important;
              flex-direction: row !important;
              align-items: stretch !important;
              gap: 8px !important;
            }

            .players-card-actions button {
              width: 100% !important;
              padding: 9px 10px !important;
              font-size: 11px !important;
              border-radius: 9px !important;
            }

            .players-filter-header {
              flex-direction: column !important;
              align-items: flex-start !important;
            }

            .players-filter-actions {
              width: 100% !important;
              flex-direction: column !important;
            }

            .players-filter-actions button {
              width: 100% !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="players-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="players-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="players-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Players Management</h1>
                <p style={heroTextStyle}>
                  Add players, update profiles, assign them to teams, and manage
                  your squad list from one clean dashboard.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <Users size={16} />
                Squad Control
              </div>
            </div>
          </div>

          <div style={statsGridStyle} className="players-stats-grid">
            <MiniStatCard
              icon={<Users size={18} />}
              title="Counted Squad"
              value={totalPlayers}
              accent="#1476b6"
              soft="rgba(20,118,182,0.10)"
            />
            <MiniStatCard
              icon={<Trophy size={18} />}
              title="Teams"
              value={totalTeams}
              accent="#109847"
              soft="rgba(16,152,71,0.10)"
            />
            <MiniStatCard
              icon={<Shield size={18} />}
              title="Goalkeepers"
              value={totalGoalkeepers}
              accent="#cf2136"
              soft="rgba(207,33,54,0.10)"
            />
          </div>

          {teamManagerLocked && (
            <div style={lockedBannerStyle}>
              <Lock size={18} />
              Player registration is locked because this tournament has already
              started.
            </div>
          )}

          <div style={sectionCardStyle} className="players-section-card">
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleWrapStyle}>
                <div style={sectionIconBlueStyle}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <div style={sectionTitleStyle}>
                    {editingPlayerId ? "Edit Person" : "Add Person"}
                  </div>
                  <div style={sectionSubtitleStyle}>
                    Create a profile and assign it to a team
                  </div>
                </div>
              </div>

              {canEditPlayers && (
                <button
                  type="button"
                  onClick={() => setShowPlayerForm((prev) => !prev)}
                  style={accordionButtonStyle}
                >
                  {showPlayerForm
                    ? "Hide Form"
                    : editingPlayerId
                    ? "Edit Person"
                    : "Add Person"}
                  <span style={{ display: "inline-flex", marginLeft: "8px" }}>
                    {showPlayerForm ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </span>
                </button>
              )}
            </div>

            {showPlayerForm && canEditPlayers && (
              <div style={{ marginTop: "18px" }}>
                <form
                  onSubmit={handleSubmit}
                  style={formGridStyle}
                  className="players-form-grid"
                >
                  <Field label="Tournament">
                    {userRole === "team_manager" || selectedTeamIdFromUrl ? (
                      <div style={fixedFieldStyle}>
                        {selectedTournament?.name || "Selected tournament"}
                      </div>
                    ) : (
                      <select
                        value={tournamentId}
                        onChange={(e) => {
                          setTournamentId(e.target.value);
                          setTeamId("");
                        }}
                        required
                        style={inputStyle}
                      >
                        <option value="">Select tournament</option>
                        {tournaments.map((tournament) => (
                          <option key={tournament.id} value={tournament.id}>
                            {tournament.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>

                  <Field label="Team">
                    {userRole === "team_manager" || selectedTeamIdFromUrl ? (
                      <div style={fixedFieldStyle}>
                        {selectedTeam?.company_name ||
                          selectedTeam?.team_name ||
                          "Selected team"}
                      </div>
                    ) : (
                      <select
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        required
                        style={inputStyle}
                      >
                        <option value="">Select team</option>
                        {filteredTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.company_name || team.team_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>

                  {teamId ? (
                    <div
                      style={limitInfoGridStyle}
                      className="players-limit-row"
                    >
                      <div
                        style={{
                          ...limitInfoCardStyle,
                          background: "#f9fafb",
                        }}
                      >
                        <div style={limitInfoLabelStyle}>Counted squad</div>
                        <div style={limitInfoValueStyle}>
                          {currentTeamCount}
                          {maxPlayersAllowed !== null
                            ? ` / ${maxPlayersAllowed}`
                            : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          ...limitInfoCardStyle,
                          background: isTeamBelowMinimum
                            ? "rgba(245,158,11,0.10)"
                            : "rgba(16,152,71,0.10)",
                        }}
                      >
                        <div style={limitInfoLabelStyle}>Minimum required</div>
                        <div style={limitInfoValueStyle}>
                          {minPlayersRequired ?? "-"}
                        </div>
                      </div>

                      <div
                        style={{
                          ...limitInfoCardStyle,
                          background: isTeamAtMaximum
                            ? "rgba(207,33,54,0.10)"
                            : "rgba(20,118,182,0.10)",
                        }}
                      >
                        <div style={limitInfoLabelStyle}>Remaining spots</div>
                        <div style={limitInfoValueStyle}>
                          {remainingSpots !== null ? remainingSpots : "-"}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {teamId && isTeamBelowMinimum ? (
                    <div
                      style={warningBannerStyle}
                      className="players-warning-row"
                    >
                      <AlertTriangle size={16} />
                      Only players and goalkeepers are counted. This team
                      currently has {currentTeamCount} counted members and needs
                      at least {minPlayersRequired}.
                    </div>
                  ) : null}

                  {teamId && isTeamAtMaximum && !editingPlayerId ? (
                    <div
                      style={dangerBannerStyle}
                      className="players-warning-row"
                    >
                      <AlertTriangle size={16} />
                      Only players and goalkeepers are counted. This team
                      already reached the maximum allowed of {maxPlayersAllowed}.
                    </div>
                  ) : null}

                  <Field label="Full name">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Jersey number">
                    <input
                      type="number"
                      placeholder="Jersey number"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Role">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select role</option>
                      <option value="player">Player</option>
                      <option value="goalkeeper">Goalkeeper</option>
                      <option value="coach">Coach</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>

                  <Field label="Age">
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Photo (optional)">
                    <div style={uploadBoxStyle}>
                      <div style={uploadIconStyle}>
                        <Camera size={18} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        style={fileInputStyle}
                      />
                    </div>
                    <small style={helperTextStyle}>
                      You can leave this empty
                    </small>
                  </Field>

                  <div
                    style={formActionsStyle}
                    className="players-form-actions"
                  >
                    <button
                      type="submit"
                      disabled={
                        loading || (teamId && isTeamAtMaximum && !editingPlayerId)
                      }
                      style={{
                        ...saveButtonStyle,
                        opacity:
                          loading || (teamId && isTeamAtMaximum && !editingPlayerId)
                            ? 0.6
                            : 1,
                        cursor:
                          loading || (teamId && isTeamAtMaximum && !editingPlayerId)
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {loading
                        ? "Saving..."
                        : editingPlayerId
                        ? "Update Person"
                        : "Add Person"}
                    </button>

                    {editingPlayerId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setShowPlayerForm(false);
                        }}
                        style={cancelButtonStyle}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          <div style={sectionCardStyle} className="players-section-card">
            <div style={filterHeaderStyle} className="players-filter-header">
              <div style={sectionTitleWrapStyle}>
                <div style={sectionIconFilterStyle}>
                  <Filter size={18} />
                </div>
                <div>
                  <div style={sectionTitleStyle}>Filter Players</div>
                  <div style={sectionSubtitleStyle}>
                    View players by tournament, team, name, or role
                  </div>
                </div>
              </div>

              <div style={filterActionsWrapStyle} className="players-filter-actions">
                {canDeletePlayers && (
                  <button
                    type="button"
                    onClick={handleDeleteAllPlayers}
                    style={deleteAllButtonStyle}
                  >
                    <span style={buttonInnerStyle}>
                      <Trash2 size={14} />
                      Remove All Visible Players
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  style={clearFilterButtonStyle}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div style={filterGridStyle} className="players-filter-grid">
              <Field label="Tournament">
                {userRole === "team_manager" || selectedTeamIdFromUrl ? (
                  <div style={fixedFieldStyle}>
                    {selectedTournament?.name || "Selected tournament"}
                  </div>
                ) : (
                  <select
                    value={listTournamentId}
                    onChange={(e) => {
                      setListTournamentId(e.target.value);
                      setListTeamId("");
                    }}
                    style={inputStyle}
                  >
                    <option value="">All tournaments</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Team">
                {userRole === "team_manager" || selectedTeamIdFromUrl ? (
                  <div style={fixedFieldStyle}>
                    {selectedTeam?.company_name ||
                      selectedTeam?.team_name ||
                      "Selected team"}
                  </div>
                ) : (
                  <select
                    value={listTeamId}
                    onChange={(e) => setListTeamId(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All teams</option>
                    {listFilteredTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.company_name || team.team_name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Search player">
                <div style={searchWrapStyle}>
                  <div style={searchIconStyle}>
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by full name"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    style={searchInputStyle}
                  />
                </div>
              </Field>

              <Field label="Role">
                <select
                  value={listRole}
                  onChange={(e) => setListRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">All roles</option>
                  <option value="player">Player</option>
                  <option value="goalkeeper">Goalkeeper</option>
                  <option value="coach">Coach</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </div>

          {visiblePlayers.length === 0 ? (
            <div style={emptyStateStyle}>No players found for this filter.</div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {visiblePlayers.map((player) => {
                const teamName =
                  player.teams?.company_name || player.teams?.team_name || "-";

                return (
                  <div
                    key={player.id}
                    style={playerCardStyle}
                    className="players-card"
                  >
                    <div style={playerMainStyle} className="players-card-main">
                      <div style={avatarWrapStyle} className="players-avatar">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.full_name}
                            style={avatarImageStyle}
                          />
                        ) : (
                          <span style={avatarFallbackStyle}>
                            {player.full_name?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={playerTitleRowStyle}
                          className="players-title-row"
                        >
                          <h3 style={playerNameStyle} className="players-name">
                            {player.full_name}
                          </h3>

                          <div
                            style={roleBadgeStyle}
                            className="players-role-badge"
                          >
                            {player.role || "No role"}
                          </div>
                        </div>

                        <div
                          style={playerMetaRowStyle}
                          className="players-meta-row"
                        >
                          <span style={metaPillStyle} className="players-meta-pill">
                            <Trophy size={12} />
                            {player.teams?.tournaments?.name || "-"}
                          </span>

                          <span style={metaPillStyle} className="players-meta-pill">
                            <Users size={12} />
                            {teamName}
                          </span>
                        </div>

                        <div
                          style={detailsGridStyle}
                          className="players-details-grid"
                        >
                          <DetailBox
                            label="Jersey"
                            value={player.jersey_number || "-"}
                            compact
                          />
                          <DetailBox
                            label="Age"
                            value={player.age || "-"}
                            compact
                          />
                          <DetailBox
                            label="Role"
                            value={player.role || "-"}
                            compact
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...playerActionsStyle,
                        minWidth: canDeletePlayers ? "130px" : "100px",
                      }}
                      className="players-card-actions"
                    >
                      {canEditPlayers && (
                        <button
                          onClick={() => handleEdit(player)}
                          style={editButtonStyle}
                        >
                          <span style={buttonInnerStyle}>
                            <Pencil size={13} />
                            Edit
                          </span>
                        </button>
                      )}

                      {canDeletePlayers && (
                        <button
                          onClick={() => handleDelete(player.id)}
                          style={deleteButtonStyle}
                        >
                          <span style={buttonInnerStyle}>
                            <Trash2 size={13} />
                            Delete
                          </span>
                        </button>
                      )}
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

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
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

function DetailBox({ label, value, compact = false }) {
  return (
    <div
      style={detailBoxStyle}
      className={compact ? "players-detail-box" : undefined}
    >
      <div
        style={detailLabelStyle}
        className={compact ? "players-detail-label" : undefined}
      >
        {label}
      </div>
      <div
        style={detailValueStyle}
        className={compact ? "players-detail-value" : undefined}
      >
        {value}
      </div>
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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

const sectionCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  marginBottom: "24px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const sectionTitleWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const sectionIconBlueStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionIconFilterStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "rgba(16,152,71,0.10)",
  color: "#109847",
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

const accordionButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const filterHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const filterActionsWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const clearFilterButtonStyle = {
  background: "#f3f4f6",
  color: "#111827",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  fontWeight: "700",
  cursor: "pointer",
};

const deleteAllButtonStyle = {
  background: "#991b1b",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
};

const formActionsStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  gap: "12px",
  alignItems: "stretch",
};

const limitInfoGridStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const limitInfoCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px",
};

const limitInfoLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "700",
  textTransform: "uppercase",
};

const limitInfoValueStyle = {
  marginTop: "6px",
  fontSize: "22px",
  fontWeight: "900",
  color: "#111827",
};

const warningBannerStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(245,158,11,0.10)",
  color: "#b45309",
  border: "1px solid rgba(245,158,11,0.22)",
  borderRadius: "12px",
  padding: "12px 14px",
  fontWeight: "700",
  fontSize: "14px",
};

const dangerBannerStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(207,33,54,0.10)",
  color: "#cf2136",
  border: "1px solid rgba(207,33,54,0.20)",
  borderRadius: "12px",
  padding: "12px 14px",
  fontWeight: "700",
  fontSize: "14px",
};

const lockedBannerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(207,33,54,0.10)",
  color: "#b91c1c",
  border: "1px solid rgba(207,33,54,0.20)",
  borderRadius: "14px",
  padding: "14px 16px",
  fontWeight: "700",
  marginBottom: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: "700",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  minHeight: "48px",
  fontSize: "15px",
};

const searchWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  background: "#fff",
  minHeight: "48px",
  padding: "0 12px",
};

const searchIconStyle = {
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const searchInputStyle = {
  border: "none",
  outline: "none",
  width: "100%",
  background: "transparent",
  fontSize: "15px",
};

const fixedFieldStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(20,118,182,0.15)",
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(20,118,182,0.08)",
  color: "#1476b6",
  fontWeight: "700",
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  fontSize: "15px",
};

const uploadBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  background: "#fff",
  minHeight: "48px",
};

const uploadIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const fileInputStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "14px",
};

const helperTextStyle = {
  display: "block",
  marginTop: "6px",
  fontSize: "12px",
  color: "#6b7280",
  lineHeight: 1.5,
};

const saveButtonStyle = {
  width: "100%",
  minHeight: "52px",
  background: "#109847",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "800",
  fontSize: "16px",
};

const cancelButtonStyle = {
  width: "100%",
  minHeight: "52px",
  background: "#e5e7eb",
  color: "#111827",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
  fontSize: "15px",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  color: "#6b7280",
};

const playerCardStyle = {
  background: "#fff",
  padding: "18px 20px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const playerMainStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  flex: 1,
};

const avatarWrapStyle = {
  width: "68px",
  height: "68px",
  minWidth: "68px",
  borderRadius: "50%",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const avatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const avatarFallbackStyle = {
  fontWeight: "800",
  color: "#6b7280",
  fontSize: "22px",
};

const playerTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const playerNameStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "22px",
  fontWeight: "800",
};

const roleBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  border: "1px solid rgba(20,118,182,0.18)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "capitalize",
};

const playerMetaRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const metaPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#f9fafb",
  color: "#4b5563",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "700",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const detailBoxStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "10px 12px",
};

const detailLabelStyle = {
  fontSize: "11px",
  color: "#6b7280",
  fontWeight: "700",
  textTransform: "uppercase",
};

const detailValueStyle = {
  fontSize: "15px",
  color: "#111827",
  fontWeight: "800",
  marginTop: "4px",
};

const playerActionsStyle = {
  minWidth: "130px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "10px",
};

const editButtonStyle = {
  width: "100px",
  background: "#1476b6",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const deleteButtonStyle = {
  width: "100px",
  background: "#cf2136",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const buttonInnerStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

export default AddPlayer;