'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faMicrophone, 
  faUser, 
  faMicrophoneSlash, 
  faChartLine, 
  faBell 
} from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  onVoiceToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onVoiceToggle }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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

  return (
    <header className="gradient-bg text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <FontAwesomeIcon icon={faRobot} className="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FinanceAI Co-Pilot</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-white/80 transition-colors flex items-center space-x-1">
              <FontAwesomeIcon icon={faChartLine} className="text-xs" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="hover:text-white/80 transition-colors flex items-center space-x-1">
              <span>Insights</span>
            </a>
            <a href="#" className="hover:text-white/80 transition-colors flex items-center space-x-1">
              <span>Goals</span>
            </a>
            <a href="#" className="hover:text-white/80 transition-colors flex items-center space-x-1">
              <span>Investments</span>
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm font-medium">
              {currentTime}
            </div>
            
            <button 
              onClick={toggleVoice}
              className={`${isVoiceActive ? 'voice-active' : 'bg-white/10 hover:bg-white/20'} 
                px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 shadow-lg`}
            >
              <FontAwesomeIcon 
                icon={isVoiceActive ? faMicrophoneSlash : faMicrophone} 
                className={`${isVoiceActive ? 'animate-pulse-slow' : ''}`} 
              />
              <span className="hidden md:inline">
                {isVoiceActive ? 'Stop Listening' : 'Ask AI'}
              </span>
            </button>
            
            <div className="relative">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              <button className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <FontAwesomeIcon icon={faBell} className="text-sm" />
              </button>
            </div>
            
            <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors cursor-pointer">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;