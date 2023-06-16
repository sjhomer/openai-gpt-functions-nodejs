/**
 * Importing necessary modules.
 * Each module represents a chat function defined elsewhere in the codebase
 */
import * as convert_requirements_to_md from "./convert_requirements_to_md";
import * as get_current_weather from "./get_current_weather";

/**
 * Object storing references to all accessible chat functions.
 * New chat functions should be added here to be accessible.
 */
const fns = {
  convert_requirements_to_md,
  get_current_weather
}

/**
 * Extract metadata of chat functions
 */
export const chatFunctionsMetadata = Object.values(fns).map((fn: any) => fn.metadata)

/**
 * Type to represent the status of a chat function call
 */
type chatFunctionStatus = 'success' | 'error' | 'missing-required-parameters';

/**
 * Type to represent the response of a chat function call
 */
type chatFunctionResponse = {
  status: chatFunctionStatus;
  message: string;
}

/**
 * Main function to execute a specific chat function by its name.
 * It handles function calling, error catching, and status management.
 *
 * @param {string} name - the name of the chat function to be called
 * @param {any} props - the parameters required by the chat function
 *
 * @return {chatFunctionResponse} - An object with the status ('success', 'error', or 'missing-required-parameters') and function message.
 *
 * @throws {Error} - If the function is listed in the metadata but its implementation (resolver) is not found
 */
export async function callChatFunction(name: string, props: any): Promise<chatFunctionResponse> {
  let status: chatFunctionStatus = 'error'; // Assume failure until proven otherwise
  let message = '';

  // If the function exists, attempt to call it
  if (name in fns) {
    // @ts-ignore
    const functionDefinition: ChatFunctionDefinition = fns[name];

    // Validate that the function metadata and resolver exist
    if(!functionDefinition.metadata || !functionDefinition.resolver) {
      console.log(`(debug) function ${name} listed in metadata, but it's malformed`, functionDefinition);
      throw new Error(`Function ${name} listed in metadata, but it's malformed`);
    }

    // Parse the function parameters
    const functionParameters = JSON.parse(props || "{}");
    console.log(`(debug) ${name}.call(${JSON.stringify(functionParameters)})`);

    // Check for any required parameters that are missing
    const missingRequiredParameters = functionDefinition.metadata.parameters.required.filter(
      (param: string) => functionParameters?.[param] === undefined
    );

    // If required parameters are missing, update the status and message
    if (missingRequiredParameters.length > 0) {
      status = 'missing-required-parameters';
      message = `Missing required parameter(s): ${missingRequiredParameters.join(", ")} for function ${name}`;
    } else {
      try {
        // Call the function and capture the response
        const functionResponse = await functionDefinition.resolver(functionParameters);
        status = 'success';
        message = functionResponse;
      } catch (error) {
        // Capture any error message that occurs during execution
        message = `Error executing function ${name}: ${(error as Error).message}`;
      }
    }

    // Log the function response
    console.log(`(debug) ${name} => ${message}`);
  } else if (name) {
    // If the function is listed in the metadata but no resolver is found, throw an error
    throw new Error(`Function ${name} listed in metadata, but no resolver found`);
  }

  // Return the success status and function message
  return {status, message};
}
