import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

function AddGoal() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [goals, setGoals] = useState([]);

  const [matchId, setMatchId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [minute, setMinute] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error.message);
      return;
    }

    setMatches(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase.from("teams").select("*");

    if (error) {
      console.error("Error fetching teams:", error.message);
      return;
    }

    setTeams(data || []);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from("players").select("*");

    if (error) {
      console.error("Error fetching players:", error.message);
      return;
    }

    setPlayers(data || []);
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select(`
        *,
        players (
          full_name,
          jersey_number,
          photo_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error.message);
      return;
    }

    setGoals(data || []);
  };

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    fetchPlayers();
    fetchGoals();
  }, []);

  const selectedMatch = matches.find((match) => match.id === matchId);

  const matchTeams = teams.filter(
    (team) =>
      team.id === selectedMatch?.team_a_id ||
      team.id === selectedMatch?.team_b_id
  );

  const filteredPlayers = players.filter((player) => player.team_id === teamId);

  const getTeamName = (id) => {
    const team = teams.find((t) => t.id === id);
    return team ? team.team_name : "Unknown Team";
  };

  const getPlayer = (id) => {
    return players.find((p) => p.id === id);
  };

  const getMatchName = (match) => {
    const teamA = getTeamName(match.team_a_id);
    const teamB = getTeamName(match.team_b_id);
    return `${teamA} vs ${teamB}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!matchId || !teamId || !playerId || !minute) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const selectedMatchData = matches.find((match) => match.id === matchId);

    if (!selectedMatchData) {
      alert("Match not found");
      setLoading(false);
      return;
    }

    if (selectedMatchData.status !== "live") {
      alert("You can only add goals to live matches");
      setLoading(false);
      return;
    }

    const { error: goalError } = await supabase.from("goals").insert([
      {
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        minute: Number(minute),
      },
    ]);

    if (goalError) {
      console.error("Error adding goal:", goalError.message);
      alert("Failed to add goal");
      setLoading(false);
      return;
    }

    let updatedTeamAScore = selectedMatchData.team_a_score || 0;
    let updatedTeamBScore = selectedMatchData.team_b_score || 0;

    if (teamId === selectedMatchData.team_a_id) {
      updatedTeamAScore += 1;
    } else if (teamId === selectedMatchData.team_b_id) {
      updatedTeamBScore += 1;
    } else {
      alert("Selected team does not belong to this match");
      setLoading(false);
      return;
    }

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        team_a_score: updatedTeamAScore,
        team_b_score: updatedTeamBScore,
      })
      .eq("id", matchId);

    if (matchError) {
      console.error("Error updating match score:", matchError.message);
      alert("Goal saved, but failed to update match score");
      setLoading(false);
      return;
    }

    setMatchId("");
    setTeamId("");
    setPlayerId("");
    setMinute("");

    await fetchGoals();
    await fetchMatches();

    setLoading(false);
    alert("Goal added and score updated successfully");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Add Goal</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "12px",
          maxWidth: "500px",
          marginBottom: "30px",
        }}
      >
        <select
          value={matchId}
          onChange={(e) => {
            setMatchId(e.target.value);
            setTeamId("");
            setPlayerId("");
          }}
          required
        >
          <option value="">Select match</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {getMatchName(match)}
            </option>
          ))}
        </select>

        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            setPlayerId("");
          }}
          required
        >
          <option value="">Select scoring team</option>
          {matchTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.team_name}
            </option>
          ))}
        </select>

        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          required
        >
          <option value="">Select player</option>
          {filteredPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.full_name}{" "}
              {player.jersey_number ? `#${player.jersey_number}` : ""}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Goal minute"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          min="1"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Goal"}
        </button>
      </form>

      <h2>All Goals</h2>

      {goals.length === 0 ? (
        <p>No goals yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {goals.map((goal) => {
            const match = matches.find((m) => m.id === goal.match_id);

            return (
              <div
                key={goal.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                <h3>{goal.players?.full_name || "Unknown Player"}</h3>

                <p>
                <strong>Match:</strong>{" "}
                 {match ? getMatchName(match) : "Unknown Match"}
                </p>

                <p>
                <strong>Team:</strong> {getTeamName(goal.team_id)}
                </p>

                <p>
                <strong>Minute:</strong> {goal.minute}'
                </p>

                <p>
                <strong>Jersey:</strong> {goal.players?.jersey_number || "-"}
                </p>

                {goal.players?.photo_url && (
                 <img
                    src={goal.players.photo_url}
                    alt={goal.players.full_name}
                    style={{
                      width: "100px",
                      borderRadius: "8px",
                      marginTop: "10px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AddGoal;