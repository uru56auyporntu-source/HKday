/**
 * =========================================================================================
 * ระบบจัดการวันลา โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2
 * Google Apps Script Web App - Server-side Logic (Code.gs)
 * =========================================================================================
 * ไฟล์นี้ทำหน้าที่เป็น Back-end ให้กับ Web App:
 * 1. ให้บริการ doGet(e) และ doPost(e) สำหรับเปิดหน้าเว็บและรับคำขอ
 * 2. จัดการฐานข้อมูลบน Google Sheets (Personnel, LeaveRecords, Settings, AuditLogs)
 * 3. บริการ API ให้ Client เรียกผ่าน google.script.run
 * 4. ส่งการแจ้งเตือนผ่าน LINE Notify และ LINE Messaging API
 * =========================================================================================
 */

// ชื่อแผ่นงานมาตรฐานใน Google Sheets
var SHEET_NAMES = {
  PERSONNEL: 'Personnel',
  LEAVE_RECORDS: 'LeaveRecords',
  SETTINGS: 'Settings',
  AUDIT_LOGS: 'AuditLogs'
};

/**
 * ฟังก์ชันหลักเมื่อผู้ใช้เปิด Web App ในเบราว์เซอร์
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  var output = template.evaluate()
    .setTitle('ระบบจัดการวันลา โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

/**
 * ฟังก์ชันรองรับ Webhook หรือ POST request จากภายนอก
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    var payload = rawData ? JSON.parse(rawData) : {};
    var action = payload.action || 'sync';

    if (action === 'get_data') {
      var initialData = getInitialAppData();
      return ContentService.createTextOutput(JSON.stringify(initialData))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'submit_leave') {
      var res = submitLeaveRecord(payload.data);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'send_line' || action === 'line_notify') {
      var token = payload.token || '';
      var to = payload.to || payload.groupId || '';
      var msg = payload.message || '';
      var lineRes = sendLineNotification(msg, token, to);
      return ContentService.createTextOutput(JSON.stringify(lineRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Google Apps Script Web App พร้อมทำงาน' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ค้นหาหรือสร้าง Google Spreadsheet สำหรับเก็บข้อมูลระบบ
 */
function getOrCreateSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (err) {
    // กรณีเป็น Standalone Script
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var savedSsId = scriptProps.getProperty('LEAVE_SYSTEM_SPREADSHEET_ID');

  if (savedSsId) {
    try {
      ss = SpreadsheetApp.openById(savedSsId);
      if (ss) return ss;
    } catch (e) {
      Logger.log('Cannot open spreadsheet from saved ID: ' + e);
    }
  }

  // หากยังไม่มี ให้สร้าง Google Spreadsheet ใหม่
  var newSpreadsheet = SpreadsheetApp.create('ระบบจัดการวันลา โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2');
  var newId = newSpreadsheet.getId();
  scriptProps.setProperty('LEAVE_SYSTEM_SPREADSHEET_ID', newId);
  return newSpreadsheet;
}

/**
 * ตรวจสอบและสร้าง Sheet ต่างๆ พร้อมหัวตาราง หากยังไม่มี
 */
function initSheetsIfMissing(ss) {
  // 1. Personnel Sheet
  var pSheet = ss.getSheetByName(SHEET_NAMES.PERSONNEL);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_NAMES.PERSONNEL);
    pSheet.appendRow([
      'ID', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'วิทยฐานะ',
      'กลุ่มสาระ/ฝ่าย', 'ที่อยู่', 'เบอร์โทรศัพท์', 'อีเมล', 'บทบาท (Role)',
      'ลายมือชื่อ (Data URL/SVG)', 'วันที่เริ่มปฏิบัติงาน'
    ]);
    formatHeaderRow(pSheet);
    seedInitialPersonnel(pSheet);
  }

  // 2. LeaveRecords Sheet
  var lSheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
  if (!lSheet) {
    lSheet = ss.insertSheet(SHEET_NAMES.LEAVE_RECORDS);
    lSheet.appendRow([
      'ID', 'เลขที่ใบลา', 'รหัสผู้ลา', 'ประเภทการลา', 'ปีงบประมาณ',
      'วันที่เริ่มลา', 'วันที่สิ้นสุด', 'ครึ่งวัน', 'ช่วงเวลาครึ่งวัน',
      'จำนวนวันลา', 'เหตุผลการลา', 'สถานที่ติดต่อ', 'เบอร์โทรติดต่อ',
      'รหัสผู้ปฏิบัติหน้าที่แทน', 'ผู้แทนตอบรับแล้ว', 'ชื่อเอกสารแนบ',
      'เวลายื่นใบลา', 'ลายเซ็นผู้ลา',
      'รหัสหัวหน้าวิชาการ', 'ความเห็นหัวหน้าวิชาการ', 'ลายเซ็นวิชาการ', 'เวลาที่วิชาการลงความเห็น',
      'รหัสผู้อำนวยการ', 'คำสั่ง/ความเห็น ผอ.', 'ลายเซ็น ผอ.', 'เวลาที่ ผอ. สั่งการ',
      'สถานะการลา', 'เหตุผลที่ยกเลิก', 'ผู้ยกเลิก', 'เวลายกเลิก'
    ]);
    formatHeaderRow(lSheet);
    seedInitialLeaveRecords(lSheet);
  }

  // 3. Settings Sheet
  var sSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sSheet) {
    sSheet = ss.insertSheet(SHEET_NAMES.SETTINGS);
    sSheet.appendRow(['Key', 'Value', 'คำอธิบาย']);
    formatHeaderRow(sSheet);
    seedInitialSettings(sSheet);
  }

  // 4. AuditLogs Sheet
  var aSheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
  if (!aSheet) {
    aSheet = ss.insertSheet(SHEET_NAMES.AUDIT_LOGS);
    aSheet.appendRow(['ID', 'วัน-เวลา', 'ชื่อผู้ดำเนินการ', 'ตำแหน่ง/บทบาท', 'การกระทำ (Action)', 'รายละเอียด', 'IP/แหล่งที่มา']);
    formatHeaderRow(aSheet);
    seedInitialAuditLogs(aSheet);
  }

  // ลบ Sheet1 เริ่มต้นถ้ามีมากกว่า 1 แผ่น
  var defaultSheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (defaultSheet1 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet1);
    } catch (e) {}
  }
}

