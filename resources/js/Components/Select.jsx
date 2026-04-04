import React from 'react';

export default function Select({ id, value, onChange, className = '', children, ...props }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`border-gray-300 focus:border-primary focus:ring-primary rounded-md shadow-sm ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}
