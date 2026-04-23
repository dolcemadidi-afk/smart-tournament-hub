import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import Skeleton from "../../components/Skeleton";
import {
  Trophy,
  Users,
  UserSquare2,
  CalendarDays,
  Newspaper,
  Building2,
  Activity,
  Flag,
  Target,
  ChevronRight,
} from "lucide-react";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const results = await Promise.allSettled([
        supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
        supabase.from("teams").select("*").order("created_at", { ascending: false }),
        supabase.from("players").select("*").order("created_at", { ascending: false }),
        supabase.from("matches").select("*").order("match_date", { ascending: false }).order("match_time", { ascending: false }),
        supabase.from("news").select("*").order("created_at", { ascending: false }),
      ]);

      const [tournamentsRes, teamsRes, playersRes, matchesRes, newsRes] = results;

      if (tournamentsRes.status === "fulfilled" && !tournamentsRes.value.error) setTournaments(tournamentsRes.value.data || []);
      if (teamsRes.status === "fulfilled" && !teamsRes.value.error) setTeams(teamsRes.value.data || []);
      if (playersRes.status === "fulfilled" && !playersRes.value.error) setPlayers(playersRes.value.data || []);
      if (matchesRes.status === "fulfilled" && !matchesRes.value.error) setMatches(matchesRes.value.data || []);
      if (newsRes.status === "fulfilled" && !newsRes.value.error) setNewsItems(newsRes.value.data || []);

      setTimeout(() => setLoading(false), 700);
    };

    fetchDashboardData();
  }, []);

  const getTournamentName = (id) => tournaments.find((t) => t.id === id)?.name || "Unknown Tournament";
  const getTeamName = (id) => teams.find((t) => t.id === id)?.team_name || teams.find((t) => t.id === id)?.company_name || "Unknown Team";
  const getTeamLogo = (id) => teams.find((t) => t.id === id)?.logo_url || "";

  const recentNews = useMemo(() => newsItems.slice(0, 3), [newsItems]);

  const companyLogos = useMemo(() => {
    const uniqueCompanies = [];
    teams.forEach((team) => {
      const companyName = team.company_name?.trim();
      if (!companyName) return;
      const exists = uniqueCompanies.find((item) => item.name === companyName);
      if (!exists) uniqueCompanies.push({ name: companyName, logo_url: team.logo_url || "" });
    });
    return uniqueCompanies;
  }, [teams]);

  const loopingCompanies = companyLogos.length > 0 ? [...companyLogos, ...companyLogos] : [];

  const recentMatches = useMemo(() => {
    return matches
      .filter((match) => match.status === "finished")
      .sort((a, b) => {
        const aTime = new Date(a.finished_at || `${a.match_date || "1970-01-01"}T${a.match_time || "00:00"}`).getTime();
        const bTime = new Date(b.finished_at || `${b.match_date || "1970-01-01"}T${b.match_time || "00:00"}`).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [matches]);

  const tournamentProgress = useMemo(() => {
    const groupMatches = matches.filter((match) => match.stage === "group");
    const finishedGroupMatches = groupMatches.filter((match) => match.status === "finished");
    const totalGroupMatches = groupMatches.length;
    const groupCompletionPercent = totalGroupMatches > 0 ? Math.round((finishedGroupMatches.length / totalGroupMatches) * 100) : 0;
    const hasStage = (stage) => matches.some((match) => match.stage === stage);
    const stageFinished = (stage) => matches.some((match) => match.stage === stage && match.status === "finished");

    let currentKnockoutRound = "Not generated";
    if (stageFinished("final")) currentKnockoutRound = "Completed";
    else if (hasStage("final")) currentKnockoutRound = "Final";
    else if (hasStage("semifinal")) currentKnockoutRound = "Semifinals";
    else if (hasStage("quarterfinal")) currentKnockoutRound = "Quarterfinals";
    else if (hasStage("round_of_16")) currentKnockoutRound = "Round of 16";
    else if (hasStage("round_of_32")) currentKnockoutRound = "Round of 32";
    else if (hasStage("round_of_64")) currentKnockoutRound = "Round of 64";

    const knockoutMatches = matches.filter((match) => match.stage !== "group");
    return {
      totalGroupMatches,
      finishedGroupMatches: finishedGroupMatches.length,
      groupCompletionPercent,
      currentKnockoutRound,
      knockoutMatchesCount: knockoutMatches.length,
      liveKnockoutMatches: knockoutMatches.filter((m) => m.status === "live").length,
      finishedKnockoutMatches: knockoutMatches.filter((m) => m.status === "finished").length,
    };
  }, [matches]);

  const getMatchStatusColor = (status) => {
    if (status === "live") return "#cf2136";
    if (status === "break") return "#f59e0b";
    if (status === "finished") return "#6b7280";
    if (status === "postponed") return "#7c3aed";
    return "#1476b6";
  };

  const getMatchStatusBg = (status) => {
    if (status === "live") return "rgba(207,33,54,0.10)";
    if (status === "break") return "rgba(245,158,11,0.12)";
    if (status === "finished") return "rgba(107,114,128,0.10)";
    if (status === "postponed") return "rgba(124,58,237,0.10)";
    return "rgba(20,118,182,0.10)";
  };

  if (loading) {
    return (
      <>
        <style>{`
          @media (max-width: 1024px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .dashboard-news-grid, .dashboard-progress-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 768px) {
            .dashboard-page { padding: 14px !important; }
            .dashboard-container { max-width: 100% !important; }
            .dashboard-stats-grid { grid-template-columns: 1fr !important; }
            .dashboard-hero { padding: 18px !important; border-radius: 18px !important; }
            .dashboard-hero-row { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
            .dashboard-section-card { padding: 16px !important; border-radius: 16px !important; }
            .dashboard-news-header, .dashboard-section-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          }
        `}</style>
        <div style={pageStyle} className="dashboard-page">
          <div style={containerStyle} className="dashboard-container">
            <DashboardSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes logoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes dashboardGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(20,118,182,0); }
          50% { box-shadow: 0 0 28px rgba(20,118,182,0.10); }
        }
        .dashboard-progress-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(17,24,39,0.08); }
        .dashboard-progress-bar-fill { animation: dashboardGlow 2.8s ease-in-out infinite; }
        @media (max-width: 1024px) {
          .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dashboard-news-grid, .dashboard-progress-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .dashboard-page { padding: 14px !important; }
          .dashboard-container { max-width: 100% !important; }
          .dashboard-stats-grid { grid-template-columns: 1fr !important; }
          .dashboard-hero { padding: 18px !important; border-radius: 18px !important; }
          .dashboard-hero-row { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .dashboard-section-card { padding: 16px !important; border-radius: 16px !important; }
          .dashboard-news-header, .dashboard-section-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .dashboard-progress-badges { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={pageStyle} className="dashboard-page">
        <div style={containerStyle} className="dashboard-container">
          <div style={heroCardStyle} className="dashboard-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="dashboard-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>Tournament Dashboard</h1>
                <p style={heroTextStyle}>Manage tournaments, teams, players, matches, and news from one central place with a cleaner and more modern experience.</p>
              </div>
              <div style={heroBadgeWrapStyle}>
                <div style={heroBadgeStyle}><Activity size={16} />Live Operations</div>
              </div>
            </div>
          </div>

          <div style={statsGridStyle} className="dashboard-stats-grid">
            <StatCard title="Tournaments" value={tournaments.length} icon={<Trophy size={20} />} accent="#1476b6" soft="rgba(20,118,182,0.10)" />
            <StatCard title="Teams" value={teams.length} icon={<Users size={20} />} accent="#109847" soft="rgba(16,152,71,0.10)" />
            <StatCard title="Players" value={players.length} icon={<UserSquare2 size={20} />} accent="#cf2136" soft="rgba(207,33,54,0.10)" />
            <StatCard title="Matches" value={matches.length} icon={<CalendarDays size={20} />} accent="#1476b6" soft="rgba(20,118,182,0.10)" />
          </div>

          <div style={sectionCardStyle} className="dashboard-section-card">
            <div style={sectionHeaderRowStyle} className="dashboard-section-header">
              <div style={sectionTitleWrapStyle}>
                <div style={{ ...sectionIconStyle, background: "rgba(20,118,182,0.10)", color: "#1476b6" }}><Target size={18} /></div>
                <div>
                  <div style={sectionTitleStyle}>Tournament Progress Tracker</div>
                  <div style={sectionSubtitleStyle}>Group stage completion and current knockout status at a glance</div>
                </div>
              </div>
            </div>

            <div style={progressGridStyle} className="dashboard-progress-grid">
              <div style={{ ...progressCardStyle, background: "linear-gradient(180deg, rgba(20,118,182,0.06) 0%, #ffffff 100%)" }} className="dashboard-progress-card">
                <div style={progressCardTopStyle}>
                  <div>
                    <div style={progressLabelStyle}>Group Stage Completion</div>
                    <div style={progressBigValueStyle}>{tournamentProgress.groupCompletionPercent}%</div>
                  </div>
                  <div style={progressPillStyle}>{tournamentProgress.finishedGroupMatches} / {tournamentProgress.totalGroupMatches || 0} finished</div>
                </div>
                <div style={progressBarTrackStyle}>
                  <div className="dashboard-progress-bar-fill" style={{ ...progressBarFillStyle, width: `${Math.min(100, Math.max(0, tournamentProgress.groupCompletionPercent))}%` }} />
                </div>
                <div style={progressMetaRowStyle}>
                  <span>Group matches completed</span>
                  <span>{tournamentProgress.finishedGroupMatches}</span>
                </div>
              </div>

              <div style={{ ...progressCardStyle, background: "linear-gradient(180deg, rgba(16,152,71,0.06) 0%, #ffffff 100%)" }} className="dashboard-progress-card">
                <div style={progressLabelStyle}>Current Knockout Round</div>
                <div style={knockoutRoundRowStyle}>
                  <div style={knockoutRoundBadgeStyle}><Trophy size={18} />{tournamentProgress.currentKnockoutRound}</div>
                  <ChevronRight size={18} color="#9ca3af" />
                </div>
                <div style={knockoutStatsGridStyle} className="dashboard-progress-badges">
                  <MiniProgressStat label="Knockout Matches" value={tournamentProgress.knockoutMatchesCount} accent="#1476b6" />
                  <MiniProgressStat label="Live" value={tournamentProgress.liveKnockoutMatches} accent="#cf2136" />
                  <MiniProgressStat label="Finished" value={tournamentProgress.finishedKnockoutMatches} accent="#109847" />
                </div>
              </div>
            </div>
          </div>

          <div style={sectionCardStyle} className="dashboard-section-card">
            <div style={sectionHeaderRowStyle} className="dashboard-section-header">
              <div style={sectionTitleWrapStyle}>
                <div style={{ ...sectionIconStyle, background: "rgba(16,152,71,0.10)", color: "#109847" }}><Building2 size={18} /></div>
                <div>
                  <div style={sectionTitleStyle}>Companies Participating</div>
                  <div style={sectionSubtitleStyle}>Partner companies currently represented in the tournament</div>
                </div>
              </div>
            </div>

            {companyLogos.length === 0 ? (
              <p style={emptyTextStyle}>No company logos yet.</p>
            ) : (
              <div style={{ overflow: "hidden", width: "100%" }}>
                <div style={companyTrackStyle}>
                  {loopingCompanies.map((company, index) => (
                    <div key={`${company.name}-${index}`} style={companyPillStyle} className="dashboard-company-pill">
                      <div style={companyLogoWrapStyle}>
                        {company.logo_url ? <img src={company.logo_url} alt={company.name} style={companyLogoStyle} /> : <span style={companyFallbackStyle}>{company.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <span style={companyNameStyle} className="dashboard-company-name">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={sectionCardStyle} className="dashboard-section-card">
            <div style={newsHeaderStyle} className="dashboard-news-header">
              <div style={sectionTitleWrapStyle}>
                <div style={{ ...sectionIconStyle, background: "rgba(20,118,182,0.10)", color: "#1476b6" }}><Newspaper size={18} /></div>
                <div>
                  <div style={sectionTitleStyle}>Smart Consulting Sport News</div>
                  <div style={sectionSubtitleStyle}>Latest content and highlights from your platform</div>
                </div>
              </div>
              <Link to="/news" style={viewAllBtnStyle}>Go to News</Link>
            </div>

            {recentNews.length === 0 ? (
              <p style={emptyTextStyle}>No news yet.</p>
            ) : (
              <div style={newsGridStyle} className="dashboard-news-grid">
                {recentNews.map((item) => (
                  <Link key={item.id} to={`/news/${item.id}`} style={newsCardLinkStyle}>
                    <div style={newsCardStyle}>
                      <div style={newsImageWrapStyle}>
                        {item.cover_image ? <img src={item.cover_image} alt={item.title} style={newsImageStyle} /> : <div style={newsImageFallbackStyle}>No image</div>}
                      </div>
                      <div style={newsContentStyle}>
                        <div style={newsTitleStyle}>{item.title}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={sectionCardStyle} className="dashboard-section-card">
            <div style={sectionHeaderRowStyle} className="dashboard-section-header">
              <div style={sectionTitleWrapStyle}>
                <div style={{ ...sectionIconStyle, background: "rgba(207,33,54,0.10)", color: "#cf2136" }}><CalendarDays size={18} /></div>
                <div>
                  <div style={sectionTitleStyle}>Recent Finished Matches</div>
                  <div style={sectionSubtitleStyle}>Latest finished matches from your platform</div>
                </div>
              </div>
            </div>

            {recentMatches.length === 0 ? (
              <p style={emptyTextStyle}>No finished matches yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {recentMatches.map((match) => {
                  const isKnockout = ["quarterfinal", "semifinal", "final", "third_place", "round_of_16", "round_of_32", "round_of_64"].includes(match.stage);
                  const isDraw = Number(match.team_a_score ?? 0) === Number(match.team_b_score ?? 0);
                  const showPenalties = isKnockout && isDraw && match.team_a_penalties != null && match.team_b_penalties != null;
                  const winnerName = match.winner_team_id ? getTeamName(match.winner_team_id) : null;

                  return (
                    <Link key={match.id} to={`/matches/${match.id}`} style={matchCardLinkStyle} className="dashboard-match-link">
                      <div style={matchCardStyle}>
                        <div style={matchMetaBarStyle} className="dashboard-match-meta">
                          <span>{getTournamentName(match.tournament_id)}</span>
                          <span>{match.field || "No field"} • {match.match_date || "-"} • {match.match_time || "-"}</span>
                        </div>

                        <div style={matchBodyStyle} className="dashboard-match-row">
                          <div style={matchMainStyle}>
                            <div style={{ ...matchStatusStyle, color: getMatchStatusColor(match.status), background: getMatchStatusBg(match.status) }}>{match.status}</div>
                            <div style={teamsColumnStyle}>
                              <div style={teamRowStyle} className="dashboard-team-row">
                                <div style={teamInfoStyle}>
                                  <MiniLogo logo={getTeamLogo(match.team_a_id)} name={getTeamName(match.team_a_id)} />
                                  <span>{getTeamName(match.team_a_id)}</span>
                                </div>
                                <span style={scoreInlineStyle} className="dashboard-inline-score">{match.team_a_score ?? 0}{showPenalties && ` (${match.team_a_penalties})`}</span>
                              </div>

                              <div style={teamRowStyle} className="dashboard-team-row">
                                <div style={teamInfoStyle}>
                                  <MiniLogo logo={getTeamLogo(match.team_b_id)} name={getTeamName(match.team_b_id)} />
                                  <span>{getTeamName(match.team_b_id)}</span>
                                </div>
                                <span style={scoreInlineStyle} className="dashboard-inline-score">{match.team_b_score ?? 0}{showPenalties && ` (${match.team_b_penalties})`}</span>
                              </div>
                            </div>

                            {winnerName && <div style={winnerBadgeStyle}><Flag size={14} />Winner: {winnerName}</div>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div style={heroCardStyle} className="dashboard-hero">
        <div style={heroOverlayStyle} />
        <div style={heroRowStyle} className="dashboard-hero-row">
          <div style={{ width: "100%", maxWidth: "620px" }}>
            <div style={{ marginBottom: "10px" }}><Skeleton height="14px" width="180px" radius="8px" /></div>
            <div style={{ marginBottom: "14px" }}><Skeleton height="38px" width="320px" radius="10px" /></div>
            <Skeleton height="16px" width="100%" radius="8px" />
            <div style={{ height: "10px" }} />
            <Skeleton height="16px" width="88%" radius="8px" />
            <div style={{ height: "10px" }} />
            <Skeleton height="16px" width="70%" radius="8px" />
          </div>
          <div style={{ minWidth: "160px", width: "160px" }}><Skeleton height="42px" width="100%" radius="999px" /></div>
        </div>
      </div>

      <div style={statsGridStyle} className="dashboard-stats-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} style={statCardStyle}>
            <div style={statTopStyle}>
              <div style={{ flex: 1 }}>
                <Skeleton height="14px" width="90px" radius="8px" />
                <div style={{ height: "14px" }} />
                <Skeleton height="34px" width="70px" radius="10px" />
              </div>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", overflow: "hidden" }}>
                <Skeleton height="48px" width="48px" radius="14px" />
              </div>
            </div>
            <div style={{ marginTop: "18px" }}><Skeleton height="5px" width="100%" radius="999px" /></div>
          </div>
        ))}
      </div>
    </>
  );
}

function StatCard({ title, value, icon, accent, soft }) {
  return (
    <div style={statCardStyle}>
      <div style={statTopStyle}>
        <div style={statTextWrapStyle}>
          <div style={statTitleStyle}>{title}</div>
          <div style={statValueStyle}>{value}</div>
        </div>
        <div style={{ ...statIconWrapStyle, background: soft, color: accent }}>{icon}</div>
      </div>
      <div style={{ ...statBottomBarStyle, background: accent }} />
    </div>
  );
}

function MiniLogo({ logo, name }) {
  return (
    <div style={miniLogoWrapStyle}>
      {logo ? <img src={logo} alt={name} style={miniLogoStyle} /> : <span style={miniLogoFallbackStyle}>{name?.charAt(0)?.toUpperCase() || "T"}</span>}
    </div>
  );
}

function MiniProgressStat({ label, value, accent }) {
  return (
    <div style={{ ...miniProgressCardStyle, borderColor: `${accent}22` }}>
      <div style={miniProgressLabelStyle}>{label}</div>
      <div style={{ ...miniProgressValueStyle, color: accent }}>{value}</div>
    </div>
  );
}

const pageStyle = { padding: "24px", background: "#f3f4f6", minHeight: "100vh", fontFamily: "Arial, sans-serif" };
const containerStyle = { maxWidth: "1180px", margin: "0 auto", width: "100%" };
const heroCardStyle = { position: "relative", overflow: "hidden", borderRadius: "24px", padding: "24px", marginBottom: "24px", background: "linear-gradient(135deg, #1476b6 0%, #109847 55%, #cf2136 100%)", boxShadow: "0 18px 40px rgba(17,24,39,0.12)" };
const heroOverlayStyle = { position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 30%)" };
const heroRowStyle = { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" };
const heroEyebrowStyle = { fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px", color: "#fff", opacity: 0.92, marginBottom: "8px", fontWeight: "700" };
const heroTitleStyle = { margin: 0, color: "#fff", fontSize: "34px", fontWeight: "800" };
const heroTextStyle = { marginTop: "10px", color: "rgba(255,255,255,0.92)", maxWidth: "620px", lineHeight: 1.7, fontSize: "15px" };
const heroBadgeWrapStyle = { display: "flex", alignItems: "center" };
const heroBadgeStyle = { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff", fontWeight: "700", whiteSpace: "nowrap" };
const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" };
const statCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" };
const statTopStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" };
const statTextWrapStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const statTitleStyle = { fontSize: "14px", color: "#6b7280", fontWeight: "700" };
const statValueStyle = { fontSize: "34px", fontWeight: "900", color: "#111827", lineHeight: 1 };
const statIconWrapStyle = { width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" };
const statBottomBarStyle = { height: "5px", borderRadius: "999px", marginTop: "18px" };
const sectionCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", padding: "20px", marginBottom: "24px", overflow: "hidden" };
const sectionHeaderRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" };
const sectionTitleWrapStyle = { display: "flex", alignItems: "center", gap: "12px" };
const sectionIconStyle = { width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" };
const sectionTitleStyle = { fontSize: "20px", fontWeight: "800", color: "#111827" };
const sectionSubtitleStyle = { fontSize: "13px", color: "#6b7280", marginTop: "4px" };
const emptyTextStyle = { margin: 0, color: "#6b7280" };
const progressGridStyle = { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" };
const progressCardStyle = { border: "1px solid #e5e7eb", borderRadius: "20px", padding: "18px", minHeight: "192px", transition: "transform 0.22s ease, box-shadow 0.22s ease" };
const progressCardTopStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "20px", flexWrap: "wrap" };
const progressLabelStyle = { fontSize: "14px", color: "#6b7280", fontWeight: "700", marginBottom: "8px" };
const progressBigValueStyle = { fontSize: "42px", lineHeight: 1, fontWeight: "900", color: "#111827" };
const progressPillStyle = { padding: "10px 12px", borderRadius: "999px", background: "#ffffff", border: "1px solid #dbe4ee", color: "#1476b6", fontWeight: "800", fontSize: "13px", whiteSpace: "nowrap" };
const progressBarTrackStyle = { width: "100%", height: "12px", borderRadius: "999px", background: "#e5eef8", overflow: "hidden" };
const progressBarFillStyle = { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #1476b6 0%, #19a0f5 100%)" };
const progressMetaRowStyle = { marginTop: "14px", display: "flex", justifyContent: "space-between", gap: "10px", color: "#4b5563", fontSize: "13px", fontWeight: "700" };
const knockoutRoundRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "10px", marginBottom: "18px" };
const knockoutRoundBadgeStyle = { display: "inline-flex", alignItems: "center", gap: "10px", borderRadius: "16px", padding: "14px 16px", background: "linear-gradient(135deg, rgba(16,152,71,0.10) 0%, rgba(20,118,182,0.10) 100%)", color: "#111827", fontSize: "18px", fontWeight: "900" };
const knockoutStatsGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" };
const miniProgressCardStyle = { border: "1px solid #e5e7eb", borderRadius: "14px", padding: "12px", background: "#fff" };
const miniProgressLabelStyle = { fontSize: "12px", color: "#6b7280", fontWeight: "700" };
const miniProgressValueStyle = { marginTop: "8px", fontSize: "24px", fontWeight: "900", lineHeight: 1 };
const companyTrackStyle = { display: "flex", gap: "16px", width: "max-content", animation: "logoScroll 25s linear infinite" };
const companyPillStyle = { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "999px", background: "#f9fafb", border: "1px solid #e5e7eb", minWidth: "fit-content" };
const companyLogoWrapStyle = { width: "42px", height: "42px", minWidth: "42px", borderRadius: "50%", overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" };
const companyLogoStyle = { width: "100%", height: "100%", objectFit: "cover" };
const companyFallbackStyle = { fontWeight: "700", color: "#6b7280", fontSize: "16px" };
const companyNameStyle = { fontSize: "14px", fontWeight: "700", color: "#111827" };
const newsHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" };
const viewAllBtnStyle = { background: "#109847", color: "#fff", textDecoration: "none", padding: "10px 14px", borderRadius: "10px", fontWeight: "700", whiteSpace: "nowrap" };
const newsGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" };
const newsCardLinkStyle = { textDecoration: "none", color: "inherit" };
const newsCardStyle = { border: "1px solid #e5e7eb", borderRadius: "16px", overflow: "hidden", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", transition: "0.2s ease" };
const newsImageWrapStyle = { width: "100%", height: "180px", background: "#e5e7eb", overflow: "hidden" };
const newsImageStyle = { width: "100%", height: "100%", objectFit: "cover" };
const newsImageFallbackStyle = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: "700" };
const newsContentStyle = { padding: "14px" };
const newsTitleStyle = { fontSize: "16px", fontWeight: "800", lineHeight: "1.5", color: "#1f2937" };
const matchCardLinkStyle = { textDecoration: "none", color: "inherit", display: "block" };
const matchCardStyle = { border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden", background: "#fafafa", transition: "0.2s ease" };
const matchMetaBarStyle = { padding: "10px 14px", background: "#eef4fb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", fontSize: "13px", color: "#4b5563", fontWeight: "700" };
const matchBodyStyle = { padding: "14px" };
const matchMainStyle = { display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 };
const matchStatusStyle = { fontWeight: "800", fontSize: "13px", textTransform: "uppercase", padding: "10px 12px", borderRadius: "999px", width: "fit-content" };
const teamsColumnStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const teamRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontWeight: "700", color: "#111827" };
const teamInfoStyle = { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 };
const scoreInlineStyle = { fontSize: "24px", fontWeight: "900", color: "#111827", marginLeft: "auto", minWidth: "40px", textAlign: "right" };
const winnerBadgeStyle = { width: "fit-content", display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "999px", background: "rgba(16,152,71,0.10)", color: "#109847", fontSize: "13px", fontWeight: "800" };
const miniLogoWrapStyle = { width: "28px", height: "28px", minWidth: "28px", borderRadius: "50%", overflow: "hidden", border: "1px solid #e5e7eb", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" };
const miniLogoStyle = { width: "100%", height: "100%", objectFit: "cover" };
const miniLogoFallbackStyle = { fontSize: "11px", fontWeight: "700", color: "#6b7280" };

export default Dashboard;