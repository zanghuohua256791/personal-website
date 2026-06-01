export function extractSteamAppId(url: string): string | null {
  const appIdMatch = url.match(/store\.steampowered\.com\/app\/(\d+)/);
  const shortIdMatch = url.match(/^(\d+)$/);

  return appIdMatch?.[1] || shortIdMatch?.[0] || null;
}

export interface SteamSearchResult {
  appid: number;
  name: string;
  logo: string;
}

export interface SteamAppDetails {
  appid: number;
  name: string;
  genres: { id: string; description: string }[];
  categories: { id: string; description: string }[];
  header_image: string;
}

const STEAM_STORE_API = "https://store.steampowered.com/api";
export async function searchSteamGames(
  query: string,
): Promise<SteamSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${STEAM_STORE_API}/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=CN`,
      { headers: { "Accept-Language": "zh-CN" } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (
      data.items
        // ?.filter((item: any) => item.metascore)
        .map((item: any) => ({
          appid: item.id,
          name: item.name,
          logo: item.tiny_image || item.small_capsule_image || "",
          ...item,
        })) || []
    );
  } catch (error) {
    console.error("Steam search error:", error);
    return [];
  }
}

export async function getSteamAppDetails(
  appid: number,
): Promise<SteamAppDetails | null> {
  try {
    const res = await fetch(
      `${STEAM_STORE_API}/appdetails?appids=${appid}&l=schinese&cc=CN`,
      { headers: { "Accept-Language": "zh-CN" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const appData = data[String(appid)];
    if (!appData?.success) return null;
    return {
      appid,
      name: appData.data.name,
      genres: appData.data.genres || [],
      categories: appData.data.categories || [],
      header_image: appData.data.header_image || "",
    };
  } catch (error) {
    console.error("Steam app details error:", error);
    return null;
  }
}

const CDN_HOSTS = [
  "cdn.cloudflare.steamstatic.com",
  "cdn.akamai.steamstatic.com",
];

const IMAGE_VARIANTS = [
  "header",
  "library_600x900",
  "library_hero",
  "capsule_616x353",
  "capsule_467x181",
  "capsule_231x87",
];

export async function fetchSteamCover(
  steamUrl: string,
): Promise<string | null> {
  const appId = extractSteamAppId(steamUrl);
  if (!appId) return null;

  const urls: string[] = [];
  for (const host of CDN_HOSTS) {
    for (const variant of IMAGE_VARIANTS) {
      urls.push(`https://${host}/steam/apps/${appId}/${variant}.jpg`);
    }
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      continue;
    }
  }

  return null;
}
