'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faMicrophone, 
  faUser, 
  faMicrophoneSlash, 
  faChartLine, 
  faBell,
  faCog,
  faSignOutAlt,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  onVoiceToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onVoiceToggle }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (onVoiceToggle) {
      onVoiceToggle();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you'd save this to localStorage and apply to document
  };

  const UserMenu = () => (
    <div className={`absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transition-all duration-200 ${showUserMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">John Doe</p>
            <p className="text-sm text-gray-500">john.doe@email.com</p>
          </div>
        </div>
      </div>
      
      <div className="py-2">
        <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3">
          <FontAwesomeIcon icon={faUser} className="text-gray-400" />
          <span>Profile Settings</span>
        </button>
        <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3">
          <FontAwesomeIcon icon={faCog} className="text-gray-400" />
          <span>Preferences</span>
        </button>
        <button 
          onClick={toggleDarkMode}
          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="text-gray-400" />
            <span>Dark Mode</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300'} relative`}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
          </div>
        </button>
      </div>
      
      <div className="border-t border-gray-100 pt-2">
        <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3">
          <FontAwesomeIcon icon={faSignOutAlt} className="text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className="gradient-bg text-white shadow-2xl sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">