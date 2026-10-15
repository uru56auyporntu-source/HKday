import { 
  Personnel, 
  LeaveRecord, 
  SchoolSettings, 
  AuditLog, 
  LeaveType,
  LeaveStatus 
} from '../types/leave';
import { 
  INITIAL_PERSONNEL, 
  INITIAL_LEAVE_RECORDS, 
  INITIAL_SCHOOL_SETTINGS, 
  INITIAL_AUDIT_LOGS,
  THAI_HOLIDAYS_2568,
  createDefaultSignatureSvg 
} from '../data/initialData';

export { createDefaultSignatureSvg };

const STORAGE_KEYS = {
  PERSONNEL: 'huaykhrai_leave_personnel',
  LEAVE_RECORDS: 'huaykhrai_leave_records',
  SCHOOL_SETTINGS: 'huaykhrai_school_settings',
  AUDIT_LOGS: 'huaykhrai_audit_logs',
  ACTIVE_USER_ID: 'huaykhrai_active_user_id',
};

export const getStoredPersonnel = (): Personnel[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PERSONNEL);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
    return INITIAL_PERSONNEL;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PERSONNEL;
  }
};

export const savePersonnel = (list: Personnel[]) => {
  localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(list));
};

export const getStoredLeaveRecords = (): LeaveRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LEAVE_RECORDS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_RECORDS, JSON.stringify(INITIAL_LEAVE_RECORDS));
    return INITIAL_LEAVE_RECORDS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_LEAVE_RECORDS;
  }
};

export const saveLeaveRecords = (records: LeaveRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.LEAVE_RECORDS, JSON.stringify(records));
};

export const getStoredSchoolSettings = (): SchoolSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(INITIAL_SCHOOL_SETTINGS));
    return INITIAL_SCHOOL_SETTINGS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SCHOOL_SETTINGS;
  }
};

export const saveSchoolSettings = (settings: SchoolSettings) => {
  localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(settings));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};

export const addAuditLog = (actorName: string, actorRole: string, action: string, details: string) => {
  const now = new Date();
  const timestamp = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }) + ' ' + now.toLocaleTimeString('th-TH');

  const newLog: AuditLog = {
    id: 'log-' + Date.now(),
    timestamp,
    actorName,
    actorRole,
    action,
    details
  };
  const logs = getStoredAuditLogs();
  const updated = [newLog, ...logs];
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return updated;
};

export const getActiveUserId = (): string => {
  const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
  if (saved) return saved;
  // default to Kanda (teacher)
  return 'p-004';
};

export const setActiveUserId = (id: string) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
};

// Calculate working days excluding Saturdays, Sundays and Thai official holidays
export const calculateWorkingDays = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  const holidaySet = new Set(THAI_HOLIDAYS_2568.map(h => h.date));
  let count = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
};

// Calculate leave usage for a specific personnel in a fiscal year
export interface LeaveBalanceSummary {
  leaveType: LeaveType;
  title: string;
  maxDays: number;
  maxTimes: number;
  usedDays: number;
  usedTimes: number;
  remainingDays: number;
  remainingTimes: number;
}

export const getPersonnelLeaveBalances = (
  personnelId: string, 
  fiscalYear: number, 
  records: LeaveRecord[], 
  settings: SchoolSettings
): LeaveBalanceSummary[] => {
  const userApprovedRecords = records.filter(r => 
    r.personnelId === personnelId && 
    r.fiscalYear === fiscalYear && 
    (r.status === 'approved' || r.status === 'pending_director' || r.status === 'pending_academic')
  );

  return settings.quotas.map(quota => {
    const matchingRecords = userApprovedRecords.filter(r => r.leaveType === quota.leaveType);
    const usedDays = matchingRecords.reduce((sum, r) => sum + r.totalDays, 0);
    const usedTimes = matchingRecords.length;
    const remainingDays = Math.max(0, quota.maxDays - usedDays);
    const remainingTimes = Math.max(0, quota.maxTimes - usedTimes);

    return {
      leaveType: quota.leaveType,
      title: quota.title,
      maxDays: quota.maxDays,
      maxTimes: quota.maxTimes,
      usedDays,
      usedTimes,
      remainingDays,
      remainingTimes
    };
  });
};

