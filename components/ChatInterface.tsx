"use client";

import { Doc, Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ChatRequestBody, StreamMessageType } from "@/lib/types";
import { createSSEParser } from "@/lib/createSSEParser";
import { tool } from "@langchain/core/tools";

interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onchunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await onchunk(new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  };

  useEffect(() => {
    messageEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    //  reset ui state for new messages
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);
    setInput("");

    // add user's message immediately for better UX.
    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    // Track complete response for saving to database
    let fullResponse = "";

    // Start Streaming the response
    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        newMessage: trimmedInput,
        chatId,
      };

      // Initialize the SSE Connection
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-type": "appliction/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("no response body available");

      // handle the stream
      // ------START-----

      const parser = createSSEParser();
      const reader = response.body.getReader();

      // Process the Stream Chunk
      await processStream(reader, async (chunk) => {
        // Parse the SSE Messages from the chunk
        const messages = parser.parse(chunk);

        //Handle each message based on its type
        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              //Handle streaming tokens (normal text response)
              if ("token" in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              //Handle start of tool execution (e.g API calls, file operations)
              if ("tool" in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input,
                });
                fullResponse = formatTerminalOutput(
                  message.tool,
                  message.input,
                  "Processing..."
                );
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolEnd:
              //Handle completion of the tool
              if ("tool" in message && currentTool) {
                //Replace the "Processing..." message to actual output
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-[#1e1e1e]'
                );
                if (lastTerminalIndex !== -1) {
                  (fullResponse = fullResponse.substring(0, lastTerminalIndex)),
                    formatTerminalOutput(
                      message.tool,
                      currentTool.input,
                      message.output
                    );

                  setStreamedResponse(fullResponse);
                }
                setCurrentTool(null);
              }
              break;

            case StreamMessageType.Error:
              if ("error" in message) {
                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
          }
        }
      });

      // ------END-------
    } catch (error) {
      //Handle the error during streaming
      console.error("Error in sending message : ", error);
      //removing the optimisticusermessage if there is an error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticUserMessage._id)
      );
      setStreamedResponse("error");
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
      {/* messages */}
      <section className="flex-1">
        <div>
          {/*messages */}
          {messages.map((message) => (
            <div key={message._id}> {message.content}</div>
          ))}

          {/* last message */}
          <div ref={messageEndRef} />
        </div>
      </section>

      {/* footer section input */}
      <footer className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className=" max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Ai Agent..."
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                input.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <ArrowRight />
            </Button>
          </div>
        </form>
      </footer>
    </main>
  );
}

export default ChatInterface;
