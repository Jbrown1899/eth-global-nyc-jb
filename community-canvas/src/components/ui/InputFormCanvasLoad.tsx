import React from 'react';

// Define the interface for props with optional and required fields
export interface InputFormProps {
    label: string;
    placeholder: string;
    value?: string;
    type?: string;
    large?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

// The enhanced InputForm component
export function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
                {label}
            </label>
            {large ? (
                // Use a textarea if the 'large' prop is true
                <textarea
                    className="w-full rounded-md border-zinc-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2"
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={onChange}
                />
            ) : (
                // Otherwise, use a standard input field
                <input
                    className="w-full rounded-md border-zinc-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2"
                    type={type || "text"}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={onChange}
                />
            )}
        </div>
    );
}