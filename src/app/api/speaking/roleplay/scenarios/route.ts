import axios from "axios";
import { NextResponse } from "next/server";
import { apisAi } from "@/utils/api.customize";

export async function GET() {
  try {
    const response = await apisAi.get("/v1/speaking/roleplay/scenarios", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[RoleplayScenarios] Fetch error:", error);
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return NextResponse.json(
      { error: status ? "Failed to fetch scenarios" : "Internal server error" },
      { status: status ?? 500 }
    );
  }
}
