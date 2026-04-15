import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { getNewsFromStorage } from "../../utils/newsStorage";
import { ArrowLeft, Share2 } from "lucide-react";

function NewsDetailsPage() {
  const { id } = useParams();
  const newsItems = getNewsFromStorage();
  const news = newsItems.find((item) => item.id === id);

  const [authorName, setAuthorName] = useState("Smart Sport Consulting");

  useEffect(() => {
    const loadAuthor = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("role", "organizer")
        .limit(1)
        .maybeSingle();

      if (data?.full_name) {
        setAuthorName(data.full_name);
      }
    };

    loadAuthor();
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied");
    } catch {}
  };

  if (!news) return <div style={pageStyle}>News not found</div>;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={cardStyle}>

          {/* HEADER */}
          <div style={headerStyle}>
            <Link to="/news" style={iconBtn}>
              <ArrowLeft size={18} />
            </Link>

            <button onClick={handleShare} style={iconBtn}>
              <Share2 size={18} />
            </button>
          </div>

          {/* IMAGE */}
          <img src={news.coverImage} style={imageStyle} />

          {/* CATEGORY */}
          <div style={categoryStyle}>
            {news.category}
          </div>

          {/* TITLE */}
          <h1 style={titleStyle}>
            {news.title}
          </h1>

          {/* AUTHOR */}
          <div style={metaStyle}>
            <div style={authorWrap}>
              <div style={avatar}>✍️</div>
              <span>{authorName}</span>
            </div>

            <span>
              {new Date(news.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* CONTENT */}
          <div style={contentStyle}>
            {news.blocks.map((block) => {
              if (block.type === "paragraph") {
                return (
                  <p key={block.id} style={paragraphStyle}>
                    {block.content}
                  </p>
                );
              }

              if (block.type === "quote") {
                return (
                  <div key={block.id} style={quoteStyle}>
                    {block.content}
                  </div>
                );
              }

              if (block.type === "image") {
                return (
                  <img key={block.id} src={block.content} style={inlineImage} />
                );
              }

              return null;
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================== STYLES ================== */

const pageStyle = {
  padding: "20px",
  background: "#f3f4f6",
  minHeight: "100vh",
};

const containerStyle = {
  maxWidth: "700px",
  margin: "0 auto",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "24px",
  padding: "18px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const iconBtn = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#fff",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const imageStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  borderRadius: "20px",
  marginBottom: "14px",
};

const categoryStyle = {
  color: "#1476b6",
  fontWeight: "800",
  fontSize: "12px",
  marginBottom: "8px",
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  marginBottom: "10px",
  color: "#111827",
};

const metaStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "18px",
};

const authorWrap = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const avatar = {
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  background: "#10984720",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const contentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const paragraphStyle = {
  fontSize: "16px",
  lineHeight: "1.9",
  color: "#374151",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const quoteStyle = {
  borderLeft: "4px solid #cf2136",
  padding: "14px",
  background: "#fff5f5",
  borderRadius: "12px",
  fontWeight: "700",
};

const inlineImage = {
  width: "100%",
  borderRadius: "16px",
};

export default NewsDetailsPage;