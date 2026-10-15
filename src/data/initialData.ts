import { Personnel, LeaveQuota, SchoolSettings, LeaveRecord, AuditLog, ThaiHoliday } from '../types/leave';

// Default signature generator for realistic visual display
export const createDefaultSignatureSvg = (name: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
    <path d="M 20 45 Q 60 15, 90 40 T 150 35 T 200 45 M 50 55 Q 110 50, 170 58" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round"/>
    <text x="110" y="65" font-family="'Sarabun', sans-serif" font-size="11" fill="#4b5563" text-anchor="middle">(${name})</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'p-001',
    prefix: 'นาย',
    firstName: 'สมบูรณ์',
    lastName: 'ศิริวัฒนานนท์',
    position: 'ผู้อำนวยการโรงเรียน',
    academicStanding: 'เชี่ยวชาญ',
    department: 'ฝ่ายบริหารงานทั่วไป',
    address: '99/4 ม.2 ต.ดงคู่ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '081-876-5432',
    email: 'somboon.s@huaykhrai.ac.th',
    role: 'director',
    signatureUrl: createDefaultSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'),
    hireDate: '2010-05-15'
  },
  {
    id: 'p-002',
    prefix: 'นาง',
    firstName: 'พรรณทิพา',
    lastName: 'สุริยฉัตร',
    position: 'ครู',
    academicStanding: 'ชำนาญการพิเศษ',
    department: 'ฝ่ายบริหารงานวิชาการ (หัวหน้า)',
    address: '45/1 ม.5 ต.หาดเสี้ยว อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '089-765-4321',
    email: 'panthipa.s@huaykhrai.ac.th',
    role: 'academic_head',
    signatureUrl: createDefaultSignatureSvg('นางพรรณทิพา สุริยฉัตร'),
    hireDate: '2014-06-01'
  },
  {
    id: 'p-003',
    prefix: 'นาย',
    firstName: 'ณัฐพงษ์',
    lastName: 'คงเจริญ',
    position: 'ครู',
    academicStanding: 'ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    address: '12 ม.1 ต.หนองอ้อ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '084-321-9876',
    email: 'nattapong.k@huaykhrai.ac.th',
    role: 'admin',
    signatureUrl: createDefaultSignatureSvg('นายณัฐพงษ์ คงเจริญ'),
    hireDate: '2018-09-10'
  },
  {
    id: 'p-004',
    prefix: 'นางสาว',
    firstName: 'กานดา',
    lastName: 'วรรณประเสริฐ',
    position: 'ครู',
    academicStanding: 'ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
    address: '78 ม.3 ต.บ้านตึก อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '086-456-7890',
    email: 'kanda.w@huaykhrai.ac.th',
    role: 'teacher',
    signatureUrl: createDefaultSignatureSvg('นางสาวกานดา วรรณประเสริฐ'),
    hireDate: '2017-10-01'
  },
  {
    id: 'p-005',
    prefix: 'นาย',
    firstName: 'วีระชัย',
    lastName: 'แก้วประดับ',
    position: 'ครู',
    academicStanding: 'ชำนาญการพิเศษ',
    department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    address: '150/3 ม.4 ต.สารจิตร อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '082-111-2233',
    email: 'weerachai.k@huaykhrai.ac.th',
    role: 'teacher',
    signatureUrl: createDefaultSignatureSvg('นายวีระชัย แก้วประดับ'),
    hireDate: '2012-07-16'
  },
  {
    id: 'p-006',
    prefix: 'นางสาว',
    firstName: 'ปรียานุช',
    lastName: 'แสงสว่าง',
    position: 'ครูผู้ช่วย',
    academicStanding: 'ไม่มีวิทยฐานะ (ครูผู้ช่วย)',
    department: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    address: '33 ม.2 ต.ป่างิ้ว อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '085-998-8776',
    email: 'priyanuch.s@huaykhrai.ac.th',
    role: 'teacher',
    signatureUrl: createDefaultSignatureSvg('นางสาวปรียานุช แสงสว่าง'),
    hireDate: '2023-11-01'
  },
  {
    id: 'p-007',
    prefix: 'นาย',
    firstName: 'ชัชวาลย์',
    lastName: 'ใจภักดี',
    position: 'ครู',
    academicStanding: 'ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    address: '88 ม.6 ต.แม่สิน อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '087-654-3210',
    email: 'chatchawal.j@huaykhrai.ac.th',
    role: 'teacher',
    signatureUrl: createDefaultSignatureSvg('นายชัชวาลย์ ใจภักดี'),
    hireDate: '2016-03-20'
  },
  {
    id: 'p-008',
    prefix: 'นางสาว',
    firstName: 'ศิริพร',
    lastName: 'ทองคำ',
    position: 'เจ้าพนักงานธุรการปฏิบัติงาน',
    academicStanding: 'ปฏิบัติงาน',
    department: 'งานสารบรรณและธุรการโรงเรียน',
    address: '55/2 ม.1 ต.ดงคู่ อ.ศรีสัชนาลัย จ.สุโขทัย 64130',
    phone: '083-222-4455',
    email: 'siriporn.t@huaykhrai.ac.th',
    role: 'teacher',
    signatureUrl: createDefaultSignatureSvg('นางสาวศิริพร ทองคำ'),
    hireDate: '2020-01-15'
  }
];

