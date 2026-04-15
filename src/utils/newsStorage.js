const STORAGE_KEY = "smart_tournament_news";

export function getNewsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read news from storage:", error);
    return [];
  }
}

export function saveNewsToStorage(news) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
  } catch (error) {
    console.error("Failed to save news to storage:", error);
  }
}

export function createNewsItem(data) {
  return {
    id: Date.now().toString(),
    title: data.title || "",
    coverImage: data.coverImage || "",
    category: data.category || "Football",
    createdAt: new Date().toISOString(),
    blocks: data.blocks || [],
  };
}