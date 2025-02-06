import { ChatOpenAI } from "@langchain/openai";
import wxflows from "@wxflows/sdk/langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { threadId } from "worker_threads";
import { text } from "stream/consumers";

// Customers at :  https://introspection.apis.stepzen.com/customers
// Comment at : https://dummyjson.com/comments

// trim the messages to manage the conversation history
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

//connect the wx workflow
const toolClient = new wxflows({
  endpoint: process.env.WXFLOW_ENDPOINT || "",
  apikey: process.env.WXFLOW_APIKEY,
});

// Retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initializeModel = () => {
  const chatModel = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7, // higher temperature for more creative responses.
    maxTokens: 4096, // higher tokens for long responses
    streaming: true, // streaming true for SSE
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("LLM is Starting");
        },
        handleLLMEnd: async (output) => {
          console.log("End LLM Call", output);
          const usage = output.llmOutput?.usage;
          if (usage) {
          }
        },
      },
    ],
  }).bindTools(tools);

  return chatModel;
};

//Define the function that determines whether to continue or not
const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // if the LLM will make a tool call then we route to the "tools" node
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  }

  //if the last message is the tool message return to the agent
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  // otherwise we will stop return to user
  return END;
};

const createWorkFlow = () => {
  const model = initializeModel();

  const stateGraph = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      //create system message content by prompt engineering
      const systemContent = SYSTEM_MESSAGE;

      //create the prompt template with system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" }, // set a cache breakpoints (max breakpoint is 4)  (prompt caching is in anthropic but not sure in open ai)
        }),
        new MessagesPlaceholder("messages"),
      ]);

      // trim the messages to manage the conversation history
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Format the prompt with the current messages
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

      // Get the response from the model
      const response = await model.invoke(prompt);

      return { messages: [response] };
    })
    .addEdge(START, "agent")
    .addNode("tools", toolNode)
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return stateGraph;
};

function addingCacheHeaders(messages: BaseMessage[]): BaseMessage[] {
  // Rules of caching headers for turn by turn conversations
  // 1. Cache the First System Message
  // 2. Cache the Last System Message
  // 3. Cache the second to last System Message

  if (!messages.length) return messages;

  // create copy of messages to avoid mutating the original one
  const cachedMessages = [...messages];

  // Helper to add cache control
  const addCache = (message: BaseMessage) => {
    message.content = [
      {
        type: "text",
        text: message.content as string,
        cache_control: { type: "ephemeral" },
      },
    ];
  };

  // Cache the last message
  console.log("🔥🔥Caching Last Message : ");
  addCache(cachedMessages.at(-1)!);

  //Find and cache the second-to-last message
  let humanConut = 0;
  for (let i = cachedMessages.length - 1; i <= 0; i++) {
    if (cachedMessages[i] instanceof HumanMessage) {
      humanConut++;
      if (humanConut === 2) {
        addCache(cachedMessages[i]);
        break;
      }
    }
  }
  return cachedMessages;
}

export async function submitQuestions(messages: BaseMessage[], chatId: string) {
  // Add a caching headers to messages
  const cachedMessages = addingCacheHeaders(messages);
  console.log("🔥🔥🔥Messages : ", cachedMessages);

  const workflow = createWorkFlow();

  //Create a checkpointer to save state of the conversation
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  //run the graph and stream
  const stream = await app.streamEvents(
    {
      messages: cachedMessages,
    },
    {
      version: "v2",
      configurable: { threadId: chatId },
      streamMode: "messages",
      runId: chatId,
    }
  );
  return stream;
}
