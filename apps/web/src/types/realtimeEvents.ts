/**
 * Type definition for OpenAI Realtime API response.function_call_arguments.done event
 * This event is received when the model has finished generating function call arguments
 */

export interface ResponseFunctionCallArgumentsDoneEvent {
  type: 'response.function_call_arguments.done';
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  name: string; // The function/tool name
  arguments: string; // JSON string of function arguments
}

/**
 * Type guard to check if an event is a ResponseFunctionCallArgumentsDoneEvent
 */
export function isResponseFunctionCallArgumentsDoneEvent(
  event: any
): event is ResponseFunctionCallArgumentsDoneEvent {
  return (
    event &&
    typeof event === 'object' &&
    event.type === 'response.function_call_arguments.done' &&
    typeof event.event_id === 'string' &&
    typeof event.response_id === 'string' &&
    typeof event.item_id === 'string' &&
    typeof event.output_index === 'number' &&
    typeof event.call_id === 'string' &&
    typeof event.name === 'string' &&
    typeof event.arguments === 'string'
  );
}
