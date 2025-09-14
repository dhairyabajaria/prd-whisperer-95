import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, X, User, AlertCircle, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HealthStatus {
  status: string;
  openaiConfigured: boolean;
  databaseConfigured: boolean;
  sessionConfigured: boolean;
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { data: healthStatus } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    staleTime: 30 * 1000, // 30 seconds
  });

  const isAiConfigured = healthStatus?.openaiConfigured ?? false;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: isAiConfigured 
        ? "Hello! I can help you with sales analysis, inventory management, financial reports, and more. What would you like to know?"
        : "AI chat is currently using fallback mode. I can provide basic assistance and direct you to the appropriate sections of the dashboard. What would you like to know?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { query });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.response || "I'm sorry, I couldn't process your request.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[600px] flex flex-col p-0" data-testid="modal-ai-chat">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="text-primary mr-2 w-5 h-5" />
              AI Assistant
              {!isAiConfigured && (
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                  Fallback Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isAiConfigured && isAdmin && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/settings'}
                  className="text-xs"
                  data-testid="button-configure-ai-chat"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-ai-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {!isAiConfigured && (
          <div className="px-6 py-3 border-b border-border">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                AI chat is using fallback responses. 
                {isAdmin ? (
                  <span> Configure OpenAI in <a href="/settings" className="font-medium underline">Settings</a> for enhanced AI capabilities.</span>
                ) : (
                  <span> Contact your administrator to enable full AI features.</span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="flex-1 p-6 overflow-y-auto" data-testid="chat-messages-container">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                data-testid={`message-${message.role}-${message.id}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-primary text-sm w-4 h-4" />
                  </div>
                )}
                
                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap" data-testid={`message-content-${message.id}`}>
                    {message.content}
                  </p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-secondary-foreground text-sm w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="text-primary text-sm w-4 h-4" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-border">
          <div className="flex space-x-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your business..."
              className="flex-1"
              disabled={chatMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-2"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