// Thai Date formatting helper
export const formatThaiDate = (dateStr: string, includeTime = false): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;

    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatThaiFullDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const thaiFullMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const day = date.getDate();
    const month = thaiFullMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} พ.ศ. ${year}`;
  } catch {
    return dateStr;
  }
};

export const getLeaveTypeLabel = (type: LeaveType): string => {
  switch (type) {
    case 'sick': return 'ลาป่วย';
    case 'personal': return 'ลากิจส่วนตัว';
    case 'maternity': return 'ลาคลอดบุตร';
    case 'ordination': return 'ลาอุปสมบทหรือพิธีฮัจญ์';
    case 'wife_delivery': return 'ลาไปช่วยเหลือภริยาที่คลอดบุตร';
    case 'military': return 'ลาตรวจเลือก / เตรียมพล';
    case 'other': return 'ลาประเภทอื่น ๆ';
    default: return type;
  }
};

export const getStatusBadgeInfo = (status: LeaveStatus) => {
  switch (status) {
    case 'approved':
      return { label: 'อนุมัติแล้ว', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'CheckCircle2' };
    case 'pending_academic':
      return { label: 'รอความเห็นหัวหน้าวิชาการ', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: 'Clock' };
    case 'pending_director':
      return { label: 'รอ ผอ. อนุมัติ', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'FileCheck' };
    case 'rejected':
      return { label: 'ไม่อนุมัติ', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: 'XCircle' };
    case 'cancelled':
      return { label: 'ยกเลิกแล้ว', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'Ban' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: 'Info' };
  }
};

// Export records to CSV with UTF-8 BOM so Thai text displays correctly in Excel and Sheets
export const exportLeaveRecordsToCsv = (records: LeaveRecord[], personnelList: Personnel[]) => {
  const pMap = new Map(personnelList.map(p => [p.id, `${p.prefix}${p.firstName} ${p.lastName}`]));
  
  const headers = [
    'เลขที่ใบลา',
    'ปีงบประมาณ',
    'ชื่อ-สกุล ผู้ลา',
    'ประเภทการลา',
    'วันที่เริ่ม',
    'วันที่สิ้นสุด',
    'จำนวนวัน',
    'เหตุผล',
    'เบอร์โทรติดต่อ',
    'วันที่ยื่น',
    'สถานะ',
    'ความเห็นหัวหน้าวิชาการ',
    'คำสั่ง ผอ.'
  ];

  const rows = records.map(r => [
    `"${r.referenceNumber}"`,
    `"${r.fiscalYear}"`,
    `"${pMap.get(r.personnelId) || r.personnelId}"`,
    `"${getLeaveTypeLabel(r.leaveType)}"`,
    `"${r.startDate}"`,
    `"${r.endDate}"`,
    `"${r.totalDays}"`,
    `"${(r.reason || '').replace(/"/g, '""')}"`,
    `"${r.contactPhone || '-'}"`,
    `"${r.submittedAt.slice(0, 10)}"`,
    `"${getStatusBadgeInfo(r.status).label}"`,
    `"${(r.academicHeadComment || '-').replace(/"/g, '""')}"`,
    `"${(r.directorComment || '-').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `HuayKhrai_Leave_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Google Apps Script template code
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script Web App Backend for ระบบจัดการวันลา
 * โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets เปล่าใหม่ แล้วคลิก 'ส่วนขยาย' (Extensions) > 'Apps Script'
 * 2. ลบโค้ดเดิมทั้งหมด แล้วนำโค้ดด้านล่างนี้ไปวาง
 * 3. คลิก 'การทำให้ใช้งานได้' (Deploy) > 'การทำให้ใช้งานได้ใหม่' (New deployment)
 * 4. เลือกประเภท: เว็บแอป (Web App)
 *    - ผู้เรียกใช้: ฉัน (Execute as me)
 *    - ผู้มีสิทธิ์เข้าถึง: ทุกคน (Anyone)
 * 5. คัดลอก URL ของเว็บแอป (Web App URL) มากรอกในระบบที่เมนู 'เชื่อมต่อ Google Sheets'
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("สถิติการลา") || ss.insertSheet("สถิติการลา");
  var data = sheet.getDataRange().getValues();
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    count: data.length > 1 ? data.length - 1 : 0,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("สถิติการลา");
    
    if (!sheet) {
      sheet = ss.insertSheet("สถิติการลา");
      sheet.appendRow([
        "เลขที่คำขอ", "วันที่ยื่น", "ชื่อ-นามสกุล", "ตำแหน่ง", "ประเภทการลา", 
        "วันที่เริ่ม", "วันที่สิ้นสุด", "จำนวนวัน", "เหตุผลการลา", "ผู้ปฏิบัติหน้าที่แทน", 
        "เบอร์ติดต่อ", "สถานะ", "ความเห็นวิชาการ", "คำสั่งผู้อำนวยการ"
      ]);
      sheet.getRange(1, 1, 1, 14).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;

    if (action === "sync_records") {
      var records = requestData.records || [];
      // ล้างข้อมูลเก่าแล้วเขียนใหม่ทั้งหมด
      if (records.length > 0) {
        var header = [
          "เลขที่คำขอ", "วันที่ยื่น", "ชื่อ-นามสกุล", "ตำแหน่ง", "ประเภทการลา", 
          "วันที่เริ่ม", "วันที่สิ้นสุด", "จำนวนวัน", "เหตุผลการลา", "ผู้ปฏิบัติหน้าที่แทน", 
          "เบอร์ติดต่อ", "สถานะ", "ความเห็นวิชาการ", "คำสั่งผู้อำนวยการ"
        ];
        sheet.clear();
        sheet.appendRow(header);
        sheet.getRange(1, 1, 1, 14).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");

        records.forEach(function(r) {
          sheet.appendRow([
            r.referenceNumber,
            r.submittedAt,
            r.personnelName,
            r.personnelPosition,
            r.leaveTypeLabel,
            r.startDate,
            r.endDate,
            r.totalDays,
            r.reason,
            r.substituteName,
            r.contactPhone,
            r.statusLabel,
            r.academicHeadComment || "",
            r.directorComment || ""
          ]);
        });
      }
    } else if (action === "add_record") {
      var r = requestData.record;
      sheet.appendRow([
        r.referenceNumber,
        r.submittedAt,
        r.personnelName,
        r.personnelPosition,
        r.leaveTypeLabel,
        r.startDate,
        r.endDate,
        r.totalDays,
        r.reason,
        r.substituteName,
        r.contactPhone,
        r.statusLabel,
        r.academicHeadComment || "",
        r.directorComment || ""
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "บันทึกลง Google Sheets เรียบร้อยแล้ว"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

// Sync with Google Sheets Web App endpoint via Server Proxy (avoids CORS)
export const syncWithGoogleSheets = async (
  webhookUrl: string, 
  records: LeaveRecord[], 
  personnelList: Personnel[],
  settings?: SchoolSettings
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, message: 'กรุณากรอก Webhook URL ของ Google Apps Script ที่ถูกต้อง' };
  }

  const pMap = new Map(personnelList.map(p => [p.id, p]));

  const payloadRecords = records.map(r => {
    const p = pMap.get(r.personnelId);
    const sub = r.substitutePersonnelId ? pMap.get(r.substitutePersonnelId) : null;
    return {
      referenceNumber: r.referenceNumber,
      submittedAt: r.submittedAt,
      personnelName: p ? `${p.prefix}${p.firstName} ${p.lastName}` : r.personnelId,
      personnelPosition: p ? `${p.position} ${p.academicStanding}` : '',
      leaveTypeLabel: getLeaveTypeLabel(r.leaveType),
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.totalDays,
      reason: r.reason,
      substituteName: sub ? `${sub.prefix}${sub.firstName} ${sub.lastName}` : '-',
      contactPhone: r.contactPhone,
      statusLabel: getStatusBadgeInfo(r.status).label,
      academicHeadComment: r.academicHeadComment,
      directorComment: r.directorComment
    };
  });

  const payload = {
    action: 'sync_records',
    records: payloadRecords,
    school: settings?.schoolName ? `${settings.schoolName} ${settings.schoolArea}` : 'โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2',
    syncTime: new Date().toISOString()
  };

  try {
    // 1. Try server proxy first (bypasses browser CORS and reads actual response)
    const proxyRes = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        serviceType: 'Google Sheets',
        payload
      })
    });

    const data = await proxyRes.json();
    return {
      success: data.success,
      message: data.message || (data.success ? 'ส่งข้อมูลบันทึกลง Google Sheets สำเร็จเรียบร้อยแล้ว' : 'ส่งข้อมูลไม่สำเร็จ')
    };
  } catch {
    // 2. Direct browser fallback using mode 'no-cors'
    try {
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return { 
        success: true, 
        message: 'ส่งข้อมูลบันทึกลง Google Sheets สำเร็จเรียบร้อยแล้ว' 
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { 
        success: false, 
        message: `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets: ${errorMsg}` 
      };
    }
  }
};

