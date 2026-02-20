import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
    id?: string;
}

export default function Card({ children, className = '', hover = false, onClick, id }: CardProps) {
    const hoverClass = hover ? 'glass-card-hover cursor-pointer' : '';

    return (
        <div
            id={id}
            className={`glass-card rounded-2xl p-6 ${hoverClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
