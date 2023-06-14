import {ChatCompletionFunctions} from "openai/api";

export interface ChatFunctionMetadataParameter {
  type: string;
  properties: Record<string, {
    type: string;
    description?: string;
  } & any>;
  required: string[];
}

export type ChatFunctionMetadata = Omit<ChatCompletionFunctions, 'parameters'> & {
  parameters: ChatFunctionMetadataParameter;
}

export interface ChatFunctionDefinition {
  metadata: ChatFunctionMetadata;
  resolver: (args: any) => Promise<string>;
}
