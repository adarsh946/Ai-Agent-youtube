import { Id } from "@/convex/_generated/dataModel";

export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatRequestBody {
  newMessage: string;
  chatId: Id<"chats">;
  messages: Message[];
}
