import { NextRequest, NextResponse } from "next/server";
import type { LeetCodeStats, SubmissionStat } from "../../../types/leetcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("user");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
      },
      body: JSON.stringify({
        query: `
          query userStats($username: String!) {
            matchedUser(username: $username) {
              submitStats {
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

    if (!response.ok) {
      return NextResponse.json({ error: "LeetCode API error" }, { status: 502 });
    }

    const raw = await response.json();
    const user = raw?.data?.matchedUser;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const submissions: SubmissionStat[] = user.submitStats?.acSubmissionNum ?? [];

    const get = (difficulty: string) =>
      submissions.find((s) => s.difficulty === difficulty)?.count ?? 0;

    const stats: LeetCodeStats = {
      username,
      easy: get("Easy"),
      medium: get("Medium"),
      hard: get("Hard"),
      total: get("All"),
      streak: user.userCalendar?.streak ?? 0,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}