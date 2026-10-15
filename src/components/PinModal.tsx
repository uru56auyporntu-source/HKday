import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, X, RotateCcw } from 'lucide-react';
import { Personnel } from '../types/leave';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetTabName?: string;
  currentPersonnel: Personnel;
  onQuickSwitchToAdmin?: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetTabName = 'เมนูที่จำกัดสิทธิ์',
  currentPersonnel,
  onQuickSwitchToAdmin
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRoleAuthorizedForApproval = 
    currentPersonnel.role === 'director' || 
    currentPersonnel.role === 'academic_head' || 
    currentPersonnel.role === 'admin';

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const verifyPin = (pinToVerify: string) => {
    if (pinToVerify === '1234') {
      if (targetTabName === 'การอนุมัติ' && !isRoleAuthorizedForApproval) {
        setError('เฉพาะผู้อำนวยการโรงเรียน, หัวหน้าวิชาการ และผู้ดูแลระบบเท่านั้นที่มีสิทธิ์เข้าถึงเมนูการอนุมัติ');
        return;
      }
      onSuccess();
    } else {
      setError('รหัสผ่านความปลอดภัยไม่ถูกต้อง');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">
            ยืนยันรหัสความปลอดภัย
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            เข้าถึง <span className="font-semibold text-blue-900">{targetTabName}</span>
          </p>
        </div>

        {/* Current User Warning if not authorized for approvals */}
        {targetTabName === 'การอนุมัติ' && !isRoleAuthorizedForApproval && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">ท่านเข้าสู่ระบบในฐานะ: {currentPersonnel.prefix}{currentPersonnel.firstName} ({currentPersonnel.position})</p>
              <p className="mt-0.5 text-slate-600">
                เมนูนี้จำกัดเฉพาะ ผอ. / หัวหน้าวิชาการ / ผู้ดูแลระบบ
              </p>
              {onQuickSwitchToAdmin && (
                <button
                  type="button"
                  onClick={onQuickSwitchToAdmin}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  สลับผู้ใช้งานเป็น ผู้อำนวยการ หรือ หัวหน้าวิชาการ คลิกที่นี่
                </button>
              )}
            </div>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-blue-600 scale-125 shadow-xs'
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center text-xs text-rose-600 font-medium mb-3 animate-shake">
            {error}
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-800 font-bold text-lg border border-slate-200 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs border border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            title="ล้างทั้งหมด"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> ล้าง
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-800 font-bold text-lg border border-slate-200 transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs border border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
          >
            ลบ
          </button>
        </div>

        {/* Professional prompt text without revealing the code */}
        <p className="text-center text-[11px] text-slate-400">
          กรุณาระบุรหัสผ่านความปลอดภัย 4 หลักเพื่อเข้าใช้งาน
        </p>
      </div>
    </div>
  );
};
