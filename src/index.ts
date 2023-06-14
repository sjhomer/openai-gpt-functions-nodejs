import {ChatCompletionRequestMessage, Configuration, OpenAIApi} from "openai";
import functions from "./chat/functions";
import {ChatFunctionDefinition} from "./types";
import {ChatCompletionRequestMessageFunctionCall} from "openai/api";
import readline from "readline";

import dotenv from 'dotenv-flow';
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

console.log('OpenAI Configured?', !!process.env.OPENAI_API_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  // output: process.stdout,
});

async function run_conversation() {
  console.log("> Enter a system prompt:");
  const systemPrompt = await getUserInput();

  const conversation: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];
  let response;
  let message;
  let functionCall;
  let functionName;
  let functionResponse;
  let functionMessage: ChatCompletionRequestMessage;

  console.log("> What is your first question?");
  let userQuestion = await getUserInput();
  conversation.push({
    role: "user",
    content: userQuestion,
  });

  do {
    response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0613',
      messages: conversation,
      functions: Object.values(functions).map((fn: any) => fn.metadata),
    });

    message = response.data.choices[0]?.message;

    conversation.push({
      role: "assistant",
      content: message?.content || '... no response ...',
    });

    functionCall = message?.function_call as ChatCompletionRequestMessageFunctionCall;

    if (functionCall?.name) {
      functionName = functionCall.name;
      const functionDefinition = (functions as Record<string, ChatFunctionDefinition>)?.[functionName] || null;

      if (!functionDefinition) throw new Error(`Function ${functionName} not found`);

      const functionParameters = JSON.parse(functionCall.arguments || "{}");
      const parameterKeys = Object.keys(functionParameters);
      const missingRequiredParameters = functionDefinition.metadata.parameters.required.filter(
        (param: string) => !parameterKeys.includes(param)
      );

      if (missingRequiredParameters.length > 0) {
        functionMessage = {
          role: "assistant",
          content: `Missing required parameter(s): ${missingRequiredParameters.join(", ")} for function ${functionName}`,
        };
      } else {
        try {
          functionResponse = await functionDefinition.resolver(functionParameters);
          functionMessage = {
            role: "function",
            name: functionName,
            content: functionResponse,
          };
        } catch (error) {
          functionMessage = {
            role: "assistant",
            content: `Error executing function ${functionName}: ${(error as Error).message}`,
          };
        }
      }

      conversation.push(functionMessage);
      console.log(`(debug) ${functionName} => ${functionMessage.content}` || "... chat response failed...");
    } else {

      // Don't show the users questions back at them
      if (message?.role !== 'user'){
          console.log(`> ${message?.content}` || "... chat response failed...");
      }

      userQuestion = await getUserInput();
      conversation.push({
        role: "user",
        content: userQuestion,
      });

      if (userQuestion.toLowerCase() === "exit") {
        break;
      }
    }
  } while (true);

  return response;
}

function getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("> ", (answer: string) => {
      resolve(answer);
    });
  });
}

run_conversation()
  .then((response) => {
    console.log(response.data);
    rl.close();
  })
  .catch((error) => {
    console.error("Error:", error);
    rl.close();
  });
