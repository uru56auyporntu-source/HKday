import React, { useState } from 'react';
import { 
  Personnel, 
  SchoolSettings, 
  LeaveQuota,
  LeaveRecord
} from '../types/leave';
import { 
  Building, 
  Save, 
  ShieldCheck, 
  Award, 
  UserCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  Sheet, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle,
  Send,
  ExternalLink,
  Smartphone,
  RotateCcw,
  Lock,
  AlertTriangle,
  X,
  ShieldAlert,
  Cloud,
  Zap,
  Server
} from 'lucide-react';
import { sendLineNotification } from '../services/storageService';

interface OrganizationSettingsProps {
  settings: SchoolSettings;
  allPersonnel: Personnel[];
  onSaveSettings: (newSettings: SchoolSettings) => void;
  currentPersonnel: Personnel;
  onOpenGoogleSheetsModal: () => void;
  onOpenLineModal: () => void;
  leaveRecords?: LeaveRecord[];
  onResetAllLeaveRecords?: () => void;
}

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  settings,
  allPersonnel,
  onSaveSettings,
  currentPersonnel,
  onOpenGoogleSheetsModal,
  onOpenLineModal,
  leaveRecords = [],
  onResetAllLeaveRecords,
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolArea, setSchoolArea] = useState(settings.schoolArea);
  const [currentFiscalYear, setCurrentFiscalYear] = useState(settings.currentFiscalYear);
  const [directorId, setDirectorId] = useState(settings.directorId);
  const [academicHeadId, setAcademicHeadId] = useState(settings.academicHeadId);
  const [adminId, setAdminId] = useState(settings.adminId);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [quotas, setQuotas] = useState<LeaveQuota[]>(settings.quotas);
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState(settings.googleSheetsWebhookUrl || '');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(settings.isAutoSyncEnabled !== false);
  const [isLineNotifyEnabled, setIsLineNotifyEnabled] = useState(settings.isLineNotifyEnabled ?? false);
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState(settings.lineChannelAccessToken || '');
  const [lineGroupId, setLineGroupId] = useState(settings.lineGroupId || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const handleConfirmReset = () => {
    if (resetPin !== '1234') {
      setResetError('รหัสผ่านไม่ถูกต้อง! กรุณากรอกรหัส 1234 อีกครั้ง');
      return;
    }
    if (onResetAllLeaveRecords) {
      onResetAllLeaveRecords();
    }
    setIsResetModalOpen(false);
    setResetPin('');
    setResetError(null);
    setResetSuccessMsg('รีเซ็ตข้อมูลวันลาทั้งหมดในระบบเรียบร้อยแล้ว (สถิติวันลาสะสมของบุคลากรทุกคนกลับเป็น 0 วัน)');
    setTimeout(() => setResetSuccessMsg(null), 6000);
  };

  const handleQuotaChange = (index: number, field: 'maxDays' | 'maxTimes', value: number) => {
    const nextQuotas = [...quotas];
    nextQuotas[index] = {
      ...nextQuotas[index],
      [field]: Math.max(0, value),
    };
    setQuotas(nextQuotas);
  };

  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestNotification = async () => {
    if (!lineChannelAccessToken.trim() || !lineGroupId.trim()) {
      setTestStatus({
        type: 'error',
        message: 'กรุณากรอกทั้ง Channel Access Token และ Group ID ให้ครบถ้วนก่อนทดสอบ'
      });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    const testSettings: SchoolSettings = {
      ...settings,
      isLineNotifyEnabled: true,
      lineChannelAccessToken: lineChannelAccessToken.trim(),
      lineGroupId: lineGroupId.trim(),
    };

    const testMessage = [
      `🔔 แจ้งเตือนบันทึกคำขอลาออนไลน์`,
      `${settings.schoolName || 'โรงเรียนบ้านห้วยไคร้'} ${settings.schoolArea || 'สพป.สุโขทัย เขต 2'}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 เลขที่คำขอ: ลร.04/2570`,
      `👤 ผู้ขอลา: ${currentPersonnel.prefix}${currentPersonnel.firstName} ${currentPersonnel.lastName}`,
      `💼 ตำแหน่ง: ${currentPersonnel.position}${currentPersonnel.academicStanding ? ' ' + currentPersonnel.academicStanding : ''}`,
      `📌 ประเภทการลา: ลาป่วย`,
      `📅 วันที่ลา: 15 ต.ค. 2569 (1 วันทำการ)`,
      `📝 เหตุผล: 123`,
      `📞 เบอร์โทรติดต่อ: ${currentPersonnel.phone || '087-654-3210'}`
    ].join('\n');

    try {
      const result = await sendLineNotification(testSettings, testMessage);
      if (result.success) {
        setTestStatus({
          type: 'success',
          message: 'ส่งข้อความทดสอบสำเร็จ! กรุณาตรวจสอบในกลุ่ม LINE ของโรงเรียน'
        });
      } else {
        setTestStatus({
          type: 'error',
          message: `ส่งข้อความไม่สำเร็จ: ${result.message}`
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setTestStatus({
        type: 'error',
        message: `เกิดข้อผิดพลาด: ${errorMsg}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: SchoolSettings = {
      ...settings,
      schoolName: schoolName.trim(),
      schoolArea: schoolArea.trim(),
      currentFiscalYear,
      directorId,
      academicHeadId,
      adminId,
      phone: phone.trim(),
      address: address.trim(),
      quotas,
      googleSheetsWebhookUrl: googleSheetsWebhookUrl.trim(),
      isAutoSyncEnabled,
      isLineNotifyEnabled,
      lineChannelAccessToken: lineChannelAccessToken.trim(),
      lineGroupId: lineGroupId.trim(),
    };
    onSaveSettings(updatedSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              เมนูตั้งค่าหน่วยงาน (ผ่านการยืนยันรหัสความปลอดภัยแล้ว)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            ข้อมูลหน่วยงานและการกำหนดโควต้าวันลา
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            สำหรับกรอกข้อมูลโรงเรียน ระบุปีงบประมาณ ผู้บริหาร และกำหนดสิทธิวันลาแต่ละประเภท
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-4 py-2 rounded-2xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            บันทึกการตั้งค่าเรียบร้อยแล้ว
          </div>
        )}

        {resetSuccessMsg && (
          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-300 px-4 py-2 rounded-2xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
            {resetSuccessMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Section 1: School General Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-blue-900" />
            1. ข้อมูลทั่วไปของสถานศึกษา
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อโรงเรียน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สังกัดสำนักงานเขตพื้นที่การศึกษา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={schoolArea}
                onChange={(e) => setSchoolArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ปีงบประมาณปัจจุบัน (พ.ศ.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={currentFiscalYear}
                onChange={(e) => setCurrentFiscalYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์โรงเรียน
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ฐานข้อมูลภายนอก (Google Sheets)
              </label>
              <button
                type="button"
                onClick={onOpenGoogleSheetsModal}
                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sheet className="w-4 h-4" />
                ตั้งค่า Google Apps Script Web App
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ที่ตั้งสถานศึกษา
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            />
          </div>
        </div>

        {/* Section 2: Key Personnel & Executive Roles */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-indigo-700" />
            2. ผู้มีอำนาจพิจารณาและผู้ดูแลระบบ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผู้อำนวยการโรงเรียน (ผู้มีอำนาจอนุมัติใบลา) <span className="text-rose-500">*</span>
              </label>
              <select
                value={directorId}
                onChange={(e) => setDirectorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              >
                {allPersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prefix}{p.firstName} {p.lastName} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หัวหน้าฝ่ายบริหารงานวิชาการ (ผู้ตรวจความเห็น) <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicHeadId}
                onChange={(e) => setAcademicHeadId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              >
                {allPersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prefix}{p.firstName} {p.lastName} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผู้ดูแลระบบ (Admin) <span className="text-rose-500">*</span>
              </label>
              <select
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              >
                {allPersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prefix}{p.firstName} {p.lastName} ({p.position})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Leave Quotas Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              3. กำหนดสิทธิวันลาแต่ละประเภท (ระบุโควต้าจำนวนครั้งและจำนวนวัน)
            </h3>
            <span className="text-xs text-slate-500">
              ตามระเบียบ พ.ศ. 2555 สามารถปรับเปลี่ยนให้เหมาะสมกับบริบทของโรงเรียนได้
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">ประเภทการลา</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">โควต้าวันสูงสุด (วัน)</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">โควต้าครั้งสูงสุด (ครั้ง)</th>
                  <th className="py-3 px-4 font-semibold">คำอธิบายและเงื่อนไข</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotas.map((quota: LeaveQuota, idx: number) => (
                  <tr key={quota.leaveType} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {quota.title}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={quota.maxDays}
                        onChange={(e) => handleQuotaChange(idx, 'maxDays', Number(e.target.value))}
                        className="w-24 text-center bg-white border border-slate-300 rounded-xl py-1.5 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-hidden mx-auto"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={quota.maxTimes}
                        onChange={(e) => handleQuotaChange(idx, 'maxTimes', Number(e.target.value))}
                        className="w-24 text-center bg-white border border-slate-300 rounded-xl py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden mx-auto"
                      />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {quota.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: LINE Messaging API Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  4. การแจ้งเตือนผ่านกลุ่ม LINE (LINE Messaging API)
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  กลุ่มโรงเรียน (ไม่ใช่ OpenChat)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                แจ้งเตือน ผอ. และหัวหน้าฝ่ายวิชาการทันทีเมื่อครูยื่นใบลา เพื่อตรวจและอนุมัติแบบเรียลไทม์
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenLineModal}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              คู่มือตั้งค่าและวิธีหา Group ID
            </button>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 text-sm block">
                เปิดระบบแจ้งเตือนเข้ากลุ่ม LINE อัตโนมัติ
              </span>
              <span className="text-xs text-slate-500">
                เมื่อครูกดยื่นใบลา หรือ ผอ./หัวหน้าวิชาการ อนุมัติใบลา ระบบจะส่งข้อความแจ้งเตือนเข้ากลุ่มทันที
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLineNotifyEnabled}
                onChange={(e) => setIsLineNotifyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Access Token (Long-lived)
              </label>
              <input
                type="password"
                value={lineChannelAccessToken}
                onChange={(e) => setLineChannelAccessToken(e.target.value)}
                placeholder="ใส่ Channel Access Token จาก LINE Developers..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                จาก LINE Developers Console &gt; แท็บ Messaging API &gt; Channel access token
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>รหัสกลุ่ม LINE (Group ID)</span>
                <button
                  type="button"
                  onClick={onOpenLineModal}
                  className="text-emerald-700 font-bold hover:underline text-[11px]"
                >
                  วิธีดู Group ID
                </button>
              </label>
              <input
                type="text"
                value={lineGroupId}
                onChange={(e) => setLineGroupId(e.target.value)}
                placeholder="เช่น Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                รหัสกลุ่มที่เชิญบอทเข้า (ขึ้นต้นด้วย C ตามด้วยตัวอักษร 32 ตัว)
              </p>
            </div>
          </div>

          {/* Template Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              ตัวอย่างข้อความแจ้งเตือนที่จะส่งเข้ากลุ่ม LINE:
            </span>
            <pre className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap select-all">
{`🔔 แจ้งเตือนบันทึกคำขอลาออนไลน์
${schoolName || 'โรงเรียนบ้านห้วยไคร้'} ${schoolArea || 'สพป.สุโขทัย เขต 2'}
━━━━━━━━━━━━━━━━━━━━
📋 เลขที่คำขอ: ลร.04/2570
👤 ผู้ขอลา: นายชัชวาลย์ ใจภักดี
💼 ตำแหน่ง: ครู ชำนาญการ
📌 ประเภทการลา: ลาป่วย
📅 วันที่ลา: 15 ต.ค. 2569 (1 วันทำการ)
📝 เหตุผล: 123
📞 เบอร์โทรติดต่อ: 087-654-3210`}
            </pre>
          </div>

          {/* Test Status feedback */}
          {testStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in ${
                testStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Quick Test Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              {isTesting ? 'กำลังทดสอบส่ง...' : 'ทดสอบส่งข้อความเข้ากลุ่ม LINE ทันที'}
            </button>
          </div>
        </div>

        {/* Section 5: Real-time Cloud Synchronization (Google Sheets) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Sheet className="w-5 h-5 text-emerald-600" />
                  5. การซิงค์ข้อมูลลงบน Google Sheets ทันที
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  ซิงค์ข้ามอุปกรณ์ทุกเครื่อง
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ซิงค์ข้อมูลคำขอลา ผลการอนุมัติ และสถิติลงบน Google Sheets ทันทีทุกครั้งที่มีการใช้งาน ไม่ว่าจะเข้าใช้จากเครื่องใดก็ตาม เพื่อป้องกันข้อมูลสูญหาย 100%
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenGoogleSheetsModal}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              เปิดหน้าต่างตั้งค่าและโค้ดติดตั้ง
            </button>
          </div>

          <div>
            {/* Google Sheets Webhook URL */}
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sheet className="w-3.5 h-3.5 text-emerald-600" />
              URL ของ Google Apps Script Web App (Google Sheets)
            </label>
            <input
              type="url"
              value={googleSheetsWebhookUrl}
              onChange={(e) => setGoogleSheetsWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Auto-sync Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-slate-800">
                ซิงค์ข้อมูลอัตโนมัติทันที ทุกครั้งที่มีการใช้งานระบบ (ยื่นใบลา / อนุมัติ / ยกเลิก)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={isAutoSyncEnabled} 
                onChange={(e) => setIsAutoSyncEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Section 6: Reset All Leave Records (รีเซ็ตวันลาทั้งหมด) */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-rose-200">
            <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              6. การจัดการข้อมูลและการรีเซ็ตวันลาทั้งหมด
            </h3>
            <span className="text-xs bg-rose-200 text-rose-800 font-bold px-3 py-1 rounded-full border border-rose-300">
              สำหรับผู้ดูแลระบบ / ผู้บริหาร
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-rose-950 max-w-2xl">
              <p className="font-semibold text-sm text-rose-900">
                รีเซ็ตข้อมูลวันลาและสถิติการลาทั้งหมดในระบบ
              </p>
              <p className="text-slate-600 leading-relaxed">
                การกดปุ่มนี้จะลบรายการใบลาทั้งหมดในระบบ และปรับยอดสถิติวันลาสะสมของข้าราชการครูและบุคลากรทุกคนให้เริ่มต้นใหม่ที่ 0 วัน (โควตาวันลาจะกลับคืนเต็มจำนวน) เหมาะสำหรับการเริ่มต้นปีงบประมาณใหม่ หรือการล้างข้อมูลทดสอบระบบ
              </p>
              <p className="text-slate-500 font-medium pt-1">
                สถานะปัจจุบัน: มีข้อมูลคำขอลาในระบบ <strong className="text-rose-700">{leaveRecords.length}</strong> รายการ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsResetModalOpen(true);
                setResetPin('');
                setResetError(null);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-md transition-all cursor-pointer shrink-0"
              title="รีเซ็ตวันลาทั้งหมด ต้องยืนยันรหัส 1234"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              รีเซ็ตวันลาทั้งหมด
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            บันทึกการตั้งค่าข้อมูลหน่วยงาน
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal with PIN 1234 requirement */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    ยืนยันการรีเซ็ตวันลาทั้งหมด
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรุณากรอกรหัสผ่าน 1234 เพื่อยืนยัน
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetPin('');
                  setResetError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-800">คำเตือนสำคัญ:</p>
                  <p className="text-slate-700 leading-relaxed">
                    ระบบจะล้างรายการคำขอลาทั้งหมด (<strong className="text-rose-700">{leaveRecords.length} รายการ</strong>) และรีเซ็ตยอดสถิติจำนวนวันลาของบุคลากรทุกคนให้เป็น 0 วัน การกระทำนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                กรุณายืนยันรหัสความปลอดภัย (1234):
              </label>
              <input
                type="password"
                maxLength={4}
                value={resetPin}
                onChange={(e) => {
                  setResetPin(e.target.value);
                  setResetError(null);
                }}
                placeholder="กรอกรหัส 1234"
                autoFocus
                className="w-full text-center text-xl tracking-[0.5em] font-mono py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
              {resetError && (
                <p className="text-xs text-rose-600 font-semibold text-center animate-in fade-in">
                  {resetError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetPin('');
                  setResetError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                ยืนยันรีเซ็ตวันลา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
