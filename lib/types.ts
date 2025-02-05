import { Id } from "@/convex/_generated/dataModel";

export const SSE_DATA_PREFIX = "done" as const;
export const SSE_DONE_MESSAGE = "[Done]" as const;
export const SSE_LINE_DELIMITER = "\n\n" as const;

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
export enum StreamMessageType {
  Token = "token",
  Error = "error",
  Connected = "connected",
  Done = "done",
  ToolStart = "tool_start",
  ToolEnd = "tool_end",
}

export interface BaseStreamMessage {
  type: StreamMessageType;
}

export interface TokenMessage extends BaseStreamMessage {
  type: StreamMessageType.Token;
  token: string;
}

export interface ErrorMessage extends BaseStreamMessage {
  type: StreamMessageType.Error;
  error: string;
}

export interface ConnectedMessage extends BaseStreamMessage {
  type: StreamMessageType.Connected;
}

export interface DoneMessage extends BaseStreamMessage {
  type: StreamMessageType.Done;
}

export interface ToolStartMessage extends BaseStreamMessage {
  type: StreamMessageType.ToolStart;
  tool: string;
  input: unknown;
}

export interface ToolEndMessage extends BaseStreamMessage {
  type: StreamMessageType.ToolEnd;
  tool: string;
  output: unknown;
}

export type StreamMessage =
  | TokenMessage
  | ConnectedMessage
  | ErrorMessage
  | DoneMessage
  | ToolStartMessage
  | ToolEndMessage;
