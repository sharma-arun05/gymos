// ============================================================================
// Global Design System — Atomic UI Component Library
// Palette: #09090B (BG), #18181B (Card), #111113 (Surface), #27272A (Border),
// #8B5CF6 (Primary), #22C55E (Success), #F59E0B (Warning), #EF4444 (Error)
// Typography: Inter / Geist font stack
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Search } from 'lucide-react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------------
// 1. BUTTON
// ----------------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-lg shadow-[#8B5CF6]/25 border border-[#8B5CF6]/30',
    secondary: 'bg-[#18181B] hover:bg-[#27272A] text-gray-200 border border-[#27272A]',
    outline: 'bg-transparent hover:bg-[#18181B] text-gray-300 border border-[#27272A] hover:border-[#8B5CF6]/50',
    ghost: 'bg-transparent hover:bg-[#18181B]/80 text-gray-400 hover:text-white',
    danger: 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white shadow-lg shadow-[#EF4444]/20 border border-[#EF4444]/30',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

// ----------------------------------------------------------------------------
// 2. INPUT
// ----------------------------------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-[#111113] text-gray-100 placeholder-gray-500 border rounded-xl px-4 py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-2',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error
              ? 'border-[#EF4444] focus:ring-[#EF4444]/40 focus:border-[#EF4444]'
              : 'border-[#27272A] focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6]',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#EF4444] flex items-center gap-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 3. SELECT
// ----------------------------------------------------------------------------
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className,
  id,
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full bg-[#111113] text-gray-100 border rounded-xl px-4 py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-2',
          error
            ? 'border-[#EF4444] focus:ring-[#EF4444]/40'
            : 'border-[#27272A] focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6]',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#18181B] text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF4444] font-medium">{error}</p>}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 4. CARD
// ----------------------------------------------------------------------------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'outline';
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-[#18181B] border border-[#27272A] shadow-lg rounded-2xl p-6 text-gray-200',
    glass: 'bg-[#18181B]/80 backdrop-blur-md border border-[#27272A]/80 shadow-xl rounded-2xl p-6 text-gray-200',
    interactive: 'bg-[#18181B] border border-[#27272A] hover:border-[#8B5CF6]/50 shadow-lg hover:shadow-[#8B5CF6]/10 transition-all duration-200 rounded-2xl p-6 text-gray-200 cursor-pointer',
    outline: 'bg-transparent border border-[#27272A] rounded-2xl p-6 text-gray-200',
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 5. BADGE
// ----------------------------------------------------------------------------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const variants = {
    primary: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30',
    success: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
    error: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
    info: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
    neutral: 'bg-[#27272A] text-gray-300 border border-[#27272A]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 w-fit', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

// ----------------------------------------------------------------------------
// 6. AVATAR
// ----------------------------------------------------------------------------
export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center font-bold text-white shadow-inner select-none shrink-0 border border-white/10',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || 'GY'}</span>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 7. SKELETON LOADER
// ----------------------------------------------------------------------------
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'rect', className, ...props }) => {
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4 w-3/4',
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#18181B] background-animate animate-pulse',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// ----------------------------------------------------------------------------
// 8. EMPTY STATE
// ----------------------------------------------------------------------------
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-12 bg-[#111113]/50 rounded-2xl border border-dashed border-[#27272A]', className)}>
      <div className="w-16 h-16 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#8B5CF6] mb-4 shadow-inner">
        {icon || <Info className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 9. PROGRESS BAR
// ----------------------------------------------------------------------------
export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    primary: 'from-[#8B5CF6] to-[#7C3AED]',
    success: 'from-[#22C55E] to-[#16A34A]',
    warning: 'from-[#F59E0B] to-[#D97706]',
    error: 'from-[#EF4444] to-[#DC2626]',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className="w-full h-2.5 bg-[#111113] rounded-full overflow-hidden border border-[#27272A]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full bg-gradient-to-r rounded-full', variants[variant])}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 font-medium">
          <span>{value.toLocaleString()}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 10. TOAST NOTIFICATION UTILITY
// ----------------------------------------------------------------------------
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss,
}) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#22C55E]" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
    info: <Info className="w-5 h-5 text-[#3B82F6]" />,
  };

  const borders = {
    success: 'border-[#22C55E]/40 bg-[#18181B]/95',
    error: 'border-[#EF4444]/40 bg-[#18181B]/95',
    warning: 'border-[#F59E0B]/40 bg-[#18181B]/95',
    info: 'border-[#3B82F6]/40 bg-[#18181B]/95',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-200',
              borders[toast.type]
            )}
          >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-100">{toast.title}</h4>
              {toast.message && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 11. METRIC CARD (KPI Card for Executive Dashboard)
// ----------------------------------------------------------------------------
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  onClick,
  className,
}) => {
  return (
    <Card
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className={cn('relative overflow-hidden flex flex-col justify-between group p-5', className)}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#27272A] flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform duration-200 shadow-sm">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight mb-1">{value}</div>
        <div className="flex items-center gap-2">
          {change && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-md inline-flex items-center',
                isPositive
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                  : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
              )}
            >
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#8B5CF6]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#8B5CF6]/10 transition-all duration-300" />
    </Card>
  );
};
