'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from './use-current-user';
import { useNotifications } from './use-notifications';
import { useChatMessages } from './use-chat-messages';
import { playNotificationSound, unlockAudio } from '@/lib/notification-sound';
import { useTranslation } from '@/app/[lang]/translation-provider';

interface SSEMessage {
  type: 'connection' | 'heartbeat' | 'notification' | 'system' | 'chat_message' | 'typing';
  subtype?: string;
  message?: string;
  data?: any;
  timestamp: string;
}

const TYPING_INDICATOR_TTL_MS = 4000;

function triggerBellAnimation() {
  const bellElement = document.querySelector('[data-notification-bell]') as HTMLElement;
  if (!bellElement) return;

  bellElement.classList.add('animate-bounce');
  bellElement.style.transform = 'scale(1.1)';
  bellElement.style.transition = 'transform 0.3s ease-in-out';

  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    background: rgba(59, 130, 246, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: ripple 1s ease-out;
    pointer-events: none;
    z-index: 1000;
  `;

  if (!document.querySelector('#ripple-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-styles';
    style.textContent = `
      @keyframes ripple {
        0% {
          width: 10px;
          height: 10px;
          opacity: 1;
        }
        100% {
          width: 60px;
          height: 60px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  bellElement.appendChild(ripple);

  setTimeout(() => {
    bellElement.classList.remove('animate-bounce');
    bellElement.style.transform = '';
    ripple.remove();
  }, 1000);
}

export function useRealTimeNotifications() {
  const { user } = useCurrentUser();
  const { dict } = useTranslation();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Unlock the shared AudioContext on first user interaction so sound
  // playback isn't blocked by autoplay restrictions.
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const establishConnection = () => {
    if (!user || !user.id) return;

    try {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Create SSE connection - auth/tenant/role are derived server-side
      // from the session cookie, which EventSource sends automatically on
      // same-origin requests.
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 Connected to notification stream');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0); // Reset attempts on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'connection':
              console.log('🔗 Notification stream established');
              break;

            case 'heartbeat':
              // Keep connection alive - no action needed
              break;

            case 'chat_message':
              if (message.data) {
                useChatMessages.getState().appendMessage(message.data);

                // Someone else's message just arrived - clear their typing
                // indicator and surface it in the notification bell too.
                if (message.data.senderId !== user.id) {
                  useChatMessages.getState().clearTyping(message.data.requestId, message.data.senderId);

                  const titleTemplate = dict?.maintenance?.notifications?.newChatMessageTitle || 'New message from {name}';
                  addNotification({
                    role: user.role,
                    icon: 'MessageSquare',
                    title: message.data.senderName
                      ? titleTemplate.replace('{name}', message.data.senderName)
                      : 'New chat message',
                    description: message.data.text,
                    navigationUrl: `/maintenance/${message.data.requestId}`,
                    type: 'info',
                    priority: 'normal',
                    createdAt: new Date(message.data.createdAt || message.timestamp),
                  });

                  playNotificationSound().catch(e => console.log('Audio error:', e));
                  triggerBellAnimation();
                }
              }
              break;

            case 'typing':
              if (message.data && message.data.userId !== user.id) {
                const { requestId, userId, userName } = message.data;
                useChatMessages.getState().setTyping(requestId, userId, userName);

                const key = `${requestId}:${userId}`;
                if (typingTimeoutsRef.current[key]) {
                  clearTimeout(typingTimeoutsRef.current[key]);
                }
                typingTimeoutsRef.current[key] = setTimeout(() => {
                  useChatMessages.getState().clearTyping(requestId, userId);
                  delete typingTimeoutsRef.current[key];
                }, TYPING_INDICATOR_TTL_MS);
              }
              break;

            case 'notification':
              console.log('🔔 New notification received:', message.data);
              if (message.data) {
                // Add the notification to the store
                addNotification({
                  role: message.data.targetRole || message.data.role || user.role,
                  icon: message.data.icon || 'Bell',
                  title: message.data.title,
                  description: message.data.description,
                  navigationUrl: message.data.navigationUrl,
                  actionLabel: message.data.actionLabel,
                  actionUrl: message.data.actionUrl,
                  type: message.data.type,
                  priority: message.data.priority,
                  createdAt: new Date(message.data.createdAt || message.timestamp),
                });

                playNotificationSound().catch(e => console.log('Audio error:', e));
                triggerBellAnimation();

                // Show browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(message.data.title, {
                    body: message.data.description,
                    icon: '/favicon.ico',
                    tag: message.data.id,
                  });
                }
              }
              break;

            case 'system':
              console.log('📢 System announcement:', message.message);
              // Could show a toast or system-wide notification here
              break;

            default:
              console.log('❓ Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.log('⚠️ SSE connection interrupted');
        setIsConnected(false);

        // Only show error and attempt reconnection if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          setConnectionError(`Connection lost. Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);

          // Attempt to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            establishConnection();
          }, delay);
        } else {
          setConnectionError('Unable to establish real-time connection. Notifications will not update automatically.');
          console.log('🔴 Max reconnection attempts reached. Giving up.');
        }
      };
    } catch (error) {
      console.error('Error establishing SSE connection:', error);
      setIsConnected(false);
      setConnectionError('Failed to establish connection');
    }
  };

  useEffect(() => {
    establishConnection();

    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      setIsConnected(false);
    };
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const reconnect = () => {
    setReconnectAttempts(0); // Reset attempts
    setConnectionError(null);
    establishConnection();
  };

  return {
    isConnected,
    connectionError,
    reconnect,
  };
}