/**
 * ตกแต่งแถวหัวตารางให้อ่านง่าย
 */
function formatHeaderRow(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  range.setBackground('#1e3a8a')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontFamily('Prompt');
  sheet.setFrozenRows(1);
}

/**
 * ข้อมูลเริ่มต้น: บุคลากรโรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2
 */
function seedInitialPersonnel(sheet) {
  var list = [
    [
      'p-001', 'นาย', 'สมบูรณ์', 'ศิริวัฒนานนท์', 'ผู้อำนวยการโรงเรียน', 'เชี่ยวชาญ',
      'ฝ่ายบริหารงานทั่วไป', '99/4 ม.2 ต.ดงคู่ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '081-876-5432', 'somboon.s@huaykhrai.ac.th', 'director',
      createSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'), '2010-05-15'
    ],
    [
      'p-002', 'นาง', 'พรรณทิพา', 'สุริยฉัตร', 'ครู', 'ชำนาญการพิเศษ',
      'ฝ่ายบริหารงานวิชาการ (หัวหน้า)', '45/1 ม.5 ต.หาดเสี้ยว อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '089-765-4321', 'panthipa.s@huaykhrai.ac.th', 'academic_head',
      createSignatureSvg('นางพรรณทิพา สุริยฉัตร'), '2014-06-01'
    ],
    [
      'p-003', 'นาย', 'ณัฐพงษ์', 'คงเจริญ', 'ครู', 'ชำนาญการ',
      'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', '12 ม.1 ต.หนองอ้อ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '084-321-9876', 'nattapong.k@huaykhrai.ac.th', 'admin',
      createSignatureSvg('นายณัฐพงษ์ คงเจริญ'), '2018-09-10'
    ],
    [
      'p-004', 'นางสาว', 'กานดา', 'วรรณประเสริฐ', 'ครู', 'ชำนาญการ',
      'กลุ่มสาระการเรียนรู้ภาษาไทย', '78 ม.3 ต.บ้านตึก อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '086-456-7890', 'kanda.w@huaykhrai.ac.th', 'teacher',
      createSignatureSvg('นางสาวกานดา วรรณประเสริฐ'), '2017-10-01'
    ],
    [
      'p-005', 'นาย', 'วีระชัย', 'แก้วประดับ', 'ครู', 'ชำนาญการพิเศษ',
      'กลุ่มสาระการเรียนรู้คณิตศาสตร์', '150/3 ม.4 ต.สารจิตร อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '082-111-2233', 'weerachai.k@huaykhrai.ac.th', 'teacher',
      createSignatureSvg('นายวีระชัย แก้วประดับ'), '2012-07-16'
    ],
    [
      'p-006', 'นางสาว', 'ปรียานุช', 'แสงสว่าง', 'ครูผู้ช่วย', 'ไม่มีวิทยฐานะ (ครูผู้ช่วย)',
      'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', '33 ม.2 ต.ป่างิ้ว อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '085-998-8776', 'priyanuch.s@huaykhrai.ac.th', 'teacher',
      createSignatureSvg('นางสาวปรียานุช แสงสว่าง'), '2023-11-01'
    ],
    [
      'p-007', 'นาย', 'ชัชวาลย์', 'ใจภักดี', 'ครู', 'ชำนาญการ',
      'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', '88 ม.6 ต.แม่สิน อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '087-654-3210', 'chatchawal.j@huaykhrai.ac.th', 'teacher',
      createSignatureSvg('นายชัชวาลย์ ใจภักดี'), '2016-03-20'
    ],
    [
      'p-008', 'นางสาว', 'ศิริพร', 'ทองคำ', 'เจ้าพนักงานธุรการปฏิบัติงาน', 'ปฏิบัติงาน',
      'งานสารบรรณและธุรการโรงเรียน', '55/2 ม.1 ต.ดงคู่ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
      '083-222-4455', 'siriporn.t@huaykhrai.ac.th', 'teacher',
      createSignatureSvg('นางสาวศิริพร ทองคำ'), '2020-01-15'
    ]
  ];

  list.forEach(function(row) {
    sheet.appendRow(row);
  });
}

/**
 * ข้อมูลเริ่มต้น: ตัวอย่างใบลา
 */
function seedInitialLeaveRecords(sheet) {
  var records = [
    [
      'leave-001', 'ลร.01/2568', 'p-004', 'sick', 2568,
      '2025-01-13', '2025-01-14', false, '', 2,
      'มีอาการไข้หวัด ปวดศีรษะและเจ็บคออย่างรุนแรง แพทย์แนะนำให้พักผ่อนรักษาตัว',
      '78 ม.3 ต.บ้านตึก อ.ศรีสัชนาลัย จ.สุโขทัย โทร 086-456-7890', '086-456-7890',
      'p-006', true, 'ใบรับรองแพทย์_กานดา.pdf',
      '2025-01-12T19:30:00Z', createSignatureSvg('นางสาวกานดา วรรณประเสริฐ'),
      'p-002', 'เห็นควรอนุญาต ได้มอบหมายให้นางสาวปรียานุช แสงสว่าง ปฏิบัติการสอนแทนเรียบร้อยแล้ว',
      createSignatureSvg('นางพรรณทิพา สุริยฉัตร'), '2025-01-13T07:45:00Z',
      'p-001', 'ทราบและอนุมัติ', createSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'),
      '2025-01-13T08:15:00Z', 'approved', '', '', ''
    ],
    [
      'leave-002', 'ลร.02/2568', 'p-005', 'personal', 2568,
      '2025-02-06', '2025-02-07', false, '', 2,
      'เดินทางไปติดต่อราชการเกี่ยวกับที่ดินมรดกและทำนิติกรรม ณ สำนักงานที่ดินจังหวัดสุโขทัย',
      '150/3 ม.4 ต.สารจิตร อ.ศรีสัชนาลัย จ.สุโขทัย', '082-111-2233',
      'p-003', true, '',
      '2025-02-03T10:15:00Z', createSignatureSvg('นายวีระชัย แก้วประดับ'),
      'p-002', 'เห็นควรอนุญาต ได้ตรวจสอบภาระงานสอนและใบงานมอบหมายแล้ว',
      createSignatureSvg('นางพรรณทิพา สุริยฉัตร'), '2025-02-03T14:20:00Z',
      'p-001', 'อนุมัติ', createSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'),
      '2025-02-04T09:00:00Z', 'approved', '', '', ''
    ],
    [
      'leave-003', 'ลร.03/2568', 'p-007', 'personal', 2568,
      '2025-03-24', '2025-03-26', false, '', 3,
      'พาครอบครัวเดินทางไปตรวจสุขภาพประจำปี ณ โรงพยาบาลศูนย์พุทธชินราช จ.พิษณุโลก',
      '88 ม.6 ต.แม่สิน อ.ศรีสัชนาลัย จ.สุโขทัย', '087-654-3210',
      'p-005', true, '',
      '2025-03-18T11:00:00Z', createSignatureSvg('นายชัชวาลย์ ใจภักดี'),
      'p-002', 'เห็นควรอนุญาต ในช่วงเวลาดังกล่าวไม่มีการสอบหรือกิจกรรมเร่งด่วน',
      createSignatureSvg('นางพรรณทิพา สุริยฉัตร'), '2025-03-18T15:30:00Z',
      '', '', '', '', 'pending_director', '', '', ''
    ],
    [
      'leave-004', 'ลร.04/2568', 'p-006', 'sick', 2568,
      '2025-04-07', '2025-04-07', true, 'morning', 0.5,
      'มีนัดทำฟันและพบทันตแพทย์ ณ โรงพยาบาลศรีสัชนาลัย ในช่วงเช้า',
      '33 ม.2 ต.ป่างิ้ว อ.ศรีสัชนาลัย จ.สุโขทัย', '085-998-8776',
      'p-004', true, '',
      '2025-04-05T08:30:00Z', createSignatureSvg('นางสาวปรียานุช แสงสว่าง'),
      '', '', '', '',
      '', '', '', '', 'pending_academic', '', '', ''
    ]
  ];

  records.forEach(function(row) {
    sheet.appendRow(row);
  });
}

/**
 * ข้อมูลเริ่มต้น: การตั้งค่าสถานศึกษา
 */
