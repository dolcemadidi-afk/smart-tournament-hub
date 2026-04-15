import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { ArrowLeft, Share2, Newspaper } from "lucide-react";

function NewsDetailsPage() {
  const { id } = useParams();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizerName, setOrganizerName] = useState("Smart Sport Consulting");

  useEffect(() => {
    const loadPageData = async () => {
      await Promise.all([loadNewsItem(), loadOrganizerName()]);
    };

    loadPageData();
  }, [id]);

  const loadNewsItem = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("News fetch error:", error);
        setNews(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setNews(null);
        setLoading(false);
        return;
      }

      const normalizedNews = {
        id: data.id,
        title: data.title ?? "",
        coverImage: data.cover_image ?? "",
        category: data.category ?? "News",
        createdAt: data.created_at ?? new Date().toISOString(),
        authorName: data.author_name ?? "",
        author: data.author ?? "",
        blocks: Array.isArray(data.blocks)
          ? data.blocks.map((block, index) => ({
              id: block?.id ?? `${data.id}-${index}`,
              type: block?.type ?? "paragraph",
              content: block?.content ?? "",
            }))
          : [],
      };

      setNews(normalizedNews);
      setLoading(false);
    } catch (err) {
      console.error("News fetch crashed:", err);
      setNews(null);
      setLoading(false);
    }
  };

  const loadOrganizerName = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("role", "organizer")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Organizer fetch error:", error);
        return;
      }

      if (data?.full_name?.trim()) {
        setOrganizerName(data.full_name.trim());
      }
    } catch (err) {
      console.error("Organizer fetch crashed:", err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: news?.title || "News",
      text: news?.title || "Check this news",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const authorName =
    news?.authorName?.trim() ||
    news?.author?.trim() ||
    organizerName ||
    "Smart Sport Consulting";

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyCardStyle}>Loading news...</div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={emptyCardStyle}>News not found.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .news-details-page {
              padding: 14px !important;
            }

            .news-details-shell {
              padding: 16px !important;
              border-radius: 28px !important;
            }

            .news-details-header {
              margin-bottom: 14px !important;
            }

            .news-details-main-image {
              height: 200px !important;
              border-radius: 22px !important;
            }

            .news-details-title {
              font-size: 18px !important;
              line-height: 1.45 !important;
            }

            .news-details-meta-row {
              margin-bottom: 18px !important;
            }

            .news-details-text {
              font-size: 15px !important;
              line-height: 1.9 !important;
              text-align: left !important;
            }

            .news-details-quote {
              font-size: 17px !important;
            }

            .news-details-content {
              gap: 16px !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="news-details-page">
        <div style={containerStyle}>
          <div style={shellStyle} className="news-details-shell">
            <div style={bgCircleOne} />
            <div style={bgCircleTwo} />

            <div style={headerRowStyle} className="news-details-header">
              <Link to="/news" style={iconButtonStyle}>
                <ArrowLeft size={18} />
              </Link>

              <button
                type="button"
                onClick={handleShare}
                style={iconButtonStyle}
                aria-label="Share news"
              >
                <Share2 size={18} />
              </button>
            </div>

            {news.coverImage ? (
              <div style={mainImageWrapStyle}>
                <img
                  src={news.coverImage}
                  alt={news.title}
                  style={mainImageStyle}
                  className="news-details-main-image"
                />
              </div>
            ) : (
              <div style={imagePlaceholderStyle}>No image</div>
            )}

            <div style={titleWrapStyle}>
              <div style={categoryStyle}>{news.category || "News"}</div>

              <h1 style={titleStyle} className="news-details-title">
                {news.title}
              </h1>
            </div>

            <div
              style={metaRowStyle}
              className="news-details-meta-row"
            >
              <div style={authorWrapStyle}>
                <div style={avatarStyle}>✍️</div>
                <span style={authorTextStyle}>{authorName}</span>
              </div>

              <div style={dateTextStyle}>{formatDate(news.createdAt)}</div>
            </div>

            <div style={contentWrapStyle} className="news-details-content">
              {news.blocks.map((block) => {
                if (block.type === "paragraph") {
                  return (
                    <p
                      key={block.id}
                      style={paragraphStyle}
                      className="news-details-text"
                    >
                      {block.content}
                    </p>
                  );
                }

                if (block.type === "quote") {
                  return (
                    <blockquote
                      key={block.id}
                      style={quoteStyle}
                      className="news-details-quote"
                    >
                      {block.content}
                    </blockquote>
                  );
                }

                if (block.type === "image") {
                  return (
                    <div key={block.id} style={inlineImageWrapStyle}>
                      <img
                        src={block.content}
                        alt="News"
                        style={inlineImageStyle}
                      />
                    </div>
                  );
                }

                if (block.type === "instagram") {
                  return (
                    <div key={block.id} style={instaCardStyle}>
                      <div style={instaTitleStyle}>
                        <Newspaper size={16} />
                        Instagram Post
                      </div>

                      <a
                        href={block.content}
                        target="_blank"
                        rel="noreferrer"
                        style={instaLinkStyle}
                      >
                        Open Instagram Post
                      </a>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  padding: "24px",
  minHeight: "100vh",
  background: "#eef2f7",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "760px",
  margin: "0 auto",
};

const shellStyle = {
  position: "relative",
  overflow: "hidden",
  background: "#f8fafc",
  borderRadius: "34px",
  padding: "22px",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(226, 232, 240, 0.9)",
};

const bgCircleOne = {
  position: "absolute",
  width: "320px",
  height: "320px",
  borderRadius: "50%",
  background: "rgba(20, 118, 182, 0.06)",
  top: "-120px",
  left: "-100px",
  pointerEvents: "none",
};

const bgCircleTwo = {
  position: "absolute",
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  background: "rgba(16, 152, 71, 0.08)",
  right: "-60px",
  bottom: "100px",
  pointerEvents: "none",
};

const headerRowStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px",
};

const iconButtonStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  border: "none",
  background: "#ffffff",
  color: "#374151",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
  cursor: "pointer",
  textDecoration: "none",
};

const mainImageWrapStyle = {
  position: "relative",
  zIndex: 1,
  marginBottom: "18px",
};

const mainImageStyle = {
  width: "100%",
  height: "280px",
  objectFit: "cover",
  display: "block",
  borderRadius: "24px",
};

const imagePlaceholderStyle = {
  width: "100%",
  height: "280px",
  borderRadius: "24px",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: "700",
  marginBottom: "18px",
};

const titleWrapStyle = {
  position: "relative",
  zIndex: 1,
  marginBottom: "14px",
};

const categoryStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#1476b6",
  textTransform: "uppercase",
  marginBottom: "10px",
  letterSpacing: "0.4px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  lineHeight: "1.28",
  fontWeight: "800",
  color: "#1f2a44",
};

const metaRowStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const authorWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const avatarStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "rgba(20, 118, 182, 0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
};

const authorTextStyle = {
  fontSize: "13px",
  color: "#109847",
  fontWeight: "700",
};

const dateTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  fontWeight: "700",
};

const contentWrapStyle = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "18px",
};

const paragraphStyle = {
  margin: 0,
  fontSize: "17px",
  lineHeight: "1.95",
  color: "#334155",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

const quoteStyle = {
  margin: 0,
  padding: "18px",
  borderRadius: "18px",
  background: "#ffffff",
  borderLeft: "4px solid #cf2136",
  boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
  fontSize: "19px",
  fontWeight: "700",
  color: "#1f2937",
};

const inlineImageWrapStyle = {
  overflow: "hidden",
  borderRadius: "20px",
  background: "#e5e7eb",
};

const inlineImageStyle = {
  width: "100%",
  display: "block",
  objectFit: "cover",
};

const instaCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px",
  boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
};

const instaTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "10px",
};

const instaLinkStyle = {
  color: "#1476b6",
  fontWeight: "700",
  textDecoration: "none",
};

const emptyCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  textAlign: "center",
};

export default NewsDetailsPage;