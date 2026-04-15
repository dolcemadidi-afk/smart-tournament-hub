import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Trophy,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  UserSquare2,
} from "lucide-react";

function Teams() {
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [players, setPlayers] = useState([]);

  const [editingTeamId, setEditingTeamId] = useState(null);

  const [tournamentId, setTournamentId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const [inviteTournamentId, setInviteTournamentId] = useState("");
  const [inviteManagerName, setInviteManagerName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompanyName, setInviteCompanyName] = useState("");
  const [inviteManagerPhone, setInviteManagerPhone] = useState("");
  const [inviteLogoFile, setInviteLogoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteManager, setShowInviteManager] = useState(false);

  const [filterTournamentId, setFilterTournamentId] = useState("all");
  const [filterCapacity, setFilterCapacity] = useState("all");

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
          max_teams
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teams:", error.message);
      return;
    }

    setTeams(data || []);
  };

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from("team_manager_invites")
      .select("*");

    if (error) {
      console.error("Error fetching invites:", error.message);
      return;
    }

    setInvites(data || []);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("id, team_id, role");

    if (error) {
      console.error("Error fetching players:", error.message);
      return;
    }

    setPlayers(data || []);
  };

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
    fetchInvites();
    fetchPlayers();
  }, []);

  const pendingInvitesCountByTournament = useMemo(() => {
    const map = {};

    invites.forEach((invite) => {
      if (invite.status === "pending") {
        const key = String(invite.tournament_id);
        map[key] = (map[key] || 0) + 1;
      }
    });

    return map;
  }, [invites]);

  const playerCountsByTeam = useMemo(() => {
    const map = {};

    players.forEach((player) => {
      const key = String(player.team_id);
      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [players]);

  const getTournamentCapacity = (tournamentIdValue, ignoreTeamId = null) => {
    const tournament = tournaments.find(
      (t) => String(t.id) === String(tournamentIdValue)
    );

    if (!tournament) {
      return {
        tournament: null,
        maxTeams: 0,
        currentTeams: 0,
        pendingInvites: 0,
        totalReserved: 0,
        isFull: false,
      };
    }

    const maxTeams = Number(tournament.max_teams || 0);

    let currentTeams = teams.filter(
      (team) => String(team.tournament_id) === String(tournamentIdValue)
    ).length;

    if (ignoreTeamId) {
      const existingTeam = teams.find((team) => team.id === ignoreTeamId);
      if (
        existingTeam &&
        String(existingTeam.tournament_id) === String(tournamentIdValue)
      ) {
        currentTeams -= 1;
      }
    }

    const pendingInvites =
      pendingInvitesCountByTournament[String(tournamentIdValue)] || 0;

    const totalReserved = currentTeams + pendingInvites;
    const isFull = maxTeams > 0 ? totalReserved >= maxTeams : false;

    return {
      tournament,
      maxTeams,
      currentTeams,
      pendingInvites,
      totalReserved,
      isFull,
    };
  };

  const getTournamentUsageText = (tournament, ignoreTeamId = null) => {
    const capacity = getTournamentCapacity(tournament.id, ignoreTeamId);

    if (capacity.maxTeams > 0) {
      return `${capacity.totalReserved}/${capacity.maxTeams}`;
    }

    return `${capacity.totalReserved}`;
  };

  const isTournamentFull = (tournamentIdValue, ignoreTeamId = null) => {
    return getTournamentCapacity(tournamentIdValue, ignoreTeamId).isFull;
  };

  const validateTournamentCapacityFromDB = async (
    selectedTournamentId,
    ignoreTeamId = null
  ) => {
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, max_teams, name")
      .eq("id", selectedTournamentId)
      .maybeSingle();

    if (tournamentError) {
      console.error("Error fetching tournament capacity:", tournamentError);
      alert("Failed to validate tournament capacity");
      return { ok: false };
    }

    if (!tournament) {
      alert("Tournament not found");
      return { ok: false };
    }

    const maxTeams = Number(tournament.max_teams || 0);

    if (!maxTeams || maxTeams < 1) {
      return { ok: true };
    }

    let currentTeamsCount = 0;
    const { count: teamsCount, error: teamsCountError } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", selectedTournamentId);

    if (teamsCountError) {
      console.error("Error counting teams:", teamsCountError);
      alert("Failed to validate tournament capacity");
      return { ok: false };
    }

    currentTeamsCount = teamsCount || 0;

    if (ignoreTeamId) {
      const { data: existingTeam } = await supabase
        .from("teams")
        .select("id, tournament_id")
        .eq("id", ignoreTeamId)
        .maybeSingle();

      if (
        existingTeam &&
        String(existingTeam.tournament_id) === String(selectedTournamentId)
      ) {
        currentTeamsCount -= 1;
      }
    }

    const { count: invitesCount, error: invitesCountError } = await supabase
      .from("team_manager_invites")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", selectedTournamentId)
      .eq("status", "pending");

    if (invitesCountError) {
      console.error("Error counting pending invites:", invitesCountError);
      alert("Failed to validate tournament capacity");
      return { ok: false };
    }

    const totalReserved = currentTeamsCount + (invitesCount || 0);

    if (totalReserved >= maxTeams) {
      alert(
        `This tournament is full (${totalReserved}/${maxTeams}). No more teams can be added.`
      );
      return { ok: false };
    }

    return { ok: true };
  };

  const resetForm = () => {
    setEditingTeamId(null);
    setTournamentId("");
    setCompanyName("");
    setManagerName("");
    setManagerEmail("");
    setManagerPhone("");
    setLogoFile(null);
  };

  const resetInviteForm = () => {
    setInviteTournamentId("");
    setInviteManagerName("");
    setInviteEmail("");
    setInviteCompanyName("");
    setInviteManagerPhone("");
    setInviteLogoFile(null);
  };

  const uploadLogo = async (file) => {
    if (!file) return null;

    const cleanName = file.name.replace(/\s+/g, "-");
    const fileName = `${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("team-logos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      alert("Failed to upload logo");
      return null;
    }

    const { data } = supabase.storage
      .from("team-logos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tournamentId) {
      alert("Please select a tournament");
      return;
    }

    if (!companyName.trim()) {
      alert("Company name is required");
      return;
    }

    const capacityCheck = await validateTournamentCapacityFromDB(
      tournamentId,
      editingTeamId
    );

    if (!capacityCheck.ok) {
      return;
    }

    setLoading(true);

    let logoUrl = null;

    if (editingTeamId) {
      const currentTeam = teams.find((team) => team.id === editingTeamId);
      logoUrl = currentTeam?.logo_url || null;
    }

    if (logoFile) {
      const uploadedLogoUrl = await uploadLogo(logoFile);

      if (!uploadedLogoUrl) {
        setLoading(false);
        return;
      }

      logoUrl = uploadedLogoUrl;
    }

    const payload = {
      tournament_id: tournamentId,
      team_name: companyName,
      company_name: companyName,
      manager_name: managerName,
      manager_email: managerEmail,
      manager_phone: managerPhone,
      logo_url: logoUrl,
    };

    if (editingTeamId) {
      const { error } = await supabase
        .from("teams")
        .update(payload)
        .eq("id", editingTeamId);

      if (error) {
        console.error("Error updating team:", error.message);
        alert("Failed to update team");
        setLoading(false);
        return;
      }

      alert("Company updated successfully");
    } else {
      const { error } = await supabase.from("teams").insert([payload]);

      if (error) {
        console.error("Error adding team:", error.message);
        alert("Failed to add company");
        setLoading(false);
        return;
      }

      alert("Company added successfully");
    }

    resetForm();
    await fetchTeams();
    await fetchInvites();
    await fetchPlayers();
    setLoading(false);
    setShowCreateTeam(false);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    if (
      !inviteTournamentId ||
      !inviteEmail ||
      !inviteManagerName ||
      !inviteCompanyName.trim()
    ) {
      alert("Please fill tournament, manager name, email, and company name");
      return;
    }

    const capacityCheck = await validateTournamentCapacityFromDB(
      inviteTournamentId
    );

    if (!capacityCheck.ok) {
      return;
    }

    setInviteLoading(true);

    try {
      const selectedTournament = tournaments.find(
        (t) => String(t.id) === String(inviteTournamentId)
      );

      const inviteToken = crypto.randomUUID();
      const inviteLink = `${window.location.origin}/accept-invite?token=${inviteToken}`;

      let inviteLogoUrl = null;

      if (inviteLogoFile) {
        const uploadedLogoUrl = await uploadLogo(inviteLogoFile);

        if (!uploadedLogoUrl) {
          setInviteLoading(false);
          return;
        }

        inviteLogoUrl = uploadedLogoUrl;
      }

      const payload = {
        tournament_id: inviteTournamentId,
        email: inviteEmail,
        manager_name: inviteManagerName,
        manager_phone: inviteManagerPhone || null,
        team_name: inviteCompanyName,
        logo_url: inviteLogoUrl,
        invited_by: selectedTournament?.organizer_id || null,
        invite_token: inviteToken,
        status: "pending",
      };

      const { error } = await supabase
        .from("team_manager_invites")
        .insert([payload]);

      if (error) {
        console.error("Error creating invite:", error.message);
        alert(error.message);
        setInviteLoading(false);
        return;
      }

      alert(`Invite created successfully

Copy this link:
${inviteLink}`);

      resetInviteForm();
      setShowInviteManager(false);
      await fetchInvites();
    } catch (err) {
      console.error("Invite error:", err);
      alert("Failed to create invite");
    }

    setInviteLoading(false);
  };

  const handleEdit = (team) => {
    setEditingTeamId(team.id);
    setTournamentId(team.tournament_id || "");
    setCompanyName(team.company_name || team.team_name || "");
    setManagerName(team.manager_name || "");
    setManagerEmail(team.manager_email || "");
    setManagerPhone(team.manager_phone || "");
    setLogoFile(null);

    setShowCreateTeam(true);
    setShowInviteManager(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Deleting this company may also remove related players and matches. Continue?"
    );
    if (!confirmDelete) return;

    const { error: playersError } = await supabase
      .from("players")
      .delete()
      .eq("team_id", id);

    if (playersError) {
      console.error("Error deleting players:", playersError);
      alert(playersError.message);
      return;
    }

    const { data: relatedMatches, error: matchesFetchError } = await supabase
      .from("matches")
      .select("id")
      .or(`team_a_id.eq.${id},team_b_id.eq.${id}`);

    if (matchesFetchError) {
      console.error("Error fetching matches:", matchesFetchError);
      alert(matchesFetchError.message);
      return;
    }

    const matchIds = (relatedMatches || []).map((m) => m.id);

    if (matchIds.length > 0) {
      const { error: goalsError } = await supabase
        .from("goals")
        .delete()
        .in("match_id", matchIds);

      if (goalsError) {
        console.error("Error deleting goals:", goalsError);
        alert(goalsError.message);
        return;
      }

      const { error: cardsError } = await supabase
        .from("cards")
        .delete()
        .in("match_id", matchIds);

      if (cardsError) {
        console.error("Error deleting cards:", cardsError);
        alert(cardsError.message);
        return;
      }

      const { error: matchesDeleteError } = await supabase
        .from("matches")
        .delete()
        .in("id", matchIds);

      if (matchesDeleteError) {
        console.error("Error deleting matches:", matchesDeleteError);
        alert(matchesDeleteError.message);
        return;
      }
    }

    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (teamError) {
      console.error("Error deleting team:", teamError);
      alert(teamError.message);
      return;
    }

    if (editingTeamId === id) {
      resetForm();
    }

    await fetchTeams();
    await fetchInvites();
    await fetchPlayers();
  };

  const toggleCreateTeam = () => {
    setShowCreateTeam((prev) => {
      const next = !prev;
      if (next) setShowInviteManager(false);
      if (!next && editingTeamId) resetForm();
      return next;
    });
  };

  const toggleInviteManager = () => {
    setShowInviteManager((prev) => {
      const next = !prev;
      if (next) setShowCreateTeam(false);
      return next;
    });
  };

  const filteredTeams = useMemo(() => {
    let result = [...teams];

    if (filterTournamentId !== "all") {
      result = result.filter(
        (team) => String(team.tournament_id) === String(filterTournamentId)
      );
    }

    if (filterCapacity !== "all") {
      result = result.filter((team) => {
        const capacity = getTournamentCapacity(team.tournament_id);
        if (filterCapacity === "full") return capacity.isFull;
        if (filterCapacity === "open") return !capacity.isFull;
        return true;
      });
    }

    return result;
  }, [teams, filterTournamentId, filterCapacity, tournaments, invites]);

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .teams-form-grid {
              grid-template-columns: 1fr !important;
            }

            .teams-form-actions {
              grid-column: span 1 !important;
              flex-direction: column !important;
            }

            .teams-page {
              padding: 16px !important;
            }

            .teams-filters-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 768px) {
            .teams-page {
              padding: 12px !important;
            }

            .teams-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .teams-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .teams-section-card {
              padding: 14px !important;
              border-radius: 14px !important;
            }

            .teams-card {
              padding: 12px !important;
              border-radius: 14px !important;
              gap: 12px !important;
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .teams-card-main {
              gap: 10px !important;
              align-items: flex-start !important;
            }

            .teams-logo-wrap {
              width: 52px !important;
              height: 52px !important;
              min-width: 52px !important;
              border-radius: 12px !important;
            }

            .teams-title-row {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 8px !important;
              flex-wrap: wrap !important;
            }

            .teams-name {
              font-size: 18px !important;
              line-height: 1.2 !important;
              margin: 0 !important;
            }

            .teams-card-badge {
              padding: 5px 9px !important;
              font-size: 11px !important;
              line-height: 1 !important;
              border-radius: 999px !important;
            }

            .teams-company-name {
              font-size: 13px !important;
              margin-top: 4px !important;
            }

            .teams-meta-grid {
              gap: 5px !important;
              margin-top: 8px !important;
            }

            .teams-meta-item {
              font-size: 12px !important;
              line-height: 1.3 !important;
            }

            .teams-meta-item svg {
              width: 13px !important;
              height: 13px !important;
            }

            .teams-card-actions {
              width: 100% !important;
              min-width: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              margin-top: 8px !important;
              align-items: stretch !important;
            }

            .teams-card-actions button {
              width: 100% !important;
              min-width: 0 !important;
              height: 36px !important;
              padding: 0 10px !important;
              font-size: 11px !important;
              border-radius: 10px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }

            .teams-card-actions button span {
              gap: 5px !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="teams-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="teams-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="teams-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Companies Management</h1>
                <p style={heroTextStyle}>
                  Create companies, invite company managers, and manage tournament
                  participation from one clean and mobile-friendly page.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <Users size={16} />
                Company Operations
              </div>
            </div>
          </div>

          <div style={topStatsGridStyle}>
            <MiniStatCard
              icon={<Users size={18} />}
              title="Companies"
              value={teams.length}
              accent="#1476b6"
              soft="rgba(20,118,182,0.10)"
            />
            <MiniStatCard
              icon={<Trophy size={18} />}
              title="Tournaments"
              value={tournaments.length}
              accent="#109847"
              soft="rgba(16,152,71,0.10)"
            />
            <MiniStatCard
              icon={<UserPlus size={18} />}
              title="Pending Invites"
              value={invites.filter((i) => i.status === "pending").length}
              accent="#cf2136"
              soft="rgba(207,33,54,0.10)"
            />
          </div>

          <div style={sectionCardStyle} className="teams-section-card">
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleWrapStyle}>
                <div style={sectionIconBlueStyle}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={sectionTitleStyle}>Create or Edit Company</div>
                  <div style={sectionSubtitleStyle}>
                    Add a company manually and assign it to a tournament
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCreateTeam}
                style={accordionButtonStyle}
              >
                {showCreateTeam ? "Hide Form" : editingTeamId ? "Edit Company" : "Create Company"}
                <span style={{ display: "inline-flex", marginLeft: "8px" }}>
                  {showCreateTeam ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
            </div>

            {showCreateTeam && (
              <div style={{ marginTop: "18px" }}>
                <form
                  onSubmit={handleSubmit}
                  style={formGridStyle}
                  className="teams-form-grid"
                >
                  <Field label="Tournament">
                    <select
                      value={tournamentId}
                      onChange={(e) => setTournamentId(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select tournament</option>
                      {tournaments.map((tournament) => {
                        const full = isTournamentFull(tournament.id, editingTeamId);
                        return (
                          <option key={tournament.id} value={tournament.id}>
                            {tournament.name} ({getTournamentUsageText(tournament, editingTeamId)}){full ? " - Full" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </Field>

                  <Field label="Company name">
                    <input
                      type="text"
                      placeholder="Company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Manager name">
                    <input
                      type="text"
                      placeholder="Manager name"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Manager email">
                    <input
                      type="email"
                      placeholder="Manager email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Manager phone">
                    <input
                      type="text"
                      placeholder="Manager phone"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Company logo">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      style={inputStyle}
                    />
                    <small style={helperTextStyle}>
                      Recommended image: square logo, 500 x 500 px, JPG or PNG
                    </small>
                  </Field>

                  <div style={formActionsStyle} className="teams-form-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      style={saveButtonStyle}
                    >
                      {loading
                        ? "Saving..."
                        : editingTeamId
                        ? "Update Company"
                        : "Add Company"}
                    </button>

                    {editingTeamId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setShowCreateTeam(false);
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

          <div style={sectionCardStyle} className="teams-section-card">
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleWrapStyle}>
                <div style={sectionIconGreenStyle}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <div style={sectionTitleStyle}>Invite Company Manager</div>
                  <div style={sectionSubtitleStyle}>
                    Create an invite link for a company manager to join
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleInviteManager}
                style={accordionButtonStyle}
              >
                {showInviteManager ? "Hide Form" : "Invite Manager"}
                <span style={{ display: "inline-flex", marginLeft: "8px" }}>
                  {showInviteManager ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
            </div>

            {showInviteManager && (
              <div style={{ marginTop: "18px" }}>
                <form
                  onSubmit={handleInviteSubmit}
                  style={formGridStyle}
                  className="teams-form-grid"
                >
                  <Field label="Tournament">
                    <select
                      value={inviteTournamentId}
                      onChange={(e) => setInviteTournamentId(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select tournament</option>
                      {tournaments.map((tournament) => {
                        const full = isTournamentFull(tournament.id);
                        return (
                          <option key={tournament.id} value={tournament.id}>
                            {tournament.name} ({getTournamentUsageText(tournament)}){full ? " - Full" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </Field>

                  <Field label="Manager name">
                    <input
                      type="text"
                      placeholder="Manager name"
                      value={inviteManagerName}
                      onChange={(e) => setInviteManagerName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Manager email">
                    <input
                      type="email"
                      placeholder="Manager email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Company name">
                    <input
                      type="text"
                      placeholder="Company name"
                      value={inviteCompanyName}
                      onChange={(e) => setInviteCompanyName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Manager phone">
                    <input
                      type="text"
                      placeholder="Manager phone"
                      value={inviteManagerPhone}
                      onChange={(e) => setInviteManagerPhone(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Company logo (optional)">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setInviteLogoFile(e.target.files?.[0] || null)}
                      style={inputStyle}
                    />
                    <small style={helperTextStyle}>
                      Recommended image: square logo, 500 x 500 px, JPG or PNG
                    </small>
                  </Field>

                  <div style={formActionsStyle} className="teams-form-actions">
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      style={saveButtonStyle}
                    >
                      {inviteLoading ? "Sending..." : "Send Invite"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div style={sectionCardStyle} className="teams-section-card">
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleWrapStyle}>
                <div style={sectionIconRedStyle}>
                  <Filter size={18} />
                </div>
                <div>
                  <div style={sectionTitleStyle}>Filters</div>
                  <div style={sectionSubtitleStyle}>
                    Filter companies by tournament and capacity
                  </div>
                </div>
              </div>
            </div>

            <div style={filtersGridStyle} className="teams-filters-grid">
              <Field label="Tournament filter">
                <select
                  value={filterTournamentId}
                  onChange={(e) => setFilterTournamentId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="all">All tournaments</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name} ({getTournamentUsageText(tournament)})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Capacity filter">
                <select
                  value={filterCapacity}
                  onChange={(e) => setFilterCapacity(e.target.value)}
                  style={inputStyle}
                >
                  <option value="all">All</option>
                  <option value="open">Open tournaments</option>
                  <option value="full">Full tournaments</option>
                </select>
              </Field>
            </div>
          </div>

          <div style={sectionCardStyle} className="teams-section-card">
            <div style={sectionTitleWrapStyle}>
              <div style={sectionIconRedStyle}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={sectionTitleStyle}>Companies List</div>
                <div style={sectionSubtitleStyle}>
                  Browse, edit, and manage all tournament companies
                </div>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              {filteredTeams.length === 0 ? (
                <div style={emptyStateStyle}>No companies found for this filter.</div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredTeams.map((team) => {
                    const displayName =
                      team.company_name || team.team_name || "-";

                    const capacity = getTournamentCapacity(team.tournament_id);
                    const playersCount = playerCountsByTeam[String(team.id)] || 0;

                    return (
                      <div
                        key={team.id}
                        style={teamCardStyle}
                        className="teams-card"
                      >
                        <div
                          style={teamCardMainStyle}
                          className="teams-card-main"
                        >
                          <div style={teamLogoWrapStyle} className="teams-logo-wrap">
                            {team.logo_url ? (
                              <img
                                src={team.logo_url}
                                alt={displayName}
                                style={teamLogoStyle}
                              />
                            ) : (
                              <span style={teamLogoFallbackStyle}>
                                {displayName?.charAt(0)?.toUpperCase() || "C"}
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={teamTitleRowStyle}
                              className="teams-title-row"
                            >
                              <h3 style={teamNameStyle} className="teams-name">
                                {displayName}
                              </h3>

                              <div
                                style={teamTournamentBadgeStyle}
                                className="teams-card-badge"
                              >
                                <Trophy size={13} />
                                {team.tournaments?.name || "-"}
                              </div>
                            </div>

                            <div
                              style={companyNameStyle}
                              className="teams-company-name"
                            >
                              {displayName}
                            </div>

                            <div
                              style={teamMetaGridStyle}
                              className="teams-meta-grid"
                            >
                              <div
                                style={metaItemStyle}
                                className="teams-meta-item"
                              >
                                <Mail size={14} />
                                <span>{team.manager_email || "-"}</span>
                              </div>

                              <div
                                style={metaItemStyle}
                                className="teams-meta-item"
                              >
                                <Phone size={14} />
                                <span>{team.manager_phone || "-"}</span>
                              </div>

                              <div
                                style={metaItemStyle}
                                className="teams-meta-item"
                              >
                                <ShieldCheck size={14} />
                                <span>{team.manager_name || "-"}</span>
                              </div>

                              <div
                                style={metaItemStyle}
                                className="teams-meta-item"
                              >
                                <Users size={14} />
                                <span>Players: {playersCount}</span>
                              </div>

                              <div
                                style={metaItemStyle}
                                className="teams-meta-item"
                              >
                                <Users size={14} />
                                <span>
                                  Capacity:{" "}
                                  {capacity.maxTeams > 0
                                    ? `${capacity.totalReserved}/${capacity.maxTeams}${
                                        capacity.isFull ? " - Full" : ""
                                      }`
                                    : `${capacity.totalReserved}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          style={teamActionsStyle}
                          className="teams-card-actions"
                        >
                          <button
                            onClick={() =>
                              navigate(`/add-player?teamId=${team.id}`)
                            }
                            style={playersButtonStyle}
                          >
                            <span style={buttonInnerStyle}>
                              <UserSquare2 size={14} />
                              Players
                            </span>
                          </button>

                          <button
                            onClick={() => handleEdit(team)}
                            style={editButtonStyle}
                          >
                            <span style={buttonInnerStyle}>
                              <Pencil size={14} />
                              Edit
                            </span>
                          </button>

                          <button
                            onClick={() => handleDelete(team.id)}
                            style={deleteButtonStyle}
                          >
                            <span style={buttonInnerStyle}>
                              <Trash2 size={14} />
                              Delete
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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

const topStatsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const sectionIconGreenStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "rgba(16,152,71,0.10)",
  color: "#109847",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionIconRedStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "rgba(207,33,54,0.10)",
  color: "#cf2136",
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

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "18px",
};

const formActionsStyle = {
  gridColumn: "span 2",
  display: "flex",
  gap: "12px",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: "700",
};

const helperTextStyle = {
  display: "block",
  marginTop: "6px",
  fontSize: "12px",
  color: "#6b7280",
};

const saveButtonStyle = {
  flex: 1,
  background: "#109847",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
};

const cancelButtonStyle = {
  background: "#e5e7eb",
  color: "#111827",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "700",
  cursor: "pointer",
};

const emptyStateStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  color: "#6b7280",
};

const teamCardStyle = {
  background: "#f9fafb",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const teamCardMainStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  flex: 1,
};

const teamLogoWrapStyle = {
  width: "58px",
  height: "58px",
  minWidth: "58px",
  borderRadius: "14px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const teamLogoStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const teamLogoFallbackStyle = {
  fontWeight: "800",
  color: "#6b7280",
  fontSize: "22px",
};

const teamTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
};

const teamNameStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "19px",
  fontWeight: "800",
  lineHeight: 1.2,
};

const teamTournamentBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  border: "1px solid rgba(20,118,182,0.18)",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  fontWeight: "700",
};

const companyNameStyle = {
  fontSize: "13px",
  color: "#4b5563",
  marginTop: "4px",
  fontWeight: "700",
};

const teamMetaGridStyle = {
  display: "grid",
  gap: "6px",
  marginTop: "8px",
};

const metaItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: 1.3,
};

const teamActionsStyle = {
  minWidth: "150px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "8px",
};

const playersButtonStyle = {
  width: "110px",
  background: "#109847",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const editButtonStyle = {
  width: "110px",
  background: "#1476b6",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const deleteButtonStyle = {
  width: "110px",
  background: "#cf2136",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const buttonInnerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

export default Teams;