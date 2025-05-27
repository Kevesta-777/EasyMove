import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, PhoneCall, Clock, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'driver';
  timestamp: string;
  read?: boolean;
}

interface ChatInterfaceProps {
  bookingId?: string;
  driver?: {
    id: string;
    name: string;
    profileImage?: string;
    phoneNumber?: string;
  };
  onSendMessage?: (message: string) => Promise<boolean>;
  onCall?: () => void;
  initialMessages?: Message[];
}

export default function ChatInterface({
  bookingId,
  driver,
  onSendMessage,
  onCall,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample predefined quick messages
  const quickMessages = [
    "I'm running late by about 10 minutes",
    "Where exactly should I park?",
    "I've arrived at the location",
    "Do you need any extra help with packing?",
    "Is there anything specific I should know about the items?",
    "Are there any parking restrictions I should be aware of?"
  ];
  
  // Extract driver initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Format timestamp to display in chat
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Auto-scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;
    
    // Create a new message
    const messageToSend: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    // Add the message to the chat
    setMessages([...messages, messageToSend]);
    setNewMessage('');
    setLoading(true);
    
    try {
      // Call the onSendMessage callback if provided
      if (onSendMessage) {
        const success = await onSendMessage(newMessage);
        
        // If the callback returns true, mark the message as read
        if (success) {
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === messageToSend.id 
                  ? { ...msg, read: true } 
                  : msg
              )
            );
          }, 2000);
        }
      }
      
      // Simulate a response from the driver (for demo purposes)
      if (driver) {
        setTimeout(() => {
          const responseMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Thank you for your message. This is an automated response as ${driver.name} might be driving. They'll get back to you as soon as possible.`,
            sender: 'driver',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, responseMessage]);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a quick message
  const handleSendQuickMessage = (message: string) => {
    setNewMessage(message);
  };

  // Render the chat messages
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">Send a message to your driver to get started</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'driver' && driver && (
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={driver.profileImage} alt={driver.name} />
                <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.content}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs opacity-70">
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.sender === 'user' && (
                  <CheckCheck 
                    className={`h-3 w-3 ${
                      message.read ? 'text-blue-400' : 'opacity-70'
                    }`} 
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">
              {driver ? `Chat with ${driver.name}` : 'Driver Chat'}
            </CardTitle>
            <CardDescription>
              {driver ? 'Message your driver directly' : 'A driver will be assigned soon'}
            </CardDescription>
          </div>
          {driver && driver.phoneNumber && onCall && (
            <Button variant="outline" size="icon" onClick={onCall}>
              <PhoneCall className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
          <TabsTrigger value="quick" className="flex-1">Quick Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 flex flex-col px-4 data-[state=active]:flex-1">
          <div className="flex-1 overflow-y-auto py-4">
            {renderMessages()}
          </div>
        </TabsContent>
        <TabsContent value="quick" className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-2">
            {quickMessages.map((message, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 font-normal text-left"
                onClick={() => handleSendQuickMessage(message)}
              >
                {message}
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <CardFooter className="pt-2 pb-4 flex-shrink-0">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={!driver || loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || !driver || loading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}