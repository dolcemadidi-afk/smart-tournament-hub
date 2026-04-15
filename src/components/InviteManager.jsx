import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path if needed

export default function InviteManager({ tournamentId, organizerId = null }) {
  const [managerName, setManagerName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTeams();
  }, [tournamentId]);

  async function fetchTeams() {
    setLoadingTeams(true);
    setMessage("");

    let query = supabase
      .from("teams")
      .select("id, team_name, tournament_id")
      .order("created_at", { ascending: false });

    if (tournamentId) {
      query = query.eq("tournament_id", tournamentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading teams:", error);
      setMessage("Failed to load teams.");
      setTeams([]);
    } else {
      setTeams(data || []);
    }

    setLoadingTeams(false);
  }

  function generateInviteToken() {
    return crypto.randomUUID();
  }

  async function handleSendInvite() {
    setMessage("");

    if (!managerName.trim()) {
      setMessage("Please enter manager name.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter manager email.");
      return;
    }

    if (!selectedTeamId) {
      setMessage("Please select a team.");
      return;
    }

    const selectedTeam = teams.find((team) => team.id === selectedTeamId);

    if (!selectedTeam) {
      setMessage("Selected team not found.");
      return;
    }

    setSending(true);

    const inviteToken = generateInviteToken();

    const { error } = await supabase.from("team_manager_invites").insert([
      {
        tournament_id: selectedTeam.tournament_id,
        email: email.trim().toLowerCase(),
        manager_name: managerName.trim(),
        team_name: selectedTeam.team_name,
        team_id: selectedTeam.id,
        status: "pending",
        invite_token: inviteToken,
        invited_by: organizerId,
      },
    ]);

    if (error) {
      console.error("Invite insert error:", error);
      setMessage("Failed to send invite.");
      setSending(false);
      return;
    }

    const inviteLink = `${window.location.origin}/accept-invite?token=${inviteToken}`;
    console.log("Invite link:", inviteLink);

    setMessage(`Invite created successfully. Link: ${inviteLink}`);

    setManagerName("");
    setEmail("");
    setSelectedTeamId("");
    setSending(false);
  }

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">Invite Team Manager</h2>

      <input
        type="text"
        placeholder="Manager Name"
        value={managerName}
        onChange={(e) => setManagerName(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <select
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        disabled={loadingTeams}
      >
        <option value="">
          {loadingTeams ? "Loading teams..." : "Select Team"}
        </option>

        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.team_name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleSendInvite}
        disabled={sending}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send Invite"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-700 break-all">{message}</p>
      )}
    </div>
  );
}