import React, { useState } from 'react';
import { Personnel, SchoolSettings } from '../types/leave';
import { Avatar } from './Avatar';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  LogIn,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginRoleModalProps {
  isOpen: boolean;
  onClose?: () => void;
  allPersonnel: Personnel[];
  currentPersonnel: Personnel | null;
  onSelectPersonnel: (person: Personnel) => void;
  settings: SchoolSettings;
  canDismiss?: boolean;
}

export const LoginRoleModal: React.FC<LoginRoleModalProps> = ({
  isOpen,
  onClose,
  allPersonnel,
  currentPersonnel,
  onSelectPersonnel,
  settings,
  canDismiss = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Filter personnel
  const filteredPersonnel = allPersonnel.filter(person => {
    const fullName = `${person.prefix}${person.firstName} ${person.lastName}`.toLowerCase();
    const position = (person.position || '').toLowerCase();
    const department = (person.department || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(term) || position.includes(term) || department.includes(term);

    if (selectedRoleFilter === 'all') return matchesSearch;
    if (selectedRoleFilter === 'director') return matchesSearch && person.role === 'director';
    if (selectedRoleFilter === 'academic_head') return matchesSearch && person.role === 'academic_head';
    if (selectedRoleFilter === 'admin') return matchesSearch && person.role === 'admin';
    if (selectedRoleFilter === 'teacher') return matchesSearch && (person.role === 'teacher' || !['director', 'academic_head', 'admin'].includes(person.role));

    return matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'director':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">
            <Award className="w-3 h-3 text-amber-600" />
            ผู้อำนวยการ
          </span>
        );
      case 'academic_head':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-300">
            <BookOpen className="w-3 h-3 text-purple-600" />
            หัวหน้าวิชาการ
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-300">
            <ShieldCheck className="w-3 h-3 text-rose-600" />
            ผู้ดูแลระบบ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-300">
            <Users className="w-3 h-3 text-blue-600" />
            ครู / บุคลากร
          </span>
        );
    }
  };

  // Quick list of key executive roles
  const directorPerson = allPersonnel.find(p => p.role === 'director');
  const academicHeadPerson = allPersonnel.find(p => p.role === 'academic_head');
  const adminPerson = allPersonnel.find(p => p.role === 'admin');

  const handleSelect = (person: Personnel) => {
    onSelectPersonnel(person);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold text-xl shadow-lg border-2 border-amber-300 shrink-0">
                <Building2 className="w-7 h-7 text-blue-950" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    เลือกเข้าสู่ระบบในฐานะ
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-medium">
                      <Sparkles className="w-3 h-3" />
                      ปีงบประมาณ {settings.currentFiscalYear}
                    </span>
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1">
                  {settings.schoolName} | {settings.schoolArea}
                </p>
              </div>
            </div>

            {canDismiss && onClose && (
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="ปิดหน้าต่างนี้"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 text-xs text-blue-100 flex items-center gap-2 border border-white/10">
            <LogIn className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              กรุณากดเลือก <strong>ชื่อและบทบาทของท่าน</strong> ด้านล่างนี้ เพื่อเข้าสู่ระบบและแสดงข้อมูลแดชบอร์ด
            </span>
          </div>
        </div>

        {/* Quick Executive Shortcuts */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-700" />
            บทบาทผู้บริหารและผู้ดูแลระบบ (Executive & Admin Roles)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Director */}
            {directorPerson && (
              <button
                key={directorPerson.id}
                onClick={() => handleSelect(directorPerson)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center gap-3 group shadow-xs ${
                  currentPersonnel?.id === directorPerson.id
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-white hover:bg-amber-50/50 border-amber-200/80 hover:border-amber-400 hover:shadow-sm'
                }`}
              >
                <Avatar 
                  prefix={directorPerson.prefix} 
                  gender={directorPerson.gender} 
                  size="md" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      ผู้อำนวยการ
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm truncate mt-0.5 group-hover:text-blue-900">
                    {directorPerson.prefix}{directorPerson.firstName} {directorPerson.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    อนุมัติใบลา & สรุปรายงานสถิติ
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {/* 2. Academic Head */}
            {academicHeadPerson && (
              <button
                key={academicHeadPerson.id}
                onClick={() => handleSelect(academicHeadPerson)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center gap-3 group shadow-xs ${
                  currentPersonnel?.id === academicHeadPerson.id
                    ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-300'
                    : 'bg-white hover:bg-purple-50/50 border-purple-200/80 hover:border-purple-400 hover:shadow-sm'
                }`}
              >
                <Avatar 
                  prefix={academicHeadPerson.prefix} 
                  gender={academicHeadPerson.gender} 
                  size="md" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                      หัวหน้าวิชาการ
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm truncate mt-0.5 group-hover:text-purple-900">
                    {academicHeadPerson.prefix}{academicHeadPerson.firstName} {academicHeadPerson.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    ตรวจพิจารณา & กลั่นกรองใบลา
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            {/* 3. Admin */}
            {adminPerson && (
              <button
                key={adminPerson.id}
                onClick={() => handleSelect(adminPerson)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center gap-3 group shadow-xs ${
                  currentPersonnel?.id === adminPerson.id
                    ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-300'
                    : 'bg-white hover:bg-rose-50/50 border-rose-200/80 hover:border-rose-400 hover:shadow-sm'
                }`}
              >
                <Avatar 
                  prefix={adminPerson.prefix} 
                  gender={adminPerson.gender} 
                  size="md" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                      ผู้ดูแลระบบ
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm truncate mt-0.5 group-hover:text-rose-900">
                    {adminPerson.prefix}{adminPerson.firstName} {adminPerson.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    จัดการระบบ & โควตาวันลา
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Role Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedRoleFilter === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              บุคลากรทั้งหมด ({allPersonnel.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('teacher')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedRoleFilter === 'teacher'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              คณะครู
            </button>
            <button
              onClick={() => setSelectedRoleFilter('director')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedRoleFilter === 'director'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ผู้อำนวยการ
            </button>
            <button
              onClick={() => setSelectedRoleFilter('academic_head')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedRoleFilter === 'academic_head'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              หัวหน้าวิชาการ
            </button>
            <button
              onClick={() => setSelectedRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedRoleFilter === 'admin'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ผู้ดูแลระบบ
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, ตำแหน่ง, สาระ..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Scrollable List of All Personnel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 space-y-2 bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            รายชื่อข้าราชการครูและบุคลากรทางการศึกษา ({filteredPersonnel.length} ท่าน)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {filteredPersonnel.map((person) => {
              const isSelected = currentPersonnel?.id === person.id;
              return (
                <button
                  key={person.id}
                  onClick={() => handleSelect(person)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-300 shadow-xs'
                      : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar 
                      prefix={person.prefix} 
                      gender={person.gender} 
                      size="md" 
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-900'}`}>
                          {person.prefix}{person.firstName} {person.lastName}
                        </span>
                        {getRoleBadge(person.role)}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {person.position} {person.academicStanding && `(${person.academicStanding})`}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {person.department || 'โรงเรียนบ้านห้วยไคร้'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                        กำลังใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                        เข้าสู่ระบบ
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredPersonnel.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              ไม่พบรายชื่อบุคลากรที่ตรงกับคำค้นหา &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>คลิกที่ชื่อของท่านเพื่อเข้าใช้งานและดูสถิติวันลา</span>
          </div>

          {currentPersonnel && (
            <div className="text-slate-500 text-right">
              ผู้ใช้ที่เลือกไว้: <strong className="text-slate-800">{currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
