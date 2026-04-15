import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error loading user:", error.message);
        }

        if (!mounted) return;

        setUser(user || null);
        setEditName(user?.user_metadata?.full_name || "");
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);
    setEditName(user?.user_metadata?.full_name || "");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      alert("Failed to logout.");
      return;
    }

    window.location.href = "/login";
  };

  const handleOpenEdit = () => {
    setEditName(user?.user_metadata?.full_name || "");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      alert("Please enter your full name.");
      return;
    }

    if (!user?.id) {
      alert("No user found.");
      return;
    }

    try {
      setSavingProfile(true);

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
        },
      });

      if (authError) {
        console.error("Auth update error:", authError.message);
        alert(authError.message);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile table update error:", profileError.message);
      }

      await refreshUser();
      setShowEditModal(false);
      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Save profile error:", err);
      alert("Something went wrong while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password update error:", error.message);
        alert(error.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
      alert("Password changed successfully.");
    } catch (err) {
      console.error("Change password error:", err);
      alert("Something went wrong while changing password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const fullName = user?.user_metadata?.full_name || "No name";
  const email = user?.email || "-";
  const userId = user?.id || "-";
  const avatarLetter = fullName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingCardStyle}>Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 900px) {
            .profile-stats-grid {
              grid-template-columns: 1fr !important;
            }

            .profile-content-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 640px) {
            .profile-page {
              padding: 14px !important;
            }

            .profile-hero {
              padding: 22px 18px !important;
              border-radius: 18px !important;
            }

            .profile-hero-content {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .profile-avatar {
              width: 72px !important;
              height: 72px !important;
              min-width: 72px !important;
              font-size: 28px !important;
            }

            .profile-name {
              font-size: 26px !important;
              line-height: 1.15 !important;
            }

            .profile-card,
            .profile-side-card {
              padding: 16px !important;
              border-radius: 16px !important;
            }

            .profile-info-grid {
              grid-template-columns: 1fr !important;
            }

            .profile-setting-item {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .profile-setting-item button {
              width: 100% !important;
            }

            .profile-modal {
              padding: 18px !important;
              border-radius: 14px !important;
            }

            .profile-modal-actions {
              flex-direction: column !important;
            }

            .profile-modal-actions button {
              width: 100% !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="profile-page">
        <div style={containerStyle}>
          <div style={heroCardStyle} className="profile-hero">
            <div style={heroOverlayStyle} />

            <div style={heroContentStyle} className="profile-hero-content">
              <div style={avatarStyle} className="profile-avatar">
                {avatarLetter}
              </div>

              <div>
                <div style={eyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={nameStyle} className="profile-name">
                  {fullName}
                </h1>
                <div style={badgeStyle}>SSC Account</div>
              </div>
            </div>
          </div>

          <div style={statsGridStyle} className="profile-stats-grid">
            <div style={statCardStyle}>
              <div
                style={{
                  ...statIconStyle,
                  background: "rgba(20,118,182,0.12)",
                  color: "#1476b6",
                }}
              >
                👤
              </div>
              <div>
                <div style={statLabelStyle}>Profile Name</div>
                <div style={statValueStyle}>{fullName}</div>
              </div>
            </div>

            <div style={statCardStyle}>
              <div
                style={{
                  ...statIconStyle,
                  background: "rgba(16,152,71,0.12)",
                  color: "#109847",
                }}
              >
                ✉️
              </div>
              <div>
                <div style={statLabelStyle}>Email</div>
                <div style={statValueStyle}>{email}</div>
              </div>
            </div>

            <div style={statCardStyle}>
              <div
                style={{
                  ...statIconStyle,
                  background: "rgba(207,33,54,0.12)",
                  color: "#cf2136",
                }}
              >
                🆔
              </div>
              <div>
                <div style={statLabelStyle}>User ID</div>
                <div style={statSmallValueStyle}>{userId}</div>
              </div>
            </div>
          </div>

          <div style={contentGridStyle} className="profile-content-grid">
            <div style={mainColumnStyle}>
              <div style={cardStyle} className="profile-card">
                <div style={sectionHeaderStyle}>
                  <div style={sectionBarStyle} />
                  <h2 style={sectionTitleStyle}>Personal Information</h2>
                </div>

                {user ? (
                  <div style={infoGridStyle} className="profile-info-grid">
                    <InfoBox label="Full Name" value={fullName} />
                    <InfoBox label="Email Address" value={email} />
                    <InfoBox label="User ID" value={userId} />
                    <InfoBox label="Account Status" value="Active" />
                  </div>
                ) : (
                  <p style={emptyTextStyle}>No user logged in.</p>
                )}
              </div>
            </div>

            <div style={sideColumnStyle}>
              <div style={sideCardStyle} className="profile-side-card">
                <div style={sectionHeaderStyle}>
                  <div style={sectionBarStyle} />
                  <h2 style={sectionTitleStyle}>Account Settings</h2>
                </div>

                <div style={settingsContainerStyle}>
                  <div style={settingItemStyle} className="profile-setting-item">
                    <div>
                      <div style={settingTitleStyle}>Edit Profile</div>
                      <div style={settingDescStyle}>
                        Update your name and personal information
                      </div>
                    </div>
                    <button style={primaryButtonStyle} onClick={handleOpenEdit}>
                      Edit
                    </button>
                  </div>

                  <div style={settingItemStyle} className="profile-setting-item">
                    <div>
                      <div style={settingTitleStyle}>Change Password</div>
                      <div style={settingDescStyle}>
                        Secure your account with a new password
                      </div>
                    </div>
                    <button
                      style={secondaryButtonStyle}
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change
                    </button>
                  </div>

                  <div style={settingItemStyle} className="profile-setting-item">
                    <div>
                      <div style={settingTitleStyle}>Logout</div>
                      <div style={settingDescStyle}>
                        Disconnect from your account
                      </div>
                    </div>
                    <button style={dangerButtonStyle} onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEditModal && (
          <ModalBackdrop onClose={() => setShowEditModal(false)}>
            <div
              style={modalStyle}
              className="profile-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={modalTitleStyle}>Edit Profile</h3>

              <label style={modalLabelStyle}>Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={modalInputStyle}
                placeholder="Enter your full name"
              />

              <div style={modalActionsStyle} className="profile-modal-actions">
                <button
                  style={modalCancelBtnStyle}
                  onClick={() => setShowEditModal(false)}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  style={modalSaveBtnStyle}
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </ModalBackdrop>
        )}

        {showPasswordModal && (
          <ModalBackdrop onClose={() => setShowPasswordModal(false)}>
            <div
              style={modalStyle}
              className="profile-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={modalTitleStyle}>Change Password</h3>

              <label style={modalLabelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={modalInputStyle}
                placeholder="Enter new password"
              />

              <label style={modalLabelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={modalInputStyle}
                placeholder="Confirm new password"
              />

              <div style={modalActionsStyle} className="profile-modal-actions">
                <button
                  style={modalCancelBtnStyle}
                  onClick={() => setShowPasswordModal(false)}
                  disabled={savingPassword}
                >
                  Cancel
                </button>
                <button
                  style={modalSaveBtnStyle}
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </ModalBackdrop>
        )}
      </div>
    </>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={infoBoxStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function ModalBackdrop({ children, onClose }) {
  return (
    <div style={backdropStyle} onClick={onClose}>
      {children}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const heroCardStyle = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  padding: "36px",
  marginBottom: "24px",
  background: "linear-gradient(135deg, #1476b6 0%, #109847 55%, #cf2136 100%)",
  boxShadow: "0 18px 40px rgba(17,24,39,0.14)",
};

const heroOverlayStyle = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 30%)",
};

const heroContentStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "20px",
  color: "#fff",
  zIndex: 1,
  flexWrap: "wrap",
};

const avatarStyle = {
  width: "90px",
  height: "90px",
  minWidth: "90px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
  border: "2px solid rgba(255,255,255,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
  fontWeight: "700",
  color: "#fff",
};

const eyebrowStyle = {
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  opacity: 0.92,
  marginBottom: "8px",
};

const nameStyle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: "700",
};

const badgeStyle = {
  marginTop: "12px",
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "700",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  marginBottom: "24px",
};

const statCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
};

const statIconStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: "700",
};

const statLabelStyle = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "6px",
};

const statValueStyle = {
  fontSize: "17px",
  fontWeight: "700",
  color: "#111827",
  wordBreak: "break-word",
};

const statSmallValueStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#111827",
  wordBreak: "break-word",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "20px",
};

