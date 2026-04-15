import { supabase } from "../services/supabase";

function sanitizeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9.-]/g, "-") // replace special chars
    .replace(/-+/g, "-") // collapse multiple -
    .replace(/^-|-$/g, ""); // trim - from start/end
}

export async function uploadImage(file) {
  if (!file) return null;

  const safeName = sanitizeFileName(file.name || "image.png");
  const fileName = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("news-images")
    .upload(fileName, file);

  if (error) {
    console.error("Upload error:", error.message);
    alert(`Failed to upload image: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage
    .from("news-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}