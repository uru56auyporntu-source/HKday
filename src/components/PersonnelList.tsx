import React, { useState, useRef } from 'react';
import { 
  Personnel, 
  Role, 
  LeaveRecord, 
  SchoolSettings 
} from '../types/leave';
import { 
  getPersonnelLeaveBalances, 
  createDefaultSignatureSvg 
} from '../services/storageService';
import { Avatar } from './Avatar';
import { 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Award, 
  Briefcase, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Eye, 
  Upload, 
  PenTool, 
  RotateCcw,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface PersonnelListProps {
  personnelList: Personnel[];
  onAddPersonnel: (person: Personnel) => void;
  onUpdatePersonnel: (person: Personnel) => void;
  onDeletePersonnel: (id: string) => void;
  leaveRecords: LeaveRecord[];
  settings: SchoolSettings;
  currentPersonnel: Personnel;
}

export const PersonnelList: React.FC<PersonnelListProps> = ({
  personnelList,
  onAddPersonnel,
  onUpdatePersonnel,
  onDeletePersonnel,
  leaveRecords,
  settings,
  currentPersonnel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  // Form states
  const [prefix, setPrefix] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [position, setPosition] = useState('ครู');
  const [academicStanding, setAcademicStanding] = useState('ชำนาญการ');
  const [department, setDepartment] = useState('กลุ่มสาระการเรียนรู้');
  const [address, setAddress] = useState('ตำบลดงคู่ อำเภอศรีสัชนาลัย จังหวัดสุโขทัย');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('teacher');

  // Signature image & canvas states
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatureMode, setSignatureMode] = useState<'upload' | 'draw'>('upload');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // View specific personnel quota modal
  const [viewingQuotaPerson, setViewingQuotaPerson] = useState<Personnel | null>(null);

  const openAddModal = () => {
    setEditingPersonnel(null);
    setPrefix('นาย');
    setFirstName('');
    setLastName('');
    setGender('male');
    setPosition('ครู');
    setAcademicStanding('ชำนาญการ');
    setDepartment('กลุ่มสาระการเรียนรู้');
    setAddress('ตำบลดงคู่ อำเภอศรีสัชนาลัย จังหวัดสุโขทัย');
    setPhone('');
    setEmail('');
    setRole('teacher');
    setSignatureUrl('');
    setSignatureMode('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (person: Personnel) => {
    setEditingPersonnel(person);
    setPrefix(person.prefix);
    setFirstName(person.firstName);
    setLastName(person.lastName);
    setGender(person.gender || (person.prefix === 'นาง' || person.prefix === 'นางสาว' ? 'female' : 'male'));
    setPosition(person.position);
    setAcademicStanding(person.academicStanding);
    setDepartment(person.department || '');
    setAddress(person.address);
    setPhone(person.phone);
    setEmail(person.email);
    setRole(person.role);
    setSignatureUrl(person.signatureUrl || '');
    setSignatureMode('upload');
    setIsModalOpen(true);
  };

  // Handle prefix change auto-sets gender
  const handlePrefixChange = (val: string) => {
    setPrefix(val);
    if (val === 'นาง' || val === 'นางสาว') {
      setGender('female');
    } else if (val === 'นาย' || val === 'ว่าที่ ร.ต.') {
      setGender('male');
    }
  };

  // Upload image handler
  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ภาพลายเซ็น (PNG, JPG, JPEG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSignatureUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

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
    ctx.strokeStyle = '#1d4ed8'; // Blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    const fullName = `${prefix}${firstName.trim()} ${lastName.trim()}`;
    const fallbackSignature = createDefaultSignatureSvg(fullName);
    const finalSignature = signatureUrl || (editingPersonnel?.signatureUrl || fallbackSignature);

    if (editingPersonnel) {
      const updated: Personnel = {
        ...editingPersonnel,
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        position: position.trim(),
        academicStanding: academicStanding.trim(),
        department: department.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim() || `${firstName.toLowerCase()}@huaykhrai.ac.th`,
        role,
        signatureUrl: finalSignature,
      };
      onUpdatePersonnel(updated);
    } else {
      const newPerson: Personnel = {
        id: 'p-' + Date.now(),
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        position: position.trim(),
        academicStanding: academicStanding.trim(),
        department: department.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim() || `${firstName.toLowerCase()}@huaykhrai.ac.th`,
        role,
        signatureUrl: finalSignature,
        hireDate: new Date().toISOString().slice(0, 10),
      };
      onAddPersonnel(newPerson);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (person: Personnel) => {
    if (person.id === currentPersonnel.id) {
      alert('ไม่สามารถลบบัญชีผู้ใช้งานที่กำลังเข้าสู่ระบบอยู่ในขณะนี้ได้');
      return;
    }
    if (confirm(`คุณต้องการลบข้อมูลบุคลากร "${person.prefix}${person.firstName} ${person.lastName}" หรือไม่?`)) {
      onDeletePersonnel(person.id);
    }
  };

  // Filtered personnel
  const filteredList = personnelList.filter(p => {
    const fullName = `${p.prefix}${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.phone.includes(searchTerm);
    const matchesRole = selectedRoleFilter === 'all' || p.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Add Button */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            ข้อมูลบุคลากรในโรงเรียน
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            โรงเรียนบ้านห้วยไคร้ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2 (ทั้งหมด {personnelList.length} ท่าน)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          เพิ่มข้อมูลบุคลากร
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, สกุล, ตำแหน่ง, เบอร์โทร..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'director', label: 'ผู้อำนวยการ' },
            { id: 'academic_head', label: 'หัวหน้าวิชาการ' },
            { id: 'teacher', label: 'ครูผู้สอน' },
            { id: 'admin', label: 'ผู้ดูแลระบบ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                selectedRoleFilter === tab.id
                  ? 'bg-blue-900 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((person) => {
          const isCurrent = person.id === currentPersonnel.id;
          return (
            <div
              key={person.id}
              className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
                isCurrent ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Cute Cartoon Avatar based on gender */}
                    <Avatar 
                      prefix={person.prefix} 
                      gender={person.gender} 
                      size="lg" 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                          {person.prefix}{person.firstName} {person.lastName}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.2 rounded-full font-semibold">
                            กำลังใช้งาน
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-700 font-medium">
                        {person.position}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>วิทยฐานะ: <strong>{person.academicStanding || '-'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{person.department || 'โรงเรียนบ้านห้วยไคร้'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{person.phone || '-'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{person.address || '-'}</span>
                  </div>
                </div>

                {/* Stored Signature Indicator & Preview */}
                <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-900 font-medium">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>ภาพลายมือชื่อในระบบ:</span>
                  </div>
                  <div className="h-8 max-w-[120px] bg-white rounded-lg border border-slate-200 px-2 flex items-center justify-center">
                    {person.signatureUrl ? (
                      <img src={person.signatureUrl} alt="Signature" className="max-h-7 object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ไม่มีลายเซ็น</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setViewingQuotaPerson(person)}
                  className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> ตรวจสอบสิทธิวันลา
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(person)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="แก้ไขข้อมูลและลายเซ็นบุคลากร"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(person)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="ลบข้อมูล"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add or Edit Personnel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
              <Avatar prefix={prefix} gender={gender} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingPersonnel ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มข้อมูลบุคลากรใหม่'}
                </h3>
                <p className="text-xs text-slate-500">
                  โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Row 1: Prefix, First Name, Last Name, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ดร.">ดร.</option>
                    <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="เช่น สมบูรณ์"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="เช่น ศิริวัฒนานนท์"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ไอคอนเพศ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden font-medium"
                  >
                    <option value="male">ครูชาย (ไอคอนชาย)</option>
                    <option value="female">ครูหญิง (ไอคอนหญิง)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Position & Academic Standing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตำแหน่ง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ผู้อำนวยการโรงเรียน, ครู, ครูผู้ช่วย, เจ้าพนักงานธุรการ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วิทยฐานะ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={academicStanding}
                    onChange={(e) => setAcademicStanding(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  >
                    <option value="ไม่มีวิทยฐานะ">ไม่มีวิทยฐานะ (ครู / ครูผู้ช่วย)</option>
                    <option value="ชำนาญการ">ชำนาญการ (คศ.2)</option>
                    <option value="ชำนาญการพิเศษ">ชำนาญการพิเศษ (คศ.3)</option>
                    <option value="เชี่ยวชาญ">เชี่ยวชาญ (คศ.4)</option>
                    <option value="เชี่ยวชาญพิเศษ">เชี่ยวชาญพิเศษ (คศ.5)</option>
                    <option value="ปฏิบัติงาน">ปฏิบัติงาน (ธุรการ)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-876-5432"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บทบาทในระบบ
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden font-medium"
                  >
                    <option value="teacher">ครูผู้สอน / บุคลากรทั่วไป</option>
                    <option value="academic_head">หัวหน้าฝ่ายบริหารงานวิชาการ (ตรวจใบลา)</option>
                    <option value="director">ผู้อำนวยการโรงเรียน (อนุมัติใบลา)</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ที่อยู่ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เช่น 99/4 ม.2 ต.ดงคู่ อ.ศรีสัชนาลัย จ.สุโขทัย 64130"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              {/* NEW: Electronic Signature Upload & Drawing Section */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wide">
                      ภาพลายมือชื่ออิเล็กทรอนิกส์ประจำตัว
                    </label>
                    <p className="text-[11px] text-amber-800">
                      ใส่ภาพลายเซ็นเพื่อนำมาใช้โดยอัตโนมัติตอนบันทึกและยื่นขอใบลา หรือตอนผู้บริหารอนุมัติ
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSignatureMode('upload')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        signatureMode === 'upload' ? 'bg-amber-500 text-white font-bold' : 'text-slate-600'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      อัปโหลดรูปภาพ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('draw')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        signatureMode === 'draw' ? 'bg-amber-500 text-white font-bold' : 'text-slate-600'
                      }`}
                    >
                      <PenTool className="w-3 h-3 inline mr-1" />
                      วาดลายเซ็นสด
                    </button>
                  </div>
                </div>

                {signatureMode === 'upload' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="flex-1 w-full">
                      <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                        เลือกไฟล์ภาพลายเซ็น (PNG / JPG ที่มีพื้นหลังโปร่งใสหรือสีขาว):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                      />
                    </div>

                    {/* Preview box */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">ตัวอย่างลายเซ็น:</span>
                      <div className="w-44 h-14 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center p-1 overflow-hidden">
                        {signatureUrl ? (
                          <img src={signatureUrl} alt="Signature Preview" className="max-h-12 object-contain" />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">ยังไม่ได้ใส่ลายเซ็น</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-center border-2 border-dashed border-slate-300 rounded-xl p-1 bg-white">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={100}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="touch-none cursor-crosshair bg-white w-full max-w-[360px] h-[100px] rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>ลากเมาส์หรือใช้นิ้วมือวาดลายเซ็นลงบนกรอบ</span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> ล้างกระดาน
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  บันทึกข้อมูลและลายเซ็น
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Specific Personnel Leave Quota */}
      {viewingQuotaPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setViewingQuotaPerson(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <Avatar prefix={viewingQuotaPerson.prefix} gender={viewingQuotaPerson.gender} size="lg" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  สิทธิการลาของ {viewingQuotaPerson.prefix}{viewingQuotaPerson.firstName} {viewingQuotaPerson.lastName}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingQuotaPerson.position} • ปีงบประมาณ {settings.currentFiscalYear}
                </p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {getPersonnelLeaveBalances(viewingQuotaPerson.id, settings.currentFiscalYear, leaveRecords, settings).map((b) => (
                <div key={b.leaveType} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800">{b.title}</span>
                    <p className="text-[11px] text-slate-500">
                      ใช้ไปแล้ว {b.usedDays} วัน ({b.usedTimes} ครั้ง) / สิทธิ {b.maxDays} วัน
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-emerald-700">
                    คงเหลือ {b.remainingDays} วัน
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingQuotaPerson(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
