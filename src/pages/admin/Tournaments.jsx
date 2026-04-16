import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import {
  Trophy,
  CalendarDays,
  Settings2,
  Layers3,
  Flag,
  Pencil,
  Trash2,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";

function Tournaments() {
  const [editingTournamentId, setEditingTournamentId] = useState(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [format, setFormat] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [logoFile, setLogoFile] = useState(null);
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [maxTeams, setMaxTeams] = useState("");

  const [round1Date, setRound1Date] = useState("");
  const [round2Date, setRound2Date] = useState("");
  const [round3Date, setRound3Date] = useState("");
  const [quarterfinalDate, setQuarterfinalDate] = useState("");
  const [semifinalDate, setSemifinalDate] = useState("");
  const [finalDate, setFinalDate] = useState("");
  const [thirdPlaceDate, setThirdPlaceDate] = useState("");

  const [round1Slots, setRound1Slots] = useState(
    Array.from({ length: 8 }, () => ({ time: "", field: "" }))
  );
  const [round2Slots, setRound2Slots] = useState(
    Array.from({ length: 8 }, () => ({ time: "", field: "" }))
  );
  const [round3Slots, setRound3Slots] = useState(
    Array.from({ length: 8 }, () => ({ time: "", field: "" }))
  );

  const [quarterfinalSlots, setQuarterfinalSlots] = useState(
    Array.from({ length: 4 }, () => ({ time: "", field: "" }))
  );
  const [semifinalSlots, setSemifinalSlots] = useState(
    Array.from({ length: 2 }, () => ({ time: "", field: "" }))
  );

  const [finalSlot, setFinalSlot] = useState({ time: "", field: "" });
  const [thirdPlaceSlot, setThirdPlaceSlot] = useState({
    time: "",
    field: "",
  });

  const [matchConfig, setMatchConfig] = useState({
    firstHalfMinutes: 20,
    secondHalfMinutes: 20,
    breakMinutes: 5,
  });

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openSections, setOpenSections] = useState({
    create: true,
    matchConfig: false,
    groupStage: false,
    knockout: false,
    list: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        setOpenSections({
          create: true,
          matchConfig: true,
          groupStage: true,
          knockout: true,
          list: true,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSection = (key) => {
    if (!isMobile) return;
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getTodayLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  };

  const today = getTodayLocal();

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

  useEffect(() => {
    fetchTournaments();
  }, []);

  const resetSlots = () => {
    setRound1Date("");
    setRound2Date("");
    setRound3Date("");
    setQuarterfinalDate("");
    setSemifinalDate("");
    setFinalDate("");
    setThirdPlaceDate("");

    setRound1Slots(Array.from({ length: 8 }, () => ({ time: "", field: "" })));
    setRound2Slots(Array.from({ length: 8 }, () => ({ time: "", field: "" })));
    setRound3Slots(Array.from({ length: 8 }, () => ({ time: "", field: "" })));
    setQuarterfinalSlots(
      Array.from({ length: 4 }, () => ({ time: "", field: "" }))
    );
    setSemifinalSlots(
      Array.from({ length: 2 }, () => ({ time: "", field: "" }))
    );

    setFinalSlot({ time: "", field: "" });
    setThirdPlaceSlot({ time: "", field: "" });
  };

  const resetForm = () => {
    setEditingTournamentId(null);
    setName("");
    setType("");
    setFormat("");
    setStartDate("");
    setEndDate("");
    setVenue("");
    setStatus("upcoming");
    setLogoFile(null);
    setMinPlayers("");
    setMaxPlayers("");
    setMaxTeams("");
    setMatchConfig({
      firstHalfMinutes: 20,
      secondHalfMinutes: 20,
      breakMinutes: 5,
    });
    resetSlots();
  };

  const updateSlot = (setter, index, key, value) => {
    setter((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot))
    );
  };

  const uploadLogo = async (file) => {
    if (!file) return null;

    const cleanName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const fileName = `${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("tournament-logos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      alert("Failed to upload tournament logo");
      return null;
    }

    const { data } = supabase.storage
      .from("tournament-logos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (startDate && startDate < today) {
      alert("Start date cannot be in the past");
      setLoading(false);
      return;
    }

    if (endDate && endDate < today) {
      alert("End date cannot be in the past");
      setLoading(false);
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      alert("End date must be after start date");
      setLoading(false);
      return;
    }

    if (minPlayers && maxPlayers && Number(minPlayers) > Number(maxPlayers)) {
      alert("Minimum players cannot be greater than maximum players.");
      setLoading(false);
      return;
    }

    if (maxTeams && Number(maxTeams) < 1) {
      alert("Maximum teams must be at least 1.");
      setLoading(false);
      return;
    }

    let logoUrl = null;

    if (editingTournamentId) {
      const currentTournament = tournaments.find(
        (t) => t.id === editingTournamentId
      );
      logoUrl = currentTournament?.logo_url || null;
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
      name,
      type,
      format,
      start_date: startDate,
      end_date: endDate,
      venue,
      status,
      logo_url: logoUrl,
      min_players: minPlayers ? Number(minPlayers) : null,
      max_players: maxPlayers ? Number(maxPlayers) : null,
      max_teams: maxTeams ? Number(maxTeams) : null,
    };

    if (editingTournamentId) {
      const { error } = await supabase
        .from("tournaments")
        .update(payload)
        .eq("id", editingTournamentId);

      if (error) {
        console.error("Error updating tournament:", error.message);
        alert("Failed to update tournament");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("tournaments").insert([payload]);

      if (error) {
        console.error("Error adding tournament:", error.message);
        alert("Failed to add tournament");
        setLoading(false);
        return;
      }
    }

    resetForm();
    await fetchTournaments();
    setLoading(false);
  };

  const handleEdit = (tournament) => {
    setEditingTournamentId(tournament.id);
    setName(tournament.name || "");
    setType(tournament.type || "");
    setFormat(tournament.format || "");
    setStartDate(tournament.start_date || "");
    setEndDate(tournament.end_date || "");
    setVenue(tournament.venue || "");
    setStatus(tournament.status || "upcoming");
    setLogoFile(null);
    setMinPlayers(tournament.min_players || "");
    setMaxPlayers(tournament.max_players || "");
    setMaxTeams(tournament.max_teams || "");

    setOpenSections((prev) => ({
      ...prev,
      create: true,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this tournament?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("tournaments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tournament:", error.message);
      alert("Failed to delete tournament");
      return;
    }

    if (editingTournamentId === id) {
      resetForm();
    }

    fetchTournaments();
  };

  const handleChangeStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("tournaments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status");
      return;
    }

    fetchTournaments();
  };

  const getStatusStyle = (statusValue) => {
    if (statusValue === "ongoing") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
        border: "1px solid #fecaca",
      };
    }

    if (statusValue === "upcoming") {
      return {
        background: "rgba(20,118,182,0.10)",
        color: "#1476b6",
        border: "1px solid rgba(20,118,182,0.20)",
      };
    }

    if (statusValue === "completed") {
      return {
        background: "#e5e7eb",
        color: "#374151",
        border: "1px solid #d1d5db",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
    };
  };

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const validateMatchConfig = () => {
    if (
      !matchConfig.firstHalfMinutes ||
      !matchConfig.secondHalfMinutes ||
      matchConfig.breakMinutes === ""
    ) {
      alert("Please configure match time settings first.");
      return false;
    }
    return true;
  };

  const handleGenerateGroupsAndMatches = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!round1Date || !round2Date || !round3Date) {
      alert("Please select Round 1, Round 2 and Round 3 dates first.");
      return;
    }

    if (round1Date < today || round2Date < today || round3Date < today) {
      alert("Group stage dates cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will assign random groups and generate all group matches. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: tournamentTeams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true });

    if (teamsError) {
      console.error("Error fetching tournament teams:", teamsError.message);
      alert(teamsError.message);
      return;
    }

    if (!tournamentTeams || tournamentTeams.length === 0) {
      alert("No teams found for this tournament.");
      return;
    }

    if (tournamentTeams.length % 4 !== 0) {
      alert("Number of teams must be divisible by 4.");
      return;
    }

    const totalGroups = tournamentTeams.length / 4;

    if (round1Slots.length < totalGroups * 2) {
      alert("Round 1 needs enough slots for all matches.");
      return;
    }

    if (round2Slots.length < totalGroups * 2) {
      alert("Round 2 needs enough slots for all matches.");
      return;
    }

    if (round3Slots.length < totalGroups * 2) {
      alert("Round 3 needs enough slots for all matches.");
      return;
    }

    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from("matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("stage", "group");

    if (existingMatchesError) {
      console.error(
        "Error checking existing group matches:",
        existingMatchesError.message
      );
      alert(existingMatchesError.message);
      return;
    }

    if (existingMatches && existingMatches.length > 0) {
      alert("Group matches already exist for this tournament.");
      return;
    }

    const shuffledTeams = shuffleArray(tournamentTeams);
    const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const groupedTeams = [];

    for (let i = 0; i < shuffledTeams.length; i += 4) {
      groupedTeams.push(shuffledTeams.slice(i, i + 4));
    }

    for (let i = 0; i < groupedTeams.length; i += 1) {
      const groupName = groupLetters[i];
      const group = groupedTeams[i];

      for (const team of group) {
        const { error: updateTeamError } = await supabase
          .from("teams")
          .update({ group_name: groupName })
          .eq("id", team.id);

        if (updateTeamError) {
          console.error("Error updating team group:", updateTeamError.message);
          alert(updateTeamError.message);
          return;
        }
      }
    }

    const matchesToInsert = [];
    let round1SlotIndex = 0;
    let round2SlotIndex = 0;
    let round3SlotIndex = 0;

    groupedTeams.forEach((group, index) => {
      const groupName = groupLetters[index];
      if (group.length !== 4) return;

      const t1 = group[0];
      const t2 = group[1];
      const t3 = group[2];
      const t4 = group[3];

      const r1slot1 = round1Slots[round1SlotIndex++] || { time: "", field: "" };
      const r1slot2 = round1Slots[round1SlotIndex++] || { time: "", field: "" };
      const r2slot1 = round2Slots[round2SlotIndex++] || { time: "", field: "" };
      const r2slot2 = round2Slots[round2SlotIndex++] || { time: "", field: "" };
      const r3slot1 = round3Slots[round3SlotIndex++] || { time: "", field: "" };
      const r3slot2 = round3Slots[round3SlotIndex++] || { time: "", field: "" };

      matchesToInsert.push(
        {
          tournament_id: tournamentId,
          team_a_id: t1.id,
          team_b_id: t4.id,
          match_date: round1Date,
          match_time: r1slot1.time || null,
          field: r1slot1.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 1,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        },
        {
          tournament_id: tournamentId,
          team_a_id: t2.id,
          team_b_id: t3.id,
          match_date: round1Date,
          match_time: r1slot2.time || null,
          field: r1slot2.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 1,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        },
        {
          tournament_id: tournamentId,
          team_a_id: t1.id,
          team_b_id: t3.id,
          match_date: round2Date,
          match_time: r2slot1.time || null,
          field: r2slot1.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 2,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        },
        {
          tournament_id: tournamentId,
          team_a_id: t2.id,
          team_b_id: t4.id,
          match_date: round2Date,
          match_time: r2slot2.time || null,
          field: r2slot2.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 2,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        },
        {
          tournament_id: tournamentId,
          team_a_id: t1.id,
          team_b_id: t2.id,
          match_date: round3Date,
          match_time: r3slot1.time || null,
          field: r3slot1.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 3,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        },
        {
          tournament_id: tournamentId,
          team_a_id: t3.id,
          team_b_id: t4.id,
          match_date: round3Date,
          match_time: r3slot2.time || null,
          field: r3slot2.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: groupName,
          round_number: 3,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        }
      );
    });

    const { error: insertMatchesError } = await supabase
      .from("matches")
      .insert(matchesToInsert);

    if (insertMatchesError) {
      console.error("Error creating group matches:", insertMatchesError.message);
      alert(insertMatchesError.message);
      return;
    }

    alert("Groups and group matches generated successfully.");
  };

  const handleGenerateQuarterfinals = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!quarterfinalDate) {
      alert("Please select the quarter-final date first.");
      return;
    }

    if (quarterfinalDate < today) {
      alert("Quarter-final date cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate quarter-finals from final group standings. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: existingQuarterfinals, error: existingQuarterfinalsError } =
      await supabase
        .from("matches")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("stage", "quarterfinal");

    if (existingQuarterfinalsError) {
      console.error(
        "Error checking existing quarter-finals:",
        existingQuarterfinalsError.message
      );
      alert(existingQuarterfinalsError.message);
      return;
    }

    if (existingQuarterfinals && existingQuarterfinals.length > 0) {
      alert("Quarter-final matches already exist for this tournament.");
      return;
    }

    const { data: tournamentTeams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (teamsError) {
      console.error("Error fetching teams:", teamsError.message);
      alert(teamsError.message);
      return;
    }

    const { data: groupMatches, error: groupMatchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("stage", "group");

    if (groupMatchesError) {
      console.error("Error fetching group matches:", groupMatchesError.message);
      alert(groupMatchesError.message);
      return;
    }

    const unfinishedGroupMatches = (groupMatches || []).filter(
      (match) => match.status !== "finished"
    );

    if (unfinishedGroupMatches.length > 0) {
      alert("All group matches must be finished before generating quarter-finals.");
      return;
    }

    const groupsMap = {};

    (tournamentTeams || []).forEach((team) => {
      const groupName = team.group_name;
      if (!groupName) return;

      if (!groupsMap[groupName]) {
        groupsMap[groupName] = {};
      }

      groupsMap[groupName][team.id] = {
        team_id: team.id,
        team_name: team.team_name,
        group_name: groupName,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      };
    });

    (groupMatches || []).forEach((match) => {
      if (match.status !== "finished") return;

      const groupName = match.group_name;
      if (!groupName || !groupsMap[groupName]) return;

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
      } else if (homeGoals < awayGoals) {
        away.w += 1;
        home.l += 1;
        away.pts += 3;
      } else {
        home.d += 1;
        away.d += 1;
        home.pts += 1;
        away.pts += 1;
      }
    });

    Object.keys(groupsMap).forEach((groupName) => {
      Object.values(groupsMap[groupName]).forEach((team) => {
        team.gd = team.gf - team.ga;
      });
    });

    const rankGroup = (groupName) => {
      const group = Object.values(groupsMap[groupName] || {});
      return group.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team_name.localeCompare(b.team_name);
      });
    };

    const groupA = rankGroup("A");
    const groupB = rankGroup("B");
    const groupC = rankGroup("C");
    const groupD = rankGroup("D");

    if (
      groupA.length < 2 ||
      groupB.length < 2 ||
      groupC.length < 2 ||
      groupD.length < 2
    ) {
      alert("Groups A, B, C and D must each have at least 2 ranked teams.");
      return;
    }

    const qf1 = quarterfinalSlots[0] || { time: "", field: "" };
    const qf2 = quarterfinalSlots[1] || { time: "", field: "" };
    const qf3 = quarterfinalSlots[2] || { time: "", field: "" };
    const qf4 = quarterfinalSlots[3] || { time: "", field: "" };

    const quarterfinalMatches = [
      {
        tournament_id: tournamentId,
        team_a_id: groupA[0].team_id,
        team_b_id: groupB[1].team_id,
        match_date: quarterfinalDate,
        match_time: qf1.time || null,
        field: qf1.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "quarterfinal",
        group_name: null,
        round_number: 1,
        winner_team_id: null,
        source_match_1: null,
        source_match_2: null,
      },
      {
        tournament_id: tournamentId,
        team_a_id: groupB[0].team_id,
        team_b_id: groupA[1].team_id,
        match_date: quarterfinalDate,
        match_time: qf2.time || null,
        field: qf2.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "quarterfinal",
        group_name: null,
        round_number: 2,
        winner_team_id: null,
        source_match_1: null,
        source_match_2: null,
      },
      {
        tournament_id: tournamentId,
        team_a_id: groupC[0].team_id,
        team_b_id: groupD[1].team_id,
        match_date: quarterfinalDate,
        match_time: qf3.time || null,
        field: qf3.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "quarterfinal",
        group_name: null,
        round_number: 3,
        winner_team_id: null,
        source_match_1: null,
        source_match_2: null,
      },
      {
        tournament_id: tournamentId,
        team_a_id: groupD[0].team_id,
        team_b_id: groupC[1].team_id,
        match_date: quarterfinalDate,
        match_time: qf4.time || null,
        field: qf4.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "quarterfinal",
        group_name: null,
        round_number: 4,
        winner_team_id: null,
        source_match_1: null,
        source_match_2: null,
      },
    ];

    const { error: insertQuarterfinalsError } = await supabase
      .from("matches")
      .insert(quarterfinalMatches);

    if (insertQuarterfinalsError) {
      console.error(
        "Error creating quarter-finals:",
        insertQuarterfinalsError.message
      );
      alert(insertQuarterfinalsError.message);
      return;
    }

    alert("Quarter-finals generated successfully.");
  };

  const handleGenerateSemifinals = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!semifinalDate) {
      alert("Please select the semi-final date first.");
      return;
    }

    if (semifinalDate < today) {
      alert("Semi-final date cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate semi-finals from quarter-final winners. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: existingSemifinals, error: existingSemifinalsError } =
      await supabase
        .from("matches")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("stage", "semifinal");

    if (existingSemifinalsError) {
      console.error(
        "Error checking existing semi-finals:",
        existingSemifinalsError.message
      );
      alert(existingSemifinalsError.message);
      return;
    }

    if (existingSemifinals && existingSemifinals.length > 0) {
      alert("Semi-final matches already exist for this tournament.");
      return;
    }

    const { data: quarterfinals, error: quarterfinalsError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("stage", "quarterfinal")
      .order("round_number", { ascending: true });

    if (quarterfinalsError) {
      console.error("Error fetching quarter-finals:", quarterfinalsError.message);
      alert(quarterfinalsError.message);
      return;
    }

    if (!quarterfinals || quarterfinals.length !== 4) {
      alert("Exactly 4 quarter-final matches are required.");
      return;
    }

    const unfinishedQuarterfinals = quarterfinals.filter(
      (match) => match.status !== "finished"
    );

    if (unfinishedQuarterfinals.length > 0) {
      alert("All quarter-final matches must be finished before generating semi-finals.");
      return;
    }

    const qf1 = quarterfinals.find((m) => Number(m.round_number) === 1);
    const qf2 = quarterfinals.find((m) => Number(m.round_number) === 2);
    const qf3 = quarterfinals.find((m) => Number(m.round_number) === 3);
    const qf4 = quarterfinals.find((m) => Number(m.round_number) === 4);

    if (!qf1 || !qf2 || !qf3 || !qf4) {
      alert("Quarter-final round numbers 1 to 4 are required.");
      return;
    }

    if (
      !qf1.winner_team_id ||
      !qf2.winner_team_id ||
      !qf3.winner_team_id ||
      !qf4.winner_team_id
    ) {
      alert("Each quarter-final match must have winner_team_id filled.");
      return;
    }

    const sfSlot1 = semifinalSlots[0] || { time: "", field: "" };
    const sfSlot2 = semifinalSlots[1] || { time: "", field: "" };

    const semifinalMatches = [
      {
        tournament_id: tournamentId,
        team_a_id: qf1.winner_team_id,
        team_b_id: qf2.winner_team_id,
        match_date: semifinalDate,
        match_time: sfSlot1.time || null,
        field: sfSlot1.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "semifinal",
        group_name: null,
        round_number: 1,
        winner_team_id: null,
        source_match_1: qf1.id,
        source_match_2: qf2.id,
      },
      {
        tournament_id: tournamentId,
        team_a_id: qf3.winner_team_id,
        team_b_id: qf4.winner_team_id,
        match_date: semifinalDate,
        match_time: sfSlot2.time || null,
        field: sfSlot2.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "semifinal",
        group_name: null,
        round_number: 2,
        winner_team_id: null,
        source_match_1: qf3.id,
        source_match_2: qf4.id,
      },
    ];

    const { error: insertSemifinalsError } = await supabase
      .from("matches")
      .insert(semifinalMatches);

    if (insertSemifinalsError) {
      console.error(
        "Error creating semi-finals:",
        insertSemifinalsError.message
      );
      alert(insertSemifinalsError.message);
      return;
    }

    alert("Semi-finals generated successfully.");
  };

  const handleGenerateFinalStage = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!finalDate || !thirdPlaceDate) {
      alert("Please select both Final date and 3rd Place date first.");
      return;
    }

    if (finalDate < today || thirdPlaceDate < today) {
      alert("Final stage dates cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate the Final and 3rd Place match from semi-final results. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: existingFinalStage, error: existingFinalStageError } =
      await supabase
        .from("matches")
        .select("id, stage")
        .eq("tournament_id", tournamentId)
        .in("stage", ["final", "third_place"]);

    if (existingFinalStageError) {
      console.error(
        "Error checking existing final stage:",
        existingFinalStageError.message
      );
      alert(existingFinalStageError.message);
      return;
    }

    if (existingFinalStage && existingFinalStage.length > 0) {
      alert("Final or 3rd Place match already exists for this tournament.");
      return;
    }

    const { data: semifinals, error: semifinalsError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("stage", "semifinal")
      .order("round_number", { ascending: true });

    if (semifinalsError) {
      console.error("Error fetching semi-finals:", semifinalsError.message);
      alert(semifinalsError.message);
      return;
    }

    if (!semifinals || semifinals.length !== 2) {
      alert("Exactly 2 semi-final matches are required.");
      return;
    }

    const unfinishedSemifinals = semifinals.filter(
      (match) => match.status !== "finished"
    );

    if (unfinishedSemifinals.length > 0) {
      alert("All semi-final matches must be finished before generating final stage.");
      return;
    }

    const sf1 = semifinals.find((m) => Number(m.round_number) === 1);
    const sf2 = semifinals.find((m) => Number(m.round_number) === 2);

    if (!sf1 || !sf2) {
      alert("Semi-final round numbers 1 and 2 are required.");
      return;
    }

    if (!sf1.winner_team_id || !sf2.winner_team_id) {
      alert("Each semi-final match must have winner_team_id filled.");
      return;
    }

    const loserSf1 =
      sf1.winner_team_id === sf1.team_a_id ? sf1.team_b_id : sf1.team_a_id;
    const loserSf2 =
      sf2.winner_team_id === sf2.team_a_id ? sf2.team_b_id : sf2.team_a_id;

    if (!loserSf1 || !loserSf2) {
      alert("Could not determine semi-final losers.");
      return;
    }

    const finalStageMatches = [
      {
        tournament_id: tournamentId,
        team_a_id: sf1.winner_team_id,
        team_b_id: sf2.winner_team_id,
        match_date: finalDate,
        match_time: finalSlot.time || null,
        field: finalSlot.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "final",
        group_name: null,
        round_number: 1,
        winner_team_id: null,
        source_match_1: sf1.id,
        source_match_2: sf2.id,
      },
      {
        tournament_id: tournamentId,
        team_a_id: loserSf1,
        team_b_id: loserSf2,
        match_date: thirdPlaceDate,
        match_time: thirdPlaceSlot.time || null,
        field: thirdPlaceSlot.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: "third_place",
        group_name: null,
        round_number: 1,
        winner_team_id: null,
        source_match_1: sf1.id,
        source_match_2: sf2.id,
      },
    ];

    const { error: insertFinalStageError } = await supabase
      .from("matches")
      .insert(finalStageMatches);

    if (insertFinalStageError) {
      console.error(
        "Error creating final stage:",
        insertFinalStageError.message
      );
      alert(insertFinalStageError.message);
      return;
    }

    alert("Final and 3rd Place matches generated successfully.");
  };

  const showSection = (key) => (!isMobile ? true : openSections[key]);

  return (
    <>
      <style>
        {`
          .tour-input,
          .tour-date-input,
          .tour-time-input,
          .tour-select {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            color: #111827;
            background: #ffffff;
            appearance: none;
            -webkit-appearance: none;
          }

          .tour-date-input,
          .tour-time-input {
            min-height: 48px;
            line-height: 1.2;
          }

          .tour-date-input::placeholder,
          .tour-time-input::placeholder,
          .tour-input::placeholder {
            color: #9ca3af;
          }

          .tour-date-input::-webkit-calendar-picker-indicator,
          .tour-time-input::-webkit-calendar-picker-indicator {
            opacity: 1;
            cursor: pointer;
          }

          .tour-slot-card {
            overflow: hidden;
          }

          @media (max-width: 1024px) {
            .tour-form-grid,
            .tour-config-grid,
            .tour-two-grid {
              grid-template-columns: 1fr !important;
            }

            .tour-header-row {
              flex-direction: column !important;
              align-items: flex-start !important;
            }

            .tour-actions {
              width: 100% !important;
              justify-content: flex-start !important;
            }
          }

          @media (max-width: 768px) {
            .tour-page {
              padding: 12px !important;
            }

            .tour-container {
              max-width: 100% !important;
            }

            .tour-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .tour-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .tour-card,
            .tour-list-card {
              padding: 14px !important;
              border-radius: 16px !important;
            }

            .tour-main-actions {
              flex-direction: column !important;
            }

            .tour-main-actions button {
              width: 100% !important;
            }

            .tour-actions {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .tour-actions button {
              width: 100% !important;
            }

            .tour-slot-grid {
              grid-template-columns: 1fr !important;
            }

            .tour-slot-card {
              padding: 12px !important;
              gap: 8px !important;
              border-radius: 14px !important;
            }

            .tour-input,
            .tour-date-input,
            .tour-time-input,
            .tour-select {
              padding: 11px 12px !important;
              font-size: 14px !important;
              min-height: 44px !important;
            }

            .tour-date-helper {
              font-size: 11px !important;
            }

            .tour-name {
              font-size: 18px !important;
            }

            .tour-meta {
              font-size: 13px !important;
              line-height: 1.5 !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="tour-page">
        <div style={pageContainerStyle} className="tour-container">
          <div style={heroCardStyle} className="tour-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="tour-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Tournament Management</h1>
                <p style={heroTextStyle}>
                  Create tournaments, configure match settings, schedule stages,
                  and manage the full competition flow from one place.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <PlayCircle size={16} />
                Competition Setup
              </div>
            </div>
          </div>

          <AccordionSection
            title={editingTournamentId ? "Edit Tournament" : "Create Tournament"}
            subtitle="Define the basics of your competition before generating rounds"
            icon={<Trophy size={18} />}
            iconStyle={sectionIconBlueStyle}
            isMobile={isMobile}
            isOpen={showSection("create")}
            onToggle={() => toggleSection("create")}
            className="tour-card"
          >
            <form
              onSubmit={handleSubmit}
              style={formGridStyle}
              className="tour-form-grid"
            >
              <Field label="Tournament name">
                <input
                  type="text"
                  placeholder="Tournament name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Type">
                <input
                  type="text"
                  placeholder="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Format">
                <input
                  type="text"
                  placeholder="Format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Venue">
                <input
                  type="text"
                  placeholder="Venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Start date">
                <DateInput
                  value={startDate}
                  min={today}
                  onChange={setStartDate}
                  helper="Tap to select start date"
                />
              </Field>

              <Field label="End date">
                <DateInput
                  value={endDate}
                  min={startDate || today}
                  onChange={setEndDate}
                  helper="Tap to select end date"
                />
              </Field>

              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={inputStyle}
                  className="tour-select"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>

              <Field label="Tournament logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Minimum players">
                <input
                  type="number"
                  min="1"
                  placeholder="Minimum players"
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Maximum players">
                <input
                  type="number"
                  min="1"
                  placeholder="Maximum players"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Maximum teams">
                <input
                  type="number"
                  min="1"
                  placeholder="Maximum teams"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <div style={mainActionsRowStyle} className="tour-main-actions">
                <button type="submit" disabled={loading} style={saveButtonStyle}>
                  {loading
                    ? "Saving..."
                    : editingTournamentId
                    ? "Update Tournament"
                    : "Create Tournament"}
                </button>

                {editingTournamentId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={cancelButtonStyle}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </AccordionSection>

          <AccordionSection
            title="Match Time Configuration"
            subtitle="Set the standard timing for all generated matches"
            icon={<Settings2 size={18} />}
            iconStyle={sectionIconGreenStyle}
            isMobile={isMobile}
            isOpen={showSection("matchConfig")}
            onToggle={() => toggleSection("matchConfig")}
            className="tour-card"
          >
            <div style={configGridStyle} className="tour-config-grid">
              <Field label="1st Half (minutes)">
                <input
                  type="number"
                  min="1"
                  value={matchConfig.firstHalfMinutes}
                  onChange={(e) =>
                    setMatchConfig((prev) => ({
                      ...prev,
                      firstHalfMinutes: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="2nd Half (minutes)">
                <input
                  type="number"
                  min="1"
                  value={matchConfig.secondHalfMinutes}
                  onChange={(e) =>
                    setMatchConfig((prev) => ({
                      ...prev,
                      secondHalfMinutes: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>

              <Field label="Break Time (minutes)">
                <input
                  type="number"
                  min="0"
                  value={matchConfig.breakMinutes}
                  onChange={(e) =>
                    setMatchConfig((prev) => ({
                      ...prev,
                      breakMinutes: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  className="tour-input"
                />
              </Field>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Group Stage Schedule"
            subtitle="Choose dates and slots for round 1, round 2, and round 3"
            icon={<CalendarDays size={18} />}
            iconStyle={sectionIconBlueStyle}
            isMobile={isMobile}
            isOpen={showSection("groupStage")}
            onToggle={() => toggleSection("groupStage")}
            className="tour-card"
          >
            <StageDateBlock
              title="Round 1 Date"
              value={round1Date}
              min={today}
              onChange={setRound1Date}
            />
            <div style={slotsGridStyle} className="tour-slot-grid">
              {round1Slots.map((slot, index) => (
                <SlotCard
                  key={`r1-${index}`}
                  title={`Round 1 - Match ${index + 1}`}
                  slot={slot}
                  onTimeChange={(value) =>
                    updateSlot(setRound1Slots, index, "time", value)
                  }
                  onFieldChange={(value) =>
                    updateSlot(setRound1Slots, index, "field", value)
                  }
                />
              ))}
            </div>

            <StageDateBlock
              title="Round 2 Date"
              value={round2Date}
              min={today}
              onChange={setRound2Date}
            />
            <div style={slotsGridStyle} className="tour-slot-grid">
              {round2Slots.map((slot, index) => (
                <SlotCard
                  key={`r2-${index}`}
                  title={`Round 2 - Match ${index + 1}`}
                  slot={slot}
                  onTimeChange={(value) =>
                    updateSlot(setRound2Slots, index, "time", value)
                  }
                  onFieldChange={(value) =>
                    updateSlot(setRound2Slots, index, "field", value)
                  }
                />
              ))}
            </div>

            <StageDateBlock
              title="Round 3 Date"
              value={round3Date}
              min={today}
              onChange={setRound3Date}
            />
            <div style={slotsGridStyle} className="tour-slot-grid">
              {round3Slots.map((slot, index) => (
                <SlotCard
                  key={`r3-${index}`}
                  title={`Round 3 - Match ${index + 1}`}
                  slot={slot}
                  onTimeChange={(value) =>
                    updateSlot(setRound3Slots, index, "time", value)
                  }
                  onFieldChange={(value) =>
                    updateSlot(setRound3Slots, index, "field", value)
                  }
                />
              ))}
            </div>
          </AccordionSection>

          <AccordionSection
            title="Knockout Schedule"
            subtitle="Configure quarter-finals, semi-finals, final, and 3rd place"
            icon={<Layers3 size={18} />}
            iconStyle={sectionIconRedStyle}
            isMobile={isMobile}
            isOpen={showSection("knockout")}
            onToggle={() => toggleSection("knockout")}
            className="tour-card"
          >
            <StageDateBlock
              title="Quarter-final Date"
              value={quarterfinalDate}
              min={today}
              onChange={setQuarterfinalDate}
            />
            <div style={slotsGridStyle} className="tour-slot-grid">
              {quarterfinalSlots.map((slot, index) => (
                <SlotCard
                  key={`qf-${index}`}
                  title={`Quarter-final ${index + 1}`}
                  slot={slot}
                  onTimeChange={(value) =>
                    updateSlot(setQuarterfinalSlots, index, "time", value)
                  }
                  onFieldChange={(value) =>
                    updateSlot(setQuarterfinalSlots, index, "field", value)
                  }
                />
              ))}
            </div>

            <StageDateBlock
              title="Semi-final Date"
              value={semifinalDate}
              min={today}
              onChange={setSemifinalDate}
            />
            <div style={twoSlotsGridStyle} className="tour-two-grid">
              {semifinalSlots.map((slot, index) => (
                <SlotCard
                  key={`sf-${index}`}
                  title={`Semi-final ${index + 1}`}
                  slot={slot}
                  onTimeChange={(value) =>
                    updateSlot(setSemifinalSlots, index, "time", value)
                  }
                  onFieldChange={(value) =>
                    updateSlot(setSemifinalSlots, index, "field", value)
                  }
                />
              ))}
            </div>

            <div style={{ marginTop: "18px" }}>
              <div style={twoSlotsGridStyle} className="tour-two-grid">
                <Field label="Final Date">
                  <DateInput
                    value={finalDate}
                    min={today}
                    onChange={setFinalDate}
                    helper="Tap to select final date"
                  />
                </Field>

                <Field label="3rd Place Date">
                  <DateInput
                    value={thirdPlaceDate}
                    min={today}
                    onChange={setThirdPlaceDate}
                    helper="Tap to select 3rd place date"
                  />
                </Field>
              </div>
            </div>

            <div style={twoSlotsGridStyle} className="tour-two-grid">
              <SlotCard
                title="Final"
                slot={finalSlot}
                onTimeChange={(value) =>
                  setFinalSlot((prev) => ({ ...prev, time: value }))
                }
                onFieldChange={(value) =>
                  setFinalSlot((prev) => ({ ...prev, field: value }))
                }
              />

              <SlotCard
                title="3rd Place"
                slot={thirdPlaceSlot}
                onTimeChange={(value) =>
                  setThirdPlaceSlot((prev) => ({ ...prev, time: value }))
                }
                onFieldChange={(value) =>
                  setThirdPlaceSlot((prev) => ({ ...prev, field: value }))
                }
              />
            </div>
          </AccordionSection>

          <AccordionSection
            title="Tournament List"
            subtitle="Manage tournament status, edit details, and generate stages"
            icon={<Flag size={18} />}
            iconStyle={sectionIconBlueStyle}
            isMobile={isMobile}
            isOpen={showSection("list")}
            onToggle={() => toggleSection("list")}
            className="tour-list-card"
          >
            {tournaments.length === 0 ? (
              <div style={emptyStateStyle}>No tournaments yet.</div>
            ) : (
              <div style={{ display: "grid", gap: "18px" }}>
                {tournaments.map((t) => (
                  <div key={t.id} style={tournamentCardStyle}>
                    <div
                      style={tournamentHeaderRowStyle}
                      className="tour-header-row"
                    >
                      <div style={tournamentInfoWrapStyle}>
                        <div style={tournamentLogoWrapStyle}>
                          {t.logo_url ? (
                            <img
                              src={t.logo_url}
                              alt={t.name}
                              style={tournamentLogoStyle}
                            />
                          ) : (
                            <span style={tournamentLogoFallbackStyle}>
                              {t.name?.charAt(0)?.toUpperCase() || "T"}
                            </span>
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3 style={tournamentNameStyle} className="tour-name">
                            {t.name}
                          </h3>
                          <div style={tournamentMetaStyle} className="tour-meta">
                            {t.type || "-"} • {t.format || "-"} • {t.venue || "-"}
                          </div>
                          <div style={tournamentDateStyle}>
                            {t.start_date || "-"} → {t.end_date || "-"}
                          </div>
                          <div style={tournamentRulesStyle}>
                            <span style={rulePillStyle}>
                              <Users size={13} />
                              Min Players: {t.min_players ?? "-"}
                            </span>
                            <span style={rulePillStyle}>
                              <Users size={13} />
                              Max Players: {t.max_players ?? "-"}
                            </span>
                            <span style={rulePillStyle}>
                              <Users size={13} />
                              Max Teams: {t.max_teams ?? "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <select
                        value={t.status || "upcoming"}
                        onChange={(e) => handleChangeStatus(t.id, e.target.value)}
                        style={{
                          ...statusSelectStyle,
                          ...getStatusStyle(t.status),
                        }}
                        className="tour-select"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div style={actionWrapStyle} className="tour-actions">
                      <ActionButton
                        color="#109847"
                        icon={<PlayCircle size={15} />}
                        label="Generate Groups"
                        onClick={() => handleGenerateGroupsAndMatches(t.id)}
                      />
                      <ActionButton
                        color="#7c3aed"
                        icon={<Layers3 size={15} />}
                        label="Generate Quarterfinals"
                        onClick={() => handleGenerateQuarterfinals(t.id)}
                      />
                      <ActionButton
                        color="#ea580c"
                        icon={<Layers3 size={15} />}
                        label="Generate Semifinals"
                        onClick={() => handleGenerateSemifinals(t.id)}
                      />
                      <ActionButton
                        color="#cf2136"
                        icon={<Flag size={15} />}
                        label="Generate Final Stage"
                        onClick={() => handleGenerateFinalStage(t.id)}
                      />
                      <ActionButton
                        color="#1476b6"
                        icon={<Pencil size={15} />}
                        label="Edit"
                        onClick={() => handleEdit(t)}
                      />
                      <ActionButton
                        color="#64748b"
                        icon={<Trash2 size={15} />}
                        label="Delete"
                        onClick={() => handleDelete(t.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>
        </div>
      </div>
    </>
  );
}

function AccordionSection({
  title,
  subtitle,
  icon,
  iconStyle,
  children,
  isMobile,
  isOpen,
  onToggle,
  className,
}) {
  return (
    <div style={sectionCardStyle} className={className}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          ...accordionButtonStyle,
          cursor: isMobile ? "pointer" : "default",
        }}
      >
        <div style={sectionTitleWrapStyle}>
          <div style={iconStyle}>{icon}</div>
          <div style={{ textAlign: "left" }}>
            <div style={sectionTitleStyle}>{title}</div>
            <div style={sectionSubtitleStyle}>{subtitle}</div>
          </div>
        </div>

        {isMobile && (
          <div style={accordionArrowStyle}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </button>

      {isOpen && <div style={{ marginTop: "18px" }}>{children}</div>}
    </div>
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

function DateInput({ value, min, onChange, helper }) {
  return (
    <div>
      <input
        type="text"
        placeholder="jj/mm/aaaa"
        value={value || ""}
        onFocus={(e) => {
          e.target.type = "date";
          if (min) e.target.min = min;
        }}
        onBlur={(e) => {
          if (!e.target.value) e.target.type = "text";
        }}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        className="tour-date-input"
      />
      <div style={dateHelperStyle} className="tour-date-helper">
        {helper}
      </div>
    </div>
  );
}

function TimeInput({ value, onChange }) {
  return (
    <div>
      <input
        type="text"
        placeholder="--:--"
        value={value || ""}
        onFocus={(e) => {
          e.target.type = "time";
        }}
        onBlur={(e) => {
          if (!e.target.value) e.target.type = "text";
        }}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        className="tour-time-input"
      />
      <div style={dateHelperStyle} className="tour-date-helper">
        Tap to select time
      </div>
    </div>
  );
}

function StageDateBlock({ title, value, min, onChange }) {
  return (
    <div style={{ marginBottom: "16px", marginTop: "6px" }}>
      <label style={labelStyle}>{title}</label>
      <DateInput
        value={value}
        min={min}
        onChange={onChange}
        helper={`Tap to select ${title.toLowerCase()}`}
      />
    </div>
  );
}

function SlotCard({ title, slot, onTimeChange, onFieldChange }) {
  return (
    <div style={slotCardStyle} className="tour-slot-card">
      <div style={slotTitleStyle}>{title}</div>

      <TimeInput value={slot.time} onChange={onTimeChange} />

      <input
        type="text"
        placeholder="Field / Venue"
        value={slot.field}
        onChange={(e) => onFieldChange(e.target.value)}
        style={inputStyle}
        className="tour-input"
      />
    </div>
  );
}

function ActionButton({ color, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...actionButtonStyle,
        background: color,
      }}
    >
      <span style={actionButtonInnerStyle}>
        {icon}
        {label}
      </span>
    </button>
  );
}

const pageStyle = {
  padding: "24px",
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

const sectionCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e5e7eb",
  marginBottom: "24px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const accordionButtonStyle = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
};

const accordionArrowStyle = {
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitleWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
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

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const configGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "14px",
};

const twoSlotsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "14px",
};

const slotsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "8px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const dateHelperStyle = {
  marginTop: "6px",
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "600",
};

const mainActionsRowStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  gap: "12px",
  marginTop: "4px",
};

const saveButtonStyle = {
  background: "#109847",
  color: "#fff",
  border: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  flex: 1,
};

const cancelButtonStyle = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const slotCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "14px",
  background: "#fafafa",
  display: "grid",
  gap: "10px",
};

const slotTitleStyle = {
  fontWeight: "800",
  color: "#111827",
  fontSize: "14px",
};

const emptyStateStyle = {
  background: "#fafafa",
  border: "1px dashed #d1d5db",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
  color: "#6b7280",
  fontWeight: "600",
};

const tournamentCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  background: "#fafafa",
};

const tournamentHeaderRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "14px",
};

const tournamentInfoWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  minWidth: 0,
  flex: 1,
};

const tournamentLogoWrapStyle = {
  width: "64px",
  height: "64px",
  minWidth: "64px",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const tournamentLogoStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const tournamentLogoFallbackStyle = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#6b7280",
};

const tournamentNameStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
  color: "#111827",
  lineHeight: 1.2,
};

const tournamentMetaStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#4b5563",
  fontWeight: "500",
};

const tournamentDateStyle = {
  marginTop: "6px",
  fontSize: "13px",
  color: "#6b7280",
};

const tournamentRulesStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const rulePillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#eef4fb",
  color: "#1476b6",
  border: "1px solid #dbe7f4",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: "700",
};

const statusSelectStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  fontWeight: "700",
  outline: "none",
  cursor: "pointer",
};

const actionWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionButtonStyle = {
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
};

const actionButtonInnerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

export default Tournaments;