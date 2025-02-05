import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Response) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("unauthorised", { status: 401 });
    }
    const body = (await req.json()) as ChatRequestBody;
    const { messages, newMessage, chatId } = body;

    const convex = getConvexClient();

    // Create Stream with larger Queue strategy for better Performance
    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "x-Accel_buffering": "no", // Disabled buffering for nginx which is required for SSE  to work properly.
      },
    });

    const startStream = async () => {
      try {
        // stream will be implemented here
      } catch (error) {
        console.error("error in Api :", error);
        return NextResponse.json(
          {
            error: "failed to process chat response",
          } as const,
          { status: 500 }
        );
      }
    };

    startStream();
    return response;
  } catch (error) {
    console.error("error in Api :", error);
    return NextResponse.json(
      {
        error: "failed to process chat response",
      } as const,
      { status: 500 }
    );
  }
}
