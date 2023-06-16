import {AzureOpenAIInput, ChatOpenAI, OpenAIChatInput} from "langchain/chat_models/openai";
import {ChatAnthropic} from "langchain/chat_models/anthropic";
import {ChatGoogleVertexAI} from "langchain/chat_models/googlevertexai";
import {BaseChatMessage, HumanChatMessage} from "langchain/schema";
import {ChatCompletionFunctions, ChatCompletionRequestMessage, CreateChatCompletionRequest} from "openai/api";
import {BaseChatModelParams} from "langchain/dist/chat_models/base";
import {ConfigurationParameters} from "openai";

const model = new ChatOpenAI({
  temperature: 0.9,
  openAIApiKey: "YOUR-API-KEY", // In Node.js defaults to process.env.OPENAI_API_KEY
});

// You can also pass tools or functions to the model, learn more here
// https://platform.openai.com/docs/guides/gpt/function-calling

const modelForFunctionCalling = new ChatOpenAI({
  modelName: "gpt-4-0613",
  temperature: 0,
});

enum ChatModels {
  OpenAIGPT_3_5 = "gpt-3.5-turbo-0613",
  OpenAIGPT_3_5_16k = "gpt-3.5-turbo-16K-0613",
  OpenAIGPT_4 = "gpt-4-0613",
  OpenAIGPT_4_32k = "gpt-4-32K-0613",
  Anthropic = "anthropic",
  GoogleVertex = "google-vertex",
}

type ChatModelConfig = Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseChatModelParams & {
  concurrency?: number;
  cache?: boolean;
  openAIApiKey?: string;
  configuration?: ConfigurationParameters;
};
type ChatMessage = ChatCompletionRequestMessage;
type ChatModelProps = {
  modelName: ChatModels | string;
  config?: ChatModelConfig;
  functions: ChatFunctionMetadata[];
  messages: BaseChatMessage[];
}

export class ChatModel {
  model: any;
  modelName: string;
  config: ChatModelConfig;
  messages: BaseChatMessage[] = [];
  functions: ChatCompletionFunctions[];

  constructor({modelName = ChatModels.OpenAIGPT_3_5, config, functions = [], messages = []}: ChatModelProps) {
    this.config = Object.assign({}, config);
    this.functions = functions || [];
    this.messages = messages || [];
    this.modelName = modelName.toString();

    switch (modelName) {
      case ChatModels.GoogleVertex.toString():
        this.model = ChatGoogleVertexAI;
        break;
      case ChatModels.Anthropic.toString():
        this.model = ChatAnthropic;
        break;
      default: // We default to OpenAi chat model
        this.model = ChatOpenAI;

    }
  }

  chat = async (messages: BaseChatMessage | BaseChatMessage[], overrides?: ChatModelConfig) => {
    let model;
    const {modelName, functions, config} = this;

    // Add new message/messages to the list
    if (Array.isArray(messages)) {
      this.messages = messages.concat(this.messages);
    } else {
      this.messages.push(messages);
    }

    switch (modelName) {
      case ChatModels.GoogleVertex.toString():
        break;
      case ChatModels.Anthropic.toString():
        break;
      default: // We default to OpenAi chat model
        // Default to auto function calling if functions are defined, and the option is not set
        if (functions?.length && 'function_call' in config) {
          config.function_call = "auto";
        }

        model = new this.model(Object.assign(this.config || {}, overrides)) as ChatOpenAI;
        const response = await model.predictMessages(this.messages, this.config) as AIChatMessage

        if (response.additional_kwargs?.function_call === 'function') {
          return this.chat(response.text, overrides);
        }
    }
  }
}
