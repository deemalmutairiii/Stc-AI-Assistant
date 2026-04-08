import { Sparkles, Wifi, Globe } from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    { icon: Sparkles, label: 'Recommend an internet package', action: 'recommend' },
    { icon: Wifi, label: 'Fix my internet', action: 'fix-internet' },
    { icon: Globe, label: 'Roaming help', action: 'roaming' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.action}
            onClick={() => onActionClick(action.label)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-gray-200 
                       transition-all duration-200 
                       hover:shadow-md hover:border-[#5C0F8B] hover:bg-[#F3E8FF]"
          >
            <Icon className="w-4 h-4 text-[#5C0F8B]" />
            <span className="text-sm text-gray-700">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}