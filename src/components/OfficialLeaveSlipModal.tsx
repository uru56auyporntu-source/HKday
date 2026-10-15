import React from 'react';
import { 
  LeaveRecord, 
  Personnel, 
  SchoolSettings 
} from '../types/leave';
import { 
  formatThaiFullDate, 
  getLeaveTypeLabel, 
  getPersonnelLeaveBalances 
} from '../services/storageService';
import { 
  X, 
  Printer, 
  FileText,
  FileDown 
} from 'lucide-react';

interface OfficialLeaveSlipModalProps {
  record: LeaveRecord | null;
  onClose: () => void;
  allPersonnel: Personnel[];
  settings: SchoolSettings;
  leaveRecords: LeaveRecord[];
}

export const OfficialLeaveSlipModal: React.FC<OfficialLeaveSlipModalProps> = ({
  record,
  onClose,
  allPersonnel,
  settings,
  leaveRecords,
}) => {
  if (!record) return null;

  const applicant = allPersonnel.find(p => p.id === record.personnelId);
  const academicHead = allPersonnel.find(p => p.id === settings.academicHeadId);
  const director = allPersonnel.find(p => p.id === settings.directorId);

  // Compute personnel leave balances
  const balances = getPersonnelLeaveBalances(
    record.personnelId,
    record.fiscalYear,
    leaveRecords,
    settings
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = () => {
    const oldTitle = document.title;
    document.title = `ใบลา_${record.referenceNumber.replace('/', '-')}_${applicant?.firstName || ''}`;
    window.print();
    setTimeout(() => {
      document.title = oldTitle;
    }, 1500);
  };

  const isSick = record.leaveType === 'sick';
  const isPersonal = record.leaveType === 'personal';
  const isOther = !isSick && !isPersonal;

  // Construct Leave Statistics Rows as requested by the user:
  // ประเภทลา | ลามาแล้ว | ลาครั้งนี้ | รวมเป็น
  // ลาป่วย    5 วัน       2 วัน       7 วัน
  // ลากิจ     2 วัน       2 วัน       4 วัน
  // ลาอื่นๆ   0 วัน       0 วัน       0 วัน
  const statsRows = [
    { type: 'sick', label: 'ลาป่วย' },
    { type: 'personal', label: 'ลากิจส่วนตัว' },
    { type: 'other', label: 'ลาอื่นๆ' },
  ].map((row) => {
    let currentLeaveDays = 0;
    let priorLeaveDays = 0;

    if (row.type === 'sick') {
      const q = balances.find(b => b.leaveType === 'sick');
      const totalUsed = q ? q.usedDays : 0;
      currentLeaveDays = isSick ? record.totalDays : 0;
      priorLeaveDays = Math.max(0, totalUsed - currentLeaveDays);
    } else if (row.type === 'personal') {
      const q = balances.find(b => b.leaveType === 'personal');
      const totalUsed = q ? q.usedDays : 0;
      currentLeaveDays = isPersonal ? record.totalDays : 0;
      priorLeaveDays = Math.max(0, totalUsed - currentLeaveDays);
    } else {
      // Row 3: ลาอื่นๆ
      const otherBalances = balances.filter(b => b.leaveType !== 'sick' && b.leaveType !== 'personal');
      const totalUsed = otherBalances.reduce((sum, b) => sum + b.usedDays, 0);
      currentLeaveDays = isOther ? record.totalDays : 0;
      priorLeaveDays = Math.max(0, totalUsed - currentLeaveDays);
    }

    return {
      type: row.type,
      label: row.label,
      priorDays: priorLeaveDays,
      currentDays: currentLeaveDays,
      totalDays: priorLeaveDays + currentLeaveDays,
      isCurrent: (row.type === 'sick' && isSick) || (row.type === 'personal' && isPersonal) || (row.type === 'other' && isOther)
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto border border-slate-200 relative overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-900" />
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                แบบใบลาทางการ - เลขที่ {record.referenceNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                {settings.schoolName} {settings.schoolArea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePdf}
              className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="บันทึกแบบใบลาเป็นไฟล์ PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-200" />
              บันทึกเป็น PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              พิมพ์แบบใบลา
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Government Leave Form Content (NO GARUDA) */}
        <div className="p-8 sm:p-12 overflow-y-auto font-sarabun text-slate-900 leading-relaxed text-sm print-page">
          {/* Header Title (Without Garuda) */}
          <div className="text-center mb-6 pb-2 border-b-2 border-slate-800">
            <p className="text-sm font-semibold text-slate-700 tracking-wide">
              {settings.schoolName} {settings.schoolArea}
            </p>
            <h1 className="text-2xl font-bold tracking-wide mt-1 text-slate-900">
              แบบใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              เลขที่อ้างอิง: {record.referenceNumber} • ปีงบประมาณ {record.fiscalYear}
            </p>
          </div>

          {/* Location & Date */}
          <div className="text-right space-y-1 mb-6">
            <p>เขียนที่ <strong>{settings.schoolName}</strong></p>
            <p>วันที่ <strong>{formatThaiFullDate(record.submittedAt.slice(0, 10))}</strong></p>
          </div>

          {/* Subject & Recipient */}
          <div className="space-y-1 mb-4">
            <p><strong>เรื่อง:</strong> ขอ{getLeaveTypeLabel(record.leaveType)}</p>
            <p><strong>เรียน:</strong> ผู้อำนวยการ{settings.schoolName}</p>
          </div>

          {/* Body Content (Without substitute teacher) */}
          <div className="space-y-3 mb-6 text-justify">
            <p className="indent-8">
              ข้าพเจ้า <strong>{applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : '-'}</strong>{' '}
              ตำแหน่ง <strong>{applicant?.position} {applicant?.academicStanding}</strong>{' '}
              สังกัด <strong>{settings.schoolName} {settings.schoolArea}</strong>
            </p>

            <p className="indent-8">
              มีความประสงค์ขอ<strong>{getLeaveTypeLabel(record.leaveType)}</strong>{' '}
              เนื่องจาก <strong>{record.reason}</strong>{' '}
              ตั้งแต่วันที่ <strong>{formatThaiFullDate(record.startDate)}</strong>{' '}
              ถึงวันที่ <strong>{formatThaiFullDate(record.endDate)}</strong>{' '}
              มีกำหนด <strong>{record.totalDays}</strong> วันทำการ{' '}
              {record.isHalfDay && `(${record.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'})`}
            </p>

            <p className="indent-8">
              ในระหว่างลา จะติดต่อข้าพเจ้าได้ที่ <strong>{record.contactAddress || applicant?.address || '...................................................'}</strong>{' '}
              หมายเลขโทรศัพท์ <strong>{record.contactPhone || applicant?.phone || '...................................'}</strong>
            </p>
          </div>

          {/* Applicant Signature Box */}
          <div className="flex justify-end my-6 text-center text-xs">
            <div className="space-y-1 border border-slate-300 p-4 rounded-xl min-w-[240px]">
              <p className="font-semibold text-slate-700">ขอแสดงความนับถือ</p>
              <div className="h-16 flex items-center justify-center my-1">
                {record.applicantSignature ? (
                  <img src={record.applicantSignature} alt="Applicant Sign" className="max-h-14 object-contain" />
                ) : (
                  <p className="text-slate-400 italic">(ลงชื่อผู้ขอลา)</p>
                )}
              </div>
              <p className="font-bold">({applicant ? `${applicant.prefix}${applicant.firstName} ${applicant.lastName}` : 'ผู้ขอลา'})</p>
              <p className="text-slate-600">ตำแหน่ง {applicant?.position || 'ครู'}</p>
            </div>
          </div>

          {/* 6. Exact Leave Statistics Table specified by User */}
          <div className="my-6 border border-slate-400 rounded-xl p-4 bg-slate-50/70">
            <p className="font-bold text-sm text-slate-800 mb-2">
              สถิติการลาในปีงบประมาณนี้ ({record.fiscalYear})
            </p>
            <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-center">
              <thead>
                <tr className="bg-slate-200/80 font-bold text-slate-800">
                  <th className="border border-slate-400 p-2.5 text-left">ประเภทลา</th>
                  <th className="border border-slate-400 p-2.5">ลามาแล้ว</th>
                  <th className="border border-slate-400 p-2.5">ลาครั้งนี้</th>
                  <th className="border border-slate-400 p-2.5">รวมเป็น</th>
                </tr>
              </thead>
              <tbody>
                {statsRows.map((row) => (
                  <tr key={row.type} className={row.isCurrent ? 'bg-blue-50/80 font-semibold' : ''}>
                    <td className="border border-slate-400 p-2 text-left">
                      {row.label}
                    </td>
                    <td className="border border-slate-400 p-2">
                      {row.priorDays} วัน
                    </td>
                    <td className="border border-slate-400 p-2 font-bold text-blue-900">
                      {row.currentDays} วัน
                    </td>
                    <td className="border border-slate-400 p-2 font-bold text-slate-900">
                      {row.totalDays} วัน
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2-Step Approval Sections: Academic Head & Director */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs">
            {/* Step 1: Academic Head */}
            <div className="border border-slate-300 p-4 rounded-xl space-y-2">
              <p className="font-bold text-slate-800">
                ๑. ความเห็นของหัวหน้าฝ่ายบริหารงานวิชาการ
              </p>
              <p className="text-slate-700 min-h-[35px]">
                {record.academicHeadComment || 'เห็นควรอนุญาต ได้ตรวจสอบภาระงานสอนและการจัดการเรียนการสอนเรียบร้อยแล้ว'}
              </p>
              <div className="text-center pt-2">
                <div className="h-14 flex items-center justify-center my-1">
                  {record.academicHeadSignature ? (
                    <img src={record.academicHeadSignature} alt="Academic Head Signature" className="max-h-12 object-contain" />
                  ) : (
                    <p className="text-slate-400 italic">....................................................</p>
                  )}
                </div>
                <p className="font-semibold">({academicHead ? `${academicHead.prefix}${academicHead.firstName} ${academicHead.lastName}` : 'หัวหน้าวิชาการ'})</p>
                <p className="text-slate-500">หัวหน้าฝ่ายบริหารงานวิชาการ</p>
                <p className="text-slate-400 text-[10px]">
                  {record.academicHeadActionDate ? formatThaiFullDate(record.academicHeadActionDate.slice(0, 10)) : ''}
                </p>
              </div>
            </div>

            {/* Step 2: Director Decision */}
            <div className="border border-slate-300 p-4 rounded-xl space-y-2">
              <p className="font-bold text-slate-800">
                ๒. คำสั่งของผู้อำนวยการสถานศึกษา
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold py-1">
                <span className={`inline-flex items-center gap-1 ${record.status === 'approved' ? 'text-emerald-700 font-bold' : ''}`}>
                  [{record.status === 'approved' ? '✓' : ' '}] อนุญาต
                </span>
                <span className={`inline-flex items-center gap-1 ${record.status === 'rejected' ? 'text-rose-700 font-bold' : ''}`}>
                  [{record.status === 'rejected' ? '✓' : ' '}] ไม่อนุญาต
                </span>
              </div>
              <p className="text-slate-700 min-h-[25px]">
                {record.directorComment || 'ทราบและอนุมัติ'}
              </p>
              <div className="text-center pt-2">
                <div className="h-14 flex items-center justify-center my-1">
                  {record.directorSignature ? (
                    <img src={record.directorSignature} alt="Director Signature" className="max-h-12 object-contain" />
                  ) : (
                    <p className="text-slate-400 italic">....................................................</p>
                  )}
                </div>
                <p className="font-semibold">({director ? `${director.prefix}${director.firstName} ${director.lastName}` : 'ผู้อำนวยการโรงเรียน'})</p>
                <p className="text-slate-500">ผู้อำนวยการ{settings.schoolName}</p>
                <p className="text-slate-400 text-[10px]">
                  {record.directorActionDate ? formatThaiFullDate(record.directorActionDate.slice(0, 10)) : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
