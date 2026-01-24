import { allRealtimeTools } from '../tools/realtimeTools';
import { isResponseFunctionCallArgumentsDoneEvent } from '../types/realtimeEvents';
// Import RunContext and Usage from @openai/agents-core
// Note: These are available at runtime from @openai/agents-realtime but not exported in types
// So we import from the core package directly
import { RunContext, Usage } from '@openai/agents-core';

export interface RealtimeEventHandlers {
  onConversationItemCreated?: (item: any) => void;
  onConversationItemUpdated?: (item: any) => void;
  onResponseAudioDone?: () => void;
  onError?: (error: any) => void;
  onResponseDone?: (usage: {
    input_token_details?: { audio_tokens?: number };
    output_token_details?: { audio_tokens?: number };
  }) => Promise<void>;
}

/**
 * Pure function to create tool result event
 * Format: https://platform.openai.com/docs/guides/realtime/function-calling
 * Tool call outputs are sent as conversation items
 */
export const createToolResultEvent = (toolCallId: string, result: any): any => ({
  type: 'conversation.item.create',
  item: {
    type: 'function_call_output',
    call_id: toolCallId,
    output: JSON.stringify(result),
  },
});

/**
 * Pure function to parse tool arguments
 */
const parseToolArguments = (args: string | Record<string, any>): Record<string, any> => {
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      throw new Error('Invalid tool arguments format');
    }
  }
  return args;
};

/**
 * Create a map of tool names to tool functions for quick lookup
 */
const createToolMap = () => {
  const toolMap = new Map<string, any>();
  allRealtimeTools.forEach((tool) => {
    toolMap.set(tool.name, tool);
  });
  return toolMap;
};

/**
 * Create a RunContext with proper Usage tracking
 * RunContext automatically initializes Usage internally
 */
const createRunContext = (): RunContext => {
  // RunContext constructor automatically creates a Usage instance
  // The optional parameter is for custom context data (not needed for tool execution)
  return new RunContext();
};

/**
 * Execute a tool call directly in the browser using tool.invoke()
 */
const executeToolCall = async (toolCall: any): Promise<any> => {
  const toolMap = createToolMap();
  const tool = toolMap.get(toolCall.name);
  
  if (!tool) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  // Create a proper RunContext with Usage tracking
  const runContext = createRunContext();
  
  // invoke expects (runContext: RunContext, input: string)
  // The input should be the JSON string of arguments
  const inputString = typeof toolCall.arguments === 'string' 
    ? toolCall.arguments 
    : JSON.stringify(toolCall.arguments);
  
  return await tool.invoke(runContext, inputString);
};

/**
 * Higher-order function to create event handler
 * Tool calls are executed directly in the browser
 */
export const createEventHandler = (
  handlers: RealtimeEventHandlers,
  sendEvent: (event: any) => void
) => {
  return async (event: any): Promise<void> => {
    // Log all events for debugging
    console.log('[realtimeEventHandler] Event received:', event.type, event);
    
    switch (event.type) {
      case 'conversation.item.created':
        handlers.onConversationItemCreated?.(event.item);
        break;
      case 'conversation.item.updated':
        handlers.onConversationItemUpdated?.(event.item);
        break;
      case 'response.audio.done':
        handlers.onResponseAudioDone?.();
        break;
      case 'response.audio_transcript.done':
        // Handle transcript if needed
        break;
      case 'response.done':
        // Handle response.done events for token usage tracking
        if (event.response?.status === 'completed' && event.response?.usage) {
          const usage = event.response.usage;
          console.log('[realtimeEventHandler] response.done with usage:', usage);
          try {
            await handlers.onResponseDone?.(usage);
          } catch (error) {
            console.error('[realtimeEventHandler] Error in onResponseDone handler:', error);
            handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        } else {
          console.log('[realtimeEventHandler] response.done without usage:', event.response);
        }
        break;
      case 'response.function_call_arguments.done':
        // Execute tool call directly in the browser
        if (isResponseFunctionCallArgumentsDoneEvent(event)) {
          try {
            const result = await executeToolCall({
              id: event.call_id,
              name: event.name,
              arguments: event.arguments,
            });
            sendEvent(createToolResultEvent(event.call_id, result));
          } catch (error) {
            console.error('Tool call execution failed:', error);
            handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        } else {
          console.warn('Invalid response.function_call_arguments.done event structure:', event);
          handlers.onError?.(new Error('Invalid function call event structure'));
        }
        break;
      case 'error':
        handlers.onError?.(event.error);
        break;
      default:
        // Pass through all other events
        break;
    }
  };
};

