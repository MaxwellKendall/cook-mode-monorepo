import { useState, useEffect, useCallback, useRef } from 'react';

const WEBSOCKET_URL = import.meta.env?.VITE_WEBSOCKET_URL || 'ws://localhost:3001/ws';

interface JobProgress {
  stage: string;
  progress: number;
  message?: string;
  error?: string;
  result?: unknown;
}

interface UseJobProgressOptions {
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
}

export function useJobProgress(jobId: string | null, options: UseJobProgressOptions = {}) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteRef = useRef(false);

  // Use refs for callbacks to avoid reconnection loops
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);
  
  // Keep refs updated without triggering reconnects
  onCompleteRef.current = options.onComplete;
  onErrorRef.current = options.onError;

  const connect = useCallback(() => {
    if (!jobId || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(WEBSOCKET_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Subscribe to job updates
      ws.send(JSON.stringify({ type: 'subscribe.job', jobId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === 'pong') {
          return;
        }

        // Pantry parsing progress
        if (data.type === 'pantry.progress' || data.progress?.stage) {
          const progressData = data.progress || data;
          setProgress({
            stage: progressData.stage,
            progress: progressData.progress,
            message: progressData.message,
            error: progressData.error,
            result: progressData.ingredients || progressData.mealPlan,
          });

          if (progressData.stage === 'completed') {
            setIsComplete(true);
            isCompleteRef.current = true;
            onCompleteRef.current?.(progressData.ingredients || progressData.mealPlan);
          } else if (progressData.stage === 'failed') {
            setIsComplete(true);
            isCompleteRef.current = true;
            onErrorRef.current?.(progressData.error || 'Unknown error');
          }
        }

        // Meal plan progress
        if (data.type === 'mealplan.progress') {
          const progressData = data.progress || data;
          setProgress({
            stage: progressData.stage,
            progress: progressData.progress,
            message: progressData.message,
            error: progressData.error,
            result: progressData.mealPlan,
          });

          if (progressData.stage === 'completed') {
            setIsComplete(true);
            isCompleteRef.current = true;
            onCompleteRef.current?.(progressData.mealPlan);
          } else if (progressData.stage === 'failed') {
            setIsComplete(true);
            isCompleteRef.current = true;
            onErrorRef.current?.(progressData.error || 'Unknown error');
          }
        }

        // Job completion events
        if (data.type === 'job.completed') {
          setIsComplete(true);
          isCompleteRef.current = true;
          onCompleteRef.current?.(data.result);
        } else if (data.type === 'job.failed') {
          setIsComplete(true);
          isCompleteRef.current = true;
          onErrorRef.current?.(data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect if not complete - use ref to get current value
      if (!isCompleteRef.current && jobId) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [jobId]); // Only depend on jobId - callbacks use refs

  useEffect(() => {
    if (jobId) {
      setProgress(null);
      setIsComplete(false);
      isCompleteRef.current = false;
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [jobId, connect]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected || !wsRef.current) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    progress,
    isConnected,
    isComplete,
  };
}
