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

    if (!response.ok) {
      console.error("[RoleplayChat] AI service error:", response.status);
      return NextResponse.json(
        { error: "Failed to get response" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[RoleplayChat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
