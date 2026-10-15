import React, { useState } from 'react';
import { AuditLog } from '../types/leave';
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  onClearLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    const text = `${log.actorName} ${log.actorRole} ${log.action} ${log.details} ${log.timestamp}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-700" />
            รายงานบันทึกประวัติระบบ (Audit Log)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            บันทึกประวัติการทำรายการ ยื่นใบลา ลงความเห็น และอนุมัติแบบเรียลไทม์เพื่อความโปร่งใส
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาประวัติการทำรายการ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">ไม่พบบันทึกการทำรายการ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold w-48">วัน-เวลา (Timestamp)</th>
                  <th className="py-3 px-4 font-semibold w-56">ผู้ดำเนินการ</th>
                  <th className="py-3 px-4 font-semibold w-40">การกระทำ (Action)</th>
                  <th className="py-3 px-4 font-semibold">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 font-sans">{log.actorName}</p>
                      <p className="text-[10px] text-blue-700 font-sans">{log.actorRole}</p>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
