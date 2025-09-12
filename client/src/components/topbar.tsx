import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Bell, 
  ChevronDown,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface TopBarProps {
  title: string;
  subtitle: string;
  onOpenAIChat: () => void;
}

export default function TopBar({ title, subtitle, onOpenAIChat }: TopBarProps) {
  const { user } = useAuth() as { user: User | null };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="topbar-main">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* AI Chat Button */}
          <Button 
            onClick={onOpenAIChat}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2 hover:opacity-90 transition-opacity"
            data-testid="button-ai-chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI</span>
          </Button>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center"
                    data-testid="badge-notifications-count">
                3
              </span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
                   data-testid="dropdown-notifications">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Expiry Alert</p>
                      <p className="text-xs text-muted-foreground">12 products expiring within 90 days</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Low Stock</p>
                      <p className="text-xs text-muted-foreground">5 products below minimum stock level</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Overdue Payment</p>
                      <p className="text-xs text-muted-foreground">8 invoices overdue for payment</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-profile"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50"
                   data-testid="dropdown-profile">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm" data-testid="text-profile-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-profile-email">
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    data-testid="button-logout"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
