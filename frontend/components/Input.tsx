import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    icon,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full px-4 py-3 ${icon ? 'pl-10' : ''}
            bg-bg-tertiary text-text-primary
            border border-white/10
            rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            placeholder-text-muted
            transition-smooth
            ${error ? 'border-error' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
        </div>
    );
}
