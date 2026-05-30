const TMDB_API_KEY = "85a2c2b5524fd455f0069d1815e2a29b";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  runtime: number | null;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  imdb_id: string | null;
}

export async function searchTMDBMovies(
  query: string,
  language: string = "zh-CN"
): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}&include_adult=false&page=1`
    );

    if (!res.ok) {
      console.error("TMDB search failed:", res.status);
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("TMDB search error:", error);
    return [];
  }
}

export async function getTMDBMovieDetails(
  movieId: number,
  language: string = "zh-CN"
): Promise<TMDBMovieDetails | null> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${language}`
    );

    if (!res.ok) {
      console.error("TMDB movie details failed:", res.status);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("TMDB movie details error:", error);
    return null;
  }
}

export function getTMDBPosterUrl(
  posterPath: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"
): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

export function getTMDBBackdropUrl(
  backdropPath: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280"
): string | null {
  if (!backdropPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
}
