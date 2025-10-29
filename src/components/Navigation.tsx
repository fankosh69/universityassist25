import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Search as SearchIcon, Settings, Bot, ChevronDown, Target, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";
import { useAdmin } from "@/hooks/useAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const Navigation = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { isAdmin, loading: adminLoading } = useAdmin();
  const isMobile = useIsMobile();

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-8">
        <Logo />
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Explore Germany
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/regions" className="cursor-pointer">Regions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cities" className="cursor-pointer">{t('navigation.cities')}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/universities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('navigation.universities')}
            </Link>
            <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <SearchIcon className="h-3.5 w-3.5" />
              {t('navigation.search')}
            </Link>
            <Link to="/admissions-navigator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Eligibility
            </Link>
            <Link to="/ai-assistant" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              AI Assistant
            </Link>
            
            {user ? (
              <>
                {isAdmin && !adminLoading && (
                  <Link to="/admin" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('navigation.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {t('navigation.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && !adminLoading && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('navigation.signout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth?tab=signin">
                  <Button variant="ghost" size="sm">{t('navigation.signin')}</Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button variant="hero" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-1 mt-6">
                <Collapsible open={exploreOpen} onOpenChange={setExploreOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 hover:bg-muted rounded-lg transition-colors">
                    <span className="text-sm font-medium">Explore Germany</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1 mt-1">
                    <Link 
                      to="/regions" 
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                    >
                      <span className="text-sm">Regions</span>
                    </Link>
                    <Link 
                      to="/cities" 
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                    >
                      <span className="text-sm">{t('navigation.cities')}</span>
                    </Link>
                  </CollapsibleContent>
                </Collapsible>

                <Link 
                  to="/universities" 
                  onClick={closeMobileMenu}
                  className="flex items-center py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">{t('navigation.universities')}</span>
                </Link>

                <Link 
                  to="/search" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                >
                  <SearchIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('navigation.search')}</span>
                </Link>

                <Link 
                  to="/admissions-navigator" 
                  onClick={closeMobileMenu}
                  className="flex items-center py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Eligibility</span>
                </Link>

                <Link 
                  to="/ai-assistant" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </Link>

                <Separator className="my-4" />

                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Target className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('navigation.dashboard')}</span>
                    </Link>

                    <Link 
                      to="/profile" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('navigation.profile')}</span>
                    </Link>

                    {isAdmin && !adminLoading && (
                      <Link 
                        to="/admin" 
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 py-3 px-4 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">Admin</span>
                      </Link>
                    )}

                    <Button 
                      onClick={() => {
                        handleSignOut();
                        closeMobileMenu();
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-2 py-3 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('navigation.signout')}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth?tab=signin" onClick={closeMobileMenu} className="block">
                      <Button variant="ghost" className="w-full justify-start py-3 px-4">
                        {t('navigation.signin')}
                      </Button>
                    </Link>
                    <Link to="/auth?tab=signup" onClick={closeMobileMenu} className="block mt-2">
                      <Button variant="hero" className="w-full py-3 px-4">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};

export default Navigation;