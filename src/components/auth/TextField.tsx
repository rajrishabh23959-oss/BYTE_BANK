import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  icon?: LucideIcon;
  prefixText?: string;
  value: string;
  onChangeValue?: (val: string) => void;
}

export default function TextField({
  id,
  label,
  error,
  icon: Icon,
  prefixText,
  value,
  onChangeValue,
  onChange,
  className = '',
  type = 'text',
  placeholder,
  ...rest
}: TextFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onChangeValue?.(e.target.value);
  };

  const hasLeftElement = !!Icon || !!prefixText;

  let leftPadding = 'px-3.5';
  if (prefixText) {
    leftPadding = 'pl-[68px] pr-3.5';
  } else if (Icon) {
    leftPadding = 'pl-10 pr-3.5';
  }

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#2B2F4A] mb-1.5"
      >
        {label}
      </label>

      <div className="relative flex items-center">
        {prefixText && (
          <span className="absolute left-3.5 flex items-center text-xs font-semibold text-[#6B7090] select-none pointer-events-none pr-2.5 border-r border-[#E1E6F5]">
            {prefixText}
          </span>
        )}

        {!prefixText && Icon && (
          <Icon className="w-4 h-4 text-[#6B7090] absolute left-3.5 pointer-events-none" />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full h-12 rounded-xl bg-[#F6F8FF] border text-sm text-[#1B0B5C] placeholder:text-[#A5AAC4] transition-all focus:outline-none ${leftPadding} ${
            error
              ? 'border-[#F43F6E] focus:border-[#F43F6E] focus:ring-3 focus:ring-[#F43F6E]/18'
              : 'border-[#E1E6F5] hover:border-[#B9C6FF] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[#0B4FFF]/18'
          } ${className}`}
          {...rest}
        />
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-[#D6204F] mt-1.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}

