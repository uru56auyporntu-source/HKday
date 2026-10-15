import React, { useState } from 'react';
import { 
  Personnel, 
  LeaveRecord, 
  SchoolSettings 
} from '../types/leave';
import { 
  formatThaiDate, 
  formatThaiFullDate, 
  getLeaveTypeLabel, 
  getStatusBadgeInfo,
  createDefaultSignatureSvg 
} from '../services/storageService';
import { Avatar } from './Avatar';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  PenTool, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  UserCheck, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface ApprovalCenterProps {
  currentPersonnel: Personnel;
  allPersonnel: Personnel[];
  leaveRecords: LeaveRecord[];
  settings: SchoolSettings;
  onApproveByAcademicHead: (recordId: string, comment: string, signature: string) => void;
  onApproveByDirector: (recordId: string, isApproved: boolean, comment: string, signature: string) => void;
  onViewLeaveSlip: (record: LeaveRecord) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  currentPersonnel,
  allPersonnel,
  leaveRecords,
  settings,
  onApproveByAcademicHead,
  onApproveByDirector,
  onViewLeaveSlip,
}) => {
  const [activeFilter, setActiveFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected record for approval action modal
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isDirectorApproving, setIsDirectorApproving] = useState<boolean>(true); // true = approve, false = reject

  const isAcademicHead = currentPersonnel.role === 'academic_head' || currentPersonnel.role === 'admin';
  const isDirector = currentPersonnel.role === 'director' || currentPersonnel.role === 'admin';

  // Filter records
  const filteredRecords = leaveRecords.filter(r => {
    const person = allPersonnel.find(p => p.id === r.personnelId);
    const applicantName = person ? `${person.prefix}${person.firstName} ${person.lastName}` : '';
    const matchesSearch = applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'pending') {
      return r.status === 'pending_academic' || r.status === 'pending_director';
    }
    if (activeFilter === 'approved') return r.status === 'approved';
    if (activeFilter === 'rejected') return r.status === 'rejected';
    return true;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const handleOpenActionModal = (record: LeaveRecord) => {
    setSelectedRecord(record);
    if (record.status === 'pending_academic') {
      setActionComment('เห็นควรอนุญาต ได้ตรวจสอบภาระงานและการจัดการเรียนการสอนเรียบร้อยแล้ว');
    } else {
      setActionComment('ทราบและอนุมัติ');
      setIsDirectorApproving(true);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedRecord) return;

    // Use current personnel's signature or fallback
    const signature = currentPersonnel.signatureUrl || 
      createDefaultSignatureSvg(`${currentPersonnel.prefix}${currentPersonnel.firstName} ${currentPersonnel.lastName}`);

    if (selectedRecord.status === 'pending_academic' && isAcademicHead) {
      onApproveByAcademicHead(selectedRecord.id, actionComment.trim(), signature);
    } else if (selectedRecord.status === 'pending_director' && isDirector) {
      onApproveByDirector(selectedRecord.id, isDirectorApproving, actionComment.trim(), signature);
    }

    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400 text-blue-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-950" />
              ศูนย์พิจารณาอนุมัติใบลา (เฉพาะผู้บริหาร)
            </span>
            <span className="text-xs bg-white/10 text-blue-200 px-2.5 py-1 rounded-full border border-white/20">
              ระบบลงลายเซ็นดิจิทัลอัตโนมัติ
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            การอนุมัติคำขอลาแบบเรียลไทม์
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            ผู้ลงนามปัจจุบัน: <strong className="text-white">{currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}</strong> ({currentPersonnel.position})
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-800/60 p-3 rounded-2xl border border-blue-700/60 text-xs text-blue-100">
          <div>
            <p className="font-semibold text-white">ขั้นตอนการอนุมัติ:</p>
            <p>1. หัวหน้าวิชาการตรวจความเห็น → 2. ผอ. สั่งการอนุมัติ</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้ลา, เลขที่ใบลา, เหตุผล..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'pending', label: 'รอพิจารณา / อนุมัติ', count: leaveRecords.filter(r => r.status.startsWith('pending')).length },
            { id: 'all', label: 'ทั้งหมด', count: leaveRecords.length },
            { id: 'approved', label: 'อนุมัติแล้ว', count: leaveRecords.filter(r => r.status === 'approved').length },
            { id: 'rejected', label: 'ไม่อนุมัติ', count: leaveRecords.filter(r => r.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-blue-900 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === tab.id ? 'bg-amber-400 text-blue-950 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Leave Approval Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-dashed border-slate-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">ไม่มีรายการคำขอลาในหมวดนี้</p>
            <p className="text-xs text-slate-400 mt-1">
              คำขอลาทั้งหมดได้รับการพิจารณาเรียบร้อยแล้ว หรือไม่มีข้อมูลที่ตรงกับการค้นหา
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const applicant = allPersonnel.find(p => p.id === record.personnelId);
            const substitute = allPersonnel.find(p => p.id === record.substitutePersonnelId);
            const statusInfo = getStatusBadgeInfo(record.status);
            
            // Check if current personnel can take action on this record
            const canAcademicAction = record.status === 'pending_academic' && isAcademicHead;
            const canDirectorAction = record.status === 'pending_director' && isDirector;
            const canAction = canAcademicAction || canDirectorAction;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-xs ${
                  canAction ? 'border-amber-300 ring-2 ring-amber-100/50' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <Avatar prefix={applicant?.prefix} gender={applicant?.gender} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-800">
                          {applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : record.personnelId}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({applicant?.position} {applicant?.academicStanding})
                        </span>
                        <span className="text-xs bg-slate-100 text-blue-900 font-semibold px-2.5 py-0.5 rounded-md">
                          {record.referenceNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ยื่นเมื่อ: {formatThaiDate(record.submittedAt, true)} • สังกัด: {applicant?.department || 'โรงเรียนบ้านห้วยไคร้'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-auto">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold border ${statusInfo.bg}`}>
                      {record.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {record.status.startsWith('pending') && <Clock className="w-3.5 h-3.5" />}
                      {record.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs sm:text-sm">
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">ประเภทและช่วงวันที่ลา:</span>
                    <p className="font-bold text-blue-900 text-sm sm:text-base">
                      {getLeaveTypeLabel(record.leaveType)}
                    </p>
                    <p className="text-slate-700">
                      {formatThaiDate(record.startDate)}
                      {record.startDate !== record.endDate && ` ถึง ${formatThaiDate(record.endDate)}`}
                    </p>
                    <p className="font-semibold text-emerald-700">
                      รวมทั้งสิ้น {record.totalDays} วันทำการ
                      {record.isHalfDay && ` (${record.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'})`}
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">เหตุผลความจำเป็นในการลา:</span>
                    <p className="text-slate-800 font-medium italic">
                      &quot;{record.reason}&quot;
                    </p>
                    <p className="text-slate-500 pt-1">
                      เบอร์โทรศัพท์: {record.contactPhone || '-'}
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">สถานที่ติดต่อและเอกสารแนบ:</span>
                    <p className="text-slate-800 text-xs">
                      {record.contactAddress || applicant?.address || '-'}
                    </p>
                    {record.attachmentName ? (
                      <p className="text-blue-700 font-medium flex items-center gap-1 pt-1 text-xs">
                        <FileText className="w-3 h-3" /> มีไฟล์แนบ: {record.attachmentName}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-xs pt-1">- ไม่มีเอกสารแนบ -</p>
                    )}
                  </div>
                </div>

                {/* Approval Chain Progress & Signatures */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Step 1: Teacher Submission */}
                  <div className="border-r-0 md:border-r border-slate-200 pr-0 md:pr-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. ผู้ขอยื่นใบลา</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {formatThaiDate(record.submittedAt, true)}
                    </p>
                    <div className="mt-1 h-12 flex items-center">
                      {record.applicantSignature && (
                        <img src={record.applicantSignature} alt="Applicant Sign" className="max-h-10 object-contain" />
                      )}
                    </div>
                  </div>

                  {/* Step 2: Academic Head */}
                  <div className="border-r-0 md:border-r border-slate-200 pr-0 md:pr-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                      {record.academicHeadSignature ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>2. หัวหน้าฝ่ายวิชาการ</span>
                    </div>
                    {record.academicHeadComment ? (
                      <div>
                        <p className="text-xs text-slate-700 italic">
                          &quot;{record.academicHeadComment}&quot;
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {record.academicHeadActionDate ? formatThaiDate(record.academicHeadActionDate, true) : ''}
                        </p>
                        <div className="mt-1 h-12 flex items-center">
                          {record.academicHeadSignature && (
                            <img src={record.academicHeadSignature} alt="Academic Head Sign" className="max-h-10 object-contain" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium py-2">
                        รอตรวจสอบและลงความเห็น
                      </p>
                    )}
                  </div>

                  {/* Step 3: Director */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                      {record.directorSignature ? (
                        record.status === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>3. ผู้อำนวยการโรงเรียน</span>
                    </div>
                    {record.directorComment ? (
                      <div>
                        <p className={`text-xs font-semibold ${record.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          คำสั่ง: {record.directorComment}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {record.directorActionDate ? formatThaiDate(record.directorActionDate, true) : ''}
                        </p>
                        <div className="mt-1 h-12 flex items-center">
                          {record.directorSignature && (
                            <img src={record.directorSignature} alt="Director Sign" className="max-h-10 object-contain" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-2">
                        รอคำสั่งผู้อำนวยการโรงเรียน
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => onViewLeaveSlip(record)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-700" />
                    ดูแบบใบลาทางการ
                  </button>

                  <div className="flex items-center gap-2">
                    {canAcademicAction && (
                      <button
                        onClick={() => handleOpenActionModal(record)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-300" />
                        ลงความเห็นหัวหน้าวิชาการ (พร้อมลายเซ็น)
                      </button>
                    )}

                    {canDirectorAction && (
                      <button
                        onClick={() => handleOpenActionModal(record)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-emerald-800 hover:from-blue-800 hover:to-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        พิจารณาคำสั่ง ผอ. (อนุมัติพร้อมลายเซ็น)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Approval Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedRecord.status === 'pending_academic' 
                    ? 'บันทึกความเห็นชอบของหัวหน้าฝ่ายวิชาการ' 
                    : 'คำสั่งการอนุมัติของผู้อำนวยการโรงเรียน'}
                </h3>
                <p className="text-xs text-slate-500">
                  ใบลาเลขที่ {selectedRecord.referenceNumber} • ระบบจะประทับลายมือชื่อดิจิทัลอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Applicant summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้ขอลา:</span>
                  <span className="font-bold text-slate-800">
                    {allPersonnel.find(p => p.id === selectedRecord.personnelId)?.prefix}
                    {allPersonnel.find(p => p.id === selectedRecord.personnelId)?.firstName} {' '}
                    {allPersonnel.find(p => p.id === selectedRecord.personnelId)?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ประเภท / วันที่:</span>
                  <span className="font-semibold text-blue-900">
                    {getLeaveTypeLabel(selectedRecord.leaveType)} ({selectedRecord.totalDays} วันทำการ)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เหตุผล:</span>
                  <span className="text-slate-700 italic max-w-xs truncate">&quot;{selectedRecord.reason}&quot;</span>
                </div>
              </div>

              {/* Director Decision radio buttons */}
              {selectedRecord.status === 'pending_director' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    คำสั่งผู้อำนวยการ
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirectorApproving(true);
                        setActionComment('ทราบและอนุมัติ');
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDirectorApproving
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      อนุมัติการลา
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirectorApproving(false);
                        setActionComment('ไม่อนุมัติ เนื่องจากมีภารกิจราชการจำเป็นเร่งด่วน');
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        !isDirectorApproving
                          ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      ไม่อนุมัติ
                    </button>
                  </div>
                </div>
              )}

              {/* Comment text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {selectedRecord.status === 'pending_academic' ? 'บันทึกความเห็น / การมอบหมายงานสอนแทน' : 'ข้อความคำสั่ง / บันทึกเพิ่มเติม'}
                </label>
                <textarea
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              {/* Digital signature preview stamp */}
              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900">
                    ลายมือชื่อผู้ลงนามอัตโนมัติ:
                  </p>
                  <p className="text-xs text-slate-600">
                    {currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName} ({currentPersonnel.position})
                  </p>
                </div>
                <div className="bg-white px-3 py-1 rounded-xl border border-blue-100 flex items-center justify-center h-12 min-w-[140px]">
                  {currentPersonnel.signatureUrl ? (
                    <img src={currentPersonnel.signatureUrl} alt="Signature Preview" className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-xs text-blue-800 font-medium">ลงนามระบบ</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  ยืนยันและลงลายเซ็นทันที
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
