import { createEventHandler } from './realtimeEventHandler';

export interface RealtimeWebRTCConfig {
  recipe?: any;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onEvent?: (event: any) => void;
  onResponseDone?: (usage: {
    input_token_details?: { audio_tokens?: number };
    output_token_details?: { audio_tokens?: number };
  }) => Promise<void>;
}

export interface RealtimeConnectionState {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  audioElement: HTMLAudioElement;
  mediaStream: MediaStream;
}

export type RealtimeConnection = {
  state: RealtimeConnectionState;
  sendEvent: (event: any) => void;
  sendMessage: (text: string) => void;
  mute: (muted: boolean) => void;
  disconnect: () => Promise<void>;
};

/**
 * Pure function to create audio element
 */
export const createAudioElement = (): HTMLAudioElement => {
  const audio = document.createElement('audio');
  audio.autoplay = true;
  return audio;
};

/**
 * Pure function to setup audio track handler
 */
export const setupAudioTrackHandler = (
  peerConnection: RTCPeerConnection,
  audioElement: HTMLAudioElement
): void => {
  peerConnection.ontrack = (e) => {
    audioElement.srcObject = e.streams[0];
  };
};

/**
 * Pure function to create peer connection with configuration
 */
export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection();
};

/**
 * Pure function to get user media
 */
export const getUserMedia = async (): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({ audio: true });
};

/**
 * Pure function to add tracks to peer connection
 */
export const addTracksToConnection = (
  peerConnection: RTCPeerConnection,
  mediaStream: MediaStream
): void => {
  mediaStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, mediaStream);
  });
};

/**
 * Pure function to create data channel
 */
export const createDataChannel = (
  peerConnection: RTCPeerConnection,
  channelName: string = 'oai-events'
): RTCDataChannel => {
  return peerConnection.createDataChannel(channelName);
};

/**
 * Pure function to create SDP offer
 */
export const createSdpOffer = async (
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

/**
 * Pure function to send SDP to server
 */
export const sendSdpToServer = async (
  sdp: string,
  recipe: any,
  baseUrl: string
): Promise<string> => {
  const response = await fetch(`${baseUrl}/realtime/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sdp, recipe }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }

  const { sdp: answerSdp } = await response.json();
  return answerSdp;
};

/**
 * Pure function to set remote description
 */
export const setRemoteDescription = async (
  peerConnection: RTCPeerConnection,
  sdpAnswer: string
): Promise<void> => {
  const answer: RTCSessionDescriptionInit = {
    type: 'answer',
    sdp: sdpAnswer,
  };
  await peerConnection.setRemoteDescription(answer);
};

/**
 * Higher-order function to setup data channel handlers
 */
export const setupDataChannelHandlers = (
  dataChannel: RTCDataChannel,
  handlers: {
    onOpen?: () => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
  }
): void => {
  dataChannel.onopen = () => {
    handlers.onOpen?.();
  };

  dataChannel.onmessage = (e) => {
    handlers.onMessage?.(e);
  };

  dataChannel.onerror = (error) => {
    handlers.onError?.(error);
  };
};

/**
 * Pure function to parse event from data channel message
 */
export const parseEventFromMessage = (message: MessageEvent): any => {
  try {
    return JSON.parse(message.data);
  } catch (error) {
    throw new Error(`Failed to parse event: ${error}`);
  }
};

/**
 * Pure function to create event message
 */
export const createEventMessage = (event: any): string => {
  return JSON.stringify(event);
};

/**
 * Pure function to create conversation item event
 */
export const createConversationItemEvent = (text: string): any => ({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'input_text',
        text,
      },
    ],
  },
});

/**
 * Pure function to mute/unmute tracks
 */
export const setTracksEnabled = (
  mediaStream: MediaStream,
  enabled: boolean
): void => {
  mediaStream.getAudioTracks().forEach(track => {
    track.enabled = enabled;
  });
};

/**
 * Pure function to stop all tracks
 */
export const stopAllTracks = (mediaStream: MediaStream): void => {
  mediaStream.getTracks().forEach(track => track.stop());
};

/**
 * Pure function to cleanup connection state
 */
export const cleanupConnection = async (
  state: RealtimeConnectionState
): Promise<void> => {
  if (state.dataChannel) {
    state.dataChannel.close();
  }
  stopAllTracks(state.mediaStream);
  state.peerConnection.close();
  state.audioElement.srcObject = null;
};

/**
 * Main function to create and connect WebRTC connection
 */
export const createRealtimeConnection = async (
  config: RealtimeWebRTCConfig
): Promise<RealtimeConnection> => {
  const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
  
  // Create connection components
  const peerConnection = createPeerConnection();
  const audioElement = createAudioElement();
  const mediaStream = await getUserMedia();
  
  // Setup audio handling
  setupAudioTrackHandler(peerConnection, audioElement);
  addTracksToConnection(peerConnection, mediaStream);
  
  // Create data channel
  const dataChannel = createDataChannel(peerConnection);
  
  // Create event handler - tool calls are executed directly in the browser
  // Note: onResponseDone callback will be set by the caller if token tracking is needed
  const handleMessage = createEventHandler(
    {
      onConversationItemCreated: (item) => {
        config.onEvent?.({ type: 'conversation.item.created', item });
      },
      onError: (error) => {
        config.onError?.(error instanceof Error ? error : new Error(String(error)));
      },
      // onResponseDone will be set by the caller (useCookingAssistant) for token tracking
      onResponseDone: config.onResponseDone,
    },
    (event) => {
      // Send event via data channel
      if (dataChannel.readyState === 'open') {
        dataChannel.send(createEventMessage(event));
      }
    }
  );
  
  // Setup data channel handlers
  setupDataChannelHandlers(dataChannel, {
    onOpen: () => {
      console.log('Data channel opened');
    },
    onMessage: async (e) => {
      try {
        const event = parseEventFromMessage(e);
        await handleMessage(event);
        config.onEvent?.(event);
      } catch (error) {
        console.error('Error handling event:', error);
        config.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError: (error) => {
      console.error('Data channel error:', error);
      config.onError?.(new Error('Data channel error'));
    },
  });
  
  // Create SDP offer and send to server
  const offer = await createSdpOffer(peerConnection);
  const answerSdp = await sendSdpToServer(offer.sdp!, config.recipe, baseUrl);
  await setRemoteDescription(peerConnection, answerSdp);
  
  // Build connection state
  const state: RealtimeConnectionState = {
    peerConnection,
    dataChannel,
    audioElement,
    mediaStream,
  };
  
  // Create connection object with methods
  const connection: RealtimeConnection = {
    state,
    sendEvent: (event: any) => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(createEventMessage(event));
      }
    },
    sendMessage: (text: string) => {
      const event = createConversationItemEvent(text);
      connection.sendEvent(event);
    },
    mute: (muted: boolean) => {
      setTracksEnabled(mediaStream, !muted);
    },
    disconnect: async () => {
      await cleanupConnection(state);
      config.onDisconnected?.();
    },
  };
  
  config.onConnected?.();
  return connection;
};

