import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

function RegistrationStatus() {
  const [teams, setTeams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

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

  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from("team_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error.message);
      return;
    }

    setRegistrations(data || []);
  };

  useEffect(() => {
    fetchTeams();
    fetchRegistrations();
  }, []);

  const getTeamName = (id) => {
    const team = teams.find((t) => t.id === id);
    return team ? team.team_name : "Unknown Team";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamId) {
      alert("Please select a team");
      return;
    }

    setLoading(true);

    const existingRegistration = registrations.find((r) => r.team_id === teamId);

    if (existingRegistration) {
      const { error } = await supabase
        .from("team_registrations")
        .update({
          status,
          notes,
          submitted_at: status === "submitted" ? new Date().toISOString() : existingRegistration.submitted_at,
        })
        .eq("id", existingRegistration.id);

      if (error) {
        console.error("Error updating registration:", error.message);
        alert("Failed to update registration");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("team_registrations").insert([
        {
          team_id: teamId,
          status,
          notes,
          submitted_at: status === "submitted" ? new Date().toISOString() : null,
        },
      ]);

      if (error) {
        console.error("Error creating registration:", error.message);
        alert("Failed to save registration");
        setLoading(false);
        return;
      }
    }

    setTeamId("");
    setStatus("draft");
    setNotes("");

    await fetchRegistrations();
    setLoading(false);
    alert("Registration saved successfully");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this registration?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("team_registrations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting registration:", error.message);
      alert("Failed to delete registration");
      return;
    }

    await fetchRegistrations();
    };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Team Registration Status</h1>

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
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          required
        >
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.team_name}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="needs_correction">Needs Correction</option>
        </select>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Registration"}
        </button>
      </form>

      <h2>All Registrations</h2>

      {registrations.length === 0 ? (
        <p>No registrations yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {registrations.map((registration) => (
            <div
              key={registration.id}
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <h3>{getTeamName(registration.team_id)}</h3>
              <p><strong>Status:</strong> {registration.status || "-"}</p>
              <p><strong>Notes:</strong> {registration.notes || "-"}</p>
              <p><strong>Submitted At:</strong> {registration.submitted_at || "-"}</p>
              <button
                onClick={() => handleDelete(registration.id)}
                style={{
                  marginTop: "10px",
                  backgroundColor: "#d9534f",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Delete Registration
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegistrationStatus;