'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { User, Mail, MapPin, Lock, FileText, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import AuthCard from '@/components/auth/AuthCard';
import Stepper from '@/components/auth/Stepper';
import TextField from '@/components/auth/TextField';
import DateField, { checkIsAdult } from '@/components/auth/DateField';

const step1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full legal name must be between 2 and 80 characters')
    .max(80, 'Full legal name must be between 2 and 80 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  address: z
    .string()
    .trim()
    .min(10, 'Physical address must be at least 10 characters'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date in DD-MM-YYYY format')
    .refine((dob) => checkIsAdult(dob), 'You must be at least 18 years old to register'),
});

const step2Schema = z.object({
  idProofNumber: z
    .string()
    .trim()
    .min(6, 'ID proof number must be at least 6 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-15');

  const [idType, setIdType] = useState('PAN');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (fieldName: string, value: string) => {
    try {
      if (fieldName === 'fullName') {
        step1Schema.shape.fullName.parse(value);
      } else if (fieldName === 'email') {
        step1Schema.shape.email.parse(value);
      } else if (fieldName === 'phone') {
        step1Schema.shape.phone.parse(value);
      } else if (fieldName === 'address') {
        step1Schema.shape.address.parse(value);
      } else if (fieldName === 'dateOfBirth') {
        step1Schema.shape.dateOfBirth.parse(value);
      } else if (fieldName === 'idProofNumber') {
        step2Schema.shape.idProofNumber.parse(value);
      } else if (fieldName === 'password') {
        step2Schema.shape.password.parse(value);
      }
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: err.issues[0]?.message || 'Invalid value',
        }));
      }
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value);
  };

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const result = step1Schema.safeParse({
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err: z.ZodIssue) => {
        const key = err.path[0] as string;
        if (!errors[key]) errors[key] = err.message;
      });
      setFieldErrors(errors);
      setTouched({
        fullName: true,
        email: true,
        phone: true,
        address: true,
        dateOfBirth: true,
      });
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const step2Result = step2Schema.safeParse({ idProofNumber, password });
    if (!step2Result.success) {
      const errors: Record<string, string> = {};
      step2Result.error.issues.forEach((err: z.ZodIssue) => {
        const key = err.path[0] as string;
        if (!errors[key]) errors[key] = err.message;
      });
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setTouched((prev) => ({ ...prev, idProofNumber: true, password: true }));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          dateOfBirth,
          idProofNumber: `${idType}-${idProofNumber.trim()}`,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error?.message || 'Registration failed';

        if (message.toLowerCase().includes('email')) {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'This email is already registered',
          }));
          setStep(1);
        } else if (message.toLowerCase().includes('phone')) {
          setFieldErrors((prev) => ({
            ...prev,
            phone: 'This phone number is already registered',
          }));
          setStep(1);
        } else {
          setGeneralError(message);
        }
        return;
      }

      router.push('/customer/dashboard');
      router.refresh();
    } catch {
      setGeneralError('Connection failed. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    phone.trim().length === 10 &&
    address.trim().length >= 10 &&
    checkIsAdult(dateOfBirth);

  const isStep2Valid = idProofNumber.trim().length >= 6 && password.length >= 6;

  return (
    <div className="min-h-screen bg-[#F3F7FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <AuthCard maxWidth="max-w-[560px]">
        <div className="text-center mb-6">
          <BrandLogo className="mx-auto mb-2" />
          <p className="text-xs text-[#6B7090] font-medium">
            Simulated Digital Asset &amp; Transaction Ledger
          </p>
        </div>

        <Stepper currentStep={step} />

        <div className="mb-6">
          {step === 1 ? (
            <div>
              <h1 className="text-xl font-bold text-[#1B0B5C] tracking-tight">
                Step 1: Master profile information
              </h1>
              <p className="text-sm text-[#6B7090] mt-1">
                Tell us who you are. All data is synthetic.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-[#1B0B5C] tracking-tight">
                Step 2: Simulated KYC verification
              </h1>
              <p className="text-sm text-[#6B7090] mt-1">
                Privacy-preserving identity simulation. No real PII stored.
              </p>
            </div>
          )}
        </div>

        {generalError && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#D6204F] text-xs leading-relaxed"
          >
            {generalError}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Continue} className="space-y-4" noValidate>
            <TextField
              id="fullName"
              label="Full Legal Name"
              value={fullName}
              onChangeValue={(val) => {
                setFullName(val);
                if (touched.fullName) validateField('fullName', val);
              }}
              onBlur={() => handleBlur('fullName', fullName)}
              placeholder="Your full name"
              autoComplete="name"
              required
              error={touched.fullName ? fieldErrors.fullName : undefined}
              icon={User}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChangeValue={(val) => {
                  setEmail(val);
                  if (touched.email) validateField('email', val);
                }}
                onBlur={() => handleBlur('email', email)}
                placeholder="name@example.com"
                autoComplete="email"
                required
                error={touched.email ? fieldErrors.email : undefined}
                icon={Mail}
              />

              <TextField
                id="phone"
                type="tel"
                inputMode="tel"
                label="Mobile Number"
                value={phone}
                onChangeValue={(val) => {
                  const digits = val.replace(/\D/g, '').slice(0, 10);
                  setPhone(digits);
                  if (touched.phone) validateField('phone', digits);
                }}
                onBlur={() => handleBlur('phone', phone)}
                placeholder="10-digit mobile number"
                prefixText="+91"
                autoComplete="tel"
                required
                maxLength={10}
                error={touched.phone ? fieldErrors.phone : undefined}
              />
            </div>

            <TextField
              id="address"
              label="Physical Address"
              value={address}
              onChangeValue={(val) => {
                setAddress(val);
                if (touched.address) validateField('address', val);
              }}
              onBlur={() => handleBlur('address', address)}
              placeholder="House no, street, city, PIN"
              autoComplete="street-address"
              required
              error={touched.address ? fieldErrors.address : undefined}
              icon={MapPin}
            />

            <DateField
              id="dateOfBirth"
              label="Date of Birth (DD-MM-YYYY)"
              isoValue={dateOfBirth}
              onChangeIso={(val) => {
                setDateOfBirth(val);
                if (touched.dateOfBirth) validateField('dateOfBirth', val);
              }}
              onBlur={() => handleBlur('dateOfBirth', dateOfBirth)}
              required
              error={touched.dateOfBirth ? fieldErrors.dateOfBirth : undefined}
            />

            <button
              type="submit"
              disabled={!isStep1Valid}
              className={`w-full h-[52px] rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-6 shadow-md ${
                isStep1Valid
                  ? 'bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white hover:-translate-y-0.5'
                  : 'bg-[#B9C6FF] text-white cursor-not-allowed'
              }`}
            >
              <span>Continue to Simulated KYC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-4" noValidate>
            <div className="p-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] text-xs text-[#2B2F4A] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#0B4FFF]">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy-Preserving KYC Simulation</span>
              </div>
              <p className="text-[11px] text-[#6B7090] leading-relaxed">
                ByteBank stores only cryptographic SHA-256 hashes and the non-sensitive last 4 digits (e.g. <code>9901</code>) in the database to prevent PII exposure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="idType"
                  className="block text-sm font-semibold text-[#2B2F4A] mb-1.5"
                >
                  ID Document Type
                </label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full h-12 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] hover:border-[#B9C6FF] px-3.5 text-sm text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF] focus:ring-3 focus:ring-[#0B4FFF]/18 transition-all"
                >
                  <option value="PAN">PAN Card</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>

              <TextField
                id="idProofNumber"
                label="Simulated ID Number"
                value={idProofNumber}
                onChangeValue={(val) => {
                  setIdProofNumber(val);
                  if (touched.idProofNumber) validateField('idProofNumber', val);
                }}
                onBlur={() => handleBlur('idProofNumber', idProofNumber)}
                placeholder="e.g. ABCDE1234F"
                required
                error={touched.idProofNumber ? fieldErrors.idProofNumber : undefined}
                icon={FileText}
              />
            </div>

            <TextField
              id="password"
              type="password"
              label="Account Password"
              value={password}
              onChangeValue={(val) => {
                setPassword(val);
                if (touched.password) validateField('password', val);
              }}
              onBlur={() => handleBlur('password', password)}
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
              error={touched.password ? fieldErrors.password : undefined}
              icon={Lock}
            />

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-[52px] px-6 rounded-full bg-[#F6F8FF] border border-[#E1E6F5] text-sm font-semibold text-[#2B2F4A] hover:bg-[#EBF2FF] hover:border-[#B9C6FF] transition-all"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading || !isStep2Valid}
                className={`flex-1 h-[52px] rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  !loading && isStep2Valid
                    ? 'bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white hover:-translate-y-0.5'
                    : 'bg-[#B9C6FF] text-white cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-[#6B7090]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#0B4FFF] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
