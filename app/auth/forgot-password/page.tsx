'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { ExpressAuthAPI } from '@/lib/api/express-auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange'
  });

  const emailValue = watch('email');

  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update validation state
  React.useEffect(() => {
    if (emailTouched) {
      if (!emailValue) {
        setEmailValid(false);
      } else {
        setEmailValid(validateEmail(emailValue) && !errors.email);
      }
    }
  }, [emailValue, emailTouched, errors.email]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ExpressAuthAPI.resetPassword(data.email);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        // Still show success to prevent email enumeration
        setIsSubmitted(true);
      }
    } catch (err) {
      // Still show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden flex items-center justify-center p-4">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 h-48 bg-[#00af8f]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-56 h-56 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00af8f]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-slide-up">
            <CardHeader className="text-center pb-4 px-6 pt-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl animate-scale-in">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Check Your Email
              </CardTitle>
              <p className="text-gray-600">We've sent you a reset link</p>
            </CardHeader>
            <CardContent className="text-center space-y-6 p-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-gray-700 leading-relaxed">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/auth/login">
                  <Button className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-[#00af8f] via-[#00af90] to-teal-600 hover:from-teal-600 hover:via-[#00af90] hover:to-[#00af8f] shadow-xl transition-all duration-500 rounded-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative z-10">Back to Login</span>
                  </Button>
                </Link>

                <p className="text-sm text-gray-600">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-[#00af8f] hover:text-[#00af90] font-semibold hover:underline transition-colors duration-200">
                    Try again
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-48 h-48 bg-[#00af8f]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00af8f]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link
            href="/auth/login"
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 inline-flex items-center transition-colors duration-200 group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back to Login</span>
          </Link>

          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Forgot Password?
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed px-4">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-slide-up">
          <CardHeader className="text-center pb-4 px-6 pt-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm animate-shake">
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                  <span>Email Address</span>
                  {emailTouched && emailValue && (
                    <span className={`text-xs font-normal ${!errors.email && emailValid ? 'text-green-600' : 'text-red-500'}`}>
                      {!errors.email && emailValid ? '✓ Valid' : '✗ Invalid format'}
                    </span>
                  )}
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className={`h-12 text-base !border-2 rounded-xl transition-all duration-300 pl-4 pr-12 ${
                      emailTouched && (errors.email || (emailValue && !emailValid))
                        ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                        : emailTouched && emailValue && !errors.email && emailValid
                        ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                        : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                    } group-hover:shadow-md`}
                    {...register('email', {
                      onBlur: () => setEmailTouched(true),
                      onChange: async (e) => {
                        setEmailTouched(true);
                        await trigger('email');
                      }
                    })}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {emailTouched && emailValue && (
                      <div className="animate-scale-in">
                        {!errors.email && emailValid ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {errors.email && emailTouched && (
                  <p className="text-red-500 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                    <X className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
                {!errors.email && emailTouched && emailValid && emailValue && (
                  <p className="text-green-600 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                    <Check className="w-4 h-4" />
                    <span>Email looks good!</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 text-base font-bold text-white bg-gradient-to-r from-[#00af8f] via-[#00af90] to-teal-600 hover:from-teal-600 hover:via-[#00af90] hover:to-[#00af8f] shadow-xl transition-all duration-500 rounded-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  <span className="relative z-10">Send Reset Link</span>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="text-[#00af8f] hover:text-[#00af90] font-semibold hover:underline transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
