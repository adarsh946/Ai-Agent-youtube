import { Id } from "@/convex/_generated/dataModel";
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
  return <div>chatPage : {chatId}</div>;
}

export default chatPage;
