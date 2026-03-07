import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const CITY_KEY = "leetcity:users";
const MAX_USERS = 200;
const MAX_PER_IP = 3;
const IP_WINDOW_MS = 60_000;

export async function GET() {
  const data = (await kv.get(CITY_KEY)) ?? {};
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { action, username, stats } = await req.json();

    if (!action || !username || typeof username !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Only alphanumeric + hyphen/underscore, max 30 chars
    if (!/^[a-zA-Z0-9_-]{1,30}$/.test(username)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const city: Record<string, any> = (await kv.get(CITY_KEY)) ?? {};

    if (action === "save") {
      // Already in city — return as-is, no re-add needed
      if (city[username]) return NextResponse.json(city);

      // Hard cap on city size
      if (Object.keys(city).length >= MAX_USERS) {
        return NextResponse.json({ error: "City is full" }, { status: 429 });
      }

      // Per-IP rate limit
      const ipKey = `ip:${ip}`;
      const ipData: { count: number; since: number } =
        (await kv.get(ipKey)) ?? { count: 0, since: Date.now() };

      const windowExpired = Date.now() - ipData.since >= IP_WINDOW_MS;
      if (!windowExpired && ipData.count >= MAX_PER_IP) {
        return NextResponse.json({ error: "Too many requests, wait a minute" }, { status: 429 });
      }

      await kv.set(
        ipKey,
        windowExpired ? { count: 1, since: Date.now() } : { ...ipData, count: ipData.count + 1 },
        { ex: 120 }
      );

      city[username] = { stats, addedAt: Date.now() };
      await kv.set(CITY_KEY, city);
      return NextResponse.json(city);
    }

    if (action === "remove") {
      delete city[username];
      await kv.set(CITY_KEY, city);
      return NextResponse.json(city);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}