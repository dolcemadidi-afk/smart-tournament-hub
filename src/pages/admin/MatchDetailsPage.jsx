import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../services/supabase";
import Skeleton from "../../components/Skeleton";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Clock3,
  Goal,
  Square,
  Save,
  Trophy,
} from "lucide-react";

function MatchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [cards, setCards] = useState([]);
  const [tick, setTick] = useState(0);
  const [userRole, setUserRole] = useState(null);

  const [goalTeamId, setGoalTeamId] = useState("");
  const [goalPlayerId, setGoalPlayerId] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  const [cardType, setCardType] = useState("");
  const [cardTeamId, setCardTeamId] = useState("");
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const [penaltySaving, setPenaltySaving] = useState(false);
  const [winnerPulseTeamId, setWinnerPulseTeamId] = useState(null);
  const [penaltyInputs, setPenaltyInputs] = useState({ a: "", b: "" });

  const [motmPlayerId, setMotmPlayerId] = useState("");
  const [motmSaving, setMotmSaving] = useState(false);

  const [previousMatchSuspendedIds, setPreviousMatchSuspendedIds] = useState(
    []
  );

  const autoActionRef = useRef(false);

  const fetchUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error.message);
      return;
    }

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchMatch = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching match:", error.message);
      return;
    }

    setMatch(data);
    setMotmPlayerId(data.man_of_the_match_player_id || "");
    setPenaltyInputs({
      a:
        data?.team_a_penalties === null || data?.team_a_penalties === undefined
          ? ""
          : String(data.team_a_penalties),
      b:
        data?.team_b_penalties === null || data?.team_b_penalties === undefined
          ? ""
          : String(data.team_b_penalties),
    });
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

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select(
        `
        *,
        players (
          id,
          team_id,
          full_name,
          jersey_number,
          photo_url
        )
      `
      )
      .eq("match_id", id)
      .order("minute", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching goals:", error.message);
      return;
    }

    setGoals(data || []);
  };

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("match_id", id)
      .order("minute", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching cards:", error.message);
      return;
    }

    setCards(data || []);
  };

  const normalizeCardType = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "yellow" || normalized === "red") return normalized;
    return "";
  };

  const getSuspendedIdsFromCards = (cardRows = []) => {
    const suspendedSet = new Set();
    const yellowCountMap = {};

    cardRows.forEach((card) => {
      if (!card?.player_id) return;

      const type = normalizeCardType(card.card_type);

      if (type === "red") {
        suspendedSet.add(card.player_id);
        return;
      }

      if (type === "yellow") {
        yellowCountMap[card.player_id] = (yellowCountMap[card.player_id] || 0) + 1;
      }
    });

    Object.entries(yellowCountMap).forEach(([playerId, count]) => {
      if (count >= 2) suspendedSet.add(playerId);
    });

    return [...suspendedSet];
  };

  const fetchPreviousMatchSuspensions = async (currentMatch) => {
    if (!currentMatch) {
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const currentDateTimeString = `${currentMatch.match_date || ""}T${
      currentMatch.match_time || "23:59"
    }`;
    const currentDateTime = new Date(currentDateTimeString).getTime();

    if (!Number.isFinite(currentDateTime)) {
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const currentTeamIds = [currentMatch.team_a_id, currentMatch.team_b_id].filter(
      Boolean
    );

    if (currentTeamIds.length === 0) {
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const { data: previousMatches, error: previousMatchesError } =
      await supabase
        .from("matches")
        .select(
          "id, match_date, match_time, status, team_a_id, team_b_id, tournament_id"
        )
        .eq("tournament_id", currentMatch.tournament_id)
        .eq("status", "finished");

    if (previousMatchesError) {
      console.error(
        "Error fetching previous matches:",
        previousMatchesError.message
      );
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const getMatchTimestamp = (m) => {
      const dt = new Date(
        `${m.match_date || ""}T${m.match_time || "23:59"}`
      ).getTime();
      return Number.isFinite(dt) ? dt : 0;
    };

    const previousMatchByTeam = {};

    previousMatches
      .filter((m) => m.id !== currentMatch.id)
      .filter((m) => {
        const involvesCurrentTeam =
          currentTeamIds.includes(m.team_a_id) ||
          currentTeamIds.includes(m.team_b_id);

        if (!involvesCurrentTeam) return false;

        const matchTs = getMatchTimestamp(m);
        return matchTs < currentDateTime;
      })
      .forEach((m) => {
        const matchTs = getMatchTimestamp(m);

        [m.team_a_id, m.team_b_id].forEach((teamId) => {
          if (!currentTeamIds.includes(teamId)) return;

          if (!previousMatchByTeam[teamId]) {
            previousMatchByTeam[teamId] = m;
            return;
          }

          const savedTs = getMatchTimestamp(previousMatchByTeam[teamId]);
          if (matchTs > savedTs) {
            previousMatchByTeam[teamId] = m;
          }
        });
      });

    const previousMatchIds = Object.values(previousMatchByTeam).map((m) => m.id);

    if (previousMatchIds.length === 0) {
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const { data: previousCards, error: previousCardsError } = await supabase
      .from("cards")
      .select("match_id, player_id, card_type, created_at")
      .in("match_id", previousMatchIds)
      .order("created_at", { ascending: true });

    if (previousCardsError) {
      console.error(
        "Error fetching previous match cards:",
        previousCardsError.message
      );
      setPreviousMatchSuspendedIds([]);
      return;
    }

    const suspendedSet = new Set();

    previousMatchIds.forEach((matchId) => {
      const cardsForMatch = (previousCards || []).filter(
        (c) => c.match_id === matchId
      );

      getSuspendedIdsFromCards(cardsForMatch).forEach((playerId) => {
        suspendedSet.add(playerId);
      });
    });

    setPreviousMatchSuspendedIds([...suspendedSet]);
  };

  useEffect(() => {
    fetchUserRole();
    fetchMatch();
    fetchTeams();
    fetchPlayers();
    fetchGoals();
    fetchCards();
  }, [id]);

  useEffect(() => {
    if (!match) return;
    fetchPreviousMatchSuspensions(match);
  }, [
    match?.id,
    match?.team_a_id,
    match?.team_b_id,
    match?.match_date,
    match?.match_time,
    match?.tournament_id,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const canManageMatch = userRole === "organizer" || userRole === "staff";

  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team
      ? team.company_name || team.team_name || "Unknown Team"
      : "Unknown Team";
  };

  const getTeamLogo = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.logo_url || "";
  };

  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player?.full_name || "Not selected";
  };

  const getPlayerById = (playerId) => {
    return players.find((p) => p.id === playerId) || null;
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

  const getLiveElapsedSeconds = (currentMatch) => {
    if (currentMatch?.status !== "live") return 0;
    return getElapsedSeconds(currentMatch?.live_started_at);
  };

  const getBreakElapsed = (currentMatch) => {
    if (currentMatch?.status !== "break") return 0;
    return getElapsedSeconds(currentMatch?.break_started_at);
  };

  const getDisplayClock = (currentMatch) => {
    if (!currentMatch) return "00:00";

    if (currentMatch.status === "live") {
      return formatMMSS(getLiveElapsedSeconds(currentMatch));
    }

    if (currentMatch.status === "break") {
      return formatMMSS(getBreakElapsed(currentMatch));
    }

    return "00:00";
  };

  const isKnockout = [
    "quarterfinal",
    "semifinal",
    "final",
    "third_place",
    "round_of_16",
    "round_of_32",
    "round_of_64",
  ].includes(match?.stage);

  const regularTeamAScore = Number(match?.team_a_score || 0);
  const regularTeamBScore = Number(match?.team_b_score || 0);
  const penaltyTeamAScore =
    match?.team_a_penalties === null || match?.team_a_penalties === undefined
      ? ""
      : match.team_a_penalties;
  const penaltyTeamBScore =
    match?.team_b_penalties === null || match?.team_b_penalties === undefined
      ? ""
      : match.team_b_penalties;

  const isRegularDraw = regularTeamAScore === regularTeamBScore;

  const hasSavedPenalties =
    isKnockout &&
    match?.status === "finished" &&
    isRegularDraw &&
    Boolean(match?.winner_team_id) &&
    penaltyTeamAScore !== "" &&
    penaltyTeamBScore !== "";

  const showPenaltyInputs =
    isKnockout &&
    match?.status === "finished" &&
    isRegularDraw &&
    !hasSavedPenalties;

  const livePenaltyTeamAScore =
    penaltyInputs.a === "" ? 0 : Number(penaltyInputs.a);

  const livePenaltyTeamBScore =
    penaltyInputs.b === "" ? 0 : Number(penaltyInputs.b);

  const displayPenaltyTeamAScore = showPenaltyInputs
    ? livePenaltyTeamAScore
    : penaltyTeamAScore;

  const displayPenaltyTeamBScore = showPenaltyInputs
    ? livePenaltyTeamBScore
    : penaltyTeamBScore;

  const showPenaltiesResult =
    isKnockout &&
    match?.status === "finished" &&
    isRegularDraw &&
    (showPenaltyInputs || hasSavedPenalties);

  const getPhaseLabel = (currentMatch) => {
    if (currentMatch?.status === "live") {
      if ((currentMatch?.current_half || 1) === 1) return "1ST HALF";
      if ((currentMatch?.current_half || 1) === 2) return "2ND HALF";
      return "LIVE";
    }

    if (currentMatch?.status === "break") return "BREAK";

    if (
      isKnockout &&
      currentMatch?.status === "finished" &&
      Number(currentMatch?.team_a_score || 0) ===
        Number(currentMatch?.team_b_score || 0) &&
      !currentMatch?.winner_team_id
    ) {
      return "PENALTIES";
    }

    if (currentMatch?.status === "finished") return "FINISHED";
    if (currentMatch?.status === "scheduled") return "SCHEDULED";

    return currentMatch?.status?.toUpperCase() || "-";
  };

  const calculateLiveMinute = (currentMatch) => {
    const played = getLiveElapsedSeconds(currentMatch);
    const currentHalf = currentMatch?.current_half || 1;
    const firstHalfMinutes = currentMatch?.first_half_minutes || 24;

    if (currentHalf === 1) {
      return Math.max(1, Math.floor(played / 60));
    }

    return Math.max(
      firstHalfMinutes + 1,
      firstHalfMinutes + 1 + Math.floor(played / 60)
    );
  };

  const handleSavePenalties = async () => {
    if (!match || !canManageMatch) return;

    if (!showPenaltyInputs) {
      alert("Penalties not available.");
      return;
    }

    const aPen = Number(penaltyInputs.a);
    const bPen = Number(penaltyInputs.b);

    if (Number.isNaN(aPen) || Number.isNaN(bPen)) {
      alert("Enter valid penalties");
      return;
    }

    if (aPen === bPen) {
      alert("Penalties cannot be equal");
      return;
    }

    const winnerTeamId = aPen > bPen ? match.team_a_id : match.team_b_id;

    setPenaltySaving(true);

    const { error } = await supabase
      .from("matches")
      .update({
        team_a_penalties: aPen,
        team_b_penalties: bPen,
        winner_team_id: winnerTeamId,
      })
      .eq("id", match.id);

    if (error) {
      console.error("Error saving penalties:", error.message);
      alert("Error saving penalties");
      setPenaltySaving(false);
      return;
    }

    await fetchMatch();
    setPenaltySaving(false);
    alert("Penalties saved successfully.");
  };

  const handleSaveMOTM = async () => {
    if (!canManageMatch) return;

    if (!motmPlayerId) {
      alert("Select a player");
      return;
    }

    setMotmSaving(true);

    const { error } = await supabase
      .from("matches")
      .update({
        man_of_the_match_player_id: motmPlayerId,
      })
      .eq("id", match.id);

    if (error) {
      console.error("Error saving MOTM:", error.message);
      alert("Error saving");
      setMotmSaving(false);
      return;
    }

    await fetchMatch();
    setMotmSaving(false);
    alert("Man of the Match saved");
  };

  const handleStartMatch = async () => {
    if (!canManageMatch) return;

    const confirmStart = window.confirm("Start this match now?");
    if (!confirmStart) return;

    autoActionRef.current = true;

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("matches")
      .update({
        status: "live",
        live_started_at: nowIso,
        break_started_at: null,
        resumed_at: null,
        finished_at: null,
        elapsed_seconds: 0,
        current_half: 1,
      })
      .eq("id", match.id);

    if (error) {
      autoActionRef.current = false;
      console.error("Error starting match:", error.message);
      alert("Failed to start match");
      return;
    }

    await fetchMatch();

    setTimeout(() => {
      autoActionRef.current = false;
    }, 1200);
  };

  const handleBreakMatch = async () => {
    if (!canManageMatch) return;

    if (!match || match.status !== "live" || (match.current_half || 1) !== 1) {
      alert("Break is only available in the 1st half");
      return;
    }

    const confirmBreak = window.confirm("Start halftime break?");
    if (!confirmBreak) return;

    autoActionRef.current = true;

    const { error } = await supabase
      .from("matches")
      .update({
        status: "break",
        break_started_at: new Date().toISOString(),
        live_started_at: null,
        elapsed_seconds: 0,
        current_half: 2,
      })
      .eq("id", match.id);

    if (error) {
      autoActionRef.current = false;
      console.error("Error pausing match:", error.message);
      alert("Failed to pause match");
      return;
    }

    await fetchMatch();

    setTimeout(() => {
      autoActionRef.current = false;
    }, 1200);
  };

  const handleResumeMatch = async () => {
    if (!canManageMatch) return;

    const confirmResume = window.confirm("Resume this match now?");
    if (!confirmResume) return;

    autoActionRef.current = true;

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("matches")
      .update({
        status: "live",
        resumed_at: nowIso,
        live_started_at: nowIso,
        break_started_at: null,
        current_half: 2,
        elapsed_seconds: 0,
      })
      .eq("id", match.id);

    if (error) {
      autoActionRef.current = false;
      console.error("Error resuming match:", error.message);
      alert("Failed to resume match");
      return;
    }

    await fetchMatch();

    setTimeout(() => {
      autoActionRef.current = false;
    }, 1200);
  };

  const handleFinishMatch = async () => {
    if (!canManageMatch) return;

    const confirmFinish = window.confirm("Finish 2nd half?");
    if (!confirmFinish) return;

    autoActionRef.current = true;

    const teamAScore = Number(match.team_a_score || 0);
    const teamBScore = Number(match.team_b_score || 0);

    if (isKnockout && teamAScore === teamBScore) {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "finished",
          finished_at: new Date().toISOString(),
          winner_team_id: null,
          live_started_at: null,
          break_started_at: null,
        })
        .eq("id", match.id);

      if (error) {
        autoActionRef.current = false;
        console.error("Error finishing match:", error.message);
        alert("Error finishing match");
        return;
      }

      await fetchMatch();
      autoActionRef.current = false;
      alert("Match finished. Enter penalties now.");
      return;
    }

    let winnerTeamId = null;

    if (match.stage === "group") {
      if (teamAScore > teamBScore) {
        winnerTeamId = match.team_a_id;
      } else if (teamBScore > teamAScore) {
        winnerTeamId = match.team_b_id;
      } else {
        winnerTeamId = null;
      }
    } else {
      if (teamAScore > teamBScore) {
        winnerTeamId = match.team_a_id;
      } else if (teamBScore > teamAScore) {
        winnerTeamId = match.team_b_id;
      }
    }

    const { error } = await supabase
      .from("matches")
      .update({
        status: "finished",
        finished_at: new Date().toISOString(),
        winner_team_id: winnerTeamId,
        live_started_at: null,
        break_started_at: null,
      })
      .eq("id", match.id);

    if (error) {
      autoActionRef.current = false;
      console.error("Error finishing match:", error.message);
      alert("Error finishing match");
      return;
    }

    await fetchMatch();
    autoActionRef.current = false;
    alert("Match finished.");
  };

  useEffect(() => {
    if (!match) return;
    if (autoActionRef.current) return;
    if (!canManageMatch) return;

    const firstHalfSeconds = (match.first_half_minutes || 24) * 60;
    const secondHalfSeconds = (match.second_half_minutes || 24) * 60;
    const breakSeconds = (match.break_minutes || 5) * 60;

    const runAutoFlow = async () => {
      if (match.status === "live") {
        const liveElapsed = getLiveElapsedSeconds(match);
        const currentHalf = match.current_half || 1;

        if (
          currentHalf === 1 &&
          firstHalfSeconds > 0 &&
          liveElapsed >= firstHalfSeconds
        ) {
          autoActionRef.current = true;

          const { error } = await supabase
            .from("matches")
            .update({
              status: "break",
              break_started_at: new Date().toISOString(),
              live_started_at: null,
              elapsed_seconds: 0,
              current_half: 2,
            })
            .eq("id", match.id);

          if (error) {
            autoActionRef.current = false;
            console.error("Error auto-starting break:", error.message);
            return;
          }

          await fetchMatch();

          setTimeout(() => {
            autoActionRef.current = false;
          }, 1200);

          alert("First half finished. Break started.");
          return;
        }

        if (
          currentHalf === 2 &&
          secondHalfSeconds > 0 &&
          liveElapsed >= secondHalfSeconds
        ) {
          autoActionRef.current = true;

          const teamAScore = Number(match.team_a_score || 0);
          const teamBScore = Number(match.team_b_score || 0);

          if (isKnockout && teamAScore === teamBScore) {
            const { error } = await supabase
              .from("matches")
              .update({
                status: "finished",
                finished_at: new Date().toISOString(),
                winner_team_id: null,
                live_started_at: null,
                break_started_at: null,
              })
              .eq("id", match.id);

            if (error) {
              autoActionRef.current = false;
              console.error("Error auto-finishing match:", error.message);
              return;
            }

            await fetchMatch();

            setTimeout(() => {
              autoActionRef.current = false;
            }, 1200);

            alert("Match finished. Enter penalties now.");
            return;
          }

          let winnerTeamId = null;

          if (match.stage === "group") {
            if (teamAScore > teamBScore) {
              winnerTeamId = match.team_a_id;
            } else if (teamBScore > teamAScore) {
              winnerTeamId = match.team_b_id;
            } else {
              winnerTeamId = null;
            }
          } else {
            if (teamAScore > teamBScore) {
              winnerTeamId = match.team_a_id;
            } else if (teamBScore > teamAScore) {
              winnerTeamId = match.team_b_id;
            }
          }

          const { error } = await supabase
            .from("matches")
            .update({
              status: "finished",
              finished_at: new Date().toISOString(),
              live_started_at: null,
              break_started_at: null,
              winner_team_id: winnerTeamId,
            })
            .eq("id", match.id);

          if (error) {
            autoActionRef.current = false;
            console.error("Error auto-finishing match:", error.message);
            return;
          }

          await fetchMatch();

          setTimeout(() => {
            autoActionRef.current = false;
          }, 1200);

          alert("Match finished.");
          return;
        }
      }

      if (match.status === "break") {
        const breakElapsed = getBreakElapsed(match);

        if (breakSeconds > 0 && breakElapsed >= breakSeconds) {
          autoActionRef.current = true;

          const nowIso = new Date().toISOString();

          const { error } = await supabase
            .from("matches")
            .update({
              status: "live",
              resumed_at: nowIso,
              live_started_at: nowIso,
              break_started_at: null,
              current_half: 2,
              elapsed_seconds: 0,
            })
            .eq("id", match.id);

          if (error) {
            autoActionRef.current = false;
            console.error("Error auto-resuming second half:", error.message);
            return;
          }

          await fetchMatch();

          setTimeout(() => {
            autoActionRef.current = false;
          }, 1200);

          alert("Break finished. Second half started.");
        }
      }
    };

    runAutoFlow();
  }, [match, tick, isKnockout, canManageMatch]);

  const currentMatchSuspendedIds = useMemo(() => {
    return getSuspendedIdsFromCards(cards);
  }, [cards]);

  const suspendedPlayerIds = useMemo(() => {
    return [...new Set([...currentMatchSuspendedIds, ...previousMatchSuspendedIds])];
  }, [currentMatchSuspendedIds, previousMatchSuspendedIds]);

  const handleAddGoal = async () => {
    if (!canManageMatch) return;

    if (match.status !== "live") {
      alert("You can only add goals to live matches");
      return;
    }

    if (!goalTeamId || !goalPlayerId) {
      alert("Please select team and player");
      return;
    }

    if (suspendedPlayerIds.includes(goalPlayerId)) {
      alert("This player is suspended and cannot be selected.");
      return;
    }

    setGoalSaving(true);

    const calculatedMinute = calculateLiveMinute(match);

    const { error: goalError } = await supabase.from("goals").insert([
      {
        match_id: match.id,
        team_id: goalTeamId,
        player_id: goalPlayerId,
        minute: calculatedMinute,
      },
    ]);

    if (goalError) {
      console.error("Error adding goal:", goalError.message);
      alert("Failed to add goal");
      setGoalSaving(false);
      return;
    }

    let updatedTeamAScore = match.team_a_score || 0;
    let updatedTeamBScore = match.team_b_score || 0;

    if (goalTeamId === match.team_a_id) {
      updatedTeamAScore += 1;
    } else if (goalTeamId === match.team_b_id) {
      updatedTeamBScore += 1;
    }

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        team_a_score: updatedTeamAScore,
        team_b_score: updatedTeamBScore,
      })
      .eq("id", match.id);

    if (matchError) {
      console.error("Error updating match score:", matchError.message);
      alert("Goal saved, but failed to update score");
      setGoalSaving(false);
      return;
    }

    setGoalTeamId("");
    setGoalPlayerId("");
    setGoalSaving(false);

    await fetchMatch();
    await fetchGoals();
  };

  const handleAddCard = async () => {
    if (!canManageMatch) return;

    if (match.status !== "live") {
      alert("You can only add cards to live matches");
      return;
    }

    if (!cardType || !cardTeamId || !cardPlayerId) {
      alert("Please select card type, team and player");
      return;
    }

    if (suspendedPlayerIds.includes(cardPlayerId)) {
      alert("This player is suspended and cannot be selected.");
      return;
    }

    setCardSaving(true);

    const calculatedMinute = calculateLiveMinute(match);

    const { error } = await supabase.from("cards").insert([
      {
        match_id: match.id,
        team_id: cardTeamId,
        player_id: cardPlayerId,
        card_type: normalizeCardType(cardType),
        minute: calculatedMinute,
      },
    ]);

    if (error) {
      console.error("Error adding card:", error.message);
      alert("Failed to add card");
      setCardSaving(false);
      return;
    }

    setCardType("");
    setCardTeamId("");
    setCardPlayerId("");
    setCardSaving(false);

    await fetchCards();
    await fetchPreviousMatchSuspensions(match);
  };

  const handleDeleteGoal = async (goal) => {
    if (!canManageMatch) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this goal?"
    );
    if (!confirmDelete) return;

    let updatedTeamAScore = match.team_a_score || 0;
    let updatedTeamBScore = match.team_b_score || 0;

    if (goal.team_id === match.team_a_id) {
      updatedTeamAScore = Math.max(0, updatedTeamAScore - 1);
    } else if (goal.team_id === match.team_b_id) {
      updatedTeamBScore = Math.max(0, updatedTeamBScore - 1);
    }

    const { error: deleteGoalError } = await supabase
      .from("goals")
      .delete()
      .eq("id", goal.id);

    if (deleteGoalError) {
      console.error("Error deleting goal:", deleteGoalError.message);
      alert("Failed to delete goal");
      return;
    }

    const { error: updateMatchError } = await supabase
      .from("matches")
      .update({
        team_a_score: updatedTeamAScore,
        team_b_score: updatedTeamBScore,
      })
      .eq("id", match.id);

    if (updateMatchError) {
      console.error("Error updating score:", updateMatchError.message);
      alert("Goal deleted, but failed to update score");
    }

    await fetchMatch();
    await fetchGoals();
  };

  const handleDeleteCard = async (card) => {
    if (!canManageMatch) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this card?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("cards").delete().eq("id", card.id);

    if (error) {
      console.error("Error deleting card:", error.message);
      alert("Failed to delete card");
      return;
    }

    await fetchCards();
  };

  const buildGoalScoresMap = useMemo(() => {
    if (!match) return {};

    let runningA = 0;
    let runningB = 0;
    const scoresMap = {};

    const sortedGoals = [...goals].sort((a, b) => {
      if ((a.minute || 0) !== (b.minute || 0)) {
        return (a.minute || 0) - (b.minute || 0);
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    sortedGoals.forEach((goal) => {
      if (goal.team_id === match.team_a_id) {
        runningA += 1;
      } else if (goal.team_id === match.team_b_id) {
        runningB += 1;
      }

      scoresMap[goal.id] = `${runningA} - ${runningB}`;
    });

    return scoresMap;
  }, [goals, match]);

  const motmPlayer = useMemo(() => {
    if (!match?.man_of_the_match_player_id) return null;
    return getPlayerById(match.man_of_the_match_player_id);
  }, [match, players]);

  const motmTeamName = motmPlayer ? getTeamName(motmPlayer.team_id) : "";

  useEffect(() => {
    if (!match?.winner_team_id) return;

    setWinnerPulseTeamId(match.winner_team_id);
    const timeout = setTimeout(() => {
      setWinnerPulseTeamId(null);
    }, 1600);

    return () => clearTimeout(timeout);
  }, [match?.winner_team_id]);

  if (!match) {
    return (
      <div style={pageStyle} className="match-details-page">
        <div style={pageContainerStyle}>
          <div style={{ marginBottom: "18px", maxWidth: "180px" }}>
            <Skeleton height="40px" width="180px" radius="10px" />
          </div>

          <div style={summaryCardStyle}>
            <div style={{ marginBottom: "22px" }}>
              <Skeleton height="18px" width="320px" radius="8px" />
            </div>

            <div style={scoreboardGridStyle} className="match-scoreboard">
              <div style={teamColumnStyle}>
                <Skeleton height="96px" width="96px" radius="20px" />
                <Skeleton height="28px" width="180px" radius="8px" />
              </div>

              <div style={scoreCenterStyle}>
                <Skeleton height="86px" width="180px" radius="12px" />
                <div style={{ marginTop: "14px" }}>
                  <Skeleton height="28px" width="140px" radius="8px" />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <Skeleton height="30px" width="100px" radius="8px" />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <Skeleton height="16px" width="220px" radius="8px" />
                </div>
              </div>

              <div style={teamColumnStyle}>
                <Skeleton height="96px" width="96px" radius="20px" />
                <Skeleton height="28px" width="180px" radius="8px" />
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Skeleton height="40px" width="110px" radius="10px" />
              <Skeleton height="40px" width="110px" radius="10px" />
            </div>
          </div>

          <div style={mainGridStyle} className="match-main-grid">
            <div style={panelCardStyle}>
              <Skeleton height="40px" width="180px" radius="10px" />
              <Skeleton height="46px" width="100%" radius="10px" />
              <Skeleton height="46px" width="100%" radius="10px" />
              <Skeleton height="44px" width="140px" radius="10px" />
            </div>

            <div style={panelCardStyle}>
              <Skeleton height="40px" width="180px" radius="10px" />
              <Skeleton height="46px" width="100%" radius="10px" />
              <Skeleton height="46px" width="100%" radius="10px" />
              <Skeleton height="46px" width="100%" radius="10px" />
              <Skeleton height="44px" width="140px" radius="10px" />
            </div>
          </div>

          <div style={eventsCardStyle}>
            <Skeleton height="40px" width="180px" radius="10px" />
            <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <Skeleton height="56px" width="100%" radius="12px" />
              <Skeleton height="56px" width="100%" radius="12px" />
              <Skeleton height="56px" width="100%" radius="12px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const matchTeams = teams.filter(
    (team) => team.id === match.team_a_id || team.id === match.team_b_id
  );

  const matchPlayers = players.filter(
    (p) => p.team_id === match.team_a_id || p.team_id === match.team_b_id
  );

  const goalPlayers = players.filter(
    (player) =>
      player.team_id === goalTeamId && !suspendedPlayerIds.includes(player.id)
  );

  const cardPlayers = players.filter(
    (player) =>
      player.team_id === cardTeamId && !suspendedPlayerIds.includes(player.id)
  );

  const allEvents = [
    ...goals.map((g) => ({
      ...g,
      eventType: "goal",
    })),
    ...cards.map((c) => ({
      ...c,
      eventType: "card",
    })),
  ].sort((a, b) => {
    if ((a.minute || 0) !== (b.minute || 0)) {
      return (a.minute || 0) - (b.minute || 0);
    }
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const firstHalfLimitForEvents = match.first_half_minutes || 24;
  const firstHalfEvents = allEvents.filter(
    (event) => (event.minute || 0) <= firstHalfLimitForEvents
  );
  const secondHalfEvents = allEvents.filter(
    (event) => (event.minute || 0) >= firstHalfLimitForEvents + 1
  );

  const renderTeamLogo = (teamId, large = false) => {
    const logo = getTeamLogo(teamId);

    return (
      <div
        className={large ? "match-team-logo-ring" : ""}
        style={{
          width: large ? "clamp(50px, 14vw, 80px)" : "32px",
          height: large ? "clamp(50px, 14vw, 80px)" : "32px",
          borderRadius: large ? "20px" : "50%",
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={getTeamName(teamId)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: large ? "contain" : "cover",
              backgroundColor: "#fff",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: large ? "22px" : "13px",
              color: "#9ca3af",
              fontWeight: "700",
            }}
          >
            {getTeamName(teamId)?.charAt(0)?.toUpperCase() || "T"}
          </div>
        )}
      </div>
    );
  };

  const renderEventRow = (event) => {
    const isTeamA = event.team_id === match.team_a_id;
    const isGoal = event.eventType === "goal";
    const normalizedCardType = normalizeCardType(event.card_type);
    const isYellow = normalizedCardType === "yellow";
    const minuteText = `${event.minute || 0}'`;

    const eventPlayer =
      event.players || players.find((player) => player.id === event.player_id) || null;

    const playerName = eventPlayer?.full_name || getPlayerName(event.player_id);
    const jersey = eventPlayer?.jersey_number
      ? ` #${eventPlayer.jersey_number}`
      : "";

    return (
      <div
        key={`${event.eventType}-${event.id}`}
        style={eventRowStyle}
        className="match-event-row"
      >
        <div
          style={{
            ...eventMinuteStyle,
            color: isTeamA ? "#111827" : "transparent",
          }}
          className="match-event-minute"
        >
          {isTeamA ? minuteText : ""}
        </div>

        <div style={eventCenterStyle} className="match-event-center">
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            {isTeamA && (
              <div style={eventCardLeftStyle} className="match-event-card-left">
                <span style={{ fontSize: "18px" }}>
                  {isGoal ? "⚽" : isYellow ? "🟨" : "🟥"}
                </span>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={eventPlayerStyle}>
                    {playerName}
                    {jersey}
                  </div>
                  <div style={eventMetaStyle}>
                    {isGoal
                      ? `Goal • Score ${buildGoalScoresMap[event.id] || ""}`
                      : isYellow
                      ? "Yellow Card"
                      : "Red Card"}
                  </div>
                </div>
                {canManageMatch && (
                  <button
                    onClick={() =>
                      isGoal ? handleDeleteGoal(event) : handleDeleteCard(event)
                    }
                    style={deleteMiniButtonStyle}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {!isTeamA && (
              <div style={eventCardRightStyle} className="match-event-card-right">
                {canManageMatch && (
                  <button
                    onClick={() =>
                      isGoal ? handleDeleteGoal(event) : handleDeleteCard(event)
                    }
                    style={deleteMiniButtonStyle}
                  >
                    Delete
                  </button>
                )}
                <div style={{ lineHeight: 1.25, textAlign: "right" }}>
                  <div style={eventPlayerStyle}>
                    {playerName}
                    {jersey}
                  </div>
                  <div style={eventMetaStyle}>
                    {isGoal
                      ? `Goal • Score ${buildGoalScoresMap[event.id] || ""}`
                      : isYellow
                      ? "Yellow Card"
                      : "Red Card"}
                  </div>
                </div>
                <span style={{ fontSize: "18px" }}>
                  {isGoal ? "⚽" : isYellow ? "🟨" : "🟥"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            ...eventMinuteStyle,
            color: !isTeamA ? "#111827" : "transparent",
            textAlign: "right",
          }}
          className="match-event-minute"
        >
          {!isTeamA ? minuteText : ""}
        </div>
      </div>
    );
  };

  const renderHalfSection = (title, events) => (
    <div style={{ marginBottom: "24px" }}>
      <div style={halfHeaderStyle}>
        <span style={halfTitleStyle}>{title}</span>
      </div>

      {events.length === 0 ? (
        <div style={noEventsStyle}>No events</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {events.map((event) => renderEventRow(event))}
        </div>
      )}
    </div>
  );

  const winnerName =
    match.winner_team_id === match.team_a_id
      ? getTeamName(match.team_a_id)
      : match.winner_team_id === match.team_b_id
      ? getTeamName(match.team_b_id)
      : "";

  const statusColor =
    match.status === "live"
      ? "#cf2136"
      : match.status === "break"
      ? "#f59e0b"
      : match.status === "finished"
      ? "#16a34a"
      : "#1476b6";


  return (
    <>
      <style>
        {`

          .match-big-score {
            display: flex !important;
            align-items: baseline !important;
            justify-content: center !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            white-space: nowrap !important;
          }

          .match-score-main {
            display: inline-block;
            transition: transform 0.28s ease, opacity 0.28s ease, text-shadow 0.28s ease;
            animation: scorePulse 0.6s ease;
          }

          .match-score-penalty {
            display: inline-block;
            font-size: clamp(16px, 4vw, 22px) !important;
            color: #6b7280 !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            transform: translateY(-2px);
          }

          .match-score-dash {
            display: inline-block;
            margin: 0 2px;
            transform: translateY(-1px);
          }

          .match-live-score .match-score-main {
            animation: liveScorePulse 1.6s ease-in-out infinite;
          }

          @keyframes scorePulse {
            0% { transform: scale(0.92); opacity: 0.75; }
            55% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes liveScorePulse {
            0%, 100% { transform: scale(1); text-shadow: 0 0 0 rgba(255,20,85,0); }
            50% { transform: scale(1.06); text-shadow: 0 0 18px rgba(255,20,85,0.18); }
          }

          .match-team-winner {
            position: relative;
          }

          .match-team-winner .match-team-logo-ring {
            box-shadow: 0 0 0 3px rgba(22,163,74,0.18), 0 0 0 8px rgba(22,163,74,0.08);
            border-color: rgba(22,163,74,0.45) !important;
          }

          .match-team-winner .match-team-name {
            color: #15803d !important;
            font-weight: 800 !important;
          }

          .match-team-winner-pulse {
            animation: teamWinnerPulse 1.2s ease;
          }

          @keyframes teamWinnerPulse {
            0% { transform: scale(1); }
            35% { transform: scale(1.05); }
            70% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }

          @media (max-width: 1024px) {
            .match-main-grid {
              grid-template-columns: 1fr !important;
            }

            .match-actions {
              justify-content: stretch !important;
            }

            .match-actions button {
              flex: 1 !important;
            }

            .match-penalties-row {
              flex-wrap: wrap !important;
            }
          }

          @media (max-width: 768px) {
            .match-details-page {
              padding: 14px !important;
            }

            .match-summary-card {
              padding: 14px !important;
              border-radius: 18px !important;
            }

            .match-summary-top {
              text-align: center !important;
              font-size: 12px !important;
              margin-bottom: 14px !important;
              line-height: 1.4 !important;
            }

            .match-scoreboard {
              grid-template-columns: 1fr auto 1fr !important;
              align-items: center !important;
              gap: 8px !important;
            }

            .match-team-column {
              text-align: center !important;
              gap: 8px !important;
            }

            .match-center-score {
              min-width: 110px !important;
            }

            .match-team-name {
              font-size: 14px !important;
              line-height: 1.2 !important;
              word-break: break-word !important;
            }

            .match-big-score {
              font-size: 34px !important;
              letter-spacing: 0 !important;
              gap: 4px !important;
            }

            .match-score-penalty {
              font-size: 16px !important;
            }

            .match-phase {
              font-size: 14px !important;
              margin-top: 8px !important;
            }

            .match-clock {
              font-size: 16px !important;
              margin-top: 4px !important;
            }

            .match-actions {
              flex-direction: column !important;
            }

            .match-actions button {
              width: 100% !important;
            }

            .match-event-row {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
              padding: 10px 0 !important;
            }

            .match-event-minute {
              text-align: left !important;
              color: #111827 !important;
              font-size: 13px !important;
            }

            .match-event-center {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }

            .match-event-card-left,
            .match-event-card-right {
              width: 100% !important;
              justify-content: space-between !important;
            }

            .match-penalties-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .match-penalties-row input,
            .match-penalties-row button {
              width: 100% !important;
              max-width: 100% !important;
            }

            .match-motm-card {
              flex-direction: row !important;
              align-items: center !important;
              justify-content: flex-start !important;
              text-align: left !important;
              gap: 12px !important;
              padding: 10px 12px !important;
            }

            .match-motm-content {
              text-align: left !important;
              flex: 1 !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="match-details-page">
        <div style={pageContainerStyle}>
          <button onClick={() => navigate("/matches")} style={backButtonStyle}>
            <ArrowLeft size={16} />
            Back to Matches
          </button>

          <div style={summaryCardStyle} className="match-summary-card">
            <div style={summaryTopStyle} className="match-summary-top">
              {match.field || "No field"} • {match.match_date || "-"} •{" "}
              {match.match_time || "-"} • {match.stage || "match"}
            </div>

            <div style={scoreboardGridStyle} className="match-scoreboard">
              <div style={teamColumnStyle} className={`match-team-column ${match.winner_team_id === match.team_a_id ? "match-team-winner" : ""} ${winnerPulseTeamId === match.team_a_id ? "match-team-winner-pulse" : ""}`}>
                {renderTeamLogo(match.team_a_id, true)}
                <div style={teamNameBigStyle} className="match-team-name">
                  {getTeamName(match.team_a_id)}
                </div>
              </div>

              <div style={scoreCenterStyle} className="match-center-score">
                <div
                  style={scoreBigStyle}
                  className={`match-big-score ${
                    match.status === "live" ? "match-live-score" : ""
                  }`}
                >
                  <span
                    className="match-score-main"
                    key={`team-a-${regularTeamAScore}-${displayPenaltyTeamAScore}`}
                  >
                    {regularTeamAScore}
                  </span>

                  {showPenaltiesResult && (
                    <span
                      className="match-score-penalty"
                      key={`team-a-pen-${displayPenaltyTeamAScore}`}
                    >
                      ({displayPenaltyTeamAScore})
                    </span>
                  )}

                  <span className="match-score-dash">-</span>

                  <span
                    className="match-score-main"
                    key={`team-b-${regularTeamBScore}-${displayPenaltyTeamBScore}`}
                  >
                    {regularTeamBScore}
                  </span>

                  {showPenaltiesResult && (
                    <span
                      className="match-score-penalty"
                      key={`team-b-pen-${displayPenaltyTeamBScore}`}
                    >
                      ({displayPenaltyTeamBScore})
                    </span>
                  )}
                </div>

                <div
                  style={{ ...phaseStyle, color: statusColor }}
                  className="match-phase"
                >
                  {getPhaseLabel(match)}
                </div>

                <div style={clockStyle} className="match-clock">
                  {getDisplayClock(match)}
                </div>

                <div style={timingInfoStyle}>
                  {match.first_half_minutes || 24}m /{" "}
                  {match.second_half_minutes || 24}m • Break{" "}
                  {match.break_minutes || 5}m
                </div>

                {showPenaltyInputs && canManageMatch && (
                  <div
                    style={penaltiesRowStyle}
                    className="match-penalties-row"
                  >
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={`${getTeamName(match.team_a_id)} penalties`}
                      value={penaltyInputs.a}
                      onChange={(e) =>
                        setPenaltyInputs((prev) => ({
                          ...prev,
                          a: e.target.value,
                        }))
                      }
                      style={{ ...inputStyle, maxWidth: "180px" }}
                    />

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={`${getTeamName(match.team_b_id)} penalties`}
                      value={penaltyInputs.b}
                      onChange={(e) =>
                        setPenaltyInputs((prev) => ({
                          ...prev,
                          b: e.target.value,
                        }))
                      }
                      style={{ ...inputStyle, maxWidth: "180px" }}
                    />

                    <button
                      onClick={handleSavePenalties}
                      disabled={penaltySaving}
                      style={penaltySaveButtonStyle}
                    >
                      <Save size={15} />
                      {penaltySaving ? "Saving..." : "Save Penalties"}
                    </button>
                  </div>
                )}

                {match.winner_team_id && (
                  <div style={winnerTextStyle}>Winner: {winnerName}</div>
                )}

                <div style={motmWrapStyle}>
                  <div style={motmTitleStyle}>
                    <Trophy size={16} />
                    Man of the Match
                  </div>

                  {canManageMatch && !motmPlayer && (
                    <div style={motmEditorStyle}>
                      <select
                        value={motmPlayerId}
                        onChange={(e) => setMotmPlayerId(e.target.value)}
                        style={{ ...inputStyle, maxWidth: "280px" }}
                      >
                        <option value="">Select player</option>
                        {matchPlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.full_name}
                            {player.jersey_number
                              ? ` #${player.jersey_number}`
                              : ""}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleSaveMOTM}
                        disabled={motmSaving}
                        style={motmButtonStyle}
                      >
                        {motmSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}

                  {motmPlayer ? (
                    <div style={motmCardStyle} className="match-motm-card">
                      <div style={motmAvatarWrapStyle}>
                        {motmPlayer.photo_url ? (
                          <img
                            src={motmPlayer.photo_url}
                            alt={motmPlayer.full_name}
                            style={motmAvatarImageStyle}
                          />
                        ) : (
                          <span style={motmAvatarFallbackStyle}>
                            {motmPlayer.full_name?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        )}
                      </div>

                      <div style={motmContentStyle} className="match-motm-content">
                        <div style={motmPlayerNameStyle}>
                          {motmPlayer.full_name}
                        </div>
                        <div style={motmMetaStyle}>
                          {motmPlayer.jersey_number
                            ? `#${motmPlayer.jersey_number} • `
                            : ""}
                          {motmPlayer.role || "Player"}
                        </div>
                        <div style={motmMetaStyle}>{motmTeamName}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={motmEmptyStyle}>No Man of the Match selected yet.</div>
                  )}
                </div>
              </div>

              <div style={teamColumnStyle} className={`match-team-column ${match.winner_team_id === match.team_b_id ? "match-team-winner" : ""} ${winnerPulseTeamId === match.team_b_id ? "match-team-winner-pulse" : ""}`}>
                {renderTeamLogo(match.team_b_id, true)}
                <div style={teamNameBigStyle} className="match-team-name">
                  {getTeamName(match.team_b_id)}
                </div>
              </div>
            </div>

            {canManageMatch && (
              <div style={actionsRowStyle} className="match-actions">
                {match.status === "scheduled" && (
                  <button onClick={handleStartMatch} style={startButtonStyle}>
                    <Play size={15} />
                    Start
                  </button>
                )}

                {match.status === "live" && (match.current_half || 1) === 1 && (
                  <button onClick={handleBreakMatch} style={breakButtonStyle}>
                    <Pause size={15} />
                    Break
                  </button>
                )}

                {match.status === "break" && (
                  <button onClick={handleResumeMatch} style={resumeButtonStyle}>
                    <RotateCcw size={15} />
                    Resume
                  </button>
                )}

                {match.status === "live" && (match.current_half || 1) === 2 && (
                  <button onClick={handleFinishMatch} style={finishButtonStyle}>
                    <Flag size={15} />
                    Finish
                  </button>
                )}
              </div>
            )}
          </div>

          {canManageMatch && (
            <div style={mainGridStyle} className="match-main-grid">
              <div style={panelCardStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelIconBlueStyle}>
                    <Goal size={18} />
                  </div>
                  <div>
                    <div style={panelTitleStyle}>Add Goal</div>
                    <div style={panelSubtitleStyle}>
                      Register a goal for the active match
                    </div>
                  </div>
                </div>

                <select
                  value={goalTeamId}
                  onChange={(e) => {
                    setGoalTeamId(e.target.value);
                    setGoalPlayerId("");
                  }}
                  style={inputStyle}
                >
                  <option value="">Select team</option>
                  {matchTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.company_name || team.team_name}
                    </option>
                  ))}
                </select>

                <select
                  value={goalPlayerId}
                  onChange={(e) => setGoalPlayerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select player</option>
                  {goalPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.full_name}{" "}
                      {player.jersey_number ? `#${player.jersey_number}` : ""}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddGoal}
                  disabled={goalSaving}
                  style={goalSaveButtonStyle}
                >
                  {goalSaving ? "Saving..." : "Save Goal"}
                </button>
              </div>

              <div style={panelCardStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelIconRedStyle}>
                    <Square size={18} />
                  </div>
                  <div>
                    <div style={panelTitleStyle}>Add Card</div>
                    <div style={panelSubtitleStyle}>
                      Register yellow or red cards
                    </div>
                  </div>
                </div>

                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select card type</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                </select>

                <select
                  value={cardTeamId}
                  onChange={(e) => {
                    setCardTeamId(e.target.value);
                    setCardPlayerId("");
                  }}
                  style={inputStyle}
                >
                  <option value="">Select team</option>
                  {matchTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.company_name || team.team_name}
                    </option>
                  ))}
                </select>

                <select
                  value={cardPlayerId}
                  onChange={(e) => setCardPlayerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select player</option>
                  {cardPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.full_name}{" "}
                      {player.jersey_number ? `#${player.jersey_number}` : ""}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddCard}
                  disabled={cardSaving}
                  style={
                    cardType === "red" ? redSaveButtonStyle : yellowSaveButtonStyle
                  }
                >
                  {cardSaving ? "Saving..." : "Save Card"}
                </button>
              </div>
            </div>
          )}

          <div style={eventsCardStyle}>
            <div style={panelHeaderStyle}>
              <div style={panelIconPurpleStyle}>
                <Clock3 size={18} />
              </div>
              <div>
                <div style={panelTitleStyle}>Match Events</div>
                <div style={panelSubtitleStyle}>
                  Goals and cards organized by half
                </div>
              </div>
            </div>

            {allEvents.length === 0 ? (
              <div style={noEventsStyle}>No events yet</div>
            ) : (
              <div>
                {renderHalfSection("1st Half", firstHalfEvents)}
                {renderHalfSection("2nd Half", secondHalfEvents)}
              </div>
            )}
          </div>
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

const backButtonStyle = {
  marginBottom: "18px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  color: "#111827",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const summaryCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "18px 16px",
  marginBottom: "20px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const summaryTopStyle = {
  textAlign: "center",
  fontSize: "16px",
  fontWeight: "600",
  color: "#6b7280",
  marginBottom: "22px",
};

const scoreboardGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "20px",
};

const teamColumnStyle = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const teamNameBigStyle = {
  fontSize: "clamp(14px, 4vw, 22px)",
  fontWeight: "700",
  color: "#111827",
  lineHeight: 1.2,
  marginTop: "0",
  textAlign: "center",
};

const scoreCenterStyle = {
  textAlign: "center",
  minWidth: "120px",
};

const scoreBigStyle = {
  fontSize: "clamp(32px, 8vw, 64px)",
  fontWeight: "800",
  lineHeight: 1,
  color: "#ff1455",
  letterSpacing: "2px",
  minHeight: "64px",
};

const phaseStyle = {
  marginTop: "14px",
  fontSize: "clamp(14px, 4vw, 20px)",
  fontWeight: "800",
  textTransform: "uppercase",
};

const clockStyle = {
  marginTop: "6px",
  fontSize: "clamp(14px, 4vw, 22px)",
  fontWeight: "700",
  color: "#111827",
};

const timingInfoStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "600",
};

const penaltiesRowStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
};

const winnerTextStyle = {
  marginTop: "12px",
  fontSize: "14px",
  fontWeight: "800",
  color: "#16a34a",
  textAlign: "center",
};

const motmWrapStyle = {
  marginTop: "16px",
  textAlign: "center",
};

const motmTitleStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "800",
  marginBottom: "10px",
  color: "#111827",
};

const motmEditorStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

const motmButtonStyle = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const motmEmptyStyle = {
  marginTop: "12px",
  color: "#6b7280",
  fontWeight: "600",
  fontSize: "14px",
};

const motmCardStyle = {
  marginTop: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "14px",
  padding: "10px",
  borderRadius: "16px",
  background: "rgba(245,158,11,0.10)",
  border: "1px solid rgba(245,158,11,0.22)",
  maxWidth: "420px",
  marginInline: "auto",
};

const motmAvatarWrapStyle = {
  width: "50px",
  height: "50px",
  minWidth: "50px",
  borderRadius: "50%",
  background: "#fff",
  border: "1px solid rgba(245,158,11,0.22)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const motmAvatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const motmAvatarFallbackStyle = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#b45309",
};

const motmContentStyle = {
  textAlign: "left",
  flex: 1,
};

const motmPlayerNameStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#111827",
};