// Fetch central database from server (for cross-device instant sync)
export const fetchDatabaseFromServer = async (): Promise<{
  personnelList?: Personnel[];
  leaveRecords?: LeaveRecord[];
  settings?: SchoolSettings;
  auditLogs?: AuditLog[];
  updatedAt?: string;
} | null> => {
  try {
    const res = await fetch('/api/database');
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
};

// Sync database to central server (persists across all devices and machines)
export const syncDatabaseToServer = async (payload: {
  personnelList: Personnel[];
  leaveRecords: LeaveRecord[];
  settings: SchoolSettings;
  auditLogs: AuditLog[];
}): Promise<{ success: boolean; message: string; updatedAt?: string }> => {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return {
      success: json.success,
      message: json.message || 'บันทึกข้อมูลลงฐานข้อมูลกลางสำเร็จ',
      updatedAt: json.updatedAt
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อฐานข้อมูลกลาง: ${errorMsg}`
    };
  }
};

// Send notification to LINE regular group via LINE Messaging API
export const sendLineNotification = async (
  settings: SchoolSettings,
  messageText: string
): Promise<{ success: boolean; message: string }> => {
  if (!settings.isLineNotifyEnabled) {
    return { success: false, message: 'ระบบแจ้งเตือน LINE ปิดการใช้งานอยู่' };
  }

  const token = settings.lineChannelAccessToken?.trim();
  const to = settings.lineGroupId?.trim();

  if (!token || !to) {
    return { success: false, message: 'ยังไม่ได้ระบุ Channel Access Token หรือ Group ID' };
  }

  try {
    const res = await fetch('/api/line-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        to,
        message: messageText
      })
    });

    const data = await res.json();
    return {
      success: data.success,
      message: data.message || (data.success ? 'ส่งข้อความแจ้งเตือนสำเร็จ' : 'ส่งข้อความไม่สำเร็จ')
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${errorMsg}`
    };
  }
};

