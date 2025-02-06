import {
  SSE_DATA_PREFIX,
  SSE_DONE_MESSAGE,
  StreamMessage,
  StreamMessageType,
} from "./types";

/* creates a parser for Server sent Events SSE Stream
 * SSE allows real time updates from server to client
 */

export const createSSEParser = () => {
  let buffer = "";

  const parse = (chunk: string): StreamMessage[] => {
    // combine buffer with new chunk and split it into new lins
    const lines = (buffer + chunk).split("\n");
    // save last potentially incomplete line.

    buffer = lines.pop() || "";

    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith(SSE_DATA_PREFIX)) return null;

        const data = trimmed.substring(SSE_DATA_PREFIX.length);
        if (data === SSE_DONE_MESSAGE) return { type: StreamMessageType.Done };

        try {
          const parsed = JSON.parse(data) as StreamMessage;
          return Object.values(StreamMessageType).includes(parsed.type)
            ? parsed
            : null;
        } catch (error) {
          return {
            type: StreamMessageType.Error,
            error: "Failed to parse SSE Message",
          };
        }
      })
      .filter((msg): msg is StreamMessage => msg != null);
  };
  return { parse };
};
