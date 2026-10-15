import React, { useState } from 'react';
import { 
  Personnel, 
  LeaveRecord, 
  SchoolSettings, 
  LeaveType 
} from '../types/leave';
import { 
  formatThaiDate, 
  getLeaveTypeLabel, 
  getStatusBadgeInfo,
  exportLeaveRecordsToCsv 
} from '../services/storageService';
import { Avatar } from './Avatar';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  FileSpreadsheet,
  Ban,
  AlertTriangle,
  X,
  ShieldCheck
} from 'lucide-react';

interface LeaveHistoryProps {
  currentPersonnel: Personnel;
  allPersonnel: Personnel[];
  leaveRecords: LeaveRecord[];
  settings: SchoolSettings;
  onViewLeaveSlip: (record: LeaveRecord) => void;
  onCancelLeave?: (recordId: string, reason?: string) => void;
}

export const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  currentPersonnel,
  allPersonnel,
  leaveRecords,
  settings,
  onViewLeaveSlip,
  onCancelLeave,
}) => {
  const [selectedPersonnelFilter, setSelectedPersonnelFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancellation States
  const [cancellingRecord, setCancellingRecord] = useState<LeaveRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState<boolean>(false);
  const [quickSearchRef, setQuickSearchRef] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current personnel is authorized to cancel leave records
  const canCancelLeave = 
    currentPersonnel.role === 'director' || 
    currentPersonnel.role === 'academic_head' || 
    currentPersonnel.role === 'admin' ||
    currentPersonnel.id === settings.directorId ||
    currentPersonnel.id === settings.academicHeadId;

  // Filtered records
  const filtered = leaveRecords.filter(r => {
    const matchesPerson = selectedPersonnelFilter === 'all' || r.personnelId === selectedPersonnelFilter;
    const matchesYear = r.fiscalYear === settings.currentFiscalYear;
    const matchesType = selectedTypeFilter === 'all' || r.leaveType === selectedTypeFilter;
    
    const person = allPersonnel.find(p => p.id === r.personnelId);
    const personName = person ? `${person.prefix}${person.firstName} ${person.lastName}` : '';
    const matchesSearch = personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesPerson && matchesYear && matchesType && matchesSearch;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Aggregate statistics for the current filter
  const activeRecords = filtered.filter(r => r.status !== 'cancelled');
  const totalLeavesCount = activeRecords.length;
  const totalLeaveDays = activeRecords.reduce((acc, r) => acc + r.totalDays, 0);
  const approvedLeavesCount = activeRecords.filter(r => r.status === 'approved').length;
  const approvedLeaveDays = activeRecords.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.totalDays, 0);

  const handleConfirmCancel = () => {
    if (!cancellingRecord) return;
    if (onCancelLeave) {
      onCancelLeave(cancellingRecord.id, cancelReason.trim() || 'ยกเลิกตามคำขอ/ดุลยพินิจผู้บริหาร');
    }
    setNotificationMsg({
      type: 'success',
      text: `ยกเลิกใบลาเลขที่ ${cancellingRecord.referenceNumber} สำเร็จแล้ว และคืนสิทธิวันลาเรียบร้อย`
    });
    setCancellingRecord(null);
    setCancelReason('');
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Notification Toast */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' 
            : 'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationMsg.text}</span>
          </div>
          <button 
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title & Stats */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            ประวัติการลาและสถิติสะสม
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            สถิติจำนวนครั้งและจำนวนวันลาในรอบปีงบประมาณ {settings.currentFiscalYear} • โรงเรียนบ้านห้วยไคร้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCancelLeave && (
            <button
              onClick={() => {
                setIsQuickLookupOpen(true);
                setQuickSearchRef('');
              }}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
              title="ค้นหาและยกเลิกใบลาตามเลขที่คำขอ (เฉพาะ ผอ., หัวหน้าวิชาการ, แอดมิน)"
            >
              <Ban className="w-4 h-4 text-rose-600" />
              ยกเลิกใบลาตามเลขที่คำขอ
            </button>
          )}

          <button
            onClick={() => exportLeaveRecordsToCsv(filtered, allPersonnel)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-sm transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ส่งออกข้อมูล Excel / CSV
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">จำนวนครั้งที่ลายื่นทั้งหมด</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeavesCount} <span className="text-xs font-normal text-slate-500">ครั้ง</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">จำนวนวันลาในรอบปีงบประมาณ</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalLeaveDays} <span className="text-xs font-normal text-slate-500">วันทำการ</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">รายการที่อนุมัติแล้ว</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedLeavesCount} <span className="text-xs font-normal text-slate-500">ครั้ง ({approvedLeaveDays} วัน)</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">สถานะที่เลือกกรอง</p>
          <p className="text-sm font-semibold text-slate-700 mt-2 truncate">
            {selectedPersonnelFilter === 'all' 
              ? 'บุคลากรทุกคนในโรงเรียน' 
              : allPersonnel.find(p => p.id === selectedPersonnelFilter)?.firstName}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Personnel Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">เลือกบุคลากร:</label>
            <select
              value={selectedPersonnelFilter}
              onChange={(e) => setSelectedPersonnelFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="all">-- แสดงบุคลากรทุกคน --</option>
              {allPersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prefix}{p.firstName} {p.lastName} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">ประเภทการลา:</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="all">-- ทุกประเภทการลา --</option>
              {settings.quotas.map((q) => (
                <option key={q.leaveType} value={q.leaveType}>{q.title}</option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">ค้นหาคำสำคัญ:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อ, เลขที่, เหตุผล..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">ไม่พบประวัติการลาตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองบุคลากรหรือประเภทการลา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">เลขที่คำขอ</th>
                  <th className="py-3.5 px-4 font-semibold">ผู้ขอลา</th>
                  <th className="py-3.5 px-4 font-semibold">ประเภทการลา</th>
                  <th className="py-3.5 px-4 font-semibold">ช่วงวันที่ลา</th>
                  <th className="py-3.5 px-4 font-semibold text-center">จำนวนวัน</th>
                  <th className="py-3.5 px-4 font-semibold text-center">สถานะ</th>
                  <th className="py-3.5 px-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => {
                  const person = allPersonnel.find(p => p.id === record.personnelId);
                  const statusInfo = getStatusBadgeInfo(record.status);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-blue-900">
                        {record.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar prefix={person?.prefix} gender={person?.gender} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-800">
                              {person ? `${person.prefix}${person.firstName} ${person.lastName}` : record.personnelId}
                            </p>
                            <p className="text-[11px] text-slate-500">{person?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {getLeaveTypeLabel(record.leaveType)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>
                          {formatThaiDate(record.startDate)}
                          {record.startDate !== record.endDate && ` - ${formatThaiDate(record.endDate)}`}
                        </div>
                        {record.isHalfDay && (
                          <span className="text-[10px] text-amber-700 font-medium">
                            ({record.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {record.totalDays}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewLeaveSlip(record)}
                            className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-xl font-medium cursor-pointer transition-colors"
                            title="ดูใบลา"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูใบลา</span>
                          </button>

                          {record.status !== 'cancelled' && canCancelLeave && (
                            <button
                              onClick={() => {
                                setCancellingRecord(record);
                                setCancelReason('');
                              }}
                              className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl font-medium cursor-pointer transition-colors"
                              title={`ยกเลิกใบลาเลขที่ ${record.referenceNumber}`}
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>ยกเลิกใบลา</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Confirm Cancel Specific Leave Record */}
      {cancellingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Ban className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    ยืนยันการยกเลิกใบลา
                  </h3>
                  <p className="text-xs text-slate-500">
                    เลขที่คำขอ: <strong className="text-blue-900">{cancellingRecord.referenceNumber}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCancellingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Leave Details Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              {(() => {
                const applicant = allPersonnel.find(p => p.id === cancellingRecord.personnelId);
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ผู้ขอลา:</span>
                      <strong className="text-slate-800">
                        {applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : cancellingRecord.personnelId}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ตำแหน่ง:</span>
                      <span className="text-slate-700">{applicant?.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ประเภทการลา:</span>
                      <span className="text-slate-800 font-semibold">{getLeaveTypeLabel(cancellingRecord.leaveType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ช่วงวันที่ลา:</span>
                      <span className="text-slate-800">
                        {formatThaiDate(cancellingRecord.startDate)} - {formatThaiDate(cancellingRecord.endDate)} ({cancellingRecord.totalDays} วันทำการ)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">เหตุผลเดิม:</span>
                      <span className="text-slate-700 truncate max-w-[240px]">{cancellingRecord.reason}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Permission Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                ผู้ดำเนินการ: <strong>{currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}</strong> ({currentPersonnel.position})
                <br />
                <span className="text-[11px] text-amber-700">มีสิทธิ์ยกเลิกใบลาในฐานะ: ผู้อำนวยการ / หัวหน้าวิชาการ / ผู้ดูแลระบบ</span>
              </span>
            </div>

            {/* Cancellation Reason Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                ระบุเหตุผลในการยกเลิกใบลา:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="เช่น ผู้ขอลายกเลิกภารกิจ, บันทึกผิดพลาด, เลื่อนวันลา..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancellingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Ban className="w-4 h-4" />
                ยืนยันยกเลิกใบลาฉบับนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Search & Cancel by Request Number */}
      {isQuickLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Search className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    ค้นหาและยกเลิกใบลาตามเลขที่คำขอ
                  </h3>
                  <p className="text-xs text-slate-500">
                    พิมพ์เลขที่คำขอ เช่น ลร.04/2570 เพื่อค้นหาและกดยกเลิก
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuickLookupOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickSearchRef}
                onChange={(e) => setQuickSearchRef(e.target.value)}
                placeholder="พิมพ์เลขที่คำขอ (เช่น ลร.04/2570 หรือ 04)..."
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const results = leaveRecords.filter(r => {
                  if (r.status === 'cancelled') return false;
                  if (!quickSearchRef.trim()) return true;
                  return r.referenceNumber.toLowerCase().includes(quickSearchRef.toLowerCase());
                });

                if (results.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ไม่พบใบลาที่ตรงกับเลขที่ &quot;{quickSearchRef}&quot; หรือใบลาถูกยกเลิกแล้ว
                    </div>
                  );
                }

                return results.map(rec => {
                  const applicant = allPersonnel.find(p => p.id === rec.personnelId);
                  const statusInfo = getStatusBadgeInfo(rec.status);
                  return (
                    <div 
                      key={rec.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-900 font-bold">{rec.referenceNumber}</strong>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-slate-800 font-semibold mt-0.5">
                          {applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : rec.personnelId}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {getLeaveTypeLabel(rec.leaveType)} • {formatThaiDate(rec.startDate)} ({rec.totalDays} วัน)
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsQuickLookupOpen(false);
                          setCancellingRecord(rec);
                          setCancelReason('');
                        }}
                        className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer shadow-xs shrink-0"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        เลือกเพื่อยกเลิก
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsQuickLookupOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
