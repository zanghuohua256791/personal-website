import { NextRequest, NextResponse } from "next/server";
import { searchSteamGames } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ items: [] });
  }

  const items = await searchSteamGames(q);
  return NextResponse.json({ items });
}
