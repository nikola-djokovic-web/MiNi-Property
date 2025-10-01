
'use server';

import {
  tenantChatbot,
  TenantChatbotInput,
  TenantChatbotOutput,
} from '@/ai/flows/tenant-chatbot';
import { Message } from './page';

export type ChatState = {
  messages: Message[];
  error: string | null;
};

export async function chatAction(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const question = formData.get('question') as string;

  if (!question) {
    return {
      messages: prevState.messages,
      error: 'Please enter a question.',
    };
  }

  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'user',
    text: question,
  };

  const newMessages = [...prevState.messages, userMessage];

  try {
    const input: TenantChatbotInput = { question };
    const result: TenantChatbotOutput = await tenantChatbot(input);

    const aiMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      text: result.answer,
    };

    return {
      messages: [...newMessages, aiMessage],
      error: null,
    };
  } catch (e: any) {
    const errorMessage = e.message || 'An unexpected error occurred.';
    const errorState = {
      messages: newMessages,
      error: errorMessage,
    };
    // Return a new object to ensure state update
    return { ...errorState };
  }
}
