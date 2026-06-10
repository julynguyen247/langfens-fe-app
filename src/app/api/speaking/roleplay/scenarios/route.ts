import { NextRequest, NextResponse } from "next/server";
import { apisAi } from "@/utils/api.customize";

export async function GET() {
  try {
    const response = await apisAi.get("/v1/speaking/roleplay/scenarios", {
      headers: {
        "Content-Type": "application/json",
      },
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
