import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'mobile-primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    // Desktop Hero Blue
    primary: 'bg-desktop-hero hover:bg-desktop-deep text-white shadow-md hover:shadow-lg rounded-xl',
    // Global Express Sampled Orange CTA (#fd8f49)
    accent: 'bg-desktop-accent hover:bg-desktop-accentHover text-white shadow-lg hover:shadow-xl rounded-xl uppercase tracking-wider font-black',
    // YATRE Mobile Dark Navy Button (#003072)
    'mobile-primary': 'bg-mobile-primaryBtn hover:opacity-95 text-white shadow-md rounded-2xl text-center py-3.5',
    // Outline style
    outline: 'border-2 border-desktop-hero text-desktop-hero hover:bg-desktop-bgTint rounded-xl',
    // Ghost
    ghost: 'text-slate-700 hover:bg-slate-100 rounded-xl',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
