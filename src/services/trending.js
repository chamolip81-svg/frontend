import { searchSongs } from "./api";

/*
  These are curated search terms
  that consistently return popular songs
*/
const TRENDING_QUERIES = {
  punjabi: "punjabi hits",
  hindi: "bollywood hits",
  global: "top hits",
};

const cache = new Map();

export async function getTrending(type) {
  if (cache.has(type)) {
    return cache.get(type);
  }

  const query = TRENDING_QUERIES[type];
  if (!query) return [];

  try {
    const { songs } = await searchSongs(query, 0);
    const result = (songs || []).slice(0, 12);

    cache.set(type, result);
    return result;
  } catch (err) {
    console.error("Trending fetch failed:", err);
    return [];
  }
}
