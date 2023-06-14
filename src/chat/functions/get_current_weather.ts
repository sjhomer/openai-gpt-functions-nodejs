import {ChatFunctionMetadata} from "../../types";

export const metadata: ChatFunctionMetadata = {
  name: "get_current_weather",
  description: "Get the current weather in a given location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city and state, e.g. San Francisco, CA",
      },
      unit: {type: "string", enum: ["celsius", "fahrenheit"]},
    },
    required: ["location"],
  },
};

export async function resolver(args: any): Promise<string> {
  return get_current_weather(args.location, args.unit);
}

function get_current_weather(location: string, unit: string = "fahrenheit"): string {
  const weather_info = {
    location: location,
    temperature: "72",
    unit: unit,
    forecast: ["sunny", "windy"],
  };
  return JSON.stringify(weather_info);
}
