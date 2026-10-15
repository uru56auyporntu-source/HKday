import React, { useState } from 'react';
import { 
  Personnel, 
  SchoolSettings, 
  LeaveRecord 
} from '../types/leave';
import { 
  Building2, 
  UserCheck, 
  Lock, 
  Unlock, 
  Bell, 
  ChevronDown,
  CalendarDays,
  ShieldCheck,
  LogIn,
  Cloud
} from 'lucide-react';
import { formatThaiDate } from '../services/storageService';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentPersonnel: Personnel;
  allPersonnel: Personnel[];
  onSelectPersonnel: (person: Personnel) => void;
  settings: SchoolSettings;
  leaveRecords: LeaveRecord[];
  isPinUnlocked: boolean;
  onLockPin: () => void;
  onRequestPin: (targetTab: string) => void;
  onOpenGoogleSheets?: () => void;
  onOpenLineModal?: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersonnel,
  allPersonnel,
  onSelectPersonnel,
  settings,
  leaveRecords,
  isPinUnlocked,
  onLockPin,
  onRequestPin,
  onOpenGoogleSheets,
  onNavigateTab,
  onOpenLoginModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Pending counts for notifications
  const pendingAcademicCount = leaveRecords.filter(r => r.status === 'pending_academic').length;
  const pendingDirectorCount = leaveRecords.filter(r => r.status === 'pending_director').length;
  const totalPending = (currentPersonnel.role === 'academic_head') 
    ? pendingAcademicCount 
    : (currentPersonnel.role === 'director') 
      ? pendingDirectorCount 
      : (currentPersonnel.role === 'admin')
        ? pendingAcademicCount + pendingDirectorCount
        : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedToday = formatThaiDate(todayStr);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'director':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-amber-300">ผู้อำนวยการ</span>;
      case 'academic_head':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-purple-300">หัวหน้าวิชาการ</span>;
      case 'admin':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-rose-300">ผู้ดูแลระบบ</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-300">ครู / บุคลากร</span>;
    }
  };

  const isExecutiveOrAdmin = ['director', 'academic_head', 'admin'].includes(currentPersonnel.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Bar for School Identity */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* School Crest / Emblem Badge */}
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold text-lg shadow-md border-2 border-amber-300 shrink-0">
              <Building2 className="w-6 h-6 text-blue-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  ระบบจัดการวันลาออนไลน์
                  <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md font-normal">
                    ปีงบประมาณ {settings.currentFiscalYear}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-blue-200">
                {settings.schoolName} | {settings.schoolArea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 self-end md:self-auto text-xs text-blue-200">
            <div className="flex items-center gap-1.5 bg-blue-800/60 px-3 py-1 rounded-lg border border-blue-700/50">
              <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
              <span>วันนี้: <strong className="text-white font-medium">{formattedToday}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Personnel Switcher & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Switcher Description */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-500 hidden md:inline">
            เข้าสู่ระบบในฐานะ:
          </span>

          {/* Personnel Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition-all shadow-xs text-left cursor-pointer group"
            >
              <Avatar 
                prefix={currentPersonnel.prefix} 
                gender={currentPersonnel.gender} 
                size="sm" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 text-sm truncate max-w-[150px] sm:max-w-[200px]">
                    {currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}
                  </span>
                  {getRoleBadge(currentPersonnel.role)}
                </div>
                <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-[240px]">
                  {currentPersonnel.position} {currentPersonnel.academicStanding}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-1 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        เลือกผู้ใช้งานบุคลากร
                      </p>
                      <p className="text-[11px] text-slate-500">
                        สลับผู้ใช้เพื่อทดสอบการทำงานของครู, หัวหน้าวิชาการ, ผอ.
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>

                  <div className="max-h-80 overflow-y-auto p-1 divide-y divide-slate-50">
                    {allPersonnel.map((person) => {
                      const isSelected = person.id === currentPersonnel.id;
                      return (
                        <button
                          key={person.id}
                          onClick={() => {
                            onSelectPersonnel(person);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <Avatar 
                            prefix={person.prefix} 
                            gender={person.gender} 
                            size="sm" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900 font-semibold' : 'text-slate-800'}`}>
                                {person.prefix}{person.firstName} {person.lastName}
                              </span>
                              {getRoleBadge(person.role)}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {person.position} • {person.department || 'โรงเรียนบ้านห้วยไคร้'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {onOpenLoginModal && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenLoginModal();
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100/70 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        เปิดหน้าต่างเลือกเข้าสู่ระบบในฐานะ (ป๊อปอัป)
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="เปิดหน้าต่างเลือกเข้าสู่ระบบในฐานะ"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">เลือกบทบาท</span>
            </button>
          )}
        </div>

        {/* Right: Cloud Sync, Security PIN Status & Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync Status & Trigger Button */}
          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="ตั้งค่าและซิงค์ข้อมูล Google Sheets ทันที"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">ซิงค์คลาวด์</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </button>
          )}

          {/* Notification Badge if Pending Approvals */}
          {totalPending > 0 && (
            <button
              onClick={() => onNavigateTab('approvals')}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer animate-pulse-subtle transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>รอการพิจารณา: {totalPending} รายการ</span>
            </button>
          )}

          {/* PIN Lock / Unlock Status Toggle: แสดงเฉพาะ ผู้อำนวยการ, หัวหน้าวิชาการ หรือ ผู้ดูแลระบบ (Admin) เท่านั้น */}
          {isExecutiveOrAdmin && (
            isPinUnlocked ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium hidden sm:inline">โหมดผู้บริหาร (ปลดล็อกแล้ว)</span>
                <span className="font-medium sm:hidden">ปลดล็อกแล้ว</span>
                <button
                  onClick={onLockPin}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-1 underline cursor-pointer"
                  title="ล็อกโหมดผู้บริหาร"
                >
                  ล็อก
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRequestPin('approvals')}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                title="ใส่รหัสผ่านความปลอดภัยสำหรับผู้บริหาร"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>รหัสผู้บริหาร</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
