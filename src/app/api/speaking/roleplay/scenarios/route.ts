import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8080";

export async function GET() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/speaking/roleplay/scenarios`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error("[RoleplayScenarios] AI service error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch scenarios" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[RoleplayScenarios] Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
