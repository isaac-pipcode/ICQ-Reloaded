import React from 'react';
import { COLORS } from '../constants';

// --- Retro Button ---
// Classic Windows 95/98 button style
interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'normal' | 'active';
}

export const RetroButton: React.FC<RetroButtonProps> = ({ children, className, variant = 'normal', ...props }) => {
  return (
    <button
      className={`
        px-3 py-1 text-sm font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white
        border-2 border-t-white border-l-white border-b-black border-r-black
        bg-[#c0c0c0] text-black outline-none focus:outline-black focus:outline-dashed focus:outline-1 focus:-outline-offset-4
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Retro Window Frame ---
interface RetroWindowProps {
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  width?: string;
  height?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({ 
  title, onClose, onMinimize, isActive = true, children, width = 'w-80', height = 'h-auto', icon, className
}) => {
  return (
    <div className={`${width} ${height} flex flex-col bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black shadow-xl ${className || ''}`}>
      {/* Title Bar */}
      <div className={`
        flex items-center justify-between px-1 py-0.5 m-0.5
        ${isActive ? 'bg-[#000080] text-white' : 'bg-[#808080] text-[#c0c0c0]'}
      `}>
        <div className="flex items-center gap-1 font-bold text-sm tracking-wide select-none">
          {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
          <span>{title}</span>
        </div>
        <div className="flex gap-0.5">
          {onMinimize && (
            <button onClick={onMinimize} className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-end justify-center pb-0.5 active:border-t-black active:border-l-black">
              <div className="w-2 h-0.5 bg-black"></div>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-black">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

// --- Beveled Input ---
export const RetroInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  return (
    <input
      ref={ref}
      className={`
        border-2 border-t-black border-l-black border-b-white border-r-white
        bg-white px-1 py-0.5 text-sm font-sans w-full outline-none
        ${props.className || ''}
      `}
      {...props}
    />
  );
});

RetroInput.displayName = 'RetroInput';

// --- Beveled Container (Sunken) ---
export const SunkenContainer: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => {
  return (
    <div className={`border-2 border-t-black border-l-black border-b-white border-r-white bg-white ${className || ''}`}>
      {children}
    </div>
  );
};
