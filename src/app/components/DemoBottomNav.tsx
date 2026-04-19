import { Home, Users, Plus, MessageSquare, User } from 'lucide-react';

export type TabType = 'home' | 'characters' | 'create' | 'message' | 'profile';

interface DemoBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function DemoBottomNav({ activeTab, onTabChange }: DemoBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'create', label: 'Create', icon: Plus, isCenter: true },
    { id: 'message', label: 'Message', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50 pt-2 pb-5 sm:pb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        if ('isCenter' in tab && tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center -mt-6 relative z-10"
            >
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 w-[4rem] transition-all duration-300 ${
              isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon 
              className={`w-[1.125rem] h-[1.125rem] transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            <span className={`text-[8px] font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-80'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
