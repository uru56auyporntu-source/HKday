import React, { useState } from 'react';
import { 
  Personnel, 
  LeaveRecord, 
  SchoolSettings 
} from '../types/leave';
import { 
  getPersonnelLeaveBalances, 
  formatThaiDate, 
  getLeaveTypeLabel, 
  getStatusBadgeInfo 
} from '../services/storageService';
import { REGULATIONS_SUMMARY } from '../data/initialData';
import { Avatar } from './Avatar';
import { 
  FilePlus, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown, 
  Phone, 
  MapPin, 
  Briefcase, 
  Award,
  FileText,
  Eye
} from 'lucide-react';

interface DashboardProps {
  currentPersonnel: Personnel;
  allPersonnel: Personnel[];
  settings: SchoolSettings;
  leaveRecords: LeaveRecord[];
  onNavigateToApply: () => void;
  onNavigateToHistory: () => void;
  onViewLeaveSlip: (record: LeaveRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentPersonnel,
  allPersonnel,
  settings,
  leaveRecords,
  onNavigateToApply,
  onNavigateToHistory,
  onViewLeaveSlip
}) => {
  const [openRegulationIndex, setOpenRegulationIndex] = useState<number | null>(0);

  // Compute leave balances for current logged-in personnel
  const balances = getPersonnelLeaveBalances(
    currentPersonnel.id,
    settings.currentFiscalYear,
    leaveRecords,
    settings
  );

  // Get current personnel's leave records
  const myRecords = leaveRecords
    .filter(r => r.personnelId === currentPersonnel.id && r.fiscalYear === settings.currentFiscalYear)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const totalUsedDays = myRecords
    .filter(r => r.status === 'approved' || r.status === 'pending_director' || r.status === 'pending_academic')
    .reduce((sum, r) => sum + r.totalDays, 0);

  const totalUsedTimes = myRecords
    .filter(r => r.status === 'approved' || r.status === 'pending_director' || r.status === 'pending_academic')
    .length;

  const sickBalance = balances.find(b => b.leaveType === 'sick');
  const personalBalance = balances.find(b => b.leaveType === 'personal');
  const approvedCount = myRecords.filter(r => r.status === 'approved').length;
  const pendingApprovalsCount = myRecords.filter(r => r.status === 'pending_academic' || r.status === 'pending_director').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Personnel Welcome & Profile Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <Avatar 
              prefix={currentPersonnel.prefix} 
              gender={currentPersonnel.gender} 
              size="xl" 
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-amber-400 text-blue-950 font-bold px-2.5 py-0.5 rounded-full">
                  ข้อมูลผู้ใช้งานที่เข้าระบบ
                </span>
                <span className="text-xs bg-blue-800/80 text-blue-200 border border-blue-600/50 px-2.5 py-0.5 rounded-full">
                  ปีงบประมาณ {settings.currentFiscalYear}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-blue-200 mt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                  {currentPersonnel.position}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  วิทยฐานะ: {currentPersonnel.academicStanding}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  {currentPersonnel.phone}
                </span>
              </div>
              <p className="text-xs text-blue-300/80 mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                <span className="truncate max-w-md">{currentPersonnel.address}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={onNavigateToApply}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-blue-950 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0"
            >
              <FilePlus className="w-4 h-4" />
              ยื่นบันทึกขอลาออนไลน์
            </button>
            <button
              onClick={onNavigateToHistory}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer shrink-0"
            >
              <Clock className="w-4 h-4" />
              ดูประวัติการลา
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leaves Taken */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>วันลาสะสมที่ใช้ไป</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalUsedDays}</span>
            <span className="text-xs text-slate-500">วัน ({totalUsedTimes} ครั้ง)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {pendingApprovalsCount > 0 ? (
              <span className="text-amber-600 font-medium">รออนุมัติ {pendingApprovalsCount} รายการ</span>
            ) : (
              <span className="text-emerald-600 font-medium">ทุกรายการได้รับการบันทึกแล้ว</span>
            )}
          </div>
        </div>

        {/* Sick Leave Quota */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>สิทธิลาป่วยคงเหลือ</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">
              {sickBalance ? sickBalance.remainingDays : 0}
            </span>
            <span className="text-xs text-slate-500">
              / {sickBalance ? sickBalance.maxDays : 60} วัน
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            ใช้ไปแล้ว {sickBalance ? sickBalance.usedDays : 0} วัน ({sickBalance ? sickBalance.usedTimes : 0} ครั้ง)
          </div>
        </div>

        {/* Personal Leave Quota */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>สิทธิลากิจส่วนตัวคงเหลือ</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600">
              {personalBalance ? personalBalance.remainingDays : 0}
            </span>
            <span className="text-xs text-slate-500">
              / {personalBalance ? personalBalance.maxDays : 45} วัน
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            ใช้ไปแล้ว {personalBalance ? personalBalance.usedDays : 0} วัน ({personalBalance ? personalBalance.usedTimes : 0} ครั้ง)
          </div>
        </div>

        {/* Approved Leave Count */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>รายการที่อนุมัติแล้ว</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {pendingApprovalsCount > 0 ? (
              <span className="text-amber-600 font-medium">อยู่ระหว่างรอพิจารณา {pendingApprovalsCount} รายการ</span>
            ) : (
              <span className="text-emerald-600 font-medium">ไม่มีรายการค้างพิจารณา</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Leave Quota Breakdown with Progress Bars */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              สิทธิวันลาคงเหลือของ {currentPersonnel.prefix}{currentPersonnel.firstName}
            </h3>
            <p className="text-xs text-slate-500">
              คำนวณตามระเบียบข้าราชการและโควต้าปีงบประมาณ {settings.currentFiscalYear}
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
            ทั้งหมด {balances.length} ประเภท
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((item) => {
            const percentUsed = Math.min(100, Math.round((item.usedDays / (item.maxDays || 1)) * 100));
            const isNearLimit = percentUsed >= 80;

            return (
              <div 
                key={item.leaveType}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 text-sm">{item.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isNearLimit ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    เหลือ {item.remainingDays} วัน
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      isNearLimit ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>ใช้ไป: <strong className="text-slate-700">{item.usedDays} วัน</strong> ({item.usedTimes} ครั้ง)</span>
                  <span>สิทธิรวม: {item.maxDays} วัน</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Leave Requests by Current User */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              ประวัติการยื่นคำขอลาล่าสุดของท่าน
            </h3>
            <p className="text-xs text-slate-500">
              สถานะการเสนอความเห็นและคำสั่งอนุมัติแบบเรียลไทม์
            </p>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {myRecords.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">ยังไม่มีประวัติการยื่นคำขอลาในปีงบประมาณนี้</p>
            <p className="text-xs text-slate-400 mt-1">ท่านสามารถคลิกปุ่ม &quot;ยื่นบันทึกขอลาออนไลน์&quot; เพื่อสร้างคำขอแรก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">เลขที่ใบลา</th>
                  <th className="pb-3 font-semibold">ประเภทการลา</th>
                  <th className="pb-3 font-semibold">ช่วงวันที่ลา</th>
                  <th className="pb-3 font-semibold text-center">จำนวนวัน</th>
                  <th className="pb-3 font-semibold text-center">สถานะ</th>
                  <th className="pb-3 font-semibold text-right">ใบลาทางการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRecords.slice(0, 5).map((record) => {
                  const statusInfo = getStatusBadgeInfo(record.status);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-medium text-blue-900">
                        {record.referenceNumber}
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {getLeaveTypeLabel(record.leaveType)}
                      </td>
                      <td className="py-3 text-slate-600">
                        {formatThaiDate(record.startDate)}
                        {record.startDate !== record.endDate && ` - ${formatThaiDate(record.endDate)}`}
                        {record.isHalfDay && (
                          <span className="text-[11px] text-amber-600 ml-1">
                            ({record.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'})
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">
                        {record.totalDays}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusInfo.bg}`}>
                          {record.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {record.status.startsWith('pending') && <Clock className="w-3 h-3 text-amber-600" />}
                          {record.status === 'rejected' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onViewLeaveSlip(record)}
                          className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors"
                          title="ดูแบบใบลาทางการและพิมพ์เอกสาร"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          ดูใบลา
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Official Regulations: ระเบียบการลาข้าราชการครู พ.ศ. 2555 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              ระเบียบการลาข้าราชการครูและบุคลากรทางการศึกษา พ.ศ. 2555
            </h3>
            <p className="text-xs text-slate-500">
              อ้างอิงตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555 และระเบียบ ก.ค.ศ.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {REGULATIONS_SUMMARY.map((reg, index) => {
            const isOpen = openRegulationIndex === index;
            return (
              <div key={index} className="bg-white">
                <button
                  type="button"
                  onClick={() => setOpenRegulationIndex(isOpen ? null : index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm text-slate-800">
                    {reg.category}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100">
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc list-inside leading-relaxed">
                      {reg.rules.map((rule, rIdx) => (
                        <li key={rIdx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