function seedInitialSettings(sheet) {
  var defaultQuotas = [
    { leaveType: 'sick', title: 'ลาป่วย', maxDays: 60, maxTimes: 20, description: 'ลาป่วยตามจริง ลาติดต่อกัน 3 วันทำการขึ้นไปต้องมีใบรับรองแพทย์' },
    { leaveType: 'personal', title: 'ลากิจส่วนตัว', maxDays: 45, maxTimes: 15, description: 'มีกิจจำเป็นต้องยื่นใบลาล่วงหน้า ได้รับอนุญาตก่อนจึงหยุดได้' },
    { leaveType: 'maternity', title: 'ลาคลอดบุตร', maxDays: 90, maxTimes: 1, description: 'ลาคลอดบุตรได้ไม่เกิน 90 วัน ไม่ต้องมีใบรับรองแพทย์ล่วงหน้า' },
    { leaveType: 'ordination', title: 'ลาอุปสมบทหรือไปประกอบพิธีฮัจญ์', maxDays: 120, maxTimes: 1, description: 'สำหรับข้าราชการที่รับราชการไม่น้อยกว่า 1 ปี ยื่นล่วงหน้าอย่างน้อย 60 วัน' },
    { leaveType: 'wife_delivery', title: 'ลาไปช่วยเหลือภริยาที่คลอดบุตร', maxDays: 15, maxTimes: 1, description: 'ติดต่อกันได้ไม่เกิน 15 วันทำการ' },
    { leaveType: 'military', title: 'ลาเข้ารับการตรวจเลือกหรือเตรียมพล', maxDays: 60, maxTimes: 2, description: 'ลาตามหมายเรียกของทางราชการ' },
    { leaveType: 'other', title: 'ลาประเภทอื่น ๆ / อบรมพัฒนา', maxDays: 30, maxTimes: 10, description: 'ลาไปศึกษา ฝึกอบรม ดูงาน หรือปฏิบัติงานวิจัย' }
  ];

  var rows = [
    ['schoolName', 'โรงเรียนบ้านห้วยไคร้', 'ชื่อสถานศึกษา'],
    ['schoolArea', 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2', 'สังกัด'],
    ['currentFiscalYear', '2568', 'ปีงบประมาณปัจจุบัน'],
    ['directorId', 'p-001', 'รหัสผู้อำนวยการ'],
    ['academicHeadId', 'p-002', 'รหัสหัวหน้าวิชาการ'],
    ['adminId', 'p-003', 'รหัสผู้ดูแลระบบ'],
    ['phone', '055-678901', 'เบอร์โทรศัพท์สถานศึกษา'],
    ['address', 'หมู่ที่ 2 ตำบลดงคู่ อำเภอศรีสัชนาลัย จังหวัดสุโขทัย 64130', 'ที่อยู่โรงเรียน'],
    ['pinCode', '1234', 'รหัส PIN ความปลอดภัย'],
    ['lineChannelAccessToken', '', 'LINE Channel Access Token / LINE Notify Token'],
    ['lineGroupId', '', 'LINE Group ID / Target ID'],
    ['isLineNotifyEnabled', 'false', 'เปิดใช้งานแจ้งเตือน LINE'],
    ['quotas', JSON.stringify(defaultQuotas), 'ข้อมูลโควต้าวันลาแต่ละประเภท']
  ];

  rows.forEach(function(r) {
    sheet.appendRow(r);
  });
}

/**
 * ข้อมูลเริ่มต้น: Audit Logs
 */
function seedInitialAuditLogs(sheet) {
  var logs = [
    ['log-001', '2025-01-12 19:30:00', 'นางสาวกานดา วรรณประเสริฐ', 'ครู', 'ยื่นใบลาออนไลน์', 'ยื่นคำขอลาป่วย (ลร.01/2568) จำนวน 2 วัน วันที่ 13-14 ม.ค. 2568', 'Google Apps Script'],
    ['log-002', '2025-01-13 07:45:00', 'นางพรรณทิพา สุริยฉัตร', 'หัวหน้าวิชาการ', 'ลงความเห็นการลา', 'บันทึกความเห็นชอบใบลา ลร.01/2568 (กานดา วรรณประเสริฐ) เสนอผู้อำนวยการ', 'Google Apps Script'],
    ['log-003', '2025-01-13 08:15:00', 'นายสมบูรณ์ ศิริวัฒนานนท์', 'ผู้อำนวยการโรงเรียน', 'อนุมัติการลา', 'อนุมัติใบลา ลร.01/2568 (กานดา วรรณประเสริฐ) สำเร็จ', 'Google Apps Script'],
    ['log-004', '2025-02-04 09:00:00', 'นายสมบูรณ์ ศิริวัฒนานนท์', 'ผู้อำนวยการโรงเรียน', 'อนุมัติการลา', 'อนุมัติใบลา ลร.02/2568 (วีระชัย แก้วประดับ) สำเร็จ', 'Google Apps Script'],
    ['log-005', '2025-03-18 15:30:00', 'นางพรรณทิพา สุริยฉัตร', 'หัวหน้าวิชาการ', 'ลงความเห็นการลา', 'เห็นควรอนุญาตใบลา ลร.03/2568 (ชัชวาลย์ ใจภักดี) รอการอนุมัติจาก ผอ.', 'Google Apps Script']
  ];

  logs.forEach(function(l) {
    sheet.appendRow(l);
  });
}

/**
 * ฟังก์ชันสร้างลายเซ็นเริ่มต้นแบบ SVG Data URL
 */
function createSignatureSvg(name) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">' +
    '<path d="M 20 45 Q 60 15, 90 40 T 150 35 T 200 45 M 50 55 Q 110 50, 170 58" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round"/>' +
    '<text x="110" y="65" font-family="sans-serif" font-size="11" fill="#4b5563" text-anchor="middle">(' + name + ')</text>' +
    '</svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// =========================================================================================
// API Functions สำหรับเรียกใช้งานผ่าน google.script.run
// =========================================================================================

/**
 * 1. ดึงข้อมูลทั้งหมดในระบบเพื่อโหลดเข้าหน้าเว็บ
 */
function getInitialAppData() {
  try {
    var ss = getOrCreateSpreadsheet();
    initSheetsIfMissing(ss);

    var personnelList = readPersonnelFromSheet(ss);
    var leaveRecords = readLeaveRecordsFromSheet(ss);
    var settings = readSettingsFromSheet(ss);
    var auditLogs = readAuditLogsFromSheet(ss);

    return {
      success: true,
      personnelList: personnelList,
      leaveRecords: leaveRecords,
      settings: settings,
      auditLogs: auditLogs,
      spreadsheetUrl: ss.getUrl()
    };
  } catch (err) {
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.toString()
    };
  }
}

