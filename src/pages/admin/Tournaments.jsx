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

const TOURNAMENT_SCHEDULE_DRAFT_KEY = "tournament_schedule_draft_v1";

const saveScheduleDraft = (draft) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    TOURNAMENT_SCHEDULE_DRAFT_KEY,
    JSON.stringify(draft)
  );
};

const loadScheduleDraft = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TOURNAMENT_SCHEDULE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Error loading schedule draft:", error);
    return null;
  }
};

const clearScheduleDraft = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOURNAMENT_SCHEDULE_DRAFT_KEY);
};

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
  const [activeScheduleTournamentId, setActiveScheduleTournamentId] = useState("");

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

  useEffect(() => {
    const draft = loadScheduleDraft();
    if (!draft) return;

    setActiveScheduleTournamentId(draft.activeScheduleTournamentId || "");
    setRound1Date(draft.round1Date || "");
    setRound2Date(draft.round2Date || "");
    setRound3Date(draft.round3Date || "");
    setQuarterfinalDate(draft.quarterfinalDate || "");
    setSemifinalDate(draft.semifinalDate || "");
    setFinalDate(draft.finalDate || "");
    setThirdPlaceDate(draft.thirdPlaceDate || "");

    if (Array.isArray(draft.round1Slots) && draft.round1Slots.length > 0) {
      setRound1Slots(draft.round1Slots);
    }
    if (Array.isArray(draft.round2Slots) && draft.round2Slots.length > 0) {
      setRound2Slots(draft.round2Slots);
    }
    if (Array.isArray(draft.round3Slots) && draft.round3Slots.length > 0) {
      setRound3Slots(draft.round3Slots);
    }
    if (Array.isArray(draft.quarterfinalSlots) && draft.quarterfinalSlots.length > 0) {
      setQuarterfinalSlots(draft.quarterfinalSlots);
    }
    if (Array.isArray(draft.semifinalSlots) && draft.semifinalSlots.length > 0) {
      setSemifinalSlots(draft.semifinalSlots);
    }
    if (draft.finalSlot) {
      setFinalSlot(draft.finalSlot);
    }
    if (draft.thirdPlaceSlot) {
      setThirdPlaceSlot(draft.thirdPlaceSlot);
    }
  }, []);

  useEffect(() => {
    saveScheduleDraft({
      activeScheduleTournamentId,
      round1Date,
      round2Date,
      round3Date,
      quarterfinalDate,
      semifinalDate,
      finalDate,
      thirdPlaceDate,
      round1Slots,
      round2Slots,
      round3Slots,
      quarterfinalSlots,
      semifinalSlots,
      finalSlot,
      thirdPlaceSlot,
    });
  }, [
    activeScheduleTournamentId,
    round1Date,
    round2Date,
    round3Date,
    quarterfinalDate,
    semifinalDate,
    finalDate,
    thirdPlaceDate,
    round1Slots,
    round2Slots,
    round3Slots,
    quarterfinalSlots,
    semifinalSlots,
    finalSlot,
    thirdPlaceSlot,
  ]);

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


  const PREFERRED_TEAMS_PER_GROUP = 4;

  const createEmptySlots = (count) =>
    Array.from({ length: count }, () => ({ time: "", field: "" }));

  const resizeSlots = (slots, nextLength) => {
    const safeLength = Math.max(1, Number(nextLength) || 1);
    return Array.from({ length: safeLength }, (_, index) => slots[index] || { time: "", field: "" });
  };

  const getGroupLabel = (index) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let label = "";
    let current = index;

    do {
      label = alphabet[current % 26] + label;
      current = Math.floor(current / 26) - 1;
    } while (current >= 0);

    return label;
  };

  const buildBalancedGroupSizes = (teamCount, preferredSize = PREFERRED_TEAMS_PER_GROUP) => {
    const safeTeamCount = Number(teamCount) || 0;
    if (safeTeamCount <= 0) return [];

    const totalGroups = Math.ceil(safeTeamCount / preferredSize);
    const baseSize = Math.floor(safeTeamCount / totalGroups);
    const remainder = safeTeamCount % totalGroups;

    return Array.from({ length: totalGroups }, (_, index) =>
      baseSize + (index < remainder ? 1 : 0)
    );
  };

  const distributeTeamsIntoBalancedGroups = (teams, preferredSize = PREFERRED_TEAMS_PER_GROUP) => {
    const sizes = buildBalancedGroupSizes(teams.length, preferredSize);
    const groups = [];
    let cursor = 0;

    sizes.forEach((size) => {
      groups.push(teams.slice(cursor, cursor + size));
      cursor += size;
    });

    return groups;
  };

  const createRoundRobinRounds = (teams) => {
    const teamList = [...teams];
    if (teamList.length < 2) return [];

    const hasBye = teamList.length % 2 !== 0;
    const working = hasBye ? [...teamList, null] : [...teamList];
    const rounds = [];
    const totalRounds = working.length - 1;
    const half = working.length / 2;

    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
      const roundMatches = [];

      for (let i = 0; i < half; i += 1) {
        const home = working[i];
        const away = working[working.length - 1 - i];

        if (home && away) {
          roundMatches.push({
            teamA: roundIndex % 2 === 0 ? home : away,
            teamB: roundIndex % 2 === 0 ? away : home,
          });
        }
      }

      rounds.push(roundMatches);

      const fixed = working[0];
      const rotating = working.slice(1);
      rotating.unshift(rotating.pop());
      working.splice(0, working.length, fixed, ...rotating);
    }

    return rounds;
  };

  const getRecommendedGroupStageSlotCount = (teamCount) => {
    const sizes = buildBalancedGroupSizes(teamCount);
    if (sizes.length === 0) return 8;

    return Math.max(
      8,
      sizes.reduce((total, size) => total + Math.floor(size / 2), 0)
    );
  };

  const isPowerOfTwo = (value) => {
    const safeValue = Number(value) || 0;
    return safeValue > 0 && (safeValue & (safeValue - 1)) === 0;
  };

  const getLargestPowerOfTwoAtMost = (value) => {
    const safeValue = Number(value) || 0;
    if (safeValue < 1) return 0;

    let power = 1;
    while (power * 2 <= safeValue) {
      power *= 2;
    }
    return power;
  };

  const getKnockoutStageName = (qualifiedTeamCount) => {
    const safeCount = Number(qualifiedTeamCount) || 0;

    if (safeCount === 2) return "final";
    if (safeCount === 4) return "semifinal";
    if (safeCount === 8) return "quarterfinal";
    if (safeCount === 16) return "round_of_16";
    if (safeCount === 32) return "round_of_32";
    if (safeCount === 64) return "round_of_64";

    return `round_of_${safeCount}`;
  };

  const getStageTeamCount = (stageName) => {
    if (!stageName) return 0;
    if (stageName === "final") return 2;
    if (stageName === "semifinal") return 4;
    if (stageName === "quarterfinal") return 8;

    const parsed = String(stageName).match(/^round_of_(\d+)$/);
    return parsed ? Number(parsed[1]) : 0;
  };

  const rankGroupTable = (teamsMap) =>
    Object.values(teamsMap || {}).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      if (a.ga !== b.ga) return a.ga - b.ga;
      return a.team_name.localeCompare(b.team_name);
    });

  const isValidKnockoutSize = (value) => {
    const safeValue = Number(value) || 0;
    return safeValue >= 2 && isPowerOfTwo(safeValue);
  };

  const getNextValidKnockoutSize = (value) => {
    const safeValue = Math.max(2, Number(value) || 0);
    let size = 2;

    while (size < safeValue) {
      size *= 2;
    }

    return size;
  };

  const selectBestThirdPlacedTeams = (rankedGroups, countNeeded) => {
    if (!countNeeded || countNeeded < 1) return [];

    const thirdPlacedTeams = rankedGroups
      .map((group) => group[2])
      .filter(Boolean)
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        if (a.ga !== b.ga) return a.ga - b.ga;
        return a.team_name.localeCompare(b.team_name);
      })
      .map((team, index) => ({
        ...team,
        seed_bucket: 3,
        seed_order: index + 1,
      }));

    return thirdPlacedTeams.slice(0, countNeeded);
  };

  const buildGroupStandings = (teams, matches) => {
    const groupsMap = {};

    (teams || []).forEach((team) => {
      const groupName = team.group_name;
      if (!groupName) return;

      if (!groupsMap[groupName]) {
        groupsMap[groupName] = {};
      }

      groupsMap[groupName][team.id] = {
        team_id: team.id,
        team_name: team.company_name || team.team_name,
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

    (matches || []).forEach((match) => {
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

    return groupsMap;
  };

  const buildSeededKnockoutTeams = (groupsMap) => {
    const rankedGroupNames = Object.keys(groupsMap).sort((a, b) => a.localeCompare(b));
    const rankedGroups = rankedGroupNames.map((groupName) =>
      rankGroupTable(groupsMap[groupName])
    );

    if (rankedGroups.length < 2) {
      return {
        error: "At least 2 groups are required to generate a knockout stage.",
      };
    }

    const winners = rankedGroups
      .map((group) => group[0])
      .filter(Boolean)
      .map((team, index) => ({
        ...team,
        seed_bucket: 1,
        seed_order: index + 1,
      }));

    const runnersUp = rankedGroups
      .map((group) => group[1])
      .filter(Boolean)
      .map((team, index) => ({
        ...team,
        seed_bucket: 2,
        seed_order: index + 1,
      }));

    const defaultQualifiers = [...winners, ...runnersUp];
    const defaultQualifiedCount = defaultQualifiers.length;

    if (defaultQualifiedCount < 2) {
      return {
        error: "Not enough qualified teams to build a knockout stage.",
      };
    }

    let targetKnockoutSize = defaultQualifiedCount;

    if (!isValidKnockoutSize(defaultQualifiedCount)) {
      const requestedTarget = getNextValidKnockoutSize(defaultQualifiedCount);
      const availableThirdPlacedCount = rankedGroups.filter((group) => Boolean(group[2])).length;
      const neededThirdPlacedCount = requestedTarget - defaultQualifiedCount;

      if (availableThirdPlacedCount < neededThirdPlacedCount) {
        return {
          error:
            "Could not reach a valid knockout bracket size with the available 3rd-placed teams.",
        };
      }

      targetKnockoutSize = requestedTarget;
    }

    const neededBestThirdPlacedCount = Math.max(0, targetKnockoutSize - defaultQualifiedCount);
    const bestThirdPlacedTeams = selectBestThirdPlacedTeams(
      rankedGroups,
      neededBestThirdPlacedCount
    );

    if (bestThirdPlacedTeams.length !== neededBestThirdPlacedCount) {
      return {
        error: "Could not select enough 3rd-placed teams to complete the knockout bracket.",
      };
    }

    const qualifiers = [...defaultQualifiers, ...bestThirdPlacedTeams].sort((a, b) => {
      if (a.seed_bucket !== b.seed_bucket) return a.seed_bucket - b.seed_bucket;
      return a.seed_order - b.seed_order;
    });

    return {
      rankedGroupNames,
      rankedGroups,
      qualifiers,
      knockoutSize: qualifiers.length,
      defaultQualifiedCount,
      addedThirdPlacedCount: bestThirdPlacedTeams.length,
      bestThirdPlacedTeams,
    };
  };

  const createSeededBracketPairings = (seededTeams) => {
    const remaining = [...seededTeams];
    const pairings = [];

    while (remaining.length > 1) {
      const teamA = remaining.shift();

      let opponentIndex = remaining.length - 1;
      while (
        opponentIndex > 0 &&
        remaining[opponentIndex]?.group_name === teamA?.group_name
      ) {
        opponentIndex -= 1;
      }

      const [teamB] = remaining.splice(opponentIndex, 1);

      if (teamA && teamB) {
        pairings.push({ teamA, teamB });
      }
    }

    return pairings;
  };

  const getExistingKnockoutMatches = async (tournamentId) => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .not("stage", "eq", "group")
      .order("created_at", { ascending: true });

    return { data: data || [], error };
  };

  const getLatestPlayableKnockoutStage = (matches) => {
    const stageNames = [...new Set(
      (matches || [])
        .map((match) => match.stage)
        .filter((stage) => stage && stage !== "final" && stage !== "third_place")
    )];

    if (stageNames.length === 0) return null;

    return stageNames.sort((a, b) => getStageTeamCount(b) - getStageTeamCount(a))[0];
  };




  useEffect(() => {
    const teamCount = Number(maxTeams);
    if (!teamCount || teamCount < 1) return;

    const recommendedSlots = getRecommendedGroupStageSlotCount(teamCount);

    setRound1Slots((prev) => resizeSlots(prev, recommendedSlots));
    setRound2Slots((prev) => resizeSlots(prev, recommendedSlots));
    setRound3Slots((prev) => resizeSlots(prev, recommendedSlots));
  }, [maxTeams]);

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
    setActiveScheduleTournamentId("");
    clearScheduleDraft();

    setRound1Date("");
    setRound2Date("");
    setRound3Date("");
    setQuarterfinalDate("");
    setSemifinalDate("");
    setFinalDate("");
    setThirdPlaceDate("");

    const recommendedSlots = getRecommendedGroupStageSlotCount(Number(maxTeams) || 0);

    setRound1Slots(createEmptySlots(recommendedSlots));
    setRound2Slots(createEmptySlots(recommendedSlots));
    setRound3Slots(createEmptySlots(recommendedSlots));
    setQuarterfinalSlots(createEmptySlots(4));
    setSemifinalSlots(createEmptySlots(2));

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

  const getAssignedGroupsData = (teams) => {
    const grouped = (teams || []).reduce((acc, team) => {
      const groupName = (team.group_name || "").trim();
      if (!groupName) return acc;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(team);
      return acc;
    }, {});

    const orderedGroupNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    const groupEntries = orderedGroupNames.map((groupName) => ({
      groupName,
      teams: grouped[groupName],
    }));

    return {
      orderedGroupNames,
      groupEntries,
    };
  };

  const buildGroupStagePlanFromAssignedGroups = (teams) => {
    const { groupEntries } = getAssignedGroupsData(teams);

    if (groupEntries.length === 0) {
      return { error: "No groups found. Generate random groups first from the Standings page." };
    }

    if (groupEntries.some((entry) => entry.teams.length < 2)) {
      return { error: "Each group must contain at least 2 teams before generating matches." };
    }

    const groupedRoundMatches = [];

    groupEntries.forEach((entry) => {
      const rounds = createRoundRobinRounds(entry.teams);

      rounds.forEach((roundMatches, roundIndex) => {
        if (!groupedRoundMatches[roundIndex]) {
          groupedRoundMatches[roundIndex] = [];
        }

        groupedRoundMatches[roundIndex].push(
          ...roundMatches.map((pairing) => ({
            ...pairing,
            groupName: entry.groupName,
          }))
        );
      });
    });

    const requiredSlotsPerBucket = [0, 0, 0];
    groupedRoundMatches.forEach((roundMatches, roundIndex) => {
      const bucketIndex = Math.min(roundIndex, 2);
      requiredSlotsPerBucket[bucketIndex] += roundMatches.length;
    });

    return {
      groupEntries,
      groupedRoundMatches,
      requiredSlotsPerBucket,
    };
  };

  const ensureGroupStageSlotCapacity = (requiredSlotsPerBucket) => {
    let changed = false;

    setRound1Slots((prev) => {
      const next = resizeSlots(prev, requiredSlotsPerBucket[0] || 1);
      if (next.length !== prev.length) changed = true;
      return next;
    });

    setRound2Slots((prev) => {
      const next = resizeSlots(prev, requiredSlotsPerBucket[1] || 1);
      if (next.length !== prev.length) changed = true;
      return next;
    });

    setRound3Slots((prev) => {
      const next = resizeSlots(prev, requiredSlotsPerBucket[2] || 1);
      if (next.length !== prev.length) changed = true;
      return next;
    });

    return changed;
  };

  const getCurrentGroupStageBuckets = () => [
    { date: round1Date, slots: round1Slots },
    { date: round2Date, slots: round2Slots },
    { date: round3Date, slots: round3Slots },
  ];

  const getGroupStageScheduleIssues = (requiredSlotsPerBucket) => {
    const buckets = getCurrentGroupStageBuckets();
    const issues = [];

    buckets.forEach((bucket, index) => {
      const needed = requiredSlotsPerBucket[index] || 0;
      if (needed === 0) return;

      if (!bucket.date) {
        issues.push(`Round ${index + 1} date is required.`);
      } else if (bucket.date < today) {
        issues.push(`Round ${index + 1} date cannot be in the past.`);
      }

      for (let slotIndex = 0; slotIndex < needed; slotIndex += 1) {
        const slot = bucket.slots[slotIndex] || { time: "", field: "" };
        if (!slot.time || !slot.field) {
          issues.push(`Round ${index + 1} - Match ${slotIndex + 1} needs time and field.`);
          break;
        }
      }
    });

    return issues;
  };

  const buildGroupStageMatchesPayload = ({ tournamentId, groupedRoundMatches }) => {
    const roundBuckets = getCurrentGroupStageBuckets();
    const slotIndexes = [0, 0, 0];
    const matchesToInsert = [];

    groupedRoundMatches.forEach((roundMatches, roundIndex) => {
      const bucketIndex = Math.min(roundIndex, 2);
      const selectedBucket = roundBuckets[bucketIndex];

      roundMatches.forEach((pairing) => {
        const slot = selectedBucket.slots[slotIndexes[bucketIndex]] || {
          time: "",
          field: "",
        };
        slotIndexes[bucketIndex] += 1;

        matchesToInsert.push({
          tournament_id: tournamentId,
          team_a_id: pairing.teamA.id,
          team_b_id: pairing.teamB.id,
          match_date: selectedBucket.date,
          match_time: slot.time || null,
          field: slot.field || null,
          status: "scheduled",
          elapsed_seconds: 0,
          team_a_score: 0,
          team_b_score: 0,
          first_half_minutes: Number(matchConfig.firstHalfMinutes),
          second_half_minutes: Number(matchConfig.secondHalfMinutes),
          break_minutes: Number(matchConfig.breakMinutes),
          stage: "group",
          group_name: pairing.groupName,
          round_number: roundIndex + 1,
          winner_team_id: null,
          source_match_1: null,
          source_match_2: null,
        });
      });
    });

    return matchesToInsert;
  };

  const prepareGroupStageSchedule = async (tournamentId) => {
    const { data: tournamentTeams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("group_name", { ascending: true })
      .order("created_at", { ascending: true });

    if (teamsError) {
      console.error("Error fetching tournament teams:", teamsError.message);
      alert(teamsError.message);
      return null;
    }

    if (!tournamentTeams || tournamentTeams.length === 0) {
      alert("No teams found for this tournament.");
      return null;
    }

    const plan = buildGroupStagePlanFromAssignedGroups(tournamentTeams);
    if (plan.error) {
      alert(plan.error);
      return null;
    }

    const slotCountsChanged = ensureGroupStageSlotCapacity(plan.requiredSlotsPerBucket);

    return {
      tournamentTeams,
      ...plan,
      slotCountsChanged,
    };
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

  const handlePrepareGroupStageSchedule = async (tournamentId) => {
    setActiveScheduleTournamentId(String(tournamentId));

    const prepared = await prepareGroupStageSchedule(tournamentId);
    if (!prepared) return;

    alert(
      `Group slots are ready. Round 1: ${prepared.requiredSlotsPerBucket[0]}, Round 2: ${prepared.requiredSlotsPerBucket[1]}, Round 3: ${prepared.requiredSlotsPerBucket[2]}. Fill date, time, and field, then click Generate Group Matches.`
    );
  };

  const handleGenerateGroupMatches = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    setActiveScheduleTournamentId(String(tournamentId));

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
      alert("Group matches already exist for this tournament. Use Update Group Schedule if you changed date, time, or field.");
      return;
    }

    const prepared = await prepareGroupStageSchedule(tournamentId);
    if (!prepared) return;

    if (prepared.slotCountsChanged) {
      alert("The required group slots were loaded automatically. Fill the missing date, time, and field values, then click Generate Group Matches again.");
      return;
    }

    const scheduleIssues = getGroupStageScheduleIssues(prepared.requiredSlotsPerBucket);
    if (scheduleIssues.length > 0) {
      alert(scheduleIssues[0]);
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate all group matches using the groups already assigned in Standings. Continue?"
    );
    if (!confirmGenerate) return;

    const matchesToInsert = buildGroupStageMatchesPayload({
      tournamentId,
      groupedRoundMatches: prepared.groupedRoundMatches,
    });

    const { error: insertMatchesError } = await supabase
      .from("matches")
      .insert(matchesToInsert);

    if (insertMatchesError) {
      console.error("Error creating group matches:", insertMatchesError.message);
      alert(insertMatchesError.message);
      return;
    }

    clearScheduleDraft();
    setActiveScheduleTournamentId("");

    alert("Group matches generated successfully.");
  };

  const handleUpdateGroupMatchSchedule = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    setActiveScheduleTournamentId(String(tournamentId));

    const prepared = await prepareGroupStageSchedule(tournamentId);
    if (!prepared) return;

    const scheduleIssues = getGroupStageScheduleIssues(prepared.requiredSlotsPerBucket);
    if (scheduleIssues.length > 0) {
      alert(scheduleIssues[0]);
      return;
    }

    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("stage", "group")
      .order("round_number", { ascending: true })
      .order("group_name", { ascending: true })
      .order("created_at", { ascending: true });

    if (existingMatchesError) {
      console.error("Error fetching existing group matches:", existingMatchesError.message);
      alert(existingMatchesError.message);
      return;
    }

    if (!existingMatches || existingMatches.length === 0) {
      alert("No group matches exist yet. Generate group matches first.");
      return;
    }

    const roundBuckets = getCurrentGroupStageBuckets();
    const slotIndexes = [0, 0, 0];
    const updates = [];

    prepared.groupedRoundMatches.forEach((roundMatches, roundIndex) => {
      const bucketIndex = Math.min(roundIndex, 2);
      const selectedBucket = roundBuckets[bucketIndex];

      roundMatches.forEach((pairing) => {
        const slot = selectedBucket.slots[slotIndexes[bucketIndex]] || { time: "", field: "" };
        slotIndexes[bucketIndex] += 1;

        const matchRecord = existingMatches.find((match) => {
          const sameTeams =
            (String(match.team_a_id) === String(pairing.teamA.id) &&
              String(match.team_b_id) === String(pairing.teamB.id)) ||
            (String(match.team_a_id) === String(pairing.teamB.id) &&
              String(match.team_b_id) === String(pairing.teamA.id));

          return (
            sameTeams &&
            match.group_name === pairing.groupName &&
            Number(match.round_number || 0) === roundIndex + 1
          );
        });

        if (matchRecord) {
          updates.push({
            id: matchRecord.id,
            match_date: selectedBucket.date,
            match_time: slot.time || null,
            field: slot.field || null,
          });
        }
      });
    });

    for (const update of updates) {
      const { error } = await supabase
        .from("matches")
        .update({
          match_date: update.match_date,
          match_time: update.match_time,
          field: update.field,
        })
        .eq("id", update.id);

      if (error) {
        console.error("Error updating group match schedule:", error.message);
        alert(error.message);
        return;
      }
    }

    alert("Group match schedule updated successfully.");
  };

  const handleGenerateQuarterfinals = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!quarterfinalDate) {
      alert("Please select the first knockout round date first.");
      return;
    }

    if (quarterfinalDate < today) {
      alert("First knockout round date cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate the first knockout round from the final group standings. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: existingKnockoutMatches, error: existingKnockoutError } =
      await getExistingKnockoutMatches(tournamentId);

    if (existingKnockoutError) {
      console.error(
        "Error checking existing knockout matches:",
        existingKnockoutError.message
      );
      alert(existingKnockoutError.message);
      return;
    }

    if ((existingKnockoutMatches || []).length > 0) {
      alert("A knockout stage already exists for this tournament.");
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
      alert("All group matches must be finished before generating the knockout stage.");
      return;
    }

    const groupsMap = buildGroupStandings(tournamentTeams, groupMatches);
    const knockoutPlan = buildSeededKnockoutTeams(groupsMap);

    if (knockoutPlan.error) {
      alert(knockoutPlan.error);
      return;
    }

    const qualifiedTeams = knockoutPlan.qualifiers || [];
    const stageName = getKnockoutStageName(qualifiedTeams.length);

    if (!isValidKnockoutSize(qualifiedTeams.length) || qualifiedTeams.length < 4) {
      alert("Could not determine a valid knockout bracket size.");
      return;
    }

    const pairings = createSeededBracketPairings(qualifiedTeams);
    const requiredSlots = pairings.length;

    let nextQuarterfinalSlots = quarterfinalSlots;
    if (quarterfinalSlots.length < requiredSlots) {
      nextQuarterfinalSlots = resizeSlots(quarterfinalSlots, requiredSlots);
      setQuarterfinalSlots(nextQuarterfinalSlots);
    }

    const knockoutMatches = pairings.map((pairing, index) => {
      const slot = nextQuarterfinalSlots[index] || { time: "", field: "" };

      return {
        tournament_id: tournamentId,
        team_a_id: pairing.teamA.team_id,
        team_b_id: pairing.teamB.team_id,
        match_date: quarterfinalDate,
        match_time: slot.time || null,
        field: slot.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: stageName,
        group_name: null,
        round_number: index + 1,
        winner_team_id: null,
        source_match_1: null,
        source_match_2: null,
      };
    });

    const { error: insertKnockoutError } = await supabase
      .from("matches")
      .insert(knockoutMatches);

    if (insertKnockoutError) {
      console.error(
        "Error creating first knockout round:",
        insertKnockoutError.message
      );
      alert(insertKnockoutError.message);
      return;
    }

    alert("First knockout round generated successfully.");
  };

  const handleGenerateSemifinals = async (tournamentId) => {
    if (!validateMatchConfig()) return;

    if (!semifinalDate) {
      alert("Please select the next knockout round date first.");
      return;
    }

    if (semifinalDate < today) {
      alert("Next knockout round date cannot be in the past.");
      return;
    }

    const confirmGenerate = window.confirm(
      "This will generate the next knockout round from the previous round winners. Continue?"
    );
    if (!confirmGenerate) return;

    const { data: knockoutMatches, error: knockoutMatchesError } =
      await getExistingKnockoutMatches(tournamentId);

    if (knockoutMatchesError) {
      console.error(
        "Error fetching knockout matches:",
        knockoutMatchesError.message
      );
      alert(knockoutMatchesError.message);
      return;
    }

    const latestStageName = getLatestPlayableKnockoutStage(knockoutMatches);

    if (!latestStageName) {
      alert("Generate the first knockout round before generating the next one.");
      return;
    }

    const latestStageMatches = (knockoutMatches || [])
      .filter((match) => match.stage === latestStageName)
      .sort((a, b) => Number(a.round_number || 0) - Number(b.round_number || 0));

    const unfinishedMatches = latestStageMatches.filter(
      (match) => match.status !== "finished"
    );

    if (unfinishedMatches.length > 0) {
      alert("All matches in the current knockout round must be finished first.");
      return;
    }

    if (latestStageMatches.some((match) => !match.winner_team_id)) {
      alert("Each knockout match must have winner_team_id filled.");
      return;
    }

    const winners = latestStageMatches
      .map((match) => ({
        team_id: match.winner_team_id,
        source_match_id: match.id,
      }))
      .filter((item) => item.team_id);

    if (winners.length <= 2) {
      alert("The next step is the final stage. Use Generate Final Stage.");
      return;
    }

    const nextStageName = getKnockoutStageName(winners.length);

    const stageAlreadyExists = (knockoutMatches || []).some(
      (match) => match.stage === nextStageName
    );

    if (stageAlreadyExists) {
      alert("That knockout round already exists for this tournament.");
      return;
    }

    const requiredSlots = Math.floor(winners.length / 2);
    let nextSemifinalSlots = semifinalSlots;

    if (semifinalSlots.length < requiredSlots) {
      nextSemifinalSlots = resizeSlots(semifinalSlots, requiredSlots);
      setSemifinalSlots(nextSemifinalSlots);
    }

    const nextRoundMatches = [];

    for (let i = 0; i < winners.length; i += 2) {
      const teamA = winners[i];
      const teamB = winners[i + 1];
      const slot = nextSemifinalSlots[i / 2] || { time: "", field: "" };

      if (!teamA || !teamB) continue;

      nextRoundMatches.push({
        tournament_id: tournamentId,
        team_a_id: teamA.team_id,
        team_b_id: teamB.team_id,
        match_date: semifinalDate,
        match_time: slot.time || null,
        field: slot.field || null,
        status: "scheduled",
        elapsed_seconds: 0,
        team_a_score: 0,
        team_b_score: 0,
        first_half_minutes: Number(matchConfig.firstHalfMinutes),
        second_half_minutes: Number(matchConfig.secondHalfMinutes),
        break_minutes: Number(matchConfig.breakMinutes),
        stage: nextStageName,
        group_name: null,
        round_number: nextRoundMatches.length + 1,
        winner_team_id: null,
        source_match_1: teamA.source_match_id,
        source_match_2: teamB.source_match_id,
      });
    }

    const { error: insertNextRoundError } = await supabase
      .from("matches")
      .insert(nextRoundMatches);

    if (insertNextRoundError) {
      console.error(
        "Error creating next knockout round:",
        insertNextRoundError.message
      );
      alert(insertNextRoundError.message);
      return;
    }

    alert("Next knockout round generated successfully.");
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

    const { data: knockoutMatches, error: knockoutMatchesError } =
      await getExistingKnockoutMatches(tournamentId);

    if (knockoutMatchesError) {
      console.error(
        "Error fetching knockout matches:",
        knockoutMatchesError.message
      );
      alert(knockoutMatchesError.message);
      return;
    }

    const existingFinalStage = (knockoutMatches || []).filter((match) =>
      ["final", "third_place"].includes(match.stage)
    );

    if (existingFinalStage.length > 0) {
      alert("Final or 3rd Place match already exists for this tournament.");
      return;
    }

    const latestStageName = getLatestPlayableKnockoutStage(knockoutMatches);

    if (latestStageName !== "semifinal") {
      alert("You must generate and finish the semi-finals before creating the final stage.");
      return;
    }

    const semifinals = (knockoutMatches || [])
      .filter((match) => match.stage === "semifinal")
      .sort((a, b) => Number(a.round_number || 0) - Number(b.round_number || 0));

    if (semifinals.length !== 2) {
      alert("Exactly 2 semi-final matches are required before generating the final stage.");
      return;
    }

    const unfinishedSemifinals = semifinals.filter(
      (match) => match.status !== "finished"
    );

    if (unfinishedSemifinals.length > 0) {
      alert("All semi-final matches must be finished before generating final stage.");
      return;
    }

    const sf1 = semifinals[0];
    const sf2 = semifinals[1];

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

  const renderSlotList = (title, date, slots) => (
    <div style={previewStageCardStyle}>
      <div style={previewStageTitleStyle}>{title}</div>
      <div style={previewStageDateStyle}>Date: {date || "-"}</div>

      <div style={previewSlotListStyle}>
        {slots.map((slot, index) => (
          <div key={`${title}-${index}`} style={previewSlotItemStyle}>
            <span style={previewSlotIndexStyle}>Match {index + 1}</span>
            <span style={previewSlotValueStyle}>
              {slot.time || "--:--"}
              {slot.field ? ` • ${slot.field}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchedulePreview = () => {
    const hasGroupSchedule =
      round1Date ||
      round2Date ||
      round3Date ||
      round1Slots.some((slot) => slot.time || slot.field) ||
      round2Slots.some((slot) => slot.time || slot.field) ||
      round3Slots.some((slot) => slot.time || slot.field);

    const hasKnockoutSchedule =
      quarterfinalDate ||
      semifinalDate ||
      finalDate ||
      thirdPlaceDate ||
      quarterfinalSlots.some((slot) => slot.time || slot.field) ||
      semifinalSlots.some((slot) => slot.time || slot.field) ||
      finalSlot.time ||
      finalSlot.field ||
      thirdPlaceSlot.time ||
      thirdPlaceSlot.field;

    if (!hasGroupSchedule && !hasKnockoutSchedule) return null;

    return (
      <div style={previewWrapStyle}>
        <div style={previewHeaderStyle}>Entered Match Schedule Preview</div>

        {hasGroupSchedule && (
          <div style={previewGridStyle}>
            {renderSlotList("Round 1", round1Date, round1Slots)}
            {renderSlotList("Round 2", round2Date, round2Slots)}
            {renderSlotList("Round 3", round3Date, round3Slots)}
          </div>
        )}

        {hasKnockoutSchedule && (
          <div style={{ ...previewGridStyle, marginTop: "14px" }}>
            {renderSlotList("First Knockout Round", quarterfinalDate, quarterfinalSlots)}
            {renderSlotList("Next Knockout Round", semifinalDate, semifinalSlots)}

            <div style={previewStageCardStyle}>
              <div style={previewStageTitleStyle}>Final</div>
              <div style={previewStageDateStyle}>Date: {finalDate || "-"}</div>
              <div style={previewSlotItemStyle}>
                <span style={previewSlotIndexStyle}>Final Match</span>
                <span style={previewSlotValueStyle}>
                  {finalSlot.time || "--:--"}
                  {finalSlot.field ? ` • ${finalSlot.field}` : ""}
                </span>
              </div>
            </div>

            <div style={previewStageCardStyle}>
              <div style={previewStageTitleStyle}>3rd Place</div>
              <div style={previewStageDateStyle}>
                Date: {thirdPlaceDate || "-"}
              </div>
              <div style={previewSlotItemStyle}>
                <span style={previewSlotIndexStyle}>3rd Place Match</span>
                <span style={previewSlotValueStyle}>
                  {thirdPlaceSlot.time || "--:--"}
                  {thirdPlaceSlot.field ? ` • ${thirdPlaceSlot.field}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const showSection = (key) => (!isMobile ? true : openSections[key]);

  return (
    <>
      <style>
        {`
          .tour-input,
          .tour-select {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            color: #111827;
            background: #ffffff;
          }

          .tour-date-input,
          .tour-time-input {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            background: #ffffff;
            min-height: 48px;
            line-height: 1.2;
            color-scheme: light;
          }

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

          .tour-list-head {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 16px;
            align-items: start;
          }

          .tour-status-wrap {
            display: flex;
            justify-content: flex-end;
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

            .tour-list-head {
              grid-template-columns: 1fr !important;
            }

            .tour-status-wrap {
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

            .tour-list-info {
              flex-direction: column !important;
              align-items: flex-start !important;
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
              title="First Knockout Round Date"
              value={quarterfinalDate}
              min={today}
              onChange={setQuarterfinalDate}
            />
            <div style={slotsGridStyle} className="tour-slot-grid">
              {quarterfinalSlots.map((slot, index) => (
                <SlotCard
                  key={`qf-${index}`}
                  title={`Knockout Match ${index + 1}`}
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
              title="Next Knockout Round Date"
              value={semifinalDate}
              min={today}
              onChange={setSemifinalDate}
            />
            <div style={twoSlotsGridStyle} className="tour-two-grid">
              {semifinalSlots.map((slot, index) => (
                <SlotCard
                  key={`sf-${index}`}
                  title={`Next Round Match ${index + 1}`}
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
                    <div className="tour-list-head">
                      <div
                        style={tournamentInfoWrapStyle}
                        className="tour-list-info"
                      >
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

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={tournamentNameStyle} className="tour-name">
                            {t.name}
                          </h3>

                          <div style={tournamentMetaStyle} className="tour-meta">
                            {[t.type, t.format, t.venue].filter(Boolean).join(" • ") ||
                              "-"}
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

                      <div className="tour-status-wrap">
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
                    </div>

                    <div style={actionWrapStyle} className="tour-actions">
                      <ActionButton
                        color="#109847"
                        icon={<CalendarDays size={15} />}
                        label="Load Group Slots"
                        onClick={() => handlePrepareGroupStageSchedule(t.id)}
                      />
                      <ActionButton
                        color="#16a34a"
                        icon={<PlayCircle size={15} />}
                        label="Generate Group Matches"
                        onClick={() => handleGenerateGroupMatches(t.id)}
                      />
                      <ActionButton
                        color="#0f766e"
                        icon={<Pencil size={15} />}
                        label="Update Group Schedule"
                        onClick={() => handleUpdateGroupMatchSchedule(t.id)}
                      />
                      <ActionButton
                        color="#7c3aed"
                        icon={<Layers3 size={15} />}
                        label="Generate First Knockout Round"
                        onClick={() => handleGenerateQuarterfinals(t.id)}
                      />
                      <ActionButton
                        color="#ea580c"
                        icon={<Layers3 size={15} />}
                        label="Generate Next Knockout Round"
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

                    {activeScheduleTournamentId && String(activeScheduleTournamentId) === String(t.id) ? renderSchedulePreview() : null}
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
        type="date"
        value={value || ""}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.target.showPicker?.()}
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
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.target.showPicker?.()}
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
  borderRadius: "18px",
  padding: "18px",
  background: "#fafafa",
  display: "grid",
  gap: "16px",
};

const tournamentInfoWrapStyle = {
  display: "flex",
  alignItems: "flex-start",
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
  fontSize: "24px",
  fontWeight: "800",
  color: "#111827",
  lineHeight: 1.2,
};

const tournamentMetaStyle = {
  marginTop: "4px",
  fontSize: "14px",
  color: "#4b5563",
  fontWeight: "600",
};

const tournamentDateStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "700",
};

const tournamentRulesStyle = {
  marginTop: "12px",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const rulePillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 10px",
  borderRadius: "999px",
  background: "#eef4fb",
  color: "#1476b6",
  fontSize: "12px",
  fontWeight: "700",
  border: "1px solid #dbe7f4",
};

const statusSelectStyle = {
  minWidth: "140px",
  padding: "10px 12px",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
  outline: "none",
};

const actionWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionButtonStyle = {
  border: "none",
  color: "#fff",
  padding: "10px 14px",
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

const previewWrapStyle = {
  marginTop: "14px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "14px",
};

const previewHeaderStyle = {
  fontSize: "15px",
  fontWeight: "800",
  color: "#111827",
  marginBottom: "12px",
};

const previewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const previewStageCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  background: "#ffffff",
  padding: "12px",
};

const previewStageTitleStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#111827",
  marginBottom: "6px",
};

const previewStageDateStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#64748b",
  marginBottom: "10px",
};

const previewSlotListStyle = {
  display: "grid",
  gap: "8px",
};

const previewSlotItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  padding: "8px 10px",
  borderRadius: "10px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  flexWrap: "wrap",
};

const previewSlotIndexStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#334155",
};

const previewSlotValueStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#111827",
};

export default Tournaments;