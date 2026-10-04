import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: string;
  className?: string;
}

export function Input({ leftIcon, className = '', ...props }: InputProps) {
  return (
    <div className={`h-11 bg-white border border-slate-200 rounded-xl px-4 flex items-center gap-3 transition-all focus-within:border-vibe-green focus-within:ring-2 focus-within:ring-vibe-green/15 ${className}`}>
      {leftIcon && <i className={`fas ${leftIcon} text-slate-400 text-sm`}></i>}
      <input
        className="bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 flex-1 w-full"
        {...props}
      />
    </div>
  );
}
