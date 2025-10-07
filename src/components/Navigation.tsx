import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Search as SearchIcon, Bookmark, Settings, Bot } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";
import { useAdmin } from "@/hooks/useAdmin";

const Navigation = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />
        
        <div className="flex items-center space-x-4">
          <Link to="/regions" className="text-muted-foreground hover:text-foreground transition-colors">
            Regions
          </Link>
          <Link to="/cities" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('navigation.cities')}
          </Link>
          <Link to="/universities" className="text-muted-foreground hover:text-foreground transition-colors">
            {t('navigation.universities')}
          </Link>
          <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <SearchIcon className="h-4 w-4" />
            {t('navigation.search')}
          </Link>
          <Link to="/admissions-navigator" className="text-muted-foreground hover:text-foreground transition-colors">
            Eligibility
          </Link>
          <Link to="/ai-assistant" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Bot className="h-4 w-4" />
            AI Assistant
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.dashboard')}
              </Link>
              <Link to="/saved" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
                {t('navigation.saved')}
              </Link>
              {isAdmin && !adminLoading && (
                <Link to="/admin" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <User className="h-4 w-4" />
                {t('navigation.profile')}
              </Link>
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                {t('navigation.signout')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth?tab=signin">
                <Button variant="ghost">{t('navigation.signin')}</Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button variant="hero">{t('navigation.signup')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;