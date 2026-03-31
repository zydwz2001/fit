import { ReactNode } from 'react';

interface FABProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FAB({ children, onClick, className = '' }: FABProps) {
  return (
    <button
      className={`fab bg-vibe-green ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
