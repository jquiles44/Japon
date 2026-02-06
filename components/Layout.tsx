import React, { useEffect, useState } from 'react';
import { Home, Map, Briefcase, Camera, MapPin, User, Gamepad2 } from 'lucide-react';
import { ViewState } from '../types';
import ChatBot from './ChatBot';
import { getUserProfile } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    // Check for user updates
    const checkUser = () => {
      const user = getUserProfile();
      setAvatarUrl(user.photoUrl);
    };
    checkUser();
    // Simple interval to check for profile changes (in a real app, use Context)
    const interval = setInterval(checkUser, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setView(view)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === view ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-[#f2f4f6] relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-md mx-auto h-screen overflow-y-auto pt-6 px-5 scrollbar-hide pb-28">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs border border-rose-200">
              JP
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Odisea Nipona</h1>
          </div>
          
          <button 
            onClick={() => setView(ViewState.PROFILE)}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center hover:scale-105 transition-transform"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-slate-400" />
            )}
          </button>
        </div>
        
        {children}
      </main>

      {/* ChatBot Overlay */}
      <ChatBot />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-sm h-20 glass-panel rounded-[2rem] shadow-2xl z-50 flex items-center justify-around px-2">
        <NavItem view={ViewState.HOME} icon={Home} label="Inicio" />
        <NavItem view={ViewState.ITINERARY} icon={Map} label="Plan" />
        <NavItem view={ViewState.GAMES} icon={Gamepad2} label="Juego" />
        <NavItem view={ViewState.PHOTO_LAB} icon={Camera} label="Lente" />
        <NavItem view={ViewState.LOGISTICS} icon={Briefcase} label="Info" />
      </nav>
    </div>
  );
};

export default Layout;