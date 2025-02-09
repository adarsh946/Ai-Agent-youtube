// import ChatInterface from "@/components/ChatInterface";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { getConvexClient } from "@/lib/convex";
// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";

// interface ChatPageProps {
//   params: Promise<{
//     chatId: Id<"chats">;
//   }>;
// }

// async function chatPage({ params }: ChatPageProps) {
//   const { chatId } = await params;
//   const { userId } = await auth();
//   if (!userId) {
//     redirect("/");
//   }

//   try {
//     //Get client for messages and chats from convex
//     const convex = getConvexClient();

//     // Get messages
//     const initialMessages = await convex.query(api.messages.lists, { chatId });
//     return (
//       <div className="flex-1 overflow-hidden">
//         <ChatInterface chat={chatId} initialMessages={initialMessages} />
//       </div>
//     );
//   } catch (error) {
//     console.error("error in loading Chats", error);
//     redirect("/");
//   }
// }

// export default chatPage;

import ChatInterface from "@/components/ChatInterface";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

interface ChatPageProps {
  params: {
    chatId: Id<"chats">;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;

  // Get user authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  try {
    // Get Convex client and fetch chat and messages
    const convex = getConvexClient();

    // Check if chat exists & user is authorized to view it
    const chat = await convex.query(api.chats.getChat, {
      id: chatId,
      userId,
    });

    if (!chat) {
      console.log(
        "⚠️ Chat not found or unauthorized, redirecting to dashboard"
      );
      redirect("/dashboard");
    }

    // Get messages
    const initialMessages = await convex.query(api.messages.list, { chatId });

    return (
      <div className="flex-1 overflow-hidden">
        <ChatInterface chatId={chatId} initialMessages={initialMessages} />
      </div>
    );
  } catch (error) {
    console.error("🔥 Error loading chat:", error);
    redirect("/dashboard");
  }
}