export const DEFAULT_QUOTAS: LeaveQuota[] = [
  {
    leaveType: 'sick',
    title: 'ลาป่วย',
    maxDays: 60,
    maxTimes: 20,
    description: 'ลาป่วยตามจริง ลาติดต่อกันตั้งแต่ 3 วันทำการขึ้นไปต้องมีใบรับรองแพทย์'
  },
  {
    leaveType: 'personal',
    title: 'ลากิจส่วนตัว',
    maxDays: 45,
    maxTimes: 15,
    description: 'มีกิจจำเป็นต้องยื่นใบลาล่วงหน้า ได้รับอนุญาตก่อนจึงจะหยุดได้'
  },
  {
    leaveType: 'maternity',
    title: 'ลาคลอดบุตร',
    maxDays: 90,
    maxTimes: 1,
    description: 'ลาคลอดบุตรได้ไม่เกิน 90 วัน ไม่ต้องมีใบรับรองแพทย์ล่วงหน้า'
  },
  {
    leaveType: 'ordination',
    title: 'ลาอุปสมบทหรือไปประกอบพิธีฮัจญ์',
    maxDays: 120,
    maxTimes: 1,
    description: 'สำหรับข้าราชการที่รับราชการไม่น้อยกว่า 1 ปี ยื่นล่วงหน้าอย่างน้อย 60 วัน'
  },
  {
    leaveType: 'wife_delivery',
    title: 'ลาไปช่วยเหลือภริยาที่คลอดบุตร',
    maxDays: 15,
    maxTimes: 1,
    description: 'มีสิทธิลาไปช่วยเหลือภริยาโดยชอบด้วยกฎหมายที่คลอดบุตร ครั้งหนึ่งติดต่อกันได้ไม่เกิน 15 วันทำการ'
  },
  {
    leaveType: 'military',
    title: 'ลาเข้ารับการตรวจเลือกหรือเตรียมพล',
    maxDays: 60,
    maxTimes: 2,
    description: 'ลาเข้ารับการตรวจเลือกหรือการเตรียมพลตามหมายเรียกของทางราชการ'
  },
  {
    leaveType: 'other',
    title: 'ลาประเภทอื่น ๆ / อบรมพัฒนา',
    maxDays: 30,
    maxTimes: 10,
    description: 'ลาไปฟื้นฟูสมรรถภาพด้านอาชีพ ศึกษา ฝึกอบรม ดูงาน หรือปฏิบัติงานวิจัย'
  }
];

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'โรงเรียนบ้านห้วยไคร้',
  schoolArea: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2',
  currentFiscalYear: 2568,
  directorId: 'p-001',
  academicHeadId: 'p-002',
  adminId: 'p-003',
  phone: '055-678901',
  address: 'หมู่ที่ 2 ตำบลดงคู่ อำเภอศรีสัชนาลัย จังหวัดสุโขทัย 64130',
  googleSheetsWebhookUrl: '',
  quotas: DEFAULT_QUOTAS
};

