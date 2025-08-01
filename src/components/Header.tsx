'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faMicrophone, faUser } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  // Add any props if needed
}

const Header: React.FC<HeaderProps> = () => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    // Additional voice functionality will be added later
  };

  return (
    <header className="gradient-bg text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faRobot} className="text-2xl" />
            <h1 className="text-2xl font-bold">FinanceAI Co-Pilot</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleVoice}
              className={`${isVoiceActive ? 'voice-active' : 'bg-white/20 hover:bg-white/30'} px-4 py-2 rounded-full transition-all duration-300`}
            >
              <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
              Ask AI
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;