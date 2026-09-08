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

interface ChatMessagesState {
  messagesByRequestId: Record<string, ChatMessage[]>;
  setMessages: (requestId: string, messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
}

export const useChatMessages = create<ChatMessagesState>((set) => ({
  messagesByRequestId: {},

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
}));