export const INITIAL_LEAVE_RECORDS: LeaveRecord[] = [
  {
    id: 'leave-001',
    referenceNumber: 'ลร.01/2568',
    personnelId: 'p-004', // กานดา วรรณประเสริฐ
    leaveType: 'sick',
    fiscalYear: 2568,
    startDate: '2025-01-13',
    endDate: '2025-01-14',
    totalDays: 2,
    reason: 'มีอาการไข้หวัด ปวดศีรษะและเจ็บคออย่างรุนแรง แพทย์แนะนำให้พักผ่อนรักษาตัว',
    contactAddress: '78 ม.3 ต.บ้านตึก อ.ศรีสัชนาลัย จ.สุโขทัย โทร 086-456-7890',
    contactPhone: '086-456-7890',
    substitutePersonnelId: 'p-006', // ปรียานุช
    substituteAccepted: true,
    attachmentName: 'medical_cert_kanda.pdf',
    submittedAt: '2025-01-12T19:30:00Z',
    applicantSignature: createDefaultSignatureSvg('นางสาวกานดา วรรณประเสริฐ'),
    academicHeadId: 'p-002',
    academicHeadComment: 'เห็นควรอนุญาต ได้มอบหมายให้นางสาวปรียานุช แสงสว่าง ปฏิบัติการสอนแทนเรียบร้อยแล้ว',
    academicHeadSignature: createDefaultSignatureSvg('นางพรรณทิพา สุริยฉัตร'),
    academicHeadActionDate: '2025-01-13T07:45:00Z',
    directorId: 'p-001',
    directorComment: 'ทราบและอนุมัติ',
    directorSignature: createDefaultSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'),
    directorActionDate: '2025-01-13T08:15:00Z',
    status: 'approved'
  },
  {
    id: 'leave-002',
    referenceNumber: 'ลร.02/2568',
    personnelId: 'p-005', // วีระชัย แก้วประดับ
    leaveType: 'personal',
    fiscalYear: 2568,
    startDate: '2025-02-06',
    endDate: '2025-02-07',
    totalDays: 2,
    reason: 'เดินทางไปติดต่อราชการเกี่ยวกับที่ดินมรดกและทำนิติกรรม ณ สำนักงานที่ดินจังหวัดสุโขทัย',
    contactAddress: '150/3 ม.4 ต.สารจิตร อ.ศรีสัชนาลัย จ.สุโขทัย',
    contactPhone: '082-111-2233',
    substitutePersonnelId: 'p-003', // ณัฐพงษ์
    substituteAccepted: true,
    submittedAt: '2025-02-03T10:15:00Z',
    applicantSignature: createDefaultSignatureSvg('นายวีระชัย แก้วประดับ'),
    academicHeadId: 'p-002',
    academicHeadComment: 'เห็นควรอนุญาต ได้ตรวจสอบภาระงานสอนและใบงานมอบหมายแล้ว',
    academicHeadSignature: createDefaultSignatureSvg('นางพรรณทิพา สุริยฉัตร'),
    academicHeadActionDate: '2025-02-03T14:20:00Z',
    directorId: 'p-001',
    directorComment: 'อนุมัติ',
    directorSignature: createDefaultSignatureSvg('นายสมบูรณ์ ศิริวัฒนานนท์'),
    directorActionDate: '2025-02-04T09:00:00Z',
    status: 'approved'
  },
  {
    id: 'leave-003',
    referenceNumber: 'ลร.03/2568',
    personnelId: 'p-007', // ชัชวาลย์ ใจภักดี
    leaveType: 'personal',
    fiscalYear: 2568,
    startDate: '2025-03-24',
    endDate: '2025-03-26',
    totalDays: 3,
    reason: 'พาครอบครัวเดินทางไปตรวจสุขภาพประจำปี ณ โรงพยาบาลศูนย์พุทธชินราช จ.พิษณุโลก',
    contactAddress: '88 ม.6 ต.แม่สิน อ.ศรีสัชนาลัย จ.สุโขทัย',
    contactPhone: '087-654-3210',
    substitutePersonnelId: 'p-005', // วีระชัย
    substituteAccepted: true,
    submittedAt: '2025-03-18T11:00:00Z',
    applicantSignature: createDefaultSignatureSvg('นายชัชวาลย์ ใจภักดี'),
    academicHeadId: 'p-002',
    academicHeadComment: 'เห็นควรอนุญาต ในช่วงเวลาดังกล่าวไม่มีการสอบหรือกิจกรรมเร่งด่วน',
    academicHeadSignature: createDefaultSignatureSvg('นางพรรณทิพา สุริยฉัตร'),
    academicHeadActionDate: '2025-03-18T15:30:00Z',
    status: 'pending_director' // Pending Director approval
  },
  {
    id: 'leave-004',
    referenceNumber: 'ลร.04/2568',
    personnelId: 'p-006', // ปรียานุช แสงสว่าง
    leaveType: 'sick',
    fiscalYear: 2568,
    startDate: '2025-04-07',
    endDate: '2025-04-07',
    isHalfDay: true,
    halfDayPeriod: 'morning',
    totalDays: 0.5,
    reason: 'มีนัดทำฟันและพบทันตแพทย์ ณ โรงพยาบาลศรีสัชนาลัย ในช่วงเช้า',
    contactAddress: '33 ม.2 ต.ป่างิ้ว อ.ศรีสัชนาลัย จ.สุโขทัย',
    contactPhone: '085-998-8776',
    substitutePersonnelId: 'p-004',
    substituteAccepted: true,
    submittedAt: '2025-04-05T08:30:00Z',
    applicantSignature: createDefaultSignatureSvg('นางสาวปรียานุช แสงสว่าง'),
    status: 'pending_academic' // Pending Academic Head review
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2025-01-12 19:30:00',
    actorName: 'นางสาวกานดา วรรณประเสริฐ',
    actorRole: 'ครู',
    action: 'ยื่นใบลาออนไลน์',
    details: 'ยื่นคำขอลาป่วย (ลร.01/2568) จำนวน 2 วัน วันที่ 13-14 ม.ค. 2568'
  },
  {
    id: 'log-002',
    timestamp: '2025-01-13 07:45:00',
    actorName: 'นางพรรณทิพา สุริยฉัตร',
    actorRole: 'หัวหน้าวิชาการ',
    action: 'ลงความเห็นการลา',
    details: 'บันทึกความเห็นชอบใบลา ลร.01/2568 (กานดา วรรณประเสริฐ) เสนอผู้อำนวยการ'
  },
  {
    id: 'log-003',
    timestamp: '2025-01-13 08:15:00',
    actorName: 'นายสมบูรณ์ ศิริวัฒนานนท์',
    actorRole: 'ผู้อำนวยการโรงเรียน',
    action: 'อนุมัติการลา',
    details: 'อนุมัติใบลา ลร.01/2568 (กานดา วรรณประเสริฐ) สำเร็จ'
  },
  {
    id: 'log-004',
    timestamp: '2025-02-04 09:00:00',
    actorName: 'นายสมบูรณ์ ศิริวัฒนานนท์',
    actorRole: 'ผู้อำนวยการโรงเรียน',
    action: 'อนุมัติการลา',
    details: 'อนุมัติใบลา ลร.02/2568 (วีระชัย แก้วประดับ) สำเร็จ'
  },
  {
    id: 'log-005',
    timestamp: '2025-03-18 15:30:00',
    actorName: 'นางพรรณทิพา สุริยฉัตร',
    actorRole: 'หัวหน้าวิชาการ',
    action: 'ลงความเห็นการลา',
    details: 'เห็นควรอนุญาตใบลา ลร.03/2568 (ชัชวาลย์ ใจภักดี) รอการอนุมัติจาก ผอ.'
  }
];

