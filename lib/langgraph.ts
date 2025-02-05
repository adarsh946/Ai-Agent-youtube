import { ChatOpenAI } from "@langchain/openai";
import wxflows from "@wxflows/sdk/langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
  StateGraph,
} from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { cache } from "react";

// Customers at :  https://introspection.apis.stepzen.com/customers
// Comment at : https://dummyjson.com/comments

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

const createWorkFlow = () => {
  const model = initializeModel();

  const stateGraph = new StateGraph(MessagesAnnotation).addNode(
    "agent",
    async (state) => {
      //create system message content by prompt engineering
      const systemContent = SYSTEM_MESSAGE;

      //create the prompt template with system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" }, // set a cache breakpoints (max breakpoint is 4)  (prompt caching is in anthropic but not sure in open ai)
        }),
        new MessagesPlaceholder("messages"),
      ]);
    }
  );
};
