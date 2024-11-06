import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Home, FileText, CreditCard, History } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState([]);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/service-requests', icon: FileText, label: 'Services' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/history', icon: History, label: 'History' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Uzima Borehole</h1>
          </div>

          {/* Main Navigation */}
          <div className="flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium 
                  ${isActive(item.path) 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-300'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50">
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="relative">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <User className="w-6 h-6" />
                <span className="hidden md:block">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;