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
  const baseStyles = 'h-10 rounded-vibe font-bold text-sm transition-all flex items-center justify-center gap-2';

  const variantStyles = {
    primary: disabled ? 'bg-slate-300 text-slate-50 cursor-not-allowed' : 'bg-vibe-green text-white hover:opacity-90',
    secondary: disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
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
