'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateFieldProps {
  id: string;
  label?: string;
  isoValue: string;
  onChangeIso: (val: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}

export function checkIsAdult(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split('-').map(Number);
  const dob = new Date(year, month - 1, day);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function displayToIso(display: string): string | null {
  const parts = display.trim().split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) return null;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

export default function DateField({
  id,
  label = 'Date of Birth (DD-MM-YYYY)',
  isoValue,
  onChangeIso,
  onBlur,
  error,
  required,
}: DateFieldProps) {
  const [displayValue, setDisplayValue] = useState(isoToDisplay(isoValue));
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(isoToDisplay(isoValue));
  }, [isoValue]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d-]/g, '');
    const digitsOnly = raw.replace(/-/g, '');

    if (digitsOnly.length <= 2) {
      raw = digitsOnly;
    } else if (digitsOnly.length <= 4) {
      raw = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`;
    } else {
      raw = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4, 8)}`;
    }

    setDisplayValue(raw);

    if (raw.length === 10) {
      const parsedIso = displayToIso(raw);
      if (parsedIso) {
        onChangeIso(parsedIso);
      }
    } else if (raw.length === 0) {
      onChangeIso('');
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    if (newIso) {
      onChangeIso(newIso);
      setDisplayValue(isoToDisplay(newIso));
      onBlur?.();
    }
  };

  const triggerPicker = () => {
    try {
      hiddenDateInputRef.current?.showPicker();
    } catch {
      hiddenDateInputRef.current?.focus();
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#2B2F4A] mb-1.5"
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <button
          type="button"
          onClick={triggerPicker}
          tabIndex={-1}
          aria-label="Open calendar picker"
          className="w-10 h-12 flex items-center justify-center text-[#6B7090] hover:text-[#0B4FFF] absolute left-0 z-10 transition-colors"
        >
          <Calendar className="w-4 h-4" />
        </button>

        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onBlur={onBlur}
          placeholder="DD-MM-YYYY"
          autoComplete="bday"
          required={required}
          maxLength={10}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full h-12 rounded-xl bg-[#F6F8FF] border text-sm text-[#1B0B5C] placeholder:text-[#A5AAC4] pl-10 pr-3.5 transition-all focus:outline-none ${
            error
              ? 'border-[#F43F6E] focus:border-[#F43F6E] focus:ring-3 focus:ring-[#F43F6E]/18'
              : 'border-[#E1E6F5] hover:border-[#B9C6FF] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[#0B4FFF]/18'
          }`}
        />

        <input
          ref={hiddenDateInputRef}
          type="date"
          value={isoValue}
          onChange={handleNativeDateChange}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute left-3.5 opacity-0 w-6 h-6 pointer-events-none"
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

