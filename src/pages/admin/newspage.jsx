import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNewsFromStorage } from "../../utils/newsStorage";
import Skeleton from "../../components/Skeleton";
import { Newspaper, CalendarDays, ChevronRight } from "lucide-react";

function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [sortedNews, setSortedNews] = useState([]);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);

      const newsItems = getNewsFromStorage();

      const sorted = [...newsItems].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setSortedNews(sorted);

      setTimeout(() => {
        setLoading(false);
      }, 600);
    };

    loadNews();
  }, []);

  if (loading) {
    return (
      <>
        <style>
          {`
            @media (max-width: 1024px) {
              .news-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }

            @media (max-width: 768px) {
              .news-page {
                padding: 14px !important;
              }

              .news-hero {
                padding: 18px !important;
                border-radius: 18px !important;
              }

              .news-hero-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 14px !important;
              }

              .news-grid {
                grid-template-columns: 1fr !important;
              }

              .news-card-image {
                height: 200px !important;
              }

              .news-card-title {
                font-size: 20px !important;
              }
            }
          `}
        </style>

        <div style={pageStyle} className="news-page">
          <div style={pageContainerStyle}>
            <NewsPageSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .news-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          @media (max-width: 768px) {
            .news-page {
              padding: 14px !important;
            }

            .news-hero {
              padding: 18px !important;
              border-radius: 18px !important;
            }

            .news-hero-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 14px !important;
            }

            .news-grid {
              grid-template-columns: 1fr !important;
            }

            .news-card-image {
              height: 200px !important;
            }

            .news-card-title {
              font-size: 20px !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="news-page">
        <div style={pageContainerStyle}>
          <div style={heroCardStyle} className="news-hero">
            <div style={heroOverlayStyle} />
            <div style={heroRowStyle} className="news-hero-row">
              <div>
                <div style={heroEyebrowStyle}>Smart Sport Consulting</div>
                <h1 style={heroTitleStyle}>News</h1>
                <p style={heroTextStyle}>
                  Discover the latest tournament updates, announcements, match
                  stories, and important news in one clean place.
                </p>
              </div>

              <div style={heroBadgeStyle}>
                <Newspaper size={16} />
                Latest Updates
              </div>
            </div>
          </div>

          <div style={topBarStyle}>
            <div style={sectionTitleStyle}>All News</div>
            <div style={sectionSubtitleStyle}>
              {sortedNews.length} article{sortedNews.length !== 1 ? "s" : ""}
            </div>
          </div>

          {sortedNews.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconWrapStyle}>
                <Newspaper size={22} />
              </div>
              <div style={emptyTitleStyle}>No news yet</div>
              <div style={emptyTextStyle}>
                Published news articles will appear here.
              </div>
            </div>
          ) : (
            <div style={gridStyle} className="news-grid">
              {sortedNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  style={linkStyle}
                >
                  <article
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 14px 28px rgba(0,0,0,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.04)";
                    }}
                  >
                    <div style={imageWrapStyle} className="news-card-image">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          style={imageStyle}
                        />
                      ) : (
                        <div style={imagePlaceholderStyle}>
                          <Newspaper size={34} />
                        </div>
                      )}
                    </div>

                    <div style={cardContentStyle}>
                      <div style={metaRowStyle}>
                        <span style={categoryBadgeStyle}>
                          {item.category || "News"}
                        </span>

                        <span style={dateStyle}>
                          <CalendarDays size={13} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 style={titleStyle} className="news-card-title">
                        {item.title}
                      </h2>

                      <div style={timeStyle}>
                        {new Date(item.createdAt).toLocaleString()}
                      </div>

                      <div style={readMoreStyle}>
                        Read article <ChevronRight size={15} />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NewsPageSkeleton() {
  return (
    <>
      <div style={heroCardStyle} className="news-hero">
        <div style={heroOverlayStyle} />
        <div style={heroRowStyle} className="news-hero-row">
          <div style={{ width: "100%", maxWidth: "640px" }}>
            <div style={{ marginBottom: "10px" }}>
              <Skeleton height="14px" width="180px" radius="8px" />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <Skeleton height="38px" width="180px" radius="10px" />
            </div>
            <Skeleton height="16px" width="100%" radius="8px" />
            <div style={{ height: "10px" }} />
            <Skeleton height="16px" width="85%" radius="8px" />
            <div style={{ height: "10px" }} />
            <Skeleton height="16px" width="68%" radius="8px" />
          </div>

          <div style={{ minWidth: "150px", width: "150px" }}>
            <Skeleton height="42px" width="100%" radius="999px" />
          </div>
        </div>
      </div>

      <div style={topBarStyle}>
        <Skeleton height="28px" width="120px" radius="8px" />
        <Skeleton height="16px" width="90px" radius="8px" />
      </div>

      <div style={gridStyle} className="news-grid">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} style={cardStyle}>
            <div style={imageWrapStyle} className="news-card-image">
              <Skeleton height="220px" width="100%" radius="0px" />
            </div>

            <div style={cardContentStyle}>
              <div style={metaRowStyle}>
                <Skeleton height="28px" width="90px" radius="999px" />
                <Skeleton height="14px" width="100px" radius="8px" />
              </div>

              <Skeleton height="24px" width="88%" radius="8px" />
              <div style={{ height: "4px" }} />
              <Skeleton height="24px" width="65%" radius="8px" />

              <Skeleton height="14px" width="130px" radius="8px" />

              <div style={{ marginTop: "auto", paddingTop: "6px" }}>
                <Skeleton height="16px" width="110px" radius="8px" />
              </div>
            </div>
          </div>
        ))}
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

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#111827",
};

const sectionSubtitleStyle = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: "700",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
};

const linkStyle = {
  textDecoration: "none",
  color: "inherit",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  transition: "all 0.2s ease",
  cursor: "pointer",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const imageWrapStyle = {
  width: "100%",
  height: "220px",
  background: "#e5e7eb",
  overflow: "hidden",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const imagePlaceholderStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#94a3b8",
  background: "#e5e7eb",
};

const cardContentStyle = {
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  flex: 1,
};

const metaRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const categoryBadgeStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#cf2136",
  background: "rgba(207,33,54,0.08)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "6px 10px",
  borderRadius: "999px",
};

const dateStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "700",
};

const titleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
  lineHeight: 1.35,
  color: "#111827",
};

const timeStyle = {
  fontSize: "12px",
  color: "#9ca3af",
};

const readMoreStyle = {
  marginTop: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  fontWeight: "800",
  color: "#1476b6",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "32px 20px",
  textAlign: "center",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const emptyIconWrapStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "rgba(20,118,182,0.10)",
  color: "#1476b6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 14px",
};

const emptyTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#111827",
};

const emptyTextStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#6b7280",
};

export default NewsPage;