const mainColumnStyle = {
  display: "grid",
  gap: "20px",
};

const sideColumnStyle = {
  display: "grid",
  gap: "20px",
  alignContent: "start",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "20px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
};

const sideCardStyle = {
  background: "#fff",
  borderRadius: "20px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
};

const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
};

const sectionBarStyle = {
  width: "6px",
  height: "24px",
  borderRadius: "999px",
  background: "#1476b6",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "22px",
  color: "#111827",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const infoBoxStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "16px",
};

const infoLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
  marginBottom: "8px",
  letterSpacing: "0.5px",
};

const infoValueStyle = {
  fontSize: "16px",
  color: "#111827",
  fontWeight: "700",
  wordBreak: "break-word",
};

const settingsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const settingItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  gap: "12px",
};

const settingTitleStyle = {
  fontWeight: "700",
  fontSize: "16px",
  color: "#111827",
};

const settingDescStyle = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "4px",
};

const primaryButtonStyle = {
  background: "#109847",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "#cf2136",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
};

const loadingCardStyle = {
  maxWidth: "700px",
  margin: "0 auto",
  background: "#fff",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
};

const emptyTextStyle = {
  margin: 0,
  color: "#6b7280",
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "500px",
  background: "#fff",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
};

const modalTitleStyle = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#111827",
  fontSize: "24px",
};

const modalLabelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "12px",
  fontWeight: "700",
  color: "#374151",
};

const modalInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "22px",
};

const modalCancelBtnStyle = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
};

const modalSaveBtnStyle = {
  background: "#1476b6",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
};

export default Profile;