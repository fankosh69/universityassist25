import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, Loader2, CheckCircle2, Circle, GraduationCap, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ProfileChecklist {
  personalInfo: boolean;
  academicBackground: boolean;
  languageSkills: boolean;
  preferences: boolean;
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [programData, setProgramData] = useState<any>(null);
  const programId = searchParams.get('program_id');

  const [checklist, setChecklist] = useState<ProfileChecklist>({
    personalInfo: false,
    academicBackground: false,
    languageSkills: false,
    preferences: false
  });

  useEffect(() => {
    checkAuth();
    loadConversation();
    if (programId) {
      loadProgramData();
    }
  }, [programId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI Assistant",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setIsAuthenticated(true);
    
    // Check profile completion
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const { data: academics } = await supabase
      .from('student_academics')
      .select('*')
      .eq('profile_id', session.user.id)
      .single();

    setChecklist({
      personalInfo: !!(profile?.full_name && profile?.nationality && profile?.date_of_birth),
      academicBackground: !!(profile?.current_education_level && profile?.current_field_of_study && academics?.gpa_raw),
      languageSkills: !!(academics?.language_certificates && (academics.language_certificates as any[]).length > 0),
      preferences: !!(profile?.preferred_fields && profile?.preferred_cities)
    });
  };

  const loadProgramData = async () => {
    if (!programId) return;

    const { data, error } = await supabase
      .from('programs')
      .select(`
        id, name, degree_level, field_of_study,
        universities!inner(id, name, slug, city)
      `)
      .eq('id', programId)
      .single();

    if (!error && data) {
      setProgramData(data);
    }
  };

  const loadConversation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get most recent active conversation
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('profile_id', session.user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (conversation) {
      setConversationId(conversation.id);

      // Load messages
      const { data: messagesData } = await supabase
        .from('ai_messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.created_at
        })));
      }
    } else {
      // Start with welcome message
      const welcomeMsg = programData
        ? `Hi! I'm your University Assist AI advisor. I see you're interested in ${programData.name} at ${programData.universities.name}. I can help you understand the requirements, check your eligibility, and guide you through the application process. How can I help you today?`
        : "Hi! I'm your University Assist AI advisor. I'm here to help you find the perfect university program in Germany. Let's start by getting to know you better. What's your name?";
      
      setMessages([{
        role: 'assistant',
        content: welcomeMsg
      }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          conversationId,
          message: userMessage,
          programId: programId || null
        }
      });

      if (error) throw error;

      setConversationId(data.conversationId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);

      // Refresh checklist after each message
      await checkAuth();

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter will naturally create a new line in textarea
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title="AI University Assistant | University Assist"
        description="Get personalized university recommendations with our AI-powered assistant"
      />
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Program Context Card */}
            {programData && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Program Context</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{programData.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {programData.universities.name}, {programData.universities.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{programData.degree_level}</Badge>
                    <Badge variant="outline">{programData.field_of_study}</Badge>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/universities/${programData.universities.slug}/programs/${programId}`}>
                      View Program Details
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Profile Completion Checklist */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Profile Completion</h3>
              </div>
              <div className="space-y-3">
                <ChecklistItem 
                  completed={checklist.personalInfo}
                  label="Personal Information"
                />
                <ChecklistItem 
                  completed={checklist.academicBackground}
                  label="Academic Background"
                />
                <ChecklistItem 
                  completed={checklist.languageSkills}
                  label="Language Skills"
                />
                <ChecklistItem 
                  completed={checklist.preferences}
                  label="Study Preferences"
                />
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                University Assistant
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Let me help you find the perfect program in Germany
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  disabled={isLoading}
                  className="flex-1 min-h-[44px] max-h-[200px] resize-none"
                  rows={1}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={`text-sm ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
