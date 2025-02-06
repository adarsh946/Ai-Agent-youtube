import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { submitQuestions } from "@/lib/langgraph";
import {
  ChatRequestBody,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
  StreamMessage,
  StreamMessageType,
} from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { error } from "console";
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

        //Convert Messages to langchain format
        const langchainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          // Create a event Stream
          const eventStream = await submitQuestions(langchainMessages, chatId);

          //Process the events
          for await (const event of eventStream) {
            if (event.event === "on_chat_model_stream") {
              const token = event.data.chunk;
              if (token) {
                // Access the text property from the AImessage chunk
                const text = token.content.at(0)?.["text"];

                if (text) {
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              const toolMessge = new ToolMessage(event.data.output);

              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessge.lc_kwargs.name || "unKnown",
                output: event.data.output,
              });
            }

            //send completion message without storing the response
            await sendSSEMessage(writer, { type: StreamMessageType.Done });
          }
        } catch (streamError) {
          console.error("errort in the stream", streamError);
          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("error in Stream :", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer", closeError);
        }
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
