import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'h-10 rounded-vibe font-bold text-sm transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibe-green/40 focus-visible:ring-offset-2 active:scale-[0.98] disabled:active:scale-100';

  const variantStyles = {
    primary: disabled ? 'bg-slate-300 text-slate-50 cursor-not-allowed' : 'bg-vibe-green text-white shadow-[0_3px_9px_rgba(16,185,129,0.18)] hover:bg-emerald-600',
    secondary: disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: disabled ? 'bg-transparent text-slate-300 cursor-not-allowed' : 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  const sizeStyles = {
    sm: 'px-3 text-xs',
    md: 'px-4',
    lg: 'px-6 h-12 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
