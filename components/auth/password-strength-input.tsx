'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordStrengthInputProps {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  showStrength?: boolean;
  className?: string;
}

export function PasswordStrengthInput({
  id,
  placeholder = 'Enter password',
  value,
  onChange,
  onBlur,
  name,
  showStrength = true,
  className = ''
}: PasswordStrengthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`h-12 text-lg border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-2 focus:ring-[#00af8f]/20 rounded-xl pr-12 ${className}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#333333]"
          onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </Button>
      </div>

      {showStrength && value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#666666]">Password strength:</span>
            <span className={`font-medium ${
              passwordStrength.strength <= 2 ? 'text-red-500' :
              passwordStrength.strength <= 3 ? 'text-yellow-500' :
              passwordStrength.strength <= 4 ? 'text-blue-500' :
              'text-green-500'
            }`}>
              {passwordStrength.label}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
            />
          </div>
          <div className="text-xs text-[#666666] space-y-1">
            <p>Password should contain:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li className={value.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
              <li className={/[a-z]/.test(value) && /[A-Z]/.test(value) ? 'text-green-600' : ''}>Upper and lowercase letters</li>
              <li className={/\d/.test(value) ? 'text-green-600' : ''}>At least one number</li>
              <li className={/[^a-zA-Z0-9]/.test(value) ? 'text-green-600' : ''}>Special character (recommended)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
