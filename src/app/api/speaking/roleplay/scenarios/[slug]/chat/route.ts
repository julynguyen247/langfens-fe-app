import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { apisAi } from "@/utils/api.customize";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await apisAi.post(
      `/v1/speaking/roleplay/scenarios/${slug}/chat`,
      { message, history }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[RoleplayChat] Error:", error);
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return NextResponse.json(
      { error: status ? "Failed to get response" : "Internal server error" },
      { status: status ?? 500 }
    );
  }
}