/**
 * อ่านบุคลากรจาก Sheet
 */
function readPersonnelFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PERSONNEL);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    result.push({
      id: String(row[0]),
      prefix: String(row[1] || ''),
      firstName: String(row[2] || ''),
      lastName: String(row[3] || ''),
      position: String(row[4] || ''),
      academicStanding: String(row[5] || ''),
      department: String(row[6] || ''),
      address: String(row[7] || ''),
      phone: String(row[8] || ''),
      email: String(row[9] || ''),
      role: String(row[10] || 'teacher'),
      signatureUrl: String(row[11] || ''),
      hireDate: row[12] ? formatSimpleDate(row[12]) : ''
    });
  }
  return result;
}

/**
 * อ่านประวัติการลาจาก Sheet
 */
function readLeaveRecordsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    result.push({
      id: String(row[0]),
      referenceNumber: String(row[1] || ''),
      personnelId: String(row[2] || ''),
      leaveType: String(row[3] || 'sick'),
      fiscalYear: Number(row[4]) || 2568,
      startDate: formatSimpleDate(row[5]),
      endDate: formatSimpleDate(row[6]),
      isHalfDay: row[7] === true || String(row[7]).toLowerCase() === 'true',
      halfDayPeriod: String(row[8] || ''),
      totalDays: Number(row[9]) || 1,
      reason: String(row[10] || ''),
      contactAddress: String(row[11] || ''),
      contactPhone: String(row[12] || ''),
      substitutePersonnelId: String(row[13] || ''),
      substituteAccepted: row[14] === true || String(row[14]).toLowerCase() === 'true',
      attachmentName: String(row[15] || ''),
      submittedAt: String(row[16] || ''),
      applicantSignature: String(row[17] || ''),
      academicHeadId: String(row[18] || ''),
      academicHeadComment: String(row[19] || ''),
      academicHeadSignature: String(row[20] || ''),
      academicHeadActionDate: String(row[21] || ''),
      directorId: String(row[22] || ''),
      directorComment: String(row[23] || ''),
      directorSignature: String(row[24] || ''),
      directorActionDate: String(row[25] || ''),
      status: String(row[26] || 'pending_academic'),
      cancellationReason: String(row[27] || ''),
      cancelledBy: String(row[28] || ''),
      cancelledAt: String(row[29] || '')
    });
  }
  return result;
}

/**
 * อ่านการตั้งค่าจาก Sheet
 */
function readSettingsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  var settings = {
    schoolName: 'โรงเรียนบ้านห้วยไคร้',
    schoolArea: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2',
    currentFiscalYear: 2568,
    directorId: 'p-001',
    academicHeadId: 'p-002',
    adminId: 'p-003',
    phone: '055-678901',
    address: 'หมู่ที่ 2 ตำบลดงคู่ อำเภอศรีสัชนาลัย จังหวัดสุโขทัย 64130',
    pinCode: '1234',
    lineChannelAccessToken: '',
    lineGroupId: '',
    isLineNotifyEnabled: false,
    quotas: []
  };

  if (!sheet) return settings;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var val = data[i][1];
    if (!key) continue;

    if (key === 'quotas') {
      try {
        settings.quotas = JSON.parse(val);
      } catch (e) {}
    } else if (key === 'currentFiscalYear') {
      settings.currentFiscalYear = Number(val) || 2568;
    } else if (key === 'isLineNotifyEnabled') {
      settings.isLineNotifyEnabled = val === true || String(val).toLowerCase() === 'true';
    } else {
      settings[key] = String(val || '');
    }
  }
  return settings;
}

/**
 * อ่านประวัติ Audit Logs จาก Sheet
 */
function readAuditLogsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  // อ่านจากล่างขึ้นบนเพื่อให้รายการใหม่อยู่ด้านบน
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    if (!row[0]) continue;
    result.push({
      id: String(row[0]),
      timestamp: String(row[1] || ''),
      actorName: String(row[2] || ''),
      actorRole: String(row[3] || ''),
      action: String(row[4] || ''),
      details: String(row[5] || ''),
      ip: String(row[6] || '')
    });
  }
  return result;
}

/**
 * แปลง Date หรือ string เป็น YYYY-MM-DD
 */
function formatSimpleDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val).split('T')[0];
}

/**
 * สร้างเลขที่ใบลาอัตโนมัติ เช่น ลร.05/2568
 */
function generateNextReferenceNumber(ss, fiscalYear) {
  var sheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
  var nextNum = 1;
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    var maxFound = 0;
    var fYearStr = String(fiscalYear || 2568);

    for (var i = 0; i < data.length; i++) {
      var ref = String(data[i][0] || '');
      // Format: ลร.XX/YYYY
      var match = ref.match(/ลร\.(\d+)\/(\d+)/);
      if (match) {
        var num = parseInt(match[1], 10);
        var yr = match[2];
        if (yr === fYearStr && num > maxFound) {
          maxFound = num;
        }
      }
    }
    nextNum = maxFound + 1;
  }
  var padded = nextNum < 10 ? '0' + nextNum : String(nextNum);
  return 'ลร.' + padded + '/' + (fiscalYear || 2568);
}

