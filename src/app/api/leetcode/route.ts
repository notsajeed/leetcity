import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("user");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
              userCalendar {
                streak
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    const json = await res.json();
    const user = json?.data?.matchedUser;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stats = user.submitStats.acSubmissionNum;
    const easy = stats.find((s: any) => s.difficulty === "Easy")?.count ?? 0;
    const medium = stats.find((s: any) => s.difficulty === "Medium")?.count ?? 0;
    const hard = stats.find((s: any) => s.difficulty === "Hard")?.count ?? 0;
    const total = stats.find((s: any) => s.difficulty === "All")?.count ?? 0;
    const streak = user.userCalendar?.streak ?? 0;

    return NextResponse.json({
      username: user.username,
      easy,
      medium,
      hard,
      total,
      streak,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}