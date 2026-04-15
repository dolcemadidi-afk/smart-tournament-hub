import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { uploadImage } from "../../utils/uploadImage";

function NewsPage() {
  const [newsItems, setNewsItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loadingNews, setLoadingNews] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Football");
  const [blocks, setBlocks] = useState([
    { id: Date.now().toString(), type: "paragraph", content: "" },
  ]);

  useEffect(() => {
    loadRole();
    fetchNews();
  }, []);

  const loadRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading role:", error);
      return;
    }

    setUserRole(profile?.role || null);
  };

  const normalizeNewsItem = (item) => ({
    id: item?.id,
    title: item?.title ?? "",
    coverImage: item?.cover_image ?? "",
    category: item?.category ?? "Football",
    createdAt: item?.created_at ?? new Date().toISOString(),
    blocks: Array.isArray(item?.blocks)
      ? item.blocks.map((block, index) => ({
          id: block?.id ?? `${Date.now()}-${index}`,
          type: block?.type ?? "paragraph",
          content: block?.content ?? "",
        }))
      : [],
  });

  const fetchNews = async () => {
    setLoadingNews(true);

    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching news:", error);
      setLoadingNews(false);
      return;
    }

    setNewsItems((data || []).map(normalizeNewsItem));
    setLoadingNews(false);
  };

  const canManageNews = userRole === "organizer";

  const sortedNews = useMemo(() => {
    return [...newsItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [newsItems]);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(
        sortedNews
          .map((item) => (item.category || "").trim())
          .filter(Boolean)
      )
    );

    return ["All", ...dynamicCategories];
  }, [sortedNews]);

  const filteredNews = useMemo(() => {
    if (activeCategory === "All") return sortedNews;
    return sortedNews.filter(
      (item) => (item.category || "").trim() === activeCategory
    );
  }, [sortedNews, activeCategory]);

  const featuredNews = filteredNews[0] || null;
  const otherNews = featuredNews ? filteredNews.slice(1) : [];

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCoverImage("");
    setCategory("Football");
    setBlocks([{ id: Date.now().toString(), type: "paragraph", content: "" }]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, [field]: value ?? "" } : block
      )
    );
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content: "",
    };

    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageNews) return;

    const cleanBlocks = blocks
      .map((block) => ({
        ...block,
        content: (block.content ?? "").trim(),
      }))
      .filter((block) => block.content);

    if (!title.trim()) {
      alert("Please add a title");
      return;
    }

    if (!coverImage.trim()) {
      alert("Please upload a cover image");
      return;
    }

    if (cleanBlocks.length === 0) {
      alert("Please add at least one content block");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      cover_image: coverImage.trim(),
      category: category.trim(),
      blocks: cleanBlocks,
    };

    if (editingId) {
      const { error } = await supabase
        .from("news")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Error updating news:", error);
        alert("Failed to update news");
        setSubmitting(false);
        return;
      }
    } else {
      const { error } = await supabase.from("news").insert([payload]);

      if (error) {
        console.error("Error creating news:", error);
        alert("Failed to publish news");
        setSubmitting(false);
        return;
      }
    }

    await fetchNews();
    resetForm();
    setShowEditor(false);
    setSubmitting(false);
  };

  const handleEdit = (item) => {
    if (!canManageNews) return;

    setEditingId(item.id);
    setTitle(item?.title ?? "");
    setCoverImage(item?.coverImage ?? "");
    setCategory(item?.category ?? "Football");
    setBlocks(
      item?.blocks?.length
        ? item.blocks.map((block, index) => ({
            id: block?.id ?? `${Date.now()}-${index}`,
            type: block?.type ?? "paragraph",
            content: block?.content ?? "",
          }))
        : [{ id: Date.now().toString(), type: "paragraph", content: "" }]
    );

    setShowEditor(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!canManageNews) return;

    const confirmDelete = window.confirm("Delete this news item?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) {
      console.error("Error deleting news:", error);
      alert("Failed to delete news");
      return;
    }

    await fetchNews();

    if (editingId === id) {
      resetForm();
    }
  };

  const getReadingTime = (item) => {
    const text = (item.blocks || [])
      .map((block) => block.content || "")
      .join(" ")
      .trim();

    if (!text) return "1 min read";

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 180));
    return `${minutes} min read`;
  };

  const formatNewsDate = (date) => {
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

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .news-list-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 768px) {
            .news-page {
              padding: 14px !important;
            }

            .news-shell {
              border-radius: 28px !important;
              padding: 16px !important;
            }

            .news-header-row {
              gap: 10px !important;
            }

            .news-heading {
              font-size: 18px !important;
            }

            .featured-card {
              padding: 14px !important;
              border-radius: 22px !important;
            }

            .featured-image {
              height: 190px !important;
              border-radius: 18px !important;
            }

            .featured-title {
              font-size: 20px !important;
            }

            .news-tabs {
              gap: 8px !important;
              overflow-x: auto !important;
              flex-wrap: nowrap !important;
              padding-bottom: 4px !important;
            }

            .news-tab {
              white-space: nowrap !important;
              flex: 0 0 auto !important;
            }

            .news-mini-card {
              grid-template-columns: 86px 1fr !important;
              gap: 12px !important;
              padding: 12px !important;
            }

            .news-mini-thumb {
              width: 86px !important;
              height: 86px !important;
              border-radius: 14px !important;
            }

            .news-mini-title {
              font-size: 14px !important;
            }

            .editor-card {
              padding: 16px !important;
              border-radius: 20px !important;
            }

            .editor-header {
              flex-direction: column !important;
              align-items: flex-start !important;
            }

            .news-card-actions {
              flex-direction: column !important;
            }

            .news-card-actions button {
              width: 100% !important;
            }

            .news-form-actions {
              flex-direction: column !important;
            }

            .news-form-actions button {
              width: 100% !important;
            }

            .news-block-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 10px !important;
            }

            .news-block-header button {
              width: 100% !important;
            }
          }
        `}
      </style>

      <div style={pageStyle} className="news-page">
        <div style={containerStyle}>
          <div style={shellStyle} className="news-shell">
            <div style={mobileCircleOne} />
            <div style={mobileCircleTwo} />

            <div style={headerRowStyle} className="news-header-row">
              <div style={headerLeftStyle}>
                <div style={avatarSmallStyle}>📰</div>
                <div style={headerMetaStyle}>
                  <div style={dateTopStyle}>{formatNewsDate(new Date())}</div>
                  <div style={brandMiniStyle}>Smart Sport Consulting</div>
                </div>
              </div>
            </div>

            <div style={headingWrapStyle}>
              <h1 style={headingStyle} className="news-heading">
                {canManageNews ? "Breaking News" : "Latest News"}
              </h1>
              <p style={headingSubStyle}>
                {canManageNews
                  ? "Publish and manage announcements with a cleaner mobile-first layout."
                  : "Follow the newest updates, match stories, and announcements."}
              </p>
            </div>

            {canManageNews && (
              <div style={editorCardStyle} className="editor-card">
                <div style={editorHeaderStyle} className="editor-header">
                  <div>
                    <h3 style={editorTitleStyle}>
                      {editingId ? "Edit News" : "Create News"}
                    </h3>
                    <p style={editorSubtitleStyle}>
                      Add a title, image, category, and content blocks
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditor((prev) => !prev)}
                    style={toggleButtonStyle}
                  >
                    {showEditor ? "Hide Editor" : "Open Editor"}
                  </button>
                </div>

                {showEditor && (
                  <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                    <input
                      type="text"
                      placeholder="News title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={inputStyle}
                    />

                    <div style={uploadCardStyle}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImage(file);
                          if (url) setCoverImage(url);
                        }}
                      />
                      <p style={helperTextStyle}>
                        Recommended: 16:9 (1200×675)
                      </p>
                    </div>

                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        style={coverPreviewStyle}
                      />
                    ) : null}

                    <input
                      type="text"
                      placeholder="Category (Football, NBA, etc.)"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={inputStyle}
                    />

                    <div style={blockButtonsWrapStyle}>
                      <button
                        type="button"
                        onClick={() => addBlock("paragraph")}
                        style={secondaryButton}
                      >
                        + Paragraph
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("image")}
                        style={secondaryButton}
                      >
                        + Image
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("instagram")}
                        style={secondaryButton}
                      >
                        + Instagram Post
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("quote")}
                        style={secondaryButton}
                      >
                        + Quote
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {blocks.map((block, index) => (
                        <div key={block.id} style={blockCardStyle}>
                          <div
                            style={blockHeaderStyle}
                            className="news-block-header"
                          >
                            <div style={blockTitleStyle}>
                              Block {index + 1} — {block.type}
                            </div>

                            {blocks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                style={removeButtonStyle}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {block.type === "paragraph" && (
                            <textarea
                              placeholder="Write paragraph text..."
                              value={block.content ?? ""}
                              onChange={(e) =>
                                updateBlock(block.id, "content", e.target.value)
                              }
                              rows={5}
                              style={textareaStyle}
                            />
                          )}

                          {block.type === "quote" && (
                            <textarea
                              placeholder="Write quote..."
                              value={block.content ?? ""}
                              onChange={(e) =>
                                updateBlock(block.id, "content", e.target.value)
                              }
                              rows={3}
                              style={textareaStyle}
                            />
                          )}

                          {block.type === "image" && (
                            <>
                              <div style={uploadCardStyle}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const url = await uploadImage(file);
                                    if (url) {
                                      updateBlock(block.id, "content", url);
                                    }
                                  }}
                                />
                                <p style={helperTextStyle}>
                                  Recommended: square (800×800)
                                </p>
                              </div>

                              {block.content ? (
                                <div style={blockImagePreviewWrapStyle}>
                                  <img
                                    src={block.content}
                                    alt="Preview"
                                    style={blockImagePreviewStyle}
                                  />
                                </div>
                              ) : null}
                            </>
                          )}

                          {block.type === "instagram" && (
                            <textarea
                              placeholder="Paste Instagram URL"
                              value={block.content ?? ""}
                              onChange={(e) =>
                                updateBlock(block.id, "content", e.target.value)
                              }
                              rows={4}
                              style={textareaStyle}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      style={formActionsStyle}
                      className="news-form-actions"
                    >
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          ...primaryButton,
                          flex: 1,
                          opacity: submitting ? 0.7 : 1,
                          cursor: submitting ? "not-allowed" : "pointer",
                        }}
                      >
                        {submitting
                          ? "Saving..."
                          : editingId
                          ? "Update News"
                          : "Publish News"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setShowEditor(false);
                          }}
                          style={secondaryButton}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            <div style={tabsWrapStyle} className="news-tabs">
              {categories.map((item) => {
                const active = activeCategory === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveCategory(item)}
                    style={{
                      ...tabButtonStyle,
                      ...(active ? tabButtonActiveStyle : {}),
                    }}
                    className="news-tab"
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {loadingNews ? (
              <div style={emptyStateStyle}>
                <div style={emptyStateTitleStyle}>Loading news...</div>
              </div>
            ) : featuredNews ? (
              <>
                <div style={featuredCardStyle} className="featured-card">
                  <Link
                    to={`/news/${featuredNews.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={featuredImageWrapStyle}>
                      {featuredNews.coverImage ? (
                        <img
                          src={featuredNews.coverImage}
                          alt={featuredNews.title}
                          style={featuredImageStyle}
                          className="featured-image"
                        />
                      ) : (
                        <div style={featuredPlaceholderStyle}>No image</div>
                      )}
                    </div>

                    <div style={featuredContentStyle}>
                      <div style={featuredCategoryStyle}>
                        {featuredNews.category}
                      </div>

                      <div style={featuredTitleStyle} className="featured-title">
                        {featuredNews.title}
                      </div>

                      <div style={featuredMetaRowStyle}>
                        <div style={featuredAuthorWrapStyle}>
                          <div style={miniAvatarStyle}>👤</div>
                          <span style={metaTextStyle}>Smart Sport Consulting</span>
                        </div>

                        <div style={featuredMetaRightStyle}>
                          <span style={metaTextStyle}>
                            {formatNewsDate(featuredNews.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {canManageNews && (
                    <div style={featuredActionsStyle} className="news-card-actions">
                      <button
                        onClick={() => handleEdit(featuredNews)}
                        style={editButtonStyle}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(featuredNews.id)}
                        style={deleteButtonStyle}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {otherNews.length > 0 && (
                  <div style={miniListWrapStyle} className="news-list-grid">
                    {otherNews.map((item) => (
                      <div
                        key={item.id}
                        style={miniCardStyle}
                        className="news-mini-card"
                      >
                        <Link
                          to={`/news/${item.id}`}
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                            display: "contents",
                          }}
                        >
                          <div style={miniThumbWrapStyle}>
                            {item.coverImage ? (
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                style={miniThumbStyle}
                                className="news-mini-thumb"
                              />
                            ) : (
                              <div style={miniThumbPlaceholderStyle}>No image</div>
                            )}
                          </div>

                          <div style={miniContentStyle}>
                            <div style={miniTitleStyle} className="news-mini-title">
                              {item.title}
                            </div>

                            <div style={miniMetaStyle}>
                              <span>{formatNewsDate(item.createdAt)}</span>
                              <span>•</span>
                              <span>{getReadingTime(item)}</span>
                            </div>
                          </div>
                        </Link>

                        {canManageNews && (
                          <div
                            style={miniActionRowStyle}
                            className="news-card-actions"
                          >
                            <button
                              onClick={() => handleEdit(item)}
                              style={miniEditButtonStyle}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={miniDeleteButtonStyle}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={emptyStateStyle}>
                <div style={emptyStateTitleStyle}>No news yet</div>
                <div style={emptyStateTextStyle}>
                  Published articles will appear here.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const pageStyle = {
  padding: "24px",
  background: "#eef2f7",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "980px",
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

const mobileCircleOne = {
  position: "absolute",
  width: "340px",
  height: "340px",
  borderRadius: "50%",
  background: "rgba(20,118,182,0.08)",
  top: "-120px",
  left: "-80px",
  pointerEvents: "none",
};

const mobileCircleTwo = {
  position: "absolute",
  width: "160px",
  height: "160px",
  borderRadius: "50%",
  background: "rgba(16,152,71,0.10)",
  right: "-60px",
  top: "220px",
  pointerEvents: "none",
};

const headerRowStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const avatarSmallStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "rgba(20,118,182,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const headerMetaStyle = {
  display: "flex",
  flexDirection: "column",
};

const dateTopStyle = {
  fontSize: "12px",
  color: "#6b7280",
  fontWeight: "700",
};

const brandMiniStyle = {
  fontSize: "11px",
  color: "#1476b6",
  fontWeight: "700",
};

const headingWrapStyle = {
  position: "relative",
  zIndex: 1,
  marginBottom: "18px",
};

const headingStyle = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  fontWeight: "800",
  color: "#1f2a44",
};

const headingSubStyle = {
  margin: "10px 0 0",
  fontSize: "14px",
  lineHeight: 1.7,
  color: "#64748b",
  maxWidth: "620px",
};

const editorCardStyle = {
  position: "relative",
  zIndex: 1,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "20px",
  marginBottom: "22px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const editorHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const editorTitleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
  color: "#1f2a44",
};

const editorSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "13px",
  color: "#6b7280",
};

const toggleButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
  background: "#fff",
};

const uploadCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px",
  background: "#fafafa",
};

const helperTextStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "8px",
};

const coverPreviewStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  borderRadius: "14px",
  marginTop: "4px",
};

const blockButtonsWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "6px",
};

const blockCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "14px",
  background: "#fafafa",
};

const blockHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const blockTitleStyle = {
  fontWeight: "700",
  color: "#1f2a44",
  textTransform: "capitalize",
};

const removeButtonStyle = {
  background: "#cf2136",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const blockImagePreviewWrapStyle = {
  marginTop: "10px",
  width: "100%",
  maxHeight: "240px",
  overflow: "hidden",
  borderRadius: "12px",
  background: "#e5e7eb",
};

const blockImagePreviewStyle = {
  width: "100%",
  display: "block",
  objectFit: "cover",
};

const formActionsStyle = {
  display: "flex",
  gap: "12px",
};

const tabsWrapStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tabButtonStyle = {
  background: "#ffffff",
  color: "#6b7280",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
};

const tabButtonActiveStyle = {
  background: "#1476b6",
  color: "#ffffff",
  borderColor: "#1476b6",
};

const featuredCardStyle = {
  position: "relative",
  zIndex: 1,
  background: "#ffffff",
  borderRadius: "26px",
  padding: "18px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
  marginBottom: "18px",
};

const featuredImageWrapStyle = {
  width: "100%",
};

const featuredImageStyle = {
  width: "100%",
  height: "260px",
  objectFit: "cover",
  borderRadius: "22px",
  display: "block",
};

const featuredPlaceholderStyle = {
  width: "100%",
  height: "260px",
  borderRadius: "22px",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: "700",
};

const featuredContentStyle = {
  paddingTop: "16px",
};

const featuredCategoryStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#1476b6",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const featuredTitleStyle = {
  fontSize: "28px",
  lineHeight: 1.25,
  fontWeight: "800",
  color: "#1f2a44",
};

const featuredMetaRowStyle = {
  marginTop: "14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const featuredAuthorWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const miniAvatarStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "rgba(16,152,71,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
};

const featuredMetaRightStyle = {
  display: "flex",
  alignItems: "center",
};

const metaTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "700",
};

const featuredActionsStyle = {
  marginTop: "16px",
  display: "flex",
  gap: "10px",
};

const miniListWrapStyle = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "14px",
};

const miniCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "14px",
  display: "grid",
  gridTemplateColumns: "110px 1fr",
  gap: "14px",
  alignItems: "start",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const miniThumbWrapStyle = {
  width: "100%",
};

const miniThumbStyle = {
  width: "110px",
  height: "110px",
  objectFit: "cover",
  borderRadius: "18px",
  display: "block",
};

const miniThumbPlaceholderStyle = {
  width: "110px",
  height: "110px",
  borderRadius: "18px",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: "700",
  fontSize: "12px",
};

const miniContentStyle = {
  minWidth: 0,
};

const miniTitleStyle = {
  fontSize: "16px",
  lineHeight: 1.45,
  fontWeight: "800",
  color: "#1f2937",
  marginBottom: "8px",
};

const miniMetaStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "700",
};

const miniActionRowStyle = {
  gridColumn: "1 / -1",
  display: "flex",
  gap: "10px",
  marginTop: "4px",
};

const editButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  flex: 1,
};

const deleteButtonStyle = {
  background: "#cf2136",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  flex: 1,
};

const miniEditButtonStyle = {
  background: "#1476b6",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  flex: 1,
};

const miniDeleteButtonStyle = {
  background: "#cf2136",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  flex: 1,
};

const primaryButton = {
  background: "#109847",
  color: "#fff",
  border: "none",
  padding: "12px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "700",
};

const secondaryButton = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "10px 12px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "700",
};

const emptyStateStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "32px",
  textAlign: "center",
  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
};

const emptyStateTitleStyle = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#1f2a44",
};

const emptyStateTextStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#6b7280",
};

export default NewsPage;