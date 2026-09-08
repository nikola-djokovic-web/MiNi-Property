'use client';

import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
};

// requestId -> userId -> display name of that user currently typing
type TypingByRequestId = Record<string, Record<string, string>>;

interface ChatMessagesState {
  messagesByRequestId: Record<string, ChatMessage[]>;
  typingByRequestId: TypingByRequestId;
  setMessages: (requestId: string, messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setTyping: (requestId: string, userId: string, userName: string) => void;
  clearTyping: (requestId: string, userId: string) => void;
}

export const useChatMessages = create<ChatMessagesState>((set) => ({
  messagesByRequestId: {},
  typingByRequestId: {},

  setMessages: (requestId, messages) =>
    set((state) => ({
      messagesByRequestId: { ...state.messagesByRequestId, [requestId]: messages },
    })),

  appendMessage: (message) =>
    set((state) => {
      const existing = state.messagesByRequestId[message.requestId] || [];
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messagesByRequestId: {
          ...state.messagesByRequestId,
          [message.requestId]: [...existing, message],
        },
      };
    }),

  setTyping: (requestId, userId, userName) =>
    set((state) => ({
      typingByRequestId: {
        ...state.typingByRequestId,
        [requestId]: { ...(state.typingByRequestId[requestId] || {}), [userId]: userName },
      },
    })),

  clearTyping: (requestId, userId) =>
    set((state) => {
      const current = state.typingByRequestId[requestId];
      if (!current || !(userId in current)) return state;
      const next = { ...current };
      delete next[userId];
      return {
        typingByRequestId: { ...state.typingByRequestId, [requestId]: next },
      };
    }),
}));
