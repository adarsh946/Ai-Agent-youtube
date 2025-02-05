import ChatInterface from "@/components/ChatInterface";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface ChatPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

async function chatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  try {
    //Get client for messages and chats from convex
    const convex = getConvexClient();

    // Get messages
    const initialMessages = await convex.query(api.messages.lists, { chatId });
    return (
      <div className="flex-1 overflow-hidden">
        <ChatInterface chat={chatId} initialMessages={initialMessages} />
      </div>
    );
  } catch (error) {
    console.error("error in loading Chats", error);
    redirect("/");
  }
}

export default chatPage;
