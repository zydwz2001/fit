import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: string;
  className?: string;
}

export function Input({ leftIcon, className = '', ...props }: InputProps) {
  return (
    <div className={`h-10 bg-slate-100 rounded-full px-4 flex items-center gap-3 ${className}`}>
      {leftIcon && <i className={`fas ${leftIcon} text-slate-400 text-sm`}></i>}
      <input
        className="bg-transparent border-none outline-none text-xs flex-1 w-full"
        {...props}
      />
    </div>
  );
}
