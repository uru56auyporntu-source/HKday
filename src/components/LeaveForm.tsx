import React, { useState, useEffect, useRef } from 'react';
import { 
  Personnel, 
  LeaveType, 
  LeaveRecord, 
  SchoolSettings 
} from '../types/leave';
import { 
  calculateWorkingDays, 
  formatThaiDate, 
  getPersonnelLeaveBalances 
} from '../services/storageService';
import { Avatar } from './Avatar';
import { 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  AlertCircle, 
  PenTool, 
  RotateCcw, 
  Send, 
  CheckCircle2, 
  Info,
  Check,
  MessageCircle
} from 'lucide-react';

interface LeaveFormProps {
  currentPersonnel: Personnel;
  allPersonnel: Personnel[];
  settings: SchoolSettings;
  leaveRecords: LeaveRecord[];
  onSubmitSuccess: (newRecord: LeaveRecord) => void;
  onViewLeaveSlip: (record: LeaveRecord) => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({
  currentPersonnel,
  settings,
  leaveRecords,
  onSubmitSuccess,
  onViewLeaveSlip,
}) => {
  // Form fields
  const [leaveType, setLeaveType] = useState<LeaveType>('sick');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');
  const [contactAddress, setContactAddress] = useState(currentPersonnel.address || '');
  const [contactPhone, setContactPhone] = useState(currentPersonnel.phone || '');

  const [signatureMode, setSignatureMode] = useState<'default' | 'canvas'>('default');
  const [customSignatureData, setCustomSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<LeaveRecord | null>(null);

  // Sync address & phone when personnel switches
  useEffect(() => {
    setContactAddress(currentPersonnel.address || '');
    setContactPhone(currentPersonnel.phone || '');
  }, [currentPersonnel]);

  // Calculate working days
  const baseWorkingDays = calculateWorkingDays(startDate, endDate);
  const totalDays = isHalfDay ? 0.5 : baseWorkingDays;

  // Check balance for selected leave type
  const balances = getPersonnelLeaveBalances(
    currentPersonnel.id,
    settings.currentFiscalYear,
    leaveRecords,
    settings
  );
  const currentQuota = balances.find(b => b.leaveType === leaveType);
  const isOverQuota = currentQuota ? (totalDays > currentQuota.remainingDays) : false;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d4ed8'; // Navy blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setCustomSignatureData(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCustomSignatureData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert('กรุณากรอกเหตุผลการลา');
      return;
    }

    if (totalDays <= 0) {
      alert('จำนวนวันลาไม่ถูกต้อง กรุณาเลือกช่วงวันที่ที่ตรงกับวันทำการ');
      return;
    }

    // Determine signature to use
    let finalSignature = currentPersonnel.signatureUrl || '';
    if (signatureMode === 'canvas') {
      if (!customSignatureData) {
        alert('กรุณาเซ็นลายมือชื่อในช่องวาดลายเซ็น หรือเลือกใช้ภาพลายเซ็นประจำตัว');
        return;
      }
      finalSignature = customSignatureData;
    }

    if (!finalSignature) {
      alert('ไม่พบลายเซ็นประจำตัว กรุณาวาดลายเซ็นสดหรือใส่ภาพลายเซ็นในข้อมูลบุคลากร');
      return;
    }

    // Auto-generate reference number like ลร. 05/2568
    const countThisYear = leaveRecords.filter(r => r.fiscalYear === settings.currentFiscalYear).length + 1;
    const refNumber = `ลร.${String(countThisYear).padStart(2, '0')}/${settings.currentFiscalYear}`;

    const newRecord: LeaveRecord = {
      id: 'leave-' + Date.now(),
      referenceNumber: refNumber,
      personnelId: currentPersonnel.id,
      leaveType,
      fiscalYear: settings.currentFiscalYear,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      totalDays,
      reason: reason.trim(),
      contactAddress: contactAddress.trim(),
      contactPhone: contactPhone.trim(),
      submittedAt: new Date().toISOString(),
      applicantSignature: finalSignature,
      status: 'pending_academic' // First stage: Academic head review
    };

    onSubmitSuccess(newRecord);
    setSubmittedRecord(newRecord);
  };

  // If already submitted in this view, show receipt confirmation
  if (submittedRecord) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
            ยื่นคำขอลาออนไลน์สำเร็จ
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            บันทึกคำขอลา {submittedRecord.referenceNumber}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ระบบได้ส่งต่อไปยังหัวหน้าฝ่ายบริหารงานวิชาการและผู้อำนวยการเพื่อพิจารณาความเห็นแบบเรียลไทม์
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">ผู้ขอลา:</span>
            <span className="font-semibold text-slate-800">{currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ประเภทการลา:</span>
            <span className="font-semibold text-blue-900">{currentQuota?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ช่วงวันที่ลา:</span>
            <span className="font-semibold text-slate-800">
              {formatThaiDate(submittedRecord.startDate)}
              {submittedRecord.startDate !== submittedRecord.endDate && ` ถึง ${formatThaiDate(submittedRecord.endDate)}`}
              {` (${submittedRecord.totalDays} วันทำการ)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">สถานะปัจจุบัน:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              รอความเห็นหัวหน้าวิชาการ
            </span>
          </div>

          {settings.isLineNotifyEnabled && settings.lineGroupId && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                แจ้งเตือนกลุ่ม LINE:
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                ส่งเข้ากลุ่มโรงเรียนแล้ว
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            onClick={() => onViewLeaveSlip(submittedRecord)}
            className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            พิมพ์แบบใบลาทางการ
          </button>
          <button
            onClick={() => {
              setSubmittedRecord(null);
              setReason('');
            }}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-semibold text-sm transition-colors cursor-pointer"
          >
            ยื่นคำขอลาใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              แบบฟอร์มยื่นคำขอลาออนไลน์
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              โรงเรียนบ้านห้วยไคร้ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Applicant Info Banner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Cute Cartoon Avatar */}
              <Avatar prefix={currentPersonnel.prefix} gender={currentPersonnel.gender} size="md" />
              <div>
                <p className="font-semibold text-sm text-slate-800">
                  {currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {currentPersonnel.position} • {currentPersonnel.academicStanding}
                </p>
              </div>
            </div>

            {currentQuota && (
              <div className="text-right text-xs">
                <span className="text-slate-500">โควต้า {currentQuota.title}: </span>
                <span className={`font-bold ${isOverQuota ? 'text-rose-600' : 'text-emerald-700'}`}>
                  คงเหลือ {currentQuota.remainingDays} วัน
                </span>
                <span className="text-slate-400"> (ใช้แล้ว {currentQuota.usedDays}/{currentQuota.maxDays} วัน)</span>
              </div>
            )}
          </div>

          {/* 1. Leave Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. เลือกประเภทการลา <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {settings.quotas.map((q) => {
                const isSelected = leaveType === q.leaveType;
                return (
                  <button
                    key={q.leaveType}
                    type="button"
                    onClick={() => setLeaveType(q.leaveType)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {q.title}
                    </p>
                    <p className={`text-[11px] mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                      สิทธิรวม: {q.maxDays} วัน
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Leave Dates & Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ตั้งแต่วันที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ถึงวันที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isHalfDay}
                value={isHalfDay ? startDate : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden disabled:opacity-50"
              />
            </div>

            {/* Calculated Working Days Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                จำนวนวันทำการที่ลา
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-blue-900 font-medium">คำนวณวันทำการ:</span>
                <span className="text-base font-extrabold text-blue-900">
                  {totalDays} <span className="text-xs font-normal">วันทำการ</span>
                </span>
              </div>
            </div>
          </div>

          {/* Half day toggle */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>ลาครึ่งวัน (0.5 วันทำการ)</span>
            </label>

            {isHalfDay && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDayPeriod"
                    value="morning"
                    checked={halfDayPeriod === 'morning'}
                    onChange={() => setHalfDayPeriod('morning')}
                    className="text-blue-600 cursor-pointer"
                  />
                  <span>ครึ่งวันเช้า</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="halfDayPeriod"
                    value="afternoon"
                    checked={halfDayPeriod === 'afternoon'}
                    onChange={() => setHalfDayPeriod('afternoon')}
                    className="text-blue-600 cursor-pointer"
                  />
                  <span>ครึ่งวันบ่าย</span>
                </label>
              </div>
            )}

            <div className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>หักวันเสาร์-อาทิตย์ และวันหยุดราชการให้เรียบร้อยแล้ว</span>
            </div>
          </div>

          {/* Quota limit warning */}
          {isOverQuota && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                คำเตือน: จำนวนวันที่ขอลานี้ ({totalDays} วัน) เกินโควต้าวันลาคงเหลือของท่าน ({currentQuota?.remainingDays} วัน)
              </span>
            </div>
          )}

          {/* 3. Reason for leave */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เหตุผลความจำเป็นในการลา <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น มีอาการป่วยเป็นไข้หวัดเจ็บคอ, มีธุระจำเป็นติดต่อราชการ, ฯลฯ"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* 4. Contact Address & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สถานที่ติดต่อได้ระหว่างลา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="ที่อยู่หรือสถานที่พักระหว่างลา"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          {/* 5. Electronic Signature Section */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  5. ลายมือชื่ออิเล็กทรอนิกส์ผู้ขอลา <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  ระบบจะใช้ภาพลายมือชื่ออิเล็กทรอนิกส์ที่บันทึกไว้ในระบบ หรือท่านสามารถวาดลายเซ็นสดใหม่ได้
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setSignatureMode('default')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    signatureMode === 'default' ? 'bg-white text-blue-900 shadow-2xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  ใช้ภาพลายเซ็นประจำตัว
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('canvas')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    signatureMode === 'canvas' ? 'bg-white text-blue-900 shadow-2xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  <PenTool className="w-3 h-3 inline mr-1" />
                  วาดลายเซ็นสด
                </button>
              </div>
            </div>

            {signatureMode === 'default' ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar prefix={currentPersonnel.prefix} gender={currentPersonnel.gender} size="md" />
                  <div>
                    <p className="text-xs text-slate-500">ลงลายมือชื่อโดย:</p>
                    <p className="font-semibold text-sm text-slate-800">
                      {currentPersonnel.prefix}{currentPersonnel.firstName} {currentPersonnel.lastName}
                    </p>
                    <p className="text-[11px] text-blue-700">{currentPersonnel.position}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-center min-w-[200px] h-16">
                  {currentPersonnel.signatureUrl ? (
                    <img
                      src={currentPersonnel.signatureUrl}
                      alt="Signature"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-amber-600">ไม่มีภาพลายเซ็น (กรุณาวาดลายเซ็นสด)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-1 flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="touch-none cursor-crosshair bg-white w-full max-w-[400px] h-[120px] rounded-lg"
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>ใช้นิ้วมือหรือเมาส์จรดลงบนกรอบเพื่อลงลายมือชื่อ</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> ล้างลายเซ็น
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button & LINE Notification Info */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {settings.isLineNotifyEnabled && settings.lineGroupId ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl w-full sm:w-auto">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>พร้อมส่งการแจ้งเตือนเข้ากลุ่ม LINE โรงเรียนทันที (แจ้ง ผอ. และหัวหน้าวิชาการ)</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                ยื่นคำขอเพื่อบันทึกและส่งต่อไปยังผู้อนุมัติ
              </div>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 text-amber-400" />
              บันทึกและยื่นใบลาออนไลน์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
