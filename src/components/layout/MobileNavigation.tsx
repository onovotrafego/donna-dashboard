
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Home, LogOut, Settings, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  {
    title: 'Minhas Finanças',
    icon: Home,
    path: '/',
  },
  {
    title: 'Transações',
    icon: BarChart3,
    path: '/transactions',
  },
  {
    title: 'Compromissos',
    icon: Calendar,
    path: '/commitments',
  },
  {
    title: 'Indique',
    icon: Users,
    path: '/referrals',
  },
  {
    title: 'Menu',
    icon: Settings,
    path: '#',
    isDropdown: true,
  },
];

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <nav className="mobile-bottom-nav animate-slide-up grid grid-cols-5 z-10">
      {NAV_ITEMS.map((item) => {
        if (item.isDropdown) {
          return (
            <DropdownMenu key={item.path}>
              <DropdownMenuTrigger className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                <item.icon size={20} />
                <span className="nav-item-text">{item.title}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mb-16 z-50 bg-background">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings size={16} />
                    <span>Ajustes</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut size={16} />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span className="nav-item-text">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
