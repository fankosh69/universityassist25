import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, Loader2, CheckCircle2, Circle, GraduationCap, ExternalLink, User, BookOpen, Languages, Target, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProgramRecommendationCard from "@/components/ai/ProgramRecommendationCard";
import { ChatHistorySidebar } from "@/components/ai/ChatHistorySidebar";
import { SessionPromptDialog } from "@/components/ai/SessionPromptDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  programs?: any[];
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
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [programData, setProgramData] = useState<any>(null);
  const programId = searchParams.get('program_id');
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [lastConversation, setLastConversation] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Use the new granular profile completion hook
  const { completion, isLoading: isLoadingCompletion, refresh: refreshCompletion } = useProfileCompletion(userId || undefined);
  const [previousProgress, setPreviousProgress] = useState(0);

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

  // Show toast when profile completion increases
  useEffect(() => {
    if (completion.overallProgress > previousProgress && previousProgress > 0) {
      toast({
        title: "✓ Profile Updated!",
        description: `Your profile is now ${completion.overallProgress}% complete`,
        duration: 2000,
      });
    }
    setPreviousProgress(completion.overallProgress);
  }, [completion.overallProgress]);

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
    setUserId(session.user.id);
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
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .select('id, updated_at, session_date, ai_messages(count)')
      .eq('profile_id', session.user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (conversation && !error) {
      setLastConversation(conversation);
      
      // Check if conversation is older than today - prompt to continue or start new
      const conversationDate = new Date(conversation.session_date || conversation.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      conversationDate.setHours(0, 0, 0, 0);
      
      const messageCount = Array.isArray(conversation.ai_messages) 
        ? conversation.ai_messages.length 
        : 0;

      if (conversationDate < today && messageCount > 0) {
        // Show session prompt dialog
        setShowSessionPrompt(true);
      } else {
        // Continue with current conversation
        loadMessages(conversation.id);
      }
    } else {
      // Start fresh with welcome message
      startNewConversation();
    }
  };

  const markConversationAsRead = async (convId: string) => {
    if (!userId) return;
    
    // Get the latest assistant message in this conversation
    const { data: latestMessage } = await supabase
      .from('ai_messages')
      .select('id, created_at')
      .eq('conversation_id', convId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!latestMessage) return;
    
    // Upsert the read record
    await supabase
      .from('ai_conversation_reads')
      .upsert({
        profile_id: userId,
        conversation_id: convId,
        last_read_message_id: latestMessage.id,
        last_read_at: latestMessage.created_at,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,conversation_id'
      });
  };

  const loadMessages = async (convId: string) => {
    setConversationId(convId);

    const { data: messagesData } = await supabase
      .from('ai_messages')
      .select('role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (messagesData) {
      setMessages(messagesData.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at
      })));
    }

    // Mark conversation as read after loading messages
    await markConversationAsRead(convId);
  };

  const startNewConversation = () => {
    setConversationId(null);
    const welcomeMsg = programData
      ? `Hi! I'm your University Assist AI advisor. I see you're interested in ${programData.name} at ${programData.universities.name}. I can help you understand the requirements, check your eligibility, and guide you through the application process. How can I help you today?`
      : "Hi! I'm your University Assist AI advisor. I'm here to help you find the perfect university program in Germany. Let's start by getting to know you better. What's your name?";
    
    setMessages([{
      role: 'assistant',
      content: welcomeMsg
    }]);
  };

  const handleContinuePreviousChat = () => {
    setShowSessionPrompt(false);
    if (lastConversation) {
      loadMessages(lastConversation.id);
    }
  };

  const handleStartNewSession = async () => {
    setShowSessionPrompt(false);
    
    // Archive the old conversation by updating its status
    if (lastConversation) {
      await supabase
        .from('ai_conversations')
        .update({ status: 'archived' })
        .eq('id', lastConversation.id);
    }
    
    startNewConversation();
  };

  const handleSelectConversation = async (convId: string) => {
    await loadMessages(convId);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    startNewConversation();
    setSidebarOpen(false);
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

      // Check for tool result failures
      if (data?.toolResults) {
        const failures = data.toolResults.filter((tr: any) => !tr.result?.success);
        if (failures.length > 0) {
          console.warn('Tool execution failures:', failures);
          toast({
            title: "Partial Save",
            description: "Some information couldn't be saved. The AI will continue helping you.",
            variant: "destructive",
          });
        }
      }

      setConversationId(data.conversationId);
      
      // Parse message for program recommendations
      const messageContent = data.message || '';
      let programs: any[] | undefined;
      let cleanedMessage = messageContent;
      
      const recommendationsMatch = messageContent.match(/:::PROGRAM_RECOMMENDATIONS:::([\s\S]*?):::END_RECOMMENDATIONS:::/);
      if (recommendationsMatch) {
        try {
          const jsonStr = recommendationsMatch[1].trim();
          const parsed = JSON.parse(jsonStr);
          programs = parsed.programs || [];
          console.log('Parsed program recommendations:', programs.length);
          
          // Remove the JSON markers from the displayed message
          cleanedMessage = messageContent.replace(/:::PROGRAM_RECOMMENDATIONS:::[\s\S]*?:::END_RECOMMENDATIONS:::/, '').trim();
        } catch (err) {
          console.error('Failed to parse program recommendations JSON:', err);
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanedMessage,
        programs: programs
      }]);

      // Mark conversation as read after receiving new message
      if (data.conversationId) {
        await markConversationAsRead(data.conversationId);
      }

      // Refresh profile completion after each message
      await refreshCompletion();

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the failed user message from display
      setMessages(prev => prev.slice(0, -1));
      
      let errorDescription = error.message || "Failed to send message";
      
      // Handle specific error cases
      if (error.message?.includes('429')) {
        errorDescription = "Too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes('402')) {
        errorDescription = "AI service quota exceeded. Please contact support.";
      } else if (error.message?.includes('profile')) {
        errorDescription = "Failed to update your profile. Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorDescription,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAIAboutProgram = (programName: string) => {
    setInput(`Tell me more about the ${programName} program. What are the specific requirements and application process?`);
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

      {/* Session Prompt Dialog */}
      {lastConversation && (
        <SessionPromptDialog
          open={showSessionPrompt}
          lastSessionDate={lastConversation.session_date || lastConversation.updated_at}
          messageCount={Array.isArray(lastConversation.ai_messages) ? lastConversation.ai_messages.length : 0}
          onContinue={handleContinuePreviousChat}
          onStartNew={handleStartNewSession}
        />
      )}

      <div className="container mx-auto px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block space-y-4">
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
            
            <Card className="h-[calc(100vh-12rem)]">
              <ChatHistorySidebar
                currentConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
              />
            </Card>
            
            {/* Profile Completion Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Profile Completion</h3>
                </div>
                <Badge variant={completion.overallProgress === 100 ? "default" : "secondary"}>
                  {completion.overallProgress}%
                </Badge>
              </div>
              
              <Progress value={completion.overallProgress} className="mb-4" />
              
              <div className="space-y-2">
                {/* ... keep existing code (Personal Information, Academic Background, Language Skills, Study Preferences sections) */}
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 hover:bg-accent/50 p-2 rounded-md transition-colors">
                      {completion.personalInfo.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className={`text-sm flex-1 text-left ${completion.personalInfo.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Personal Information
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-2 space-y-1">
                    <SubCheckItem completed={completion.personalInfo.items.fullName} label="Full Name" />
                    <SubCheckItem completed={completion.personalInfo.items.nationality} label="Nationality" />
                    <SubCheckItem completed={completion.personalInfo.items.dateOfBirth} label="Date of Birth" />
                    <SubCheckItem completed={completion.personalInfo.items.contact} label="Contact Info" />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 hover:bg-accent/50 p-2 rounded-md transition-colors">
                      {completion.academicBackground.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className={`text-sm flex-1 text-left ${completion.academicBackground.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Academic Background
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-2 space-y-1">
                    <SubCheckItem completed={completion.academicBackground.items.educationLevel} label="Education Level" />
                    <SubCheckItem completed={completion.academicBackground.items.institution} label="Institution" />
                    <SubCheckItem completed={completion.academicBackground.items.fieldOfStudy} label="Field of Study" />
                    <SubCheckItem completed={completion.academicBackground.items.gpa} label="GPA/Grades" />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 hover:bg-accent/50 p-2 rounded-md transition-colors">
                      {completion.languageSkills.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Languages className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className={`text-sm flex-1 text-left ${completion.languageSkills.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Language Skills
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-2 space-y-1">
                    <SubCheckItem completed={completion.languageSkills.items.germanCertificate} label="German Certificate" />
                    <SubCheckItem completed={completion.languageSkills.items.englishCertificate} label="English Certificate" />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 hover:bg-accent/50 p-2 rounded-md transition-colors">
                      {completion.preferences.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Target className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className={`text-sm flex-1 text-left ${completion.preferences.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Study Preferences
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-2 space-y-1">
                    <SubCheckItem completed={completion.preferences.items.degreeType} label="Degree Type" />
                    <SubCheckItem completed={completion.preferences.items.preferredFields} label="Preferred Fields" />
                    <SubCheckItem completed={completion.preferences.items.preferredCities} label="Preferred Cities" />
                    <SubCheckItem completed={completion.preferences.items.careerGoals} label="Career Goals" />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-10rem)]">
            <div className="p-4 border-b flex items-center gap-3">
              {/* Mobile Sidebar Trigger */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <ChatHistorySidebar
                    currentConversationId={conversationId}
                    onSelectConversation={handleSelectConversation}
                    onNewChat={handleNewChat}
                  />
                </SheetContent>
              </Sheet>

              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  University Assistant
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Let me help you find the perfect program in Germany
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className="space-y-3">
                    <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                    
                    {/* Render program recommendation cards if present */}
                    {message.programs && message.programs.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 ml-11 max-w-[80%]">
                        {message.programs.map((program: any, idx: number) => (
                          <ProgramRecommendationCard
                            key={idx}
                            program={program}
                            onAskAI={handleAskAIAboutProgram}
                          />
                        ))}
                      </div>
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
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
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

function SubCheckItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 w-1.5 rounded-full ${completed ? 'bg-green-600' : 'bg-muted-foreground'}`} />
      <span className={`text-xs ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