/**
 * 2. บันทึกคำขอลาใหม่ (ยื่นใบลา)
 */
function submitLeaveRecord(leaveData) {
  try {
    var ss = getOrCreateSpreadsheet();
    initSheetsIfMissing(ss);
    var lSheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);

    var fiscalYear = leaveData.fiscalYear || 2568;
    var refNumber = leaveData.referenceNumber || generateNextReferenceNumber(ss, fiscalYear);
    var newId = 'leave-' + new Date().getTime();
    var submittedAt = new Date().toISOString();

    var row = [
      newId,
      refNumber,
      leaveData.personnelId,
      leaveData.leaveType,
      fiscalYear,
      leaveData.startDate,
      leaveData.endDate,
      leaveData.isHalfDay ? true : false,
      leaveData.halfDayPeriod || '',
      leaveData.totalDays || 1,
      leaveData.reason || '',
      leaveData.contactAddress || '',
      leaveData.contactPhone || '',
      leaveData.substitutePersonnelId || '',
      leaveData.substituteAccepted !== false,
      leaveData.attachmentName || '',
      submittedAt,
      leaveData.applicantSignature || '',
      '', '', '', '', // academic
      '', '', '', '', // director
      'pending_academic', // status
      '', '', ''
    ];

    lSheet.appendRow(row);

    // บันทึก Audit Log
    addAuditLogEntry(
      ss,
      leaveData.applicantName || 'ครูผู้ยื่นใบลา',
      'ครู/บุคลากร',
      'ยื่นใบลาออนไลน์',
      'ยื่นขอ' + getLeaveTypeName(leaveData.leaveType) + ' (' + refNumber + ') จำนวน ' + (leaveData.totalDays || 1) + ' วัน'
    );

    // ส่งแจ้งเตือน LINE
    var settings = readSettingsFromSheet(ss);
    if (settings.isLineNotifyEnabled && settings.lineChannelAccessToken) {
      var lineMsg = '📌 มีคำขอลาใหม่ (' + refNumber + ')\n' +
        'ผู้ขอลา: ' + (leaveData.applicantName || 'บุคลากร') + '\n' +
        'ประเภท: ' + getLeaveTypeName(leaveData.leaveType) + '\n' +
        'วันที่ลา: ' + leaveData.startDate + ' ถึง ' + leaveData.endDate + ' (รวม ' + leaveData.totalDays + ' วัน)\n' +
        'เหตุผล: ' + leaveData.reason + '\n' +
        'สถานะ: รอหัวหน้าฝ่ายวิชาการตรวจสอบ';
      sendLineNotification(lineMsg, settings.lineChannelAccessToken, settings.lineGroupId);
    }

    return {
      success: true,
      message: 'ยื่นใบลาเรียบร้อยแล้ว เลขที่อ้างอิง: ' + refNumber,
      recordId: newId,
      referenceNumber: refNumber
    };
  } catch (err) {
    return {
      success: false,
      message: 'ไม่สามารถบันทึกใบลาได้: ' + err.toString()
    };
  }
}

/**
 * 3. บันทึกความเห็นหัวหน้าฝ่ายวิชาการ
 */
function reviewLeaveRecord(reviewData) {
  try {
    var ss = getOrCreateSpreadsheet();
    var lSheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
    var data = lSheet.getDataRange().getValues();

    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === reviewData.recordId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'ไม่พบรายการใบลาที่ต้องการลงความเห็น' };
    }

    var now = new Date().toISOString();
    var isApprove = reviewData.action === 'recommend' || reviewData.action === 'approve';
    var newStatus = isApprove ? 'pending_director' : 'rejected';

    // คอลัมน์ที่ 19-22: หัวหน้าวิชาการ
    // คอลัมน์ที่ 27: Status
    lSheet.getRange(targetRow, 19).setValue(reviewData.academicHeadId || 'p-002');
    lSheet.getRange(targetRow, 20).setValue(reviewData.comment || 'เห็นควรอนุญาต');
    lSheet.getRange(targetRow, 21).setValue(reviewData.signature || '');
    lSheet.getRange(targetRow, 22).setValue(now);
    lSheet.getRange(targetRow, 27).setValue(newStatus);

    // Audit Log
    addAuditLogEntry(
      ss,
      reviewData.actorName || 'หัวหน้าฝ่ายวิชาการ',
      'หัวหน้าวิชาการ',
      'ลงความเห็นใบลา',
      (isApprove ? 'เห็นควรอนุญาต' : 'ไม่เห็นควรอนุญาต') + ' ใบลา ' + reviewData.referenceNumber + ': ' + (reviewData.comment || '')
    );

    // LINE Notification
    var settings = readSettingsFromSheet(ss);
    if (settings.isLineNotifyEnabled && settings.lineChannelAccessToken) {
      var lineMsg = '📝 หัวหน้าวิชาการลงความเห็นแล้ว\n' +
        'ใบลาเลขที่: ' + reviewData.referenceNumber + '\n' +
        'ความเห็น: ' + (reviewData.comment || 'เห็นควรอนุญาต') + '\n' +
        'สถานะ: ' + (isApprove ? 'ส่งต่อผู้อำนวยการโรงเรียนเพื่อสั่งการ' : 'ไม่เห็นควรอนุญาต');
      sendLineNotification(lineMsg, settings.lineChannelAccessToken, settings.lineGroupId);
    }

    return { success: true, message: 'บันทึกความเห็นวิชาการเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.toString() };
  }
}

