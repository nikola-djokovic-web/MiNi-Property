'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from './use-current-user';
import { useNotifications } from './use-notifications';

interface SSEMessage {
  type: 'connection' | 'heartbeat' | 'notification' | 'system';
  subtype?: string;
  message?: string;
  data?: any;
  timestamp: string;
}

export function useRealTimeNotifications() {
  const { user } = useCurrentUser();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio context after first user interaction
  const initializeAudio = () => {
    if (!audioInitialized && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioInitialized(true);
        console.log('📢 Audio context initialized');
      } catch (e) {
        console.log('Audio context not supported:', e);
      }
    }
  };

  // Add user interaction event listeners to initialize audio
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
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

  // Play notification sound with proper audio context
  const playNotificationSound = async () => {
    console.log('🔊 Attempting to play notification sound...', {
      audioContextExists: !!audioContextRef.current,
      audioInitialized,
      audioState: audioContextRef.current?.state
    });
    
    if (!audioContextRef.current) {
      console.log('❌ No audio context available');
      return;
    }

    // Try to resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('✅ Audio context resumed');
      } catch (e) {
        console.log('❌ Failed to resume audio context:', e);
        return;
      }
    }

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Set frequency for a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1);
      
      // Set volume
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.4);
      
      // Play the sound
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.4);
      
      console.log('✅ Notification sound played successfully');
    } catch (e) {
      console.log('❌ Could not play notification sound:', e);
    }
  };

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

      // Create SSE connection
      const params = new URLSearchParams({
        tenantId: user.tenantId || 'default-tenant',
        userId: user.id,
        role: user.role,
      });

      const eventSource = new EventSource(`/api/notifications/stream?${params}`);
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

                // Play notification sound (only if audio is initialized)
                playNotificationSound().catch(e => console.log('Audio error:', e));

                // Trigger bell animation with enhanced effects
                const bellElement = document.querySelector('[data-notification-bell]') as HTMLElement;
                if (bellElement) {
                  // Add multiple animation classes
                  bellElement.classList.add('animate-bounce');
                  bellElement.style.transform = 'scale(1.1)';
                  bellElement.style.transition = 'transform 0.3s ease-in-out';
                  
                  // Create a ripple effect
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
                  
                  // Add ripple animation styles if not already present
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

    // Initialize audio on first user interaction
    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

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
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
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