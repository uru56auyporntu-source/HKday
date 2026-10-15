import React, { useState } from 'react';
import { 
  SchoolSettings, 
  LeaveRecord, 
  Personnel 
} from '../types/leave';
import { 
  sendLineNotification 
} from '../services/storageService';
import { 
  MessageCircle, 
  X, 
  Check, 
  Send, 
  ExternalLink, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ShieldCheck, 
  Info,
  Smartphone,
  Users
} from 'lucide-react';

interface LineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  currentPersonnel: Personnel;
}

export const LineSettingsModal: React.FC<LineSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentPersonnel,
}) => {
  const [isEnabled, setIsEnabled] = useState(settings.isLineNotifyEnabled ?? false);
  const [channelAccessToken, setChannelAccessToken] = useState(settings.lineChannelAccessToken || '');
  const [groupId, setGroupId] = useState(settings.lineGroupId || '');
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'guide' | 'gas_helper'>('settings');

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: SchoolSettings = {
      ...settings,
      isLineNotifyEnabled: isEnabled,
      lineChannelAccessToken: channelAccessToken.trim(),
      lineGroupId: groupId.trim(),
    };
    onSaveSettings(updated);
    setTestStatus({
      type: 'success',
      message: 'บันทึกการตั้งค่า LINE Messaging API เรียบร้อยแล้ว'
    });
  };

  const handleTestNotification = async () => {
    if (!channelAccessToken.trim() || !groupId.trim()) {
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
      lineChannelAccessToken: channelAccessToken.trim(),
      lineGroupId: groupId.trim(),
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

  // Google Apps Script code to capture Group ID
  const gasGroupIdHelperCode = `/**
 * โค้ด Google Apps Script สำหรับหา LINE Group ID อัตโนมัติ
 * 
 * วิธีการใช้งาน:
 * 1. นำโค้ดนี้ไปวางใน Google Apps Script
 * 2. Deploy เป็น Web App (สิทธิ์ Everyone)
 * 3. นำ Web App URL ไปใส่ใน Webhook URL บน LINE Developers Console
 * 4. เมื่อเชิญบอทเข้ากลุ่ม หรือเมื่อมีคนพิมพ์ข้อความในกลุ่ม 
 *    บอทจะตอบกลับเป็น Group ID ให้ทันที!
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var events = data.events;
    if (!events || events.length === 0) return;

    var event = events[0];
    var replyToken = event.replyToken;
    var source = event.source;

    // ตรวจสอบว่าเป็น Event จากกลุ่มหรือไม่
    if (source.type === "group") {
      var groupId = source.groupId;
      var replyText = "🆔 รหัสกลุ่ม LINE (Group ID) ของคุณคือ:\\n" + groupId + 
                      "\\n\\n(นำรหัสนี้ไปใส่ในช่อง Group ID ของระบบจัดการวันลา)";
      
      // ส่งข้อความตอบกลับ
      var channelAccessToken = "${channelAccessToken ? channelAccessToken.trim() : 'ใส่_CHANNEL_ACCESS_TOKEN_ที่นี่'}";
      UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + channelAccessToken
        },
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: [{ type: "text", text: replyText }]
        })
      });
    }
  } catch (err) {
    console.error(err);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-800">
                ตั้งค่าแจ้งเตือนผ่านกลุ่ม LINE (Messaging API)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                กลุ่มโรงเรียน (ไม่ใช่ OpenChat)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แจ้งเตือนทันทีเมื่อครูยื่นคำขอลาออนไลน์ เพื่อให้ ผอ. และหัวหน้าฝ่ายวิชาการตรวจสอบและอนุมัติแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            ⚙️ การตั้งค่าระบบ
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'guide' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📖 ขั้นตอนการเชื่อมต่อ (4 สเต็ป)
          </button>
          <button
            onClick={() => setActiveTab('gas_helper')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'gas_helper' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🔍 วิธีดู Group ID
          </button>
        </div>

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Toggle Active */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-sm block">
                  เปิดใช้งานการแจ้งเตือนคำขอลาเข้ากลุ่ม LINE
                </span>
                <span className="text-xs text-slate-500">
                  เมื่อเปิดใช้งาน ครูยื่นลาปุ๊บ ระบบจะส่งข้อความแจ้ง ผอ. และหัวหน้าวิชาการในกลุ่มทันที
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Info for GitHub Pages users */}
            {typeof window !== 'undefined' && window.location.hostname.endsWith('github.io') && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">คำแนะนำสำหรับ GitHub Pages:</span><br/>
                  เนื่องจาก LINE API บล็อกการส่งข้อความตรงจากเว็บเบราว์เซอร์ (ติดปัญหา Browser CORS) และ GitHub Pages ไม่มี Node.js เซิร์ฟเวอร์ กรุณาระบุ <strong>Google Apps Script Web App URL</strong> ในเมนู <strong>"เชื่อมต่อ Google Sheets"</strong> ระบบจะส่งข้อความแจ้งเตือนผ่าน Google Apps Script เข้ากลุ่ม LINE ได้สำเร็จ 100%!
                </div>
              </div>
            )}

            {/* Channel Access Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Channel Access Token (Long-lived) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={channelAccessToken}
                onChange={(e) => setChannelAccessToken(e.target.value)}
                placeholder="วาง Channel Access Token ที่ได้จาก LINE Developers Console (แท็บ Messaging API)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                สร้างได้ที่ LINE Developers Console &gt; ช่อง Messaging API &gt; Channel access token &gt; กด Issue
              </p>
            </div>

            {/* Group ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>รหัสกลุ่ม LINE (Group ID) <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setActiveTab('gas_helper')}
                  className="text-emerald-700 font-bold hover:underline normal-case cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Group ID ดูได้จากที่ไหน?
                </button>
              </label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="เช่น Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ขึ้นต้นด้วยอักษร &apos;C&apos; ตามด้วยตัวเลขและตัวอักษร 32 ตัว (เฉพาะกลุ่มปกติที่ไม่ใช่ OpenChat เท่านั้น)
              </p>
            </div>

            {/* Template Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                ตัวอย่างข้อความแจ้งเตือนที่จะส่งเข้ากลุ่ม LINE:
              </span>
              <pre className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap select-all">
{`🔔 แจ้งเตือนบันทึกคำขอลาออนไลน์
${settings.schoolName || 'โรงเรียนบ้านห้วยไคร้'} ${settings.schoolArea || 'สพป.สุโขทัย เขต 2'}
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

            {/* Test Status Banner */}
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTesting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                {isTesting ? 'กำลังทดสอบส่ง...' : 'ทดสอบส่งข้อความเข้ากลุ่ม LINE'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <h4 className="font-bold text-emerald-900 text-sm mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ใช้ Messaging API ส่งเข้ากลุ่ม LINE ทั่วไปที่ไม่ใช่ OpenChat ได้ 100%!
              </h4>
              <p className="text-emerald-800 leading-relaxed">
                เนื่องจาก LINE ได้ยกเลิกบริการ LINE Notify เดิมไปแล้ว <strong>LINE Messaging API</strong> คือทางเลือกที่เป็นทางการและมีประสิทธิภาพสูงสุด โดยสามารถส่ง Push Message แจ้งเตือนเข้ากลุ่มคุณครูของโรงเรียนได้ทันที
              </p>
            </div>

            <div className="space-y-3">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <span className="font-bold text-slate-900 block text-sm mb-1 text-emerald-700">
                  ขั้นตอนที่ 1: สมัครและเข้าสู่ LINE Developers
                </span>
                <p className="text-slate-600 mb-2">
                  ไปที่เว็บไซต์ <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">developers.line.biz <ExternalLink className="w-3 h-3" /></a> แล้วสร้างหรือเลือก Provider ของโรงเรียน
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <span className="font-bold text-slate-900 block text-sm mb-1 text-emerald-700">
                  ขั้นตอนที่ 2: สร้าง Messaging API Channel
                </span>
                <p className="text-slate-600 mb-2">
                  สร้าง Channel ประเภท <strong>Messaging API</strong> (ตั้งชื่อ เช่น &quot;ระบบวันลา ห้วยไคร้&quot;) แล้วเปิดแท็บ <strong>Messaging API</strong> เลื่อนลงมาที่หัวข้อ <strong>Channel access token (long-lived)</strong> แล้วกด Issue เพื่อคัดลอก Token
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <span className="font-bold text-slate-900 block text-sm mb-1 text-emerald-700">
                  ขั้นตอนที่ 3: เชิญ LINE Bot เข้ากลุ่มโรงเรียน (กลุ่มปกติ)
                </span>
                <p className="text-slate-600 mb-2">
                  เพิ่มเพื่อนบัญชี LINE Bot ของคุณ (สแกน QR Code จากหน้า Messaging API) จากนั้น <strong>กดเชิญบอทเข้ากลุ่ม LINE ของโรงเรียนบ้านห้วยไคร้</strong> (ตรวจสอบว่าในการตั้งค่า LINE Official Account มีการเปิดฟังก์ชัน &quot;Allow bot to join group chats&quot; ไว้อยู่แล้ว)
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <span className="font-bold text-slate-900 block text-sm mb-1 text-emerald-700">
                  ขั้นตอนที่ 4: นำ Group ID มาใส่ และทดสอบส่ง
                </span>
                <p className="text-slate-600 mb-2">
                  นำ Group ID (ขึ้นต้นด้วย C...) มากดใส่ในระบบ แล้วกดปุ่ม &quot;ทดสอบส่งข้อความเข้ากลุ่ม LINE&quot; เพื่อยืนยันว่าข้อความเด้งเข้ากลุ่มเรียบร้อย
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Finding Group ID */}
        {activeTab === 'gas_helper' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-700" />
                วิธีดู Group ID ของกลุ่ม LINE (ง่ายที่สุดผ่าน Google Apps Script)
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                เนื่องจาก LINE ไม่ได้แสดงรหัส Group ID ในแอปตรงๆ คุณสามารถใช้สคริปต์ Google Apps Script เล็กๆ นี้รับ Webhook เมื่อเชิญบอทเข้ากลุ่ม บอทจะพิมพ์ Group ID บอกในกลุ่มทันที!
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  โค้ด Google Apps Script ตรวจหา Group ID:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gasGroupIdHelperCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                {gasGroupIdHelperCode}
              </pre>
            </div>

            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li>เปิด <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">Google Apps Script</a> แล้ววางโค้ดด้านบน</li>
              <li>กด <strong>Deploy &gt; New deployment &gt; Web app</strong> (ตั้งค่า Who has access: Anyone)</li>
              <li>นำ Web App URL ไปกรอกใน <strong>Webhook URL</strong> บน LINE Developers Console แล้วเปิดสวิตช์ <strong>Use webhook</strong></li>
              <li>เมื่อพิมพ์ข้อความใดๆ ในกลุ่ม LINE ที่บอทอยู่ บอทจะตอบกลับเป็น Group ID (เช่น <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-bold">C1234567...</code>) ให้ทันที!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