// Format LINE message for new leave application
export const formatNewLeaveLineMessage = (
  record: LeaveRecord, 
  applicant: Personnel,
  settings?: SchoolSettings
): string => {
  const schoolTitle = settings?.schoolName && settings?.schoolArea
    ? `${settings.schoolName} ${settings.schoolArea}`
    : 'โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2';

  const positionText = applicant.academicStanding
    ? `${applicant.position} ${applicant.academicStanding}`
    : applicant.position;

  const dateText = record.startDate === record.endDate
    ? `${formatThaiDate(record.startDate)} (${record.totalDays} วันทำการ)`
    : `${formatThaiDate(record.startDate)} ถึง ${formatThaiDate(record.endDate)} (${record.totalDays} วันทำการ)`;

  return [
    `🔔 แจ้งเตือนบันทึกคำขอลาออนไลน์`,
    schoolTitle,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 เลขที่คำขอ: ${record.referenceNumber}`,
    `👤 ผู้ขอลา: ${applicant.prefix}${applicant.firstName} ${applicant.lastName}`,
    `💼 ตำแหน่ง: ${positionText}`,
    `📌 ประเภทการลา: ${getLeaveTypeLabel(record.leaveType)}`,
    `📅 วันที่ลา: ${dateText}`,
    `📝 เหตุผล: ${record.reason || '-'}`,
    `📞 เบอร์โทรติดต่อ: ${record.contactPhone || applicant.phone || '-'}`
  ].join('\n');
};

// Format LINE message for Academic Head review
export const formatAcademicReviewLineMessage = (
  record: LeaveRecord, 
  applicant: Personnel, 
  academicHeadName: string, 
  comment: string
): string => {
  return [
    `📝 หัวหน้าฝ่ายวิชาการลงความเห็นแล้ว`,
    `โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 เลขที่คำขอ: ${record.referenceNumber}`,
    `👤 ผู้ขอลา: ${applicant.prefix}${applicant.firstName} ${applicant.lastName}`,
    `📌 ประเภทการลา: ${getLeaveTypeLabel(record.leaveType)} (${record.totalDays} วันทำการ)`,
    `✍️ ผู้ลงความเห็น: ${academicHeadName}`,
    `💬 ความเห็น: "${comment}"`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⏳ ขั้นตอนต่อไป: รอผู้อำนวยการโรงเรียนสั่งการอนุมัติ`
  ].join('\n');
};

// Format LINE message for Director final decision
export const formatDirectorDecisionLineMessage = (
  record: LeaveRecord, 
  applicant: Personnel, 
  directorName: string, 
  isApproved: boolean, 
  comment: string
): string => {
  const statusIcon = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'อนุมัติการลาเรียบร้อยแล้ว' : 'ไม่อนุมัติการลา';

  return [
    `${statusIcon} แจ้งผลการพิจารณาอนุมัติใบลา`,
    `โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 เลขที่คำขอ: ${record.referenceNumber}`,
    `👤 ผู้ขอลา: ${applicant.prefix}${applicant.firstName} ${applicant.lastName}`,
    `📌 ประเภท: ${getLeaveTypeLabel(record.leaveType)} (${record.totalDays} วันทำการ)`,
    `📅 ช่วงวันที่: ${formatThaiDate(record.startDate)}${record.startDate !== record.endDate ? ` ถึง ${formatThaiDate(record.endDate)}` : ''}`,
    `🎖️ คำสั่ง ผอ.: ${statusText}`,
    `💬 บันทึกคำสั่ง: "${comment || '-'}"`,
    `✍️ ผู้อนุมัติ: ${directorName}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📄 สามารถเปิดดูและพิมพ์แบบใบลาทางการได้ในระบบ`
  ].join('\n');
};
