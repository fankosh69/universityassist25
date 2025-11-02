import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageSquarePlus, Clock, Calendar, Trash2 } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Conversation {
  id: string;
  title: string;
  session_date: string;
  updated_at: string;
  unread_count?: number;
}

interface ChatHistorySidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ 
  currentConversationId, 
  onSelectConversation, 
  onNewChat 
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ai_conversations')
      .select(`
        id,
        title,
        session_date,
        updated_at,
        created_at
      `)
      .eq('profile_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      // Calculate unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        data.map(async (conv) => {
          // Get the last read timestamp
          const { data: readData } = await supabase
            .from('ai_conversation_reads')
            .select('last_read_at')
            .eq('profile_id', user.id)
            .eq('conversation_id', conv.id)
            .maybeSingle();

          // Count unread assistant messages
          const { count } = await supabase
            .from('ai_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('role', 'assistant')
            .gt('created_at', readData?.last_read_at || conv.created_at);

          return {
            ...conv,
            unread_count: count || 0
          };
        })
      );
      
      setConversations(conversationsWithUnread);
    }
    setIsLoading(false);
  };

  const searchConversations = async () => {
    if (!searchQuery.trim()) {
      loadConversations();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ai_messages')
      .select('conversation_id')
      .textSearch('search_vector', searchQuery, {
        type: 'websearch',
        config: 'english'
      });

    if (!error && data) {
      const conversationIds = [...new Set(data.map(m => m.conversation_id))];
      
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('id, title, session_date, updated_at')
        .eq('profile_id', user.id)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversations) {
        setConversations(conversations);
      }
    }
  };

  const groupConversationsByDate = () => {
    const groups: Record<string, Conversation[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    conversations.forEach(conv => {
      const date = new Date(conv.session_date || conv.updated_at);
      if (isToday(date)) {
        groups.today.push(conv);
      } else if (isYesterday(date)) {
        groups.yesterday.push(conv);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(conv);
      } else {
        groups.earlier.push(conv);
      }
    });

    return groups;
  };

  const groups = groupConversationsByDate();

  const renderGroup = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">{title}</h3>
        <div className="space-y-1">
          {items.map(conv => {
            const hasUnread = (conv.unread_count || 0) > 0;
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : hasUnread
                    ? 'bg-accent border border-accent-foreground/10 hover:bg-accent/80'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm flex-1 line-clamp-1 ${
                    hasUnread ? 'font-semibold' : 'font-medium'
                  }`}>
                    {conv.title || 'New Conversation'}
                  </span>
                  {hasUnread && (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(conv.updated_at), 'HH:mm')}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchConversations();
              } else if (e.key === 'Escape') {
                setSearchQuery("");
                loadConversations();
              }
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2 py-4">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchQuery 
                ? "No conversations found matching your search."
                : "Start a new conversation to get personalized university recommendations!"}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {renderGroup("Today", groups.today)}
            {renderGroup("Yesterday", groups.yesterday)}
            {renderGroup("This Week", groups.thisWeek)}
            {renderGroup("Earlier", groups.earlier)}
          </>
        )}
      </ScrollArea>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">Ctrl+K</kbd> to search
        </p>
      </div>
    </div>
  );
}