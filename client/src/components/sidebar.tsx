import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  Calculator,
  CreditCard,
  Bot,
  TrendingUp,
  Settings,
  Pill,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'inventory', 'finance']
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    roles: ['admin', 'sales']
  },
  {
    name: "Inventory",
    href: "/inventory", 
    icon: Package,
    roles: ['admin', 'inventory', 'sales']
  },
  {
    name: "Sales",
    href: "/sales",
    icon: FileText,
    roles: ['admin', 'sales']
  },
  {
    name: "Purchases", 
    href: "/purchases",
    icon: ShoppingCart,
    roles: ['admin', 'inventory']
  },
  {
    name: "Finance",
    href: "/finance",
    icon: Calculator,
    roles: ['admin', 'finance']
  },
  {
    name: "POS",
    href: "/pos",
    icon: CreditCard,
    roles: ['admin', 'pos', 'sales']
  }
];

const aiTools = [
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Bot,
    roles: ['admin', 'sales', 'inventory', 'finance']
  },
  {
    name: "Predictions",
    href: "/predictions", 
    icon: TrendingUp,
    roles: ['admin', 'sales', 'inventory']
  }
];

export default function Sidebar() {
  const { user } = useAuth() as { user: User | null };
  const [location] = useLocation();
  const [language, setLanguage] = useState("pt");

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const canAccessRoute = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split('@')[0] || 'User';

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      sales: 'Sales',
      inventory: 'Inventory',
      finance: 'Finance',
      hr: 'HR',
      pos: 'POS',
      marketing: 'Marketing'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="w-64 sidebar-gradient text-white flex flex-col" data-testid="sidebar-main">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">PharmaDist ERP</h1>
            <p className="text-xs text-white/70">Pharmaceutical Distribution</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
                data-testid="img-profile"
              />
            ) : (
              <span className="text-sm font-medium" data-testid="text-user-initials">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium truncate" data-testid="text-username">{userName}</p>
            <p className="text-xs text-white/70" data-testid="text-user-role">
              {user?.role ? getRoleDisplay(user.role) : 'User'}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-xs rounded px-2 py-1"
            data-testid="select-language"
          >
            <option value="pt">🇵🇹 Português</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-2" data-testid="nav-main">
        <div className="text-xs text-white/70 uppercase tracking-wide mb-3">Main Menu</div>
        
        {navigation.map((item) => {
          if (!canAccessRoute(item.roles)) return null;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive(item.href)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(' ', '-')}`}>
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
                {item.name === "Inventory" && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full"
                        data-testid="badge-inventory-alerts">
                    12
                  </span>
                )}
              </a>
            </Link>
          );
        })}

        <div className="text-xs text-white/70 uppercase tracking-wide mt-6 mb-3">AI Tools</div>
        
        {aiTools.map((item) => {
          if (!canAccessRoute(item.roles)) return null;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive(item.href)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
              data-testid={`link-ai-${item.name.toLowerCase().replace(' ', '-')}`}>
                <item.icon className={cn("w-4 h-4", item.name === "AI Assistant" && "ai-pulse")} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-6 border-t border-white/20">
        <Link href="/settings">
          <a className="flex items-center space-x-3 px-3 py-2 rounded-md text-white/80 hover:bg-white/10 transition-colors"
             data-testid="link-settings">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
