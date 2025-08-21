import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">UniMatch Germany</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate("/search")}>
            Browse Programs
          </Button>
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            My Profile
          </Button>
          <Button variant="outline" onClick={async () => {
            await supabase.auth.signOut();
            navigate("/");
          }}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;