/**
 * 4. บันทึกคำสั่งอนุมัติของผู้อำนวยการโรงเรียน
 */
function approveLeaveRecord(approvalData) {
  try {
    var ss = getOrCreateSpreadsheet();
    var lSheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
    var data = lSheet.getDataRange().getValues();

    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === approvalData.recordId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'ไม่พบรายการใบลาที่ต้องการอนุมัติ' };
    }

    var now = new Date().toISOString();
    var isApprove = approvalData.action === 'approve';
    var newStatus = isApprove ? 'approved' : 'rejected';

    // คอลัมน์ 23-26: ผอ.
    // คอลัมน์ 27: Status
    lSheet.getRange(targetRow, 23).setValue(approvalData.directorId || 'p-001');
    lSheet.getRange(targetRow, 24).setValue(approvalData.comment || (isApprove ? 'อนุมัติ' : 'ไม่อนุมัติ'));
    lSheet.getRange(targetRow, 25).setValue(approvalData.signature || '');
    lSheet.getRange(targetRow, 26).setValue(now);
    lSheet.getRange(targetRow, 27).setValue(newStatus);

    // Audit Log
    addAuditLogEntry(
      ss,
      approvalData.actorName || 'นายสมบูรณ์ ศิริวัฒนานนท์ (ผอ.)',
      'ผู้อำนวยการ',
      isApprove ? 'อนุมัติการลา' : 'ไม่อนุมัติการลา',
      (isApprove ? 'อนุมัติ' : 'ไม่อนุมัติ') + ' ใบลาเลขที่ ' + approvalData.referenceNumber + ': ' + (approvalData.comment || '')
    );

    // LINE Notification
    var settings = readSettingsFromSheet(ss);
    if (settings.isLineNotifyEnabled && settings.lineChannelAccessToken) {
      var lineMsg = (isApprove ? '✅ อนุมัติการลาแล้ว' : '❌ ไม่อนุมัติการลา') + '\n' +
        'ใบลาเลขที่: ' + approvalData.referenceNumber + '\n' +
        'คำสั่ง ผอ.: ' + (approvalData.comment || (isApprove ? 'อนุมัติ' : 'ไม่อนุมัติ')) + '\n' +
        'ผู้มีอำนาจสั่งการ: ผู้อำนวยการโรงเรียนบ้านห้วยไคร้';
      sendLineNotification(lineMsg, settings.lineChannelAccessToken, settings.lineGroupId);
    }

    return { success: true, message: 'บันทึกคำสั่ง ' + (isApprove ? 'อนุมัติ' : 'ไม่อนุมัติ') + ' เรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.toString() };
  }
}

/**
 * 5. ขอยกเลิกใบลา (โดยผู้ขอลา)
 */
function cancelLeaveRecord(cancelData) {
  try {
    var ss = getOrCreateSpreadsheet();
    var lSheet = ss.getSheetByName(SHEET_NAMES.LEAVE_RECORDS);
    var data = lSheet.getDataRange().getValues();

    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === cancelData.recordId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'ไม่พบรายการใบลา' };
    }

    var now = new Date().toISOString();
    // คอลัมน์ 27: Status, 28: CancellationReason, 29: CancelledBy, 30: CancelledAt
    lSheet.getRange(targetRow, 27).setValue('cancelled');
    lSheet.getRange(targetRow, 28).setValue(cancelData.reason || 'ผู้ขอยกเลิกความจำเป็น');
    lSheet.getRange(targetRow, 29).setValue(cancelData.cancelledBy || 'ผู้ลา');
    lSheet.getRange(targetRow, 30).setValue(now);

    addAuditLogEntry(
      ss,
      cancelData.actorName || 'ผู้ขอลา',
      'ครู/บุคลากร',
      'ยกเลิกใบลา',
      'ขอยกเลิกใบลา ' + cancelData.referenceNumber + ' เนื่องจาก: ' + (cancelData.reason || 'ไม่มีระบุ')
    );

    return { success: true, message: 'ยกเลิกใบลาเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.toString() };
  }
}

/**
 * 6. บันทึกรายชื่อบุคลากร (เพิ่มหรือแก้ไข)
 */
