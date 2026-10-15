import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CheckSquare, 
  History, 
  BarChart3, 
  Calendar, 
  Building, 
  ShieldAlert,
  Lock
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  pendingApprovalCount: number;
  isPinUnlocked: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalCount,
  isPinUnlocked,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด',
      icon: LayoutDashboard,
      requiresPin: false
    },
    {
      id: 'apply',
      label: 'ยื่นใบลา',
      icon: FileText,
      requiresPin: false,
      highlight: true
    },
    {
      id: 'personnel',
      label: 'ข้อมูลบุคลากร',
      icon: Users,
      requiresPin: false
    },
    {
      id: 'approvals',
      label: 'การอนุมัติ',
      icon: CheckSquare,
      requiresPin: true,
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined
    },
    {
      id: 'history',
      label: 'ประวัติการลา',
      icon: History,
      requiresPin: false
    },
    {
      id: 'reports',
      label: 'รายงาน สถิติ&กราฟ',
      icon: BarChart3,
      requiresPin: false
    },
    {
      id: 'calendar',
      label: 'ปฏิทินวันลา',
      icon: Calendar,
      requiresPin: false
    },
    {
      id: 'organization',
      label: 'ข้อมูลหน่วยงาน',
      icon: Building,
      requiresPin: true
    },
    {
      id: 'audit_logs',
      label: 'Audit Log',
      icon: ShieldAlert,
      requiresPin: false
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-2xs sticky top-[105px] z-30 no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer relative shrink-0 ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : item.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : item.highlight ? 'text-amber-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>

                {item.requiresPin && !isPinUnlocked && (
                  <span title="ต้องใส่รหัสผ่านความปลอดภัย">
                    <Lock className={`w-3 h-3 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                  </span>
                )}

                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-400 text-blue-950' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
