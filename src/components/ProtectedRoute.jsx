import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("ProtectedRoute auth user:", user);
        console.log("ProtectedRoute auth error:", userError);

        if (userError) {
          console.error("Auth fetch error:", userError);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (!user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(user);

        console.log("ProtectedRoute before profile query");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        console.log("ProtectedRoute profile data:", profileData);
        console.log("ProtectedRoute profile error:", profileError);
        console.log("ProtectedRoute after profile query");

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData || null);
        setLoading(false);
      } catch (err) {
        console.error("ProtectedRoute crashed:", err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    if (profile?.role === "team_manager") {
      if (profile?.team_id) {
        return <Navigate to={`/add-player?teamId=${profile.team_id}`} replace />;
      }
      return <Navigate to="/add-player" replace />;
    }

    if (profile?.role === "staff") {
      return <Navigate to="/" replace />;
    }

    if (profile?.role === "audience") {
      return <Navigate to="/" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;