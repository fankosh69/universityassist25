import { useState } from 'react';
import { Heart, HeartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import {
  addToGuestWatchlist,
  removeFromGuestWatchlist,
  isInGuestWatchlist,
} from '@/lib/guest-watchlist';

interface WatchlistButtonProps {
  programId: string;
  isWatched?: boolean;
  onToggle?: (isWatched: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export default function WatchlistButton({ 
  programId, 
  isWatched = false,
  onToggle,
  size = 'default',
  variant = 'outline'
}: WatchlistButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isComplete, isLoggedIn } = useOnboardingStatus();
  const [isLoading, setIsLoading] = useState(false);
  // For guests, hydrate from localStorage so the icon reflects existing saves.
  const [watched, setWatched] = useState(
    isWatched || (!isLoggedIn && isInGuestWatchlist(programId)),
  );

  const handleToggle = async () => {
    if (!isLoggedIn) {
      // Guest mode: persist locally; prompt sign-in only when they open the list.
      if (watched) {
        removeFromGuestWatchlist(programId);
        setWatched(false);
        onToggle?.(false);
        toast({ title: t('watchlist.removed'), description: t('watchlist.removed_desc') });
      } else {
        addToGuestWatchlist(programId);
        setWatched(true);
        onToggle?.(true);
        toast({
          title: t('watchlist.added'),
          description: 'Sign in to access your list from anywhere.',
        });
      }
      return;
    }
    if (!isComplete) {
      toast({ title: 'Complete your profile', description: 'Please complete your profile to save programs.', variant: 'destructive' });
      navigate('/onboarding');
      return;
    }
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('watchlist.login_required'),
          description: t('watchlist.login_required_desc'),
          variant: 'destructive'
        });
        return;
      }

      if (watched) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('profile_id', user.id)
          .eq('program_id', programId);

        if (error) throw error;

        setWatched(false);
        onToggle?.(false);
        toast({
          title: t('watchlist.removed'),
          description: t('watchlist.removed_desc')
        });
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlist')
          .insert({
            profile_id: user.id,
            program_id: programId
          });

        if (error) throw error;

        setWatched(true);
        onToggle?.(true);

        // Check watchlist count and award XP/badge
        const { count } = await supabase
          .from('watchlist')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id);

        if (count === 3) {
          const { GamificationService } = await import('@/services/gamification');
          await GamificationService.awardXP(user.id, {
            eventType: 'WATCHLIST_3_PROGRAMS',
            description: 'Added 3 programs to watchlist'
          });
          await GamificationService.awardBadge(user.id, 'deadline_guardian');
          
          toast({
            title: '🎉 Deadline Guardian Badge Earned!',
            description: '+30 XP for adding 3 programs to your watchlist',
          });
        } else {
          toast({
            title: t('watchlist.added'),
            description: t('watchlist.added_desc')
          });
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast({
        title: t('common.error'),
        description: t('watchlist.error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      {watched ? (
        <Heart className="h-4 w-4 fill-current text-red-500" />
      ) : (
        <HeartIcon className="h-4 w-4" />
      )}
      {size !== 'sm' && (
        <span>
          {watched ? t('watchlist.saved') : t('watchlist.save')}
        </span>
      )}
    </Button>
  );
}