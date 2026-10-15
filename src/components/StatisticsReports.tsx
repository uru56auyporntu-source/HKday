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
  exportLeaveRecordsToCsv 
} from '../services/storageService';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Users, 
  TrendingUp, 
  PieChart, 
  FileText,
  CheckCircle2,
  Filter,
  FileDown
} from 'lucide-react';

interface StatisticsReportsProps {
  allPersonnel: Personnel[];
  leaveRecords: LeaveRecord[];
  settings: SchoolSettings;
  currentPersonnel: Personnel;
}

export const StatisticsReports: React.FC<StatisticsReportsProps> = ({
  allPersonnel,
  leaveRecords,
  settings,
  currentPersonnel,
}) => {
  // Date Range Filter state - defaults to current fiscal year range (Oct 1 to Sep 30)
  const [startDate, setStartDate] = useState('2024-10-01');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [showExecutivePrint, setShowExecutivePrint] = useState(false);

  // Filter records within the specified date range
  const filtered = leaveRecords.filter(r => {
    return r.startDate >= startDate && r.startDate <= endDate;
  });

  const activeFiltered = filtered.filter(r => r.status !== 'cancelled');

  // Calculate statistics (active leaves)
  const totalLeaves = activeFiltered.length;
  const totalDays = activeFiltered.reduce((sum, r) => sum + r.totalDays, 0);
  const approvedLeaves = activeFiltered.filter(r => r.status === 'approved');
  const approvedDays = approvedLeaves.reduce((sum, r) => sum + r.totalDays, 0);

  // Group by leave type (for visual chart)
  const typeMap: Record<string, { days: number; count: number; title: string }> = {};
  settings.quotas.forEach(q => {
    typeMap[q.leaveType] = { days: 0, count: 0, title: q.title };
  });
  activeFiltered.forEach(r => {
    if (typeMap[r.leaveType]) {
      typeMap[r.leaveType].days += r.totalDays;
      typeMap[r.leaveType].count += 1;
    }
  });

  // Calculate leave statistics classified by individual personnel (จำแนกตามรายบุคคล)
  const personnelStats = allPersonnel.map((p, idx) => {
    const pRecords = activeFiltered.filter(r => r.personnelId === p.id);
    const sickDays = pRecords.filter(r => r.leaveType === 'sick').reduce((sum, r) => sum + r.totalDays, 0);
    const personalDays = pRecords.filter(r => r.leaveType === 'personal').reduce((sum, r) => sum + r.totalDays, 0);
    const otherDays = pRecords.filter(r => !['sick', 'personal'].includes(r.leaveType)).reduce((sum, r) => sum + r.totalDays, 0);
    const totalPersonDays = sickDays + personalDays + otherDays;
    const totalPersonTimes = pRecords.length;

    return {
      no: idx + 1,
      id: p.id,
      name: `${p.prefix}${p.firstName} ${p.lastName}`,
      position: p.position + (p.academicStanding ? ` (${p.academicStanding})` : ''),
      sickDays,
      personalDays,
      otherDays,
      totalPersonDays,
      totalPersonTimes,
    };
  });

  // Overall totals across school for memorandum table
  const totalSickDays = activeFiltered.filter(r => r.leaveType === 'sick').reduce((s, r) => s + r.totalDays, 0);
  const totalPersonalDays = activeFiltered.filter(r => r.leaveType === 'personal').reduce((s, r) => s + r.totalDays, 0);
  const totalOtherDays = activeFiltered.filter(r => !['sick', 'personal'].includes(r.leaveType)).reduce((s, r) => s + r.totalDays, 0);

  // Group by personnel for chart rank
  const personnelRankList = [...personnelStats].sort((a, b) => b.totalPersonDays - a.totalPersonDays);

  const director = allPersonnel.find(p => p.id === settings.directorId);
  const academicHead = allPersonnel.find(p => p.id === settings.academicHeadId);

  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfHelperNotice, setPdfHelperNotice] = useState<string | null>(null);

  const handlePrintOrPdf = (isPdf = false) => {
    setIsPrinting(true);
    setShowExecutivePrint(true);

    if (isPdf) {
      setPdfHelperNotice('กำลังเปิดหน้าต่างบันทึก PDF: ในช่องปลายทาง (Destination) ให้เลือก "บันทึกเป็น PDF" หรือ "Save as PDF"');
      setTimeout(() => setPdfHelperNotice(null), 8000);
    }

    const originalTitle = document.title;
    if (isPdf) {
      document.title = `บันทึกข้อความ_รายงานสรุปสถิติการลา_${settings.schoolName}_ปีงบประมาณ${settings.currentFiscalYear}`;
    }

    // Scroll to the report element so the user sees it immediately
    const el = document.getElementById('printable-memorandum-report');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('window.print error, trying fallback iframe:', err);
        // Fallback printable iframe
        const reportEl = document.getElementById('printable-memorandum-report');
        if (reportEl) {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
          const doc = iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>บันทึกข้อความรายงานสรุปสถิติการลา</title>
                  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap">
                  <style>
                    @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
                    body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #111; font-size: 13pt; line-height: 1.6; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
                    th, td { border: 1px solid #333; padding: 6px 6px; }
                    th { background-color: #f3f4f6; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-justify { text-align: justify; }
                    .indent-8 { text-indent: 2.5em; }
                    .font-bold { font-weight: bold; }
                    .no-print { display: none !important; }
                  </style>
                </head>
                <body>
                  ${reportEl.innerHTML}
                </body>
              </html>
            `);
            doc.close();
            iframe.contentWindow?.focus();
            setTimeout(() => {
              iframe.contentWindow?.print();
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 1500);
            }, 300);
          }
        }
      } finally {
        setIsPrinting(false);
        if (isPdf) {
          setTimeout(() => {
            document.title = originalTitle;
          }, 1500);
        }
      }
    }, 250);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* PDF Helper Notification */}
      {pdfHelperNotice && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs no-print animate-in fade-in">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pdfHelperNotice}</span>
          </div>
          <button 
            onClick={() => setPdfHelperNotice(null)} 
            className="text-rose-500 hover:text-rose-700 cursor-pointer ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header with Range Filter & Print/Export */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              รายงาน สถิติการลา & แดชบอร์ดวิเคราะห์ข้อมูล
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2 • สามารถกำหนดช่วงวันที่ต้องการประมวลผลได้อย่างอิสระ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePrintOrPdf(true)}
              disabled={isPrinting}
              className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="บันทึกรายงานสรุปสถิติการลาเป็นไฟล์ PDF"
            >
              <FileDown className="w-4 h-4 text-rose-200" />
              บันทึกเป็น PDF
            </button>
            <button
              onClick={() => handlePrintOrPdf(false)}
              disabled={isPrinting}
              className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="สั่งพิมพ์บันทึกข้อความสรุปสถิติการลาจำแนกรายบุคคลเสนอผู้อำนวยการ"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              {isPrinting ? 'กำลังสั่งพิมพ์...' : 'สั่งพิมพ์รายงานสรุปเสนอ ผอ.'}
            </button>
            <button
              onClick={() => exportLeaveRecordsToCsv(activeFiltered, allPersonnel)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              ส่งออก Excel / CSV
            </button>
          </div>
        </div>

        {/* Date Range Selector Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>ระบุช่วงวันที่:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">ถึงวันที่:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>


        </div>
      </div>

      {/* 2. Key Metrics for the range */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">รวมจำนวนครั้งที่ลา</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{totalLeaves}</p>
          <p className="text-[11px] text-slate-400 mt-1">ในช่วงเวลาที่ระบุ</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">รวมจำนวนวันทำการที่ลา</p>
          <p className="text-3xl font-extrabold text-blue-900 mt-1">{totalDays} <span className="text-xs font-normal">วัน</span></p>
          <p className="text-[11px] text-slate-400 mt-1">คำนวณหักวันหยุดแล้ว</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">อนุมัติแล้ว</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{approvedDays} <span className="text-xs font-normal">วัน</span></p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">({approvedLeaves.length} ครั้ง)</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">เฉลี่ยต่อการลาหนึ่งครั้ง</p>
          <p className="text-3xl font-extrabold text-indigo-700 mt-1">
            {totalLeaves > 0 ? (totalDays / totalLeaves).toFixed(1) : 0} <span className="text-xs font-normal">วัน/ครั้ง</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">อัตราเฉลี่ยโรงเรียน</p>
        </div>
      </div>

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Chart 1: Leaves by Type */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              สถิติการลาแยกตามประเภท (จำนวนวัน)
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {formatThaiDate(startDate)} - {formatThaiDate(endDate)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(typeMap).map(([typeKey, data]) => {
              const percent = totalDays > 0 ? Math.round((data.days / totalDays) * 100) : 0;
              return (
                <div key={typeKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{data.title}</span>
                    <span className="font-bold text-slate-800">
                      {data.days} วัน ({data.count} ครั้ง / {percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Top Personnel Leave Ranking */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              สถิติการลาจำแนกตามรายบุคคล
            </h3>
            <span className="text-xs text-slate-400 font-medium">เรียงตามวันลาสูงสุด</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {personnelRankList.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    index === 0 ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.position}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-blue-900 text-sm">{item.totalPersonDays} วัน</span>
                  <p className="text-[10px] text-slate-400">{item.totalPersonTimes} ครั้ง</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Formal Memorandum Report to Director & Academic Head (Printable) */}
      {(showExecutivePrint || true) && (
        <div id="printable-memorandum-report" className="bg-white rounded-3xl p-8 border border-slate-300 shadow-md print-page font-sarabun text-slate-900">
          <div className="flex flex-wrap items-center justify-between mb-6 pb-4 border-b border-slate-200 no-print gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-base text-slate-800 font-sans">
                ตัวอย่างบันทึกข้อความรายงานสรุปสถิติการลาจำแนกตามรายบุคคล เสนอผู้อำนวยการ
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrintOrPdf(true)}
                disabled={isPrinting}
                className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer font-sans disabled:opacity-50"
                title="บันทึกรายงานเป็นไฟล์ PDF"
              >
                <FileDown className="w-4 h-4 text-rose-200" />
                บันทึกเป็น PDF
              </button>
              <button
                onClick={() => handlePrintOrPdf(false)}
                disabled={isPrinting}
                className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer font-sans disabled:opacity-50"
                title="สั่งพิมพ์รายงาน"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                {isPrinting ? 'กำลังสั่งพิมพ์...' : 'พิมพ์รายงาน'}
              </button>
            </div>
          </div>

          {/* Official Government Memorandum Format */}
          <div className="space-y-4 max-w-5xl mx-auto text-sm leading-relaxed">
            {/* 1. Header Centered Title - บันทึกข้อความ จัดให้อยู่กึ่งกลางด้านบน และตัดชื่อโรงเรียน/เขตที่อยู่ด้านล่างออก */}
            <div className="text-center py-2 mb-2">
              <h1 className="text-3xl font-extrabold tracking-widest text-slate-900 font-sarabun">บันทึกข้อความ</h1>
            </div>

            {/* 2. Official Header Information Block */}
            <div className="border-b-2 border-slate-800 pb-3 space-y-2 font-sarabun text-sm sm:text-base">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 shrink-0">ส่วนราชการ:</span>
                <span className="text-slate-800 font-medium">โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2</span>
                {settings.phone && <span className="text-slate-700 ml-4 font-normal">โทรศัพท์: {settings.phone}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">ที่:</span>
                  <span className="text-slate-800 font-medium"></span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">วันที่:</span>
                  <span className="text-slate-800 font-medium">{formatThaiFullDate(new Date().toISOString().slice(0, 10))}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 shrink-0">เรื่อง:</span>
                <span className="font-bold text-slate-900">รายงานสรุปสถิติการลาของข้าราชการครูและบุคลากรทางการศึกษา</span>
              </div>
            </div>

            <div className="pt-2">
              <p><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนบ้านห้วยไคร้</p>
            </div>

            <p className="indent-8 text-justify">
              ตามที่กลุ่มบริหารงานบุคคลและงานสารบรรณ โรงเรียนบ้านห้วยไคร้ ได้ดำเนินงานระบบจัดการวันลาออนไลน์สำหรับข้าราชการครูและบุคลากรทางการศึกษา เพื่อให้การบริหารจัดการข้อมูลการลาเป็นไปด้วยความถูกต้อง เรียบร้อย และสอดคล้องตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555 นั้น
            </p>

            <p className="indent-8 text-justify">
              บัดนี้ ขอรายงานสรุปสถิติการลา ระหว่างวันที่ <strong>{formatThaiFullDate(startDate)}</strong> ถึงวันที่ <strong>{formatThaiFullDate(endDate)}</strong> โดยมีรายละเอียดการลาจำแนกตามรายบุคคล ดังนี้
            </p>

            {/* Individual Personnel Statistics Summary Table */}
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-900">
                    <th className="border border-slate-400 p-2 text-center w-10">ที่</th>
                    <th className="border border-slate-400 p-2 text-left">ชื่อ - นามสกุล</th>
                    <th className="border border-slate-400 p-2 text-left">ตำแหน่ง</th>
                    <th className="border border-slate-400 p-2 text-center w-14">ลาป่วย (วัน)</th>
                    <th className="border border-slate-400 p-2 text-center w-14">ลากิจ (วัน)</th>
                    <th className="border border-slate-400 p-2 text-center w-14">ลาอื่นๆ (วัน)</th>
                    <th className="border border-slate-400 p-2 text-center w-16 bg-blue-50 text-blue-950 font-bold">รวมวันลา (วัน)</th>
                    <th className="border border-slate-400 p-2 text-center w-14">รวม (ครั้ง)</th>
                    <th className="border border-slate-400 p-2 text-center w-16">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {personnelStats.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-1.5 text-center">{row.no}</td>
                      <td className="border border-slate-400 p-1.5 font-medium">{row.name}</td>
                      <td className="border border-slate-400 p-1.5 text-slate-700">{row.position}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{row.sickDays > 0 ? row.sickDays : '-'}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{row.personalDays > 0 ? row.personalDays : '-'}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{row.otherDays > 0 ? row.otherDays : '-'}</td>
                      <td className="border border-slate-400 p-1.5 text-center font-bold text-blue-900 bg-blue-50/50">
                        {row.totalPersonDays > 0 ? row.totalPersonDays : '0'}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center text-slate-700">
                        {row.totalPersonTimes > 0 ? row.totalPersonTimes : '0'}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center text-slate-400">-</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border border-slate-400 p-2 text-center">
                      รวมทั้งสิ้น ({allPersonnel.length} คน)
                    </td>
                    <td className="border border-slate-400 p-2 text-center">{totalSickDays}</td>
                    <td className="border border-slate-400 p-2 text-center">{totalPersonalDays}</td>
                    <td className="border border-slate-400 p-2 text-center">{totalOtherDays}</td>
                    <td className="border border-slate-400 p-2 text-center text-blue-950 font-extrabold bg-blue-100/60">
                      {totalDays}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-bold">
                      {totalLeaves}
                    </td>
                    <td className="border border-slate-400 p-2 text-center text-slate-600">วันทำการ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="indent-8 text-justify">
              จึงเรียนมาเพื่อโปรดทราบและพิจารณา
            </p>

            {/* Signatures Area - ผู้รับรองให้ ผอ.รับรองคนเดียว */}
            <div className="flex justify-end pt-10 text-center text-xs sm:text-sm font-sarabun">
              <div className="space-y-2 min-w-[280px]">
                <p>(ลงชื่อ)....................................................................</p>
                <p className="font-medium">
                  ({director ? `${director.prefix}${director.firstName} ${director.lastName}` : '....................................................................'})
                </p>
                <p className="font-medium">ตำแหน่ง ผู้อำนวยการ{settings.schoolName}</p>
                <p className="text-slate-600">วันที่ .......... เดือน .................... พ.ศ. ..............</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
