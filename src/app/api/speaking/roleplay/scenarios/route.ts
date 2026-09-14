import { NextResponse } from "next/server";
import axios from "axios";
import { apisAi } from "@/utils/api.customize";

export async function GET() {
  try {
    const response = await apisAi.get("/v1/speaking/roleplay/scenarios", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[RoleplayScenarios] Fetch error:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data as { error?: string } | undefined;
      const message = errorData?.error || "Failed to fetch scenarios";
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}
