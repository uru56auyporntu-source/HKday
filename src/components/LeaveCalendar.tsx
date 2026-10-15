import React, { useState, useMemo } from 'react';
import { 
  Personnel, 
  LeaveRecord, 
  ThaiHoliday,
  SchoolSettings 
} from '../types/leave';
import { 
  formatThaiDate, 
  getLeaveTypeLabel, 
  getStatusBadgeInfo 
} from '../services/storageService';
import { THAI_HOLIDAYS_2568 } from '../data/initialData';
import { Avatar } from './Avatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Flag, 
  User, 
  Clock, 
  Info,
  X,
  Lock
} from 'lucide-react';

interface LeaveCalendarProps {
  leaveRecords: LeaveRecord[];
  allPersonnel: Personnel[];
  settings?: SchoolSettings;
  onViewLeaveSlip: (record: LeaveRecord) => void;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  leaveRecords,
  allPersonnel,
  settings,
  onViewLeaveSlip,
}) => {
  const fiscalYear = settings?.currentFiscalYear || 2568;

  // 12 specific months of this configured fiscal year (1 ต.ค. - 30 ก.ย.)
  const fiscalMonths = useMemo(() => [
    { index: 0, month: 9, year: fiscalYear - 544, name: 'ตุลาคม', shortName: 'ต.ค.', beYear: fiscalYear - 1 },
    { index: 1, month: 10, year: fiscalYear - 544, name: 'พฤศจิกายน', shortName: 'พ.ย.', beYear: fiscalYear - 1 },
    { index: 2, month: 11, year: fiscalYear - 544, name: 'ธันวาคม', shortName: 'ธ.ค.', beYear: fiscalYear - 1 },
    { index: 3, month: 0, year: fiscalYear - 543, name: 'มกราคม', shortName: 'ม.ค.', beYear: fiscalYear },
    { index: 4, month: 1, year: fiscalYear - 543, name: 'กุมภาพันธ์', shortName: 'ก.พ.', beYear: fiscalYear },
    { index: 5, month: 2, year: fiscalYear - 543, name: 'มีนาคม', shortName: 'มี.ค.', beYear: fiscalYear },
    { index: 6, month: 3, year: fiscalYear - 543, name: 'เมษายน', shortName: 'เม.ย.', beYear: fiscalYear },
    { index: 7, month: 4, year: fiscalYear - 543, name: 'พฤษภาคม', shortName: 'พ.ค.', beYear: fiscalYear },
    { index: 8, month: 5, year: fiscalYear - 543, name: 'มิถุนายน', shortName: 'มิ.ย.', beYear: fiscalYear },
    { index: 9, month: 6, year: fiscalYear - 543, name: 'กรกฎาคม', shortName: 'ก.ค.', beYear: fiscalYear },
    { index: 10, month: 7, year: fiscalYear - 543, name: 'สิงหาคม', shortName: 'ส.ค.', beYear: fiscalYear },
    { index: 11, month: 8, year: fiscalYear - 543, name: 'กันยายน', shortName: 'ก.ย.', beYear: fiscalYear },
  ], [fiscalYear]);

  // Determine initial month index within fiscal year
  const [fiscalMonthIndex, setFiscalMonthIndex] = useState<number>(() => {
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const found = fiscalMonths.findIndex(m => m.year === tYear && m.month === tMonth);
    return found !== -1 ? found : 0; // Default to October of fiscal year
  });

  const activeMonthInfo = fiscalMonths[fiscalMonthIndex];
  const currentYear = activeMonthInfo.year;
  const currentMonth = activeMonthInfo.month;

  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    holiday?: ThaiHoliday;
    leaves: LeaveRecord[];
  } | null>(null);

  const handlePrevMonth = () => {
    if (fiscalMonthIndex > 0) {
      setFiscalMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (fiscalMonthIndex < fiscalMonths.length - 1) {
      setFiscalMonthIndex(prev => prev + 1);
    }
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  // blanks for padding before day 1
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const holidayMap = new Map<string, ThaiHoliday>();
  THAI_HOLIDAYS_2568.forEach(h => holidayMap.set(h.date, h));

  // Only display leave records belonging strictly to the configured fiscal year
  const fiscalLeaveRecords = useMemo(() => {
    return leaveRecords.filter(r => r.fiscalYear === fiscalYear);
  }, [leaveRecords, fiscalYear]);

  const getEventsForDate = (dateStr: string) => {
    const holiday = holidayMap.get(dateStr);
    const leaves = fiscalLeaveRecords.filter(r => {
      return (r.status === 'approved' || r.status === 'pending_director' || r.status === 'pending_academic') &&
             dateStr >= r.startDate && dateStr <= r.endDate;
    });
    return { holiday, leaves };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header with Fiscal Year Lock */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-900" />
              ปฏิทินวันลาและวันหยุดราชการ
            </h2>
            <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-700" />
              ปีงบประมาณ {fiscalYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            แสดงเฉพาะข้อมูลในรอบปีงบประมาณ {fiscalYear} (1 ต.ค. {fiscalYear - 1} – 30 ก.ย. {fiscalYear}) • {settings?.schoolName || 'โรงเรียนบ้านห้วยไคร้'}
          </p>
        </div>

        {/* Month Navigator bounded to the 12 fiscal months */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={handlePrevMonth}
            disabled={fiscalMonthIndex === 0}
            className={`p-1.5 rounded-xl transition-colors ${
              fiscalMonthIndex === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'hover:bg-white text-slate-700 cursor-pointer shadow-xs'
            }`}
            title="เดือนก่อนหน้าในรอบปีงบประมาณ"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-800 px-3 min-w-[170px] text-center">
            {activeMonthInfo.name} {activeMonthInfo.beYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={fiscalMonthIndex === fiscalMonths.length - 1}
            className={`p-1.5 rounded-xl transition-colors ${
              fiscalMonthIndex === fiscalMonths.length - 1 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'hover:bg-white text-slate-700 cursor-pointer shadow-xs'
            }`}
            title="เดือนถัดไปในรอบปีงบประมาณ"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 12-Month Quick Selector Bar for Configured Fiscal Year */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-xs font-semibold text-slate-500 px-2 shrink-0">
            เลือกเดือน (12 เดือนของปีงบฯ {fiscalYear}):
          </span>
          {fiscalMonths.map((m) => {
            const isSelected = m.index === fiscalMonthIndex;
            return (
              <button
                key={m.index}
                onClick={() => setFiscalMonthIndex(m.index)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                {m.shortName} {String(m.beYear).slice(-2)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-hidden">
        {/* Day of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs pb-3 border-b border-slate-200">
          <span className="text-rose-600">อา. (Sun)</span>
          <span className="text-slate-700">จ. (Mon)</span>
          <span className="text-slate-700">อ. (Tue)</span>
          <span className="text-slate-700">พ. (Wed)</span>
          <span className="text-slate-700">พฤ. (Thu)</span>
          <span className="text-slate-700">ศ. (Fri)</span>
          <span className="text-purple-600">ส. (Sat)</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {calendarDays.map((dayNum, index) => {
            if (dayNum === null) {
              return <div key={`empty-${index}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/50 rounded-xl" />;
            }

            const mm = String(currentMonth + 1).padStart(2, '0');
            const dd = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${mm}-${dd}`;
            const { holiday, leaves } = getEventsForDate(dateStr);
            const dayOfWeek = (index % 7);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <div
                key={dateStr}
                onClick={() => (holiday || leaves.length > 0) && setSelectedDayEvents({ dateStr, holiday, leaves })}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  holiday
                    ? 'bg-rose-50/70 border-rose-200'
                    : isWeekend
                      ? 'bg-slate-50 border-slate-100'
                      : 'bg-white border-slate-200 hover:border-blue-400'
                } ${holiday || leaves.length > 0 ? 'cursor-pointer hover:shadow-xs' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    holiday || dayOfWeek === 0
                      ? 'text-rose-600'
                      : dayOfWeek === 6
                        ? 'text-purple-600'
                        : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>

                  {holiday && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title={holiday.name} />
                  )}
                </div>

                <div className="space-y-1 overflow-hidden my-1">
                  {holiday && (
                    <div className="bg-rose-100/80 text-rose-800 text-[10px] font-semibold p-1 rounded-md line-clamp-2 leading-tight">
                      {holiday.name}
                    </div>
                  )}

                  {leaves.slice(0, 2).map((l) => {
                    const person = allPersonnel.find(p => p.id === l.personnelId);
                    return (
                      <div
                        key={l.id}
                        className={`text-[10px] p-1 rounded-md font-medium truncate leading-tight ${
                          l.status === 'approved' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-amber-100 text-amber-900'
                        }`}
                        title={`${person?.firstName}: ${getLeaveTypeLabel(l.leaveType)}`}
                      >
                        {person?.firstName || 'ครู'}: {getLeaveTypeLabel(l.leaveType)}
                      </div>
                    );
                  })}

                  {leaves.length > 2 && (
                    <span className="text-[10px] text-slate-500 font-semibold block text-center">
                      +{leaves.length - 2} รายการ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setSelectedDayEvents(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-900 rounded-2xl flex items-center justify-center font-bold">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  เหตุการณ์วันที่ {formatThaiDate(selectedDayEvents.dateStr)}
                </h3>
                <p className="text-xs text-slate-500">
                  โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Holiday info if any */}
              {selectedDayEvents.holiday && (
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <Flag className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{selectedDayEvents.holiday.name}</p>
                    <p className="text-rose-700 mt-0.5">วันหยุดราชการประจำปีของสถานศึกษา</p>
                  </div>
                </div>
              )}

              {/* Leaves on this day */}
              {selectedDayEvents.leaves.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  ไม่มีบุคลากรลาในวันนี้
                </p>
              ) : (
                selectedDayEvents.leaves.map((l) => {
                  const applicant = allPersonnel.find(p => p.id === l.personnelId);
                  const subTeacher = allPersonnel.find(p => p.id === l.substitutePersonnelId);
                  const statusInfo = getStatusBadgeInfo(l.status);

                  return (
                    <div key={l.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar prefix={applicant?.prefix} gender={applicant?.gender} size="sm" />
                          <div>
                            <p className="font-bold text-sm text-slate-800">
                              {applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : l.personnelId}
                            </p>
                            <p className="text-slate-500">{applicant?.position}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600">
                        <p><strong>ประเภท:</strong> {getLeaveTypeLabel(l.leaveType)} ({l.totalDays} วัน)</p>
                        <p><strong>เหตุผล:</strong> {l.reason}</p>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedDayEvents(null);
                            onViewLeaveSlip(l);
                          }}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer underline"
                        >
                          เปิดดูแบบใบลาฉบับเต็ม
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
