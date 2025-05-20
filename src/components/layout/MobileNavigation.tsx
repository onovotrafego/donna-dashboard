
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Home, Settings, Users } from 'lucide-react';

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
    title: 'Ajustes',
    icon: Settings,
    path: '/settings',
  },
];

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="mobile-bottom-nav animate-slide-up grid grid-cols-5 z-10">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span className="nav-item-text">{item.title}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavigation;
