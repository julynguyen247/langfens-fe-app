<<<<<<< HEAD
import { NextResponse } from "next/server";
import axios from "axios";
=======
import axios from "axios";
import { NextResponse } from "next/server";
>>>>>>> origin/master
import { apisAi } from "@/utils/api.customize";

export async function GET() {
  try {
    const response = await apisAi.get("/v1/speaking/roleplay/scenarios", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
<<<<<<< HEAD
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
=======
  } catch (error) {
    console.error("[RoleplayScenarios] Fetch error:", error);
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return NextResponse.json(
      { error: status ? "Failed to fetch scenarios" : "Internal server error" },
      { status: status ?? 500 }
>>>>>>> origin/master
    );
  }
}
