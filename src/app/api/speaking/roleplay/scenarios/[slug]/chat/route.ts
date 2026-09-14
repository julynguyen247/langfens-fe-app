import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { apisAi } from "@/utils/api.customize";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: unknown = await request.json();
    const typedBody = body && typeof body === "object" ? (body as { message?: unknown; history?: unknown }) : null;
    const message = typeof typedBody?.message === "string" ? typedBody.message : undefined;
    const history = typedBody?.history;

    if (!message) {
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
  } catch (error: unknown) {
    console.error("[RoleplayChat] Error:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data as { error?: string } | undefined;
      const message = errorData?.error || "Failed to get response";
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
