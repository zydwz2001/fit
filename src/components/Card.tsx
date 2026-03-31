import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}

export function Card({ children, className = '', size = 'md' }: CardProps) {
  const sizeStyles = {
    md: 'rounded-2xl',
    lg: 'rounded-vibe-lg',
    xl: 'rounded-vibe-xl',
  };

  return (
    <div className={`bg-white shadow-sm border border-slate-50 ${sizeStyles[size]} ${className}`}>
      {children}
    </div>
  );
}
