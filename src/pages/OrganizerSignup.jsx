import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, Link } from "react-router-dom";

function OrganizerSignup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    // change this code to your own private code
    if (secretCode !== "SSC2026") {
      alert("Invalid organizer secret code");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      alert("User was not created.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert([
      {
        id: user.id,
        full_name: fullName,
        email,
        role: "organizer",
      },
    ]);

    setLoading(false);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    navigate("/login");
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Organizer Sign Up</h1>
        <p style={subtitleStyle}>
          Create an organizer account to manage tournaments, teams, and invites.
        </p>

        <form onSubmit={handleSignup}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Organizer Secret Code</label>
          <input
            type="text"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            style={inputStyle}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Creating..." : "Create Organizer Account"}
          </button>
        </form>

        <p style={footerStyle}>
          Already have an account?{" "}
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#eef2f7",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#fff",
  padding: "32px",
  borderRadius: "18px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
};

const titleStyle = {
  margin: 0,
  marginBottom: "10px",
  fontSize: "32px",
  color: "#0f172a",
};

const subtitleStyle = {
  marginTop: 0,
  marginBottom: "24px",
  color: "#64748b",
  lineHeight: "1.6",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "12px",
  fontWeight: "700",
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  marginTop: "20px",
  padding: "14px",
  border: "none",
  borderRadius: "12px",
  background: "#1476b6",
  color: "#fff",
  fontWeight: "700",
  cursor: "pointer",
};

const footerStyle = {
  marginTop: "18px",
  textAlign: "center",
  color: "#64748b",
};

const linkStyle = {
  color: "#1476b6",
  fontWeight: "700",
  textDecoration: "none",
};

export default OrganizerSignup;