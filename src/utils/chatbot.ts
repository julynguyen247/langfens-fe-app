import { NextRequest } from "next/server";
import { apisChatbot } from "./api.customize";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await apisChatbot.post("/ielts/chat-stream", body, {
    responseType: "stream",
  });

  const nodeStream = res.data as Readable;

  const stream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk);
      });
      nodeStream.on("end", () => {
        controller.close();
      });

      nodeStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
