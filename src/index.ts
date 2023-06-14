// Import necessary modules
import {ChatCompletionRequestMessage, Configuration, OpenAIApi} from "openai";
import functions from "./chat/functions"; // Chat functions module
import {ChatFunctionDefinition} from "./types"; // Type definitions
import {ChatCompletionRequestMessageFunctionCall} from "openai/api"; // Function call type
import readline from "readline"; // Readline for interactive command line interface
import dotenv from 'dotenv-flow'; // Dotenv to manage environment variables
dotenv.config(); // Load environment variables

// Configure OpenAI API with the API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Log a check if OpenAI is configured
console.log('OpenAI Configured?', !!process.env.OPENAI_API_KEY);

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
});

// Asynchronous function to run a conversation with OpenAI
async function run_conversation() {
  // Prompt user for a system message
  console.log("> Enter a system prompt:");
  const systemPrompt = await getUserInput();

  // Initialize the conversation with the system message
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

  // Prompt the user for the first question
  console.log("> What is your first question?");
  let userQuestion = await getUserInput();
  conversation.push({
    role: "user",
    content: userQuestion,
  });

  do {
    // Request a response from the OpenAI API
    response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0613',
      messages: conversation,
      functions: Object.values(functions).map((fn: any) => fn.metadata),
    });

    message = response.data.choices[0]?.message;

    // Add the assistant's response to the conversation
    conversation.push({
      role: "assistant",
      content: message?.content || '... no response ...',
    });

    functionCall = message?.function_call as ChatCompletionRequestMessageFunctionCall;

    if (functionCall?.name) {
      // Handle function calls in the assistant's response
      functionName = functionCall.name;
      const functionDefinition = (functions as Record<string, ChatFunctionDefinition>)?.[functionName] || null;

      if (!functionDefinition) throw new Error(`Function ${functionName} not found`);

      const functionParameters = JSON.parse(functionCall.arguments || "{}");
      const parameterKeys = Object.keys(functionParameters);

      // Check for missing parameters in the function call
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
          // Call the function with the parameters from the function call
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

      // Add the function message to the conversation
      conversation.push(functionMessage);
      console.log(`(debug) ${functionName} => ${functionMessage.content}` || "... chat response failed...");
    } else {

      // Don't show the users questions back at them
      if (message?.role !== 'user') {
        console.log(`> ${message?.content}` || "... chat response failed...");
      }

      // Prompt the user for the next question
      userQuestion = await getUserInput();
      conversation.push({
        role: "user",
        content: userQuestion,
      });

      // Exit the conversation if the user types "exit"
      if (userQuestion.toLowerCase() === "exit") {
        break;
      }
    }
  } while (true);

  return response;
}

// Function to get user input from the command line
function getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("> ", (answer: string) => {
      resolve(answer);
    });
  });
}

// Start the conversation
run_conversation()
  .then((response) => {
    // Log the final response from OpenAI
    console.log(response.data);
    // Close the readline interface
    rl.close();
  })
  .catch((error) => {
    // Log any errors that occurred
    console.error("Error:", error);
    // Close the readline interface
    rl.close();
  });