const motmMetaStyle = {
  marginTop: "4px",
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: "600",
};

const actionsRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px",
};

const actionBtnBase = {
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const startButtonStyle = {
  ...actionBtnBase,
  background: "#16a34a",
};

const breakButtonStyle = {
  ...actionBtnBase,
  background: "#f59e0b",
};

const resumeButtonStyle = {
  ...actionBtnBase,
  background: "#2563eb",
};

const finishButtonStyle = {
  ...actionBtnBase,
  background: "#374151",
};

const penaltySaveButtonStyle = {
  ...actionBtnBase,
  background: "#111827",
  padding: "12px 14px",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const panelCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  display: "grid",
  gap: "12px",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "4px",
};

const panelIconBase = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const panelIconBlueStyle = {
  ...panelIconBase,
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
};

const panelIconRedStyle = {
  ...panelIconBase,
  background: "rgba(207,33,54,0.10)",
  color: "#cf2136",
};

const panelIconPurpleStyle = {
  ...panelIconBase,
  background: "rgba(124,58,237,0.10)",
  color: "#7c3aed",
};

const panelTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#111827",
};

const panelSubtitleStyle = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "4px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "#fff",
  boxSizing: "border-box",
};

const goalSaveButtonStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "11px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const yellowSaveButtonStyle = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "11px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const redSaveButtonStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "11px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const eventsCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const halfHeaderStyle = {
  background: "#f3f4f6",
  borderRadius: "10px",
  padding: "10px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const halfTitleStyle = {
  fontWeight: "800",
  color: "#4b5563",
  fontSize: "15px",
  textTransform: "uppercase",
};

const noEventsStyle = {
  color: "#9ca3af",
  fontSize: "14px",
  padding: "10px 2px",
};

const eventRowStyle = {
  display: "grid",
  gridTemplateColumns: "80px 1fr 80px",
  alignItems: "center",
  gap: "14px",
  padding: "10px 0",
};

const eventMinuteStyle = {
  fontSize: "16px",
  fontWeight: "700",
};

const eventCenterStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  alignItems: "center",
  gap: "20px",
};

const eventCardBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  minHeight: "46px",
};

const eventCardLeftStyle = {
  ...eventCardBaseStyle,
};

const eventCardRightStyle = {
  ...eventCardBaseStyle,
};

const eventPlayerStyle = {
  fontWeight: "700",
  color: "#111827",
  fontSize: "17px",
};

const eventMetaStyle = {
  fontSize: "13px",
  color: "#6b7280",
};

const deleteMiniButtonStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "6px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "12px",
};

export default MatchDetailsPage;