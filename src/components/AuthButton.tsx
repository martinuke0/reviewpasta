import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AuthButton = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/signup')}
        className="fixed top-4 right-20 gap-2"
      >
        <LogIn className="h-4 w-4" />
        Request Access
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-20 gap-2"
        >
          {profile?.email || user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile?.is_admin && (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin/businesses')}>
              Manage Businesses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/waitlist')}>
              Waitlist Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