function savePersonnelList(personnelList) {
  try {
    var ss = getOrCreateSpreadsheet();
    var pSheet = ss.getSheetByName(SHEET_NAMES.PERSONNEL);
    if (!pSheet) {
      initSheetsIfMissing(ss);
      pSheet = ss.getSheetByName(SHEET_NAMES.PERSONNEL);
    }

    // ล้างข้อมูลเดิมตั้งแต่แถวที่ 2
    if (pSheet.getLastRow() > 1) {
      pSheet.deleteRows(2, pSheet.getLastRow() - 1);
    }

    personnelList.forEach(function(p) {
      pSheet.appendRow([
        p.id, p.prefix, p.firstName, p.lastName, p.position, p.academicStanding,
        p.department, p.address, p.phone, p.email, p.role, p.signatureUrl, p.hireDate
      ]);
    });

    return { success: true, message: 'บันทึกรายชื่อบุคลากรเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'ไม่สามารถบันทึกบุคลากรได้: ' + err.toString() };
  }
}

/**
 * 7. บันทึกการตั้งค่าสถานศึกษา
 */
function saveSchoolSettings(settings) {
  try {
    var ss = getOrCreateSpreadsheet();
    var sSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
    if (!sSheet) {
      initSheetsIfMissing(ss);
      sSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
    }

    // ล้างข้อมูลเดิมตั้งแต่แถวที่ 2
    if (sSheet.getLastRow() > 1) {
      sSheet.deleteRows(2, sSheet.getLastRow() - 1);
    }

    var rows = [
      ['schoolName', settings.schoolName || 'โรงเรียนบ้านห้วยไคร้', 'ชื่อสถานศึกษา'],
      ['schoolArea', settings.schoolArea || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2', 'สังกัด'],
      ['currentFiscalYear', String(settings.currentFiscalYear || 2568), 'ปีงบประมาณปัจจุบัน'],
      ['directorId', settings.directorId || 'p-001', 'รหัสผู้อำนวยการ'],
      ['academicHeadId', settings.academicHeadId || 'p-002', 'รหัสหัวหน้าวิชาการ'],
      ['adminId', settings.adminId || 'p-003', 'รหัสผู้ดูแลระบบ'],
      ['phone', settings.phone || '055-678901', 'เบอร์โทรศัพท์สถานศึกษา'],
      ['address', settings.address || '', 'ที่อยู่โรงเรียน'],
      ['pinCode', settings.pinCode || '1234', 'รหัส PIN ความปลอดภัย'],
      ['lineChannelAccessToken', settings.lineChannelAccessToken || '', 'LINE Channel Access Token / Notify Token'],
      ['lineGroupId', settings.lineGroupId || '', 'LINE Group ID / Target ID'],
      ['isLineNotifyEnabled', settings.isLineNotifyEnabled ? 'true' : 'false', 'เปิดใช้งานแจ้งเตือน LINE'],
      ['quotas', JSON.stringify(settings.quotas || []), 'ข้อมูลโควต้าวันลา']
    ];

    rows.forEach(function(r) {
      sSheet.appendRow(r);
    });

    return { success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'ไม่สามารถบันทึกการตั้งค่าได้: ' + err.toString() };
  }
}

/**
 * บันทึก Audit Log เพิ่ม 1 รายการ
 */
function addAuditLogEntry(ss, actorName, actorRole, action, details) {
  try {
    var aSheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
    if (!aSheet) return;

    var now = new Date();
    var timestampStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    var logId = 'log-' + now.getTime();

    aSheet.appendRow([
      logId,
      timestampStr,
      actorName,
      actorRole,
      action,
      details,
      'Web App'
    ]);
  } catch (e) {
    Logger.log('Cannot write audit log: ' + e);
  }
}

/**
 * ส่งการแจ้งเตือนไปยัง LINE
 */
function sendLineNotification(message, token, groupId) {
  if (!token) return { success: false, message: 'ไม่มี Token' };

  try {
    // 1. ถ้ามี groupId แสดงว่าใช้ LINE Messaging API Push
    if (groupId && groupId.trim() !== '') {
      var pushUrl = 'https://api.line.me/v2/bot/message/push';
      var payload = {
        to: groupId.trim(),
        messages: [{ type: 'text', text: message }]
      };
      var response = UrlFetchApp.fetch(pushUrl, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + token.trim()
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      return { success: response.getResponseCode() === 200 };
    } else {
      // 2. ถ้าไม่มี groupId ให้ถือว่าเป็น LINE Notify Token
      var notifyUrl = 'https://notify-api.line.me/api/notify';
      var response = UrlFetchApp.fetch(notifyUrl, {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + token.trim()
        },
        payload: {
          message: '\n' + message
        },
        muteHttpExceptions: true
      });
      return { success: response.getResponseCode() === 200 };
    }
  } catch (err) {
    Logger.log('LINE Notify error: ' + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * ทดสอบส่ง LINE Notification
 */
function testLineNotification(token, groupId) {
  var testMsg = '🔔 ทดสอบการเชื่อมต่อระบบแจ้งเตือนการลา\n' +
    'โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2\n' +
    'ระบบเชื่อมต่อสำเร็จเมื่อ: ' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
  return sendLineNotification(testMsg, token, groupId);
}

/**
 * ชื่อภาษาไทยของประเภทการลา
 */
function getLeaveTypeName(type) {
  switch (type) {
    case 'sick': return 'ลาป่วย';
    case 'personal': return 'ลากิจส่วนตัว';
    case 'maternity': return 'ลาคลอดบุตร';
    case 'ordination': return 'ลาอุปสมบทหรือพิธีฮัจญ์';
    case 'wife_delivery': return 'ลาไปช่วยเหลือภริยาที่คลอดบุตร';
    case 'military': return 'ลาตรวจเลือกหรือเตรียมพล';
    default: return 'ลาประเภทอื่น ๆ';
  }
}
