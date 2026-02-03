import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/60',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
  outline: 'bg-transparent hover:bg-slate-900 text-slate-100 border border-slate-700',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
          Processing
        </span>
      )}
      {!isLoading && children}
    </button>
  );
};