export const THAI_HOLIDAYS_2568: ThaiHoliday[] = [
  { date: '2025-01-01', name: 'วันขึ้นปีใหม่' },
  { date: '2025-01-16', name: 'วันครูแห่งชาติ (วันหยุดสถานศึกษา)' },
  { date: '2025-02-12', name: 'วันมาฆบูชา' },
  { date: '2025-04-06', name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกฯ และวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  { date: '2025-04-07', name: 'วันหยุดชดเชยวันจักรี', isSubstitution: true },
  { date: '2025-04-13', name: 'วันสงกรานต์' },
  { date: '2025-04-14', name: 'วันสงกรานต์' },
  { date: '2025-04-15', name: 'วันสงกรานต์' },
  { date: '2025-04-16', name: 'วันหยุดชดเชยวันสงกรานต์', isSubstitution: true },
  { date: '2025-05-01', name: 'วันแรงงานแห่งชาติ' },
  { date: '2025-05-04', name: 'วันฉัตรมงคล' },
  { date: '2025-05-05', name: 'วันหยุดชดเชยวันฉัตรมงคล', isSubstitution: true },
  { date: '2025-05-11', name: 'วันวิสาขบูชา' },
  { date: '2025-05-12', name: 'วันหยุดชดเชยวันวิสาขบูชา', isSubstitution: true },
  { date: '2025-06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { date: '2025-07-10', name: 'วันอาสาฬหบูชา' },
  { date: '2025-07-11', name: 'วันเข้าพรรษา' },
  { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว' },
  { date: '2025-08-12', name: 'วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง' },
  { date: '2025-10-13', name: 'วันนวมินทรมหาราช' },
  { date: '2025-10-23', name: 'วันปิยมหาราช' },
  { date: '2025-12-05', name: 'วันชาติ และวันพ่อแห่งชาติ' },
  { date: '2025-12-10', name: 'วันรัฐธรรมนูญ' },
  { date: '2025-12-31', name: 'วันสิ้นปี' }
];

export const REGULATIONS_SUMMARY = [
  {
    category: '1. การลาป่วย',
    rules: [
      'ให้เสนอใบลาต่อผู้บังคับบัญชาก่อนหรือในวันที่ลา แต่ถ้ามีเหตุจำเป็นไม่อาจเสนอได้ ให้เสนอใบลาในวันแรกที่มาปฏิบัติราชการ',
      'การลาป่วยติดต่อกันตั้งแต่ 3 วันทำการขึ้นไป ต้องมีใบรับรองของแพทย์ซึ่งเป็นผู้ประกอบวิชาชีพเวชกรรมแนบไปกับใบลาด้วย',
      'ข้าราชการมีสิทธิลาป่วยโดยได้รับเงินเดือนเต็มปีงบประมาณหนึ่งได้ไม่เกิน 60 วันทำการ (หากเกิน ผู้มีอำนาจอาจพิจารณาจ่ายเงินเดือนตามระเบียบ ก.พ.)'
    ]
  },
  {
    category: '2. การลากิจส่วนตัว',
    rules: [
      'ให้เสนอใบลาต่อผู้บังคับบัญชา และเมื่อได้รับอนุญาตแล้วจึงจะหยุดราชการได้ เว้นแต่มีเหตุจำเป็นเร่งด่วนไม่อาจรอรับอนุญาตได้ ให้ยื่นใบลาพร้อมระบุเหตุจำเป็นแล้วหยุดราชการไปก่อนได้',
      'ข้าราชการมีสิทธิลากิจส่วนตัวโดยได้รับเงินเดือนปีงบประมาณหนึ่งได้ไม่เกิน 45 วันทำการ ในปีแรกที่เข้ารับราชการมีสิทธิได้ไม่เกิน 15 วันทำการ',
      'กรณีลากิจเพื่อเลี้ยงดูบุตรต่อเนื่องจากการลาคลอดบุตร มีสิทธิลาได้ไม่เกิน 150 วันทำการ โดยไม่ได้รับเงินเดือน'
    ]
  },
  {
    category: '3. การลาคลอดบุตร และลาไปช่วยเหลือภริยาคลอดบุตร',
    rules: [
      'ข้าราชการสตรีมีสิทธิลาคลอดบุตรโดยได้รับเงินเดือนครั้งหนึ่งได้ไม่เกิน 90 วัน ไม่ต้องมีใบรับรองแพทย์',
      'ข้าราชการชายมีสิทธิลาไปช่วยเหลือภริยาโดยชอบด้วยกฎหมายที่คลอดบุตร ครั้งหนึ่งติดต่อกันได้ไม่เกิน 15 วันทำการ โดยได้รับเงินเดือน'
    ]
  },
  {
    category: '4. ขั้นตอนการลงนามและอนุมัติในโรงเรียน',
    rules: [
      'ครูผู้ขอยื่นใบลาพร้อมระบุครูผู้ปฏิบัติหน้าที่สอนแทน (ผู้รับมอบงาน)',
      'หัวหน้ากลุ่มสาระฯ / หัวหน้าฝ่ายบริหารงานวิชาการ ตรวจสอบภาระงานสอนและบันทึกความเห็นชอบ',
      'ผู้อำนวยการโรงเรียน เป็นผู้มีอำนาจพิจารณาสั่งอนุญาตหรือไม่อนุญาต'
    ]
  }
];
