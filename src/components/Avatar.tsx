import React from 'react';

interface AvatarProps {
  prefix?: string;
  gender?: 'male' | 'female';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  prefix = 'นาย',
  gender,
  size = 'md',
  className = '',
}) => {
  const isFemale = gender ? gender === 'female' : (prefix === 'นาง' || prefix === 'นางสาว');

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`rounded-2xl shrink-0 flex items-center justify-center overflow-hidden shadow-xs transition-transform ${
        isFemale ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
      } ${sizeClasses[size]} ${className}`}
    >
      {isFemale ? (
        // Cute Cartoon Female Teacher Avatar SVG
        <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hair back */}
          <circle cx="32" cy="30" r="19" fill="#4B2E1E" />
          <path d="M14 36C14 44 19 49 22 51C22 51 20 44 21 38" fill="#4B2E1E" />
          <path d="M50 36C50 44 45 49 42 51C42 51 44 44 43 38" fill="#4B2E1E" />
          {/* Face */}
          <circle cx="32" cy="32" r="14" fill="#FFDFC4" />
          {/* Hair front & bangs */}
          <path d="M18 28C20 20 28 16 32 16C36 16 44 20 46 28C43 23 37 22 32 23C27 22 21 23 18 28Z" fill="#3A2214" />
          {/* Eyes */}
          <circle cx="27" cy="32" r="2.2" fill="#2D3748" />
          <circle cx="37" cy="32" r="2.2" fill="#2D3748" />
          {/* Eye shine */}
          <circle cx="26.3" cy="31.3" r="0.8" fill="#FFFFFF" />
          <circle cx="36.3" cy="31.3" r="0.8" fill="#FFFFFF" />
          {/* Blushes */}
          <circle cx="24" cy="36" r="2.5" fill="#FFAAA6" opacity="0.8" />
          <circle cx="40" cy="36" r="2.5" fill="#FFAAA6" opacity="0.8" />
          {/* Smile */}
          <path d="M29 36C30.5 38 33.5 38 35 36" stroke="#C55353" strokeWidth="1.6" strokeLinecap="round" />
          {/* Teacher glasses / hairpin */}
          <circle cx="43" cy="23" r="2.5" fill="#FF6B8B" />
          {/* Clothes (blouse) */}
          <path d="M21 54C21 46 26 44 32 44C38 44 43 46 43 54L45 64H19L21 54Z" fill="#E8618C" />
          {/* Collar */}
          <path d="M32 44L28 50L32 53L36 50L32 44Z" fill="#FFFFFF" />
        </svg>
      ) : (
        // Cute Cartoon Male Teacher Avatar SVG
        <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hair back */}
          <circle cx="32" cy="28" r="18" fill="#2D3748" />
          {/* Face */}
          <circle cx="32" cy="32" r="14" fill="#FFDFC4" />
          {/* Hair front styled */}
          <path d="M18 25C21 16 29 14 34 14C41 14 47 18 47 25C43 20 37 19 32 20C26 21 21 21 18 25Z" fill="#1A202C" />
          {/* Eyes */}
          <circle cx="27" cy="32" r="2.2" fill="#2D3748" />
          <circle cx="37" cy="32" r="2.2" fill="#2D3748" />
          {/* Eye shine */}
          <circle cx="26.3" cy="31.3" r="0.8" fill="#FFFFFF" />
          <circle cx="36.3" cy="31.3" r="0.8" fill="#FFFFFF" />
          {/* Smile */}
          <path d="M29 36C30.5 38.5 33.5 38.5 35 36" stroke="#B85D3B" strokeWidth="1.6" strokeLinecap="round" />
          {/* Cute glasses */}
          <rect x="22" y="28" width="9" height="7" rx="2" stroke="#2B6CB0" strokeWidth="1.4" fill="none" />
          <rect x="33" y="28" width="9" height="7" rx="2" stroke="#2B6CB0" strokeWidth="1.4" fill="none" />
          <line x1="31" y1="31" x2="33" y2="31" stroke="#2B6CB0" strokeWidth="1.4" />
          {/* Clothes (Shirt & Tie) */}
          <path d="M20 54C20 46 25 44 32 44C39 44 44 46 44 54L46 64H18L20 54Z" fill="#2B6CB0" />
          {/* Tie */}
          <path d="M31 44H33L34 52L32 57L30 52L31 44Z" fill="#ECC94B" />
          <polygon points="30,44 34,44 33,46 31,46" fill="#D69E2E" />
        </svg>
      )}
    </div>
  );
};
