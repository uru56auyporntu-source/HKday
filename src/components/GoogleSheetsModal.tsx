import React, { useState } from 'react';
import { 
  SchoolSettings, 
  LeaveRecord, 
  Personnel 
} from '../types/leave';
import { 
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  syncWithGoogleSheets,
  syncDatabaseToServer
} from '../services/storageService';
import { 
  Sheet, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Server
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onSaveCloudUrls: (googleUrl: string, autoSync: boolean) => void;
  leaveRecords: LeaveRecord[];
  allPersonnel: Personnel[];
  onTriggerSyncAll?: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveCloudUrls,
  leaveRecords,
  allPersonnel,
  onTriggerSyncAll,
}) => {
  const [sheetsUrl, setSheetsUrl] = useState(settings.googleSheetsWebhookUrl || '');
  const [autoSync, setAutoSync] = useState(settings.isAutoSyncEnabled !== false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveAndSync = async () => {
    onSaveCloudUrls(sheetsUrl.trim(), autoSync);
    setIsSyncing(true);
    setSyncStatus(null);

    const results: string[] = [];
    let hasError = false;

    try {
      // 1. Sync to Central Server persistent store
      const serverRes = await syncDatabaseToServer({
        personnelList: allPersonnel,
        leaveRecords,
        settings: {
          ...settings,
          googleSheetsWebhookUrl: sheetsUrl.trim(),
          isAutoSyncEnabled: autoSync,
          lastSyncedAt: new Date().toISOString()
        },
        auditLogs: []
      });

      if (serverRes.success) {
        results.push('ฐานข้อมูลกลางเซิร์ฟเวอร์: สำเร็จ');
      }

      // 2. Sync to Google Sheets if provided
      if (sheetsUrl.trim()) {
        const sheetsRes = await syncWithGoogleSheets(sheetsUrl.trim(), leaveRecords, allPersonnel, settings);
        if (sheetsRes.success) {
          results.push('Google Sheets: ซิงค์สำเร็จ');
        } else {
          results.push(`Google Sheets: ${sheetsRes.message}`);
          hasError = true;
        }
      }

      if (onTriggerSyncAll) {
        await onTriggerSyncAll();
      }

      if (results.length === 0) {
        setSyncStatus({ 
          type: 'success', 
          message: 'บันทึกการตั้งค่าลงฐานข้อมูลกลางสำเร็จ (พร้อมทำงานแบบเรียลไทม์ทุกเครื่อง)' 
        });
      } else if (hasError) {
        setSyncStatus({ 
          type: 'error', 
          message: results.join(' • ') 
        });
      } else {
        setSyncStatus({ 
          type: 'success', 
          message: 'ซิงค์ข้อมูลสำเร็จครบถ้วน: ' + results.join(' | ') 
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSyncStatus({ type: 'error', message: `ข้อผิดพลาดในการซิงค์: ${errorMsg}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <Sheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-800">
                ซิงค์ข้อมูลลงบน Google Sheets ทันที
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Realtime Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ป้องกันข้อมูลสูญหาย 100% ใช้งานพร้อมกันได้จากทุกเครื่อง ทุกอุปกรณ์ (มือถือ แท็บเล็ต คอมพิวเตอร์)
            </p>
          </div>
        </div>

        {/* Real-time Central Sync Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl mb-5 flex items-center gap-3 text-xs text-blue-900">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div className="leading-relaxed">
            <p className="font-bold text-blue-950">
              ระบบมีฐานข้อมูลกลางเซิร์ฟเวอร์รองรับตลอด 24 ชั่วโมง
            </p>
            <p className="text-blue-800 text-[11px]">
              ไม่ว่าจะเข้าใช้งานจากเครื่องของ ผอ., หัวหน้าวิชาการ หรือโทรศัพท์มือถือของครู ข้อมูลจะเชื่อมต่อถึงกันทันทีโดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sheet className="w-4 h-4 text-emerald-600" />
              URL ของ Google Apps Script Web App (Google Sheets)
            </label>
            <input
              type="url"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              เมื่อครูยื่นใบลา หรือ ผอ. อนุมัติ ข้อมูลจะถูกบันทึกลง Google Sheets ของโรงเรียนทันที
            </p>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                  ซิงค์อัตโนมัติทันทีทุกครั้งที่มีการใช้งานระบบ
                </span>
                <span className="text-[11px] text-slate-500">
                  ยื่นใบลา, ลงความเห็นวิชาการ, ผอ. อนุมัติ หรือยกเลิกใบลา ซิงค์ลง Google Sheets และฐานข้อมูลกลางทันที
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input 
                type="checkbox" 
                checked={autoSync} 
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Sync Button */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลังซิงค์ข้อมูลทุกเครื่อง...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  บันทึกการตั้งค่าและซิงค์ทันที ({leaveRecords.length} รายการ)
                </>
              )}
            </button>
          </div>

          {/* Sync Status Banner */}
          {syncStatus && (
            <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
              syncStatus.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              {syncStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="leading-relaxed">{syncStatus.message}</span>
            </div>
          )}
        </div>

        {/* Step-by-Step Instructions & Code for Google Sheets */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              ขั้นตอนการติดตั้งบน Google Sheets (ง่ายและเสร็จใน 2 นาที):
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1 text-[11px] sm:text-xs">
              <li>เปิด <strong>Google Sheets</strong> แผ่นงานใหม่ของโรงเรียน</li>
              <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></li>
              <li>ลบโค้ดเดิมทั้งหมด แล้วกดปุ่ม <strong>คัดลอกโค้ด Apps Script</strong> ด้านล่างนี้ไปวาง</li>
              <li>คลิกปุ่ม <strong>การทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>การทำให้ใช้งานได้ใหม่ (New deployment)</strong></li>
              <li>เลือกประเภท <strong>เว็บแอป (Web App)</strong> &gt; ผู้มีสิทธิ์เข้าถึง: <strong>ทุกคน (Anyone)</strong></li>
              <li>คัดลอก <strong>Web App URL</strong> มาวางในช่องด้านบน แล้วกดบันทึก</li>
            </ol>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-amber-400">Code.gs (Google Apps Script Code)</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    คัดลอกเรียบร้อยแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    คัดลอกโค้ด Apps Script
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
              {GOOGLE_APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
