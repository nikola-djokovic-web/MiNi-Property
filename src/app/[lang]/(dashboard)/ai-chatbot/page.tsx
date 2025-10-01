

'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { chatAction, ChatState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/page-header';
import {
  ArrowRight,
  Bot,
  Loader2,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4" />
      )}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

export default function AIChatbotPage() {
  const { user } = useCurrentUser();
  const initialState: ChatState = {
    messages: [
      {
        id: 'init',
        role: 'assistant',
        text: 'Hello! I am your AI Assistant. How can I help you today? You can ask me about rent payments, maintenance, and more.',
      },
    ],
    error: null,
  };
  const [state, formAction] = useActionState(chatAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);
  
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [state.messages]);


  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-10rem)]">
      <PageHeader
        title="AI Assistant"
        description="Ask questions about your property and lease."
      />
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6" viewportRef={viewportRef}>
              <div className="space-y-6">
                {state.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-start gap-4',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback>
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-md rounded-lg p-3 text-sm whitespace-pre-wrap',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.text}
                    </div>
                    {message.role === 'user' && user && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?u=${user.id}`}
                          alt={user.name}
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
           <form
            ref={formRef}
            action={(formData) => {
              formAction(formData);
              formRef.current?.reset();
            }}
            className="flex w-full items-center gap-2"
          >
            <Input
              id="question"
              name="question"
              placeholder="Ask a question..."
              required
            />
            <SubmitButton />
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
