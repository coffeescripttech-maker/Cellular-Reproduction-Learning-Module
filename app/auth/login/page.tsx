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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowRight, Shield, User, BookOpen, Sparkles, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['student', 'teacher'])
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(
    'student'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'student'
    },
    mode: 'onChange' // Enable real-time validation
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 1; // Just check if not empty for login
  };

  // Update validation states on input change
  React.useEffect(() => {
    if (emailTouched) {
      if (!emailValue) {
        setEmailValid(false);
      } else {
        setEmailValid(validateEmail(emailValue) && !errors.email);
      }
    }
  }, [emailValue, emailTouched, errors.email]);

  React.useEffect(() => {
    if (passwordTouched) {
      if (!passwordValue) {
        setPasswordValid(false);
      } else {
        setPasswordValid(validatePassword(passwordValue) && !errors.password);
      }
    }
  }, [passwordValue, passwordTouched, errors.password]);

  const roleConfig = {
    teacher: {
      icon: Shield,
      title: 'Teacher Sign In',
      description: 'Access your dashboard',
      color: 'text-teal-600',
      bgColor: 'bg-gradient-to-r from-teal-500 to-[#00af8f]',
      borderColor: 'border-teal-500'
    },
    student: {
      icon: User,
      title: 'Student Sign In',
      description: 'Continue learning',
      color: 'text-[#00af8f]',
      bgColor: 'bg-gradient-to-r from-[#00af8f] to-[#00af90]',
      borderColor: 'border-[#00af8f]'
    }
  } as const;

  const config = roleConfig[selectedRole];

  const handleRoleChange = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Login form submitted with data:', data);
      console.log('Calling login function...');
      const result = await login(data.email, data.password, data.role);
      console.log('Login function returned:', result);

      if (result.success && result.user) {
        console.log('Login successful, user data:', result.user);
        console.log('User role:', result.user.role);
        console.log('Onboarding completed:', result.user.onboardingCompleted);

        // Wait for auth state to update before redirecting
        console.log('Waiting for auth state to update...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Role-based redirect according to features.txt
        if (result.user.role === 'teacher') {
          console.log('Redirecting teacher to dashboard');
          window.location.href = '/teacher/dashboard';
        } else if (result.user.role === 'student') {
          if (result.user.onboardingCompleted) {
            console.log('Student onboarding completed, redirecting to dashboard');
            window.location.href = '/student/dashboard';
          } else {
            console.log('Student onboarding not completed, redirecting to VARK');
            window.location.href = '/onboarding/vark';
          }
        }
      } else {
        console.log('Login failed or no user data:', result);
        // Error handling is now done by Sonner toast in auth.ts
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      // Error handling is now done by Sonner toast in auth.ts
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced Background Decorations with Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-[#00af8f]/20 to-[#00af8f]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-56 h-56 sm:w-80 sm:h-80 bg-gradient-to-r from-[#00af8f]/15 to-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-[#00af8f]/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="hidden lg:block absolute top-40 right-40 w-64 h-64 bg-gradient-to-r from-teal-400/15 to-[#00af8f]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="hidden lg:block absolute bottom-40 left-40 w-56 h-56 bg-gradient-to-r from-[#00af8f]/15 to-teal-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.3s' }} />
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#00af8f]/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-teal-400/30 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-[#00af8f]/30 rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-6xl relative z-10 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Info */}
          <div className="hidden lg:block space-y-8 px-8">
            {/* Logo & Title */}
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">BISCAS NAGA</h1>
                  <p className="text-sm text-gray-600">Learning Module System</p>
                </div>
              </div>
              
              <div className="h-1 w-24 bg-gradient-to-r from-[#00af8f] to-teal-400 rounded-full" />
            </div>

            {/* Features */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Access your personalized learning dashboard and continue your educational journey.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: 'Personalized VARK Learning Styles' },
                  { icon: BookOpen, text: 'Interactive Learning Modules' },
                  { icon: Shield, text: 'Secure & Private Platform' }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 transform hover:translate-x-2"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Quote */}
            <div className="p-6 bg-gradient-to-br from-[#00af8f]/10 to-teal-400/10 rounded-2xl border border-[#00af8f]/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-gray-700 italic text-lg">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <p className="text-gray-600 text-sm mt-2">— Nelson Mandela</p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8 animate-fade-in">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">BISCAS NAGA</h1>
              <p className="text-gray-600">Learning Module System</p>
            </div>

            {/* Login Card */}
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md group hover:shadow-3xl transition-all duration-500 animate-slide-up">
              <CardHeader className="text-center pb-4 px-6 pt-8">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 ${
                      selectedRole === 'teacher'
                        ? 'bg-gradient-to-br from-teal-500 to-[#00af8f]'
                        : 'bg-gradient-to-br from-[#00af8f] to-[#00af90]'
                    }`}>
                    {(() => {
                      const IconComponent = config.icon;
                      return (
                        <IconComponent className="w-7 h-7 text-white" />
                      );
                    })()}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {config.title}
                </CardTitle>
                <p className="text-gray-600 text-sm">{config.description}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Role Selection Tabs */}
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="text-gray-900 font-semibold text-base">
                      I am a...
                    </Label>
                  </div>

                  <Tabs
                    value={selectedRole}
                    onValueChange={value =>
                      handleRoleChange(value as 'student' | 'teacher')
                    }
                    className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-20 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1.5 shadow-inner">
                      {(['student', 'teacher'] as const).map(role => (
                        <TabsTrigger
                          key={role}
                          value={role}
                          className="flex flex-col items-center justify-center space-y-2 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#00af8f] data-[state=active]:to-[#00af90] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-[#00af8f] data-[state=inactive]:hover:bg-white/50 rounded-lg transition-all duration-300 transform data-[state=active]:scale-105">
                          {/* Icon Container */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              selectedRole === role
                                ? 'bg-white/25 shadow-md'
                                : 'bg-gradient-to-br from-[#00af8f]/20 to-[#00af90]/20'
                            }`}>
                            {(() => {
                              const IconComponent = roleConfig[role].icon;
                              return (
                                <IconComponent className={`w-5 h-5 ${selectedRole === role ? 'text-white' : 'text-[#00af8f]'}`} />
                              );
                            })()}
                          </div>

                          {/* Role Text */}
                          <div className="text-center">
                            <div className="font-bold text-sm capitalize">
                              {role}
                            </div>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5">
                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50/80 backdrop-blur-sm animate-shake">
                      <AlertDescription className="text-red-800 text-sm font-medium">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                        <span>Password</span>
                        {passwordTouched && passwordValue && (
                          <span className={`text-xs font-normal ${!errors.password && passwordValid ? 'text-green-600' : 'text-red-500'}`}>
                            {!errors.password && passwordValid ? '✓ Entered' : '✗ Required'}
                          </span>
                        )}
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[#00af8f] hover:text-[#00af90] font-medium text-xs transition-colors duration-200 hover:underline">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`h-12 text-base !border-2 rounded-xl pr-24 transition-all duration-300 pl-4 ${
                          passwordTouched && (errors.password || (passwordValue && !passwordValid))
                            ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                            : passwordTouched && passwordValue && !errors.password && passwordValid
                            ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                            : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                        } group-hover:shadow-md`}
                        {...register('password', {
                          onBlur: () => setPasswordTouched(true),
                          onChange: async (e) => {
                            setPasswordTouched(true);
                            await trigger('password');
                          }
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                        {passwordTouched && passwordValue && (
                          <div className="animate-scale-in">
                            {!errors.password && passwordValid ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-[#00af8f] hover:bg-[#00af8f]/10 transition-all duration-200 rounded-lg h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {errors.password && passwordTouched && (
                      <p className="text-red-500 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                        <X className="w-4 h-4" />
                        <span>{errors.password.message}</span>
                      </p>
                    )}
                    {!errors.password && passwordTouched && passwordValid && passwordValue && (
                      <p className="text-green-600 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                        <Check className="w-4 h-4" />
                        <span>Password entered</span>
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
                        <span>Signing you in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 relative z-10">
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="text-gray-600 text-sm">Don't have an account?</p>
                    <Link
                      href="/auth/register"
                      className="text-[#00af8f] hover:text-[#00af90] font-bold text-sm transition-all duration-200 hover:underline inline-flex items-center space-x-1 group">
                      <span>Sign up</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
