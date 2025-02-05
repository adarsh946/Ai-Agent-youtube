import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import {
  ChatRequestBody,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
  StreamMessage,
  StreamMessageType,
} from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

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

        // set initial connection stream message
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // Send User message to convex
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        });
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
