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
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  BookOpen,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    gradeLevel: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['student', 'teacher'])
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(
    'student'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time validation states
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [firstNameValid, setFirstNameValid] = useState(false);
  const [lastNameValid, setLastNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student'
    },
    mode: 'onChange' // Enable real-time validation
  });

  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  // Real-time validation functions
  const validateFirstName = (name: string) => {
    return !!(name && name.length >= 1);
  };

  const validateLastName = (name: string) => {
    return !!(name && name.length >= 1);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd);
  };

  const validateConfirmPassword = (pwd: string, confirmPwd: string) => {
    return confirmPwd.length > 0 && pwd === confirmPwd;
  };

  // Update validation states
  React.useEffect(() => {
    if (firstNameTouched) {
      setFirstNameValid(validateFirstName(firstNameValue) && !errors.firstName);
    }
  }, [firstNameValue, firstNameTouched, errors.firstName]);

  React.useEffect(() => {
    if (lastNameTouched) {
      setLastNameValid(validateLastName(lastNameValue) && !errors.lastName);
    }
  }, [lastNameValue, lastNameTouched, errors.lastName]);

  React.useEffect(() => {
    if (emailTouched) {
      setEmailValid(validateEmail(emailValue) && !errors.email);
    }
  }, [emailValue, emailTouched, errors.email]);

  React.useEffect(() => {
    if (passwordTouched) {
      setPasswordValid(validatePassword(passwordValue) && !errors.password);
    }
  }, [passwordValue, passwordTouched, errors.password]);

  React.useEffect(() => {
    if (confirmPasswordTouched) {
      setConfirmPasswordValid(validateConfirmPassword(passwordValue, confirmPasswordValue) && !errors.confirmPassword);
    }
  }, [passwordValue, confirmPasswordValue, confirmPasswordTouched, errors.confirmPassword]);

  // Password strength indicator
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

  const passwordStrength = getPasswordStrength(passwordValue);

  const roleConfig = {
    teacher: {
      icon: Shield,
      title: 'Teacher Sign Up',
      subtitle: 'Educator Portal',
      description: 'Create lessons, quizzes, and manage classes',
      color: 'text-[#00af8f]',
      bgColor: 'bg-[#00af8f]',
      borderColor: 'border-[#00af8f]'
    },
    student: {
      icon: User,
      title: 'Student Sign Up',
      subtitle: 'Learning Portal',
      description: 'Access lessons, take quizzes, and submit activities',
      color: 'text-[#00af8f]',
      bgColor: 'bg-[#00af8f]',
      borderColor: 'border-[#00af8f]'
    }
  } as const;

  const config = roleConfig[selectedRole];

  const handleRoleChange = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        ...data,
        role: selectedRole
      });

      console.log({ selectedRole });

      // Small delay to allow authentication state to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect based on role according to features.txt
      if (selectedRole === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        // Students go to VARK onboarding
        router.push('/onboarding/vark');
      }
    } catch (err) {
      // Error handling is now done by Sonner toast in auth.ts
      // Just set a generic error for the UI state
      setError('Registration failed. Please try again.');
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
              <Link
                href="/auth/login"
                className="inline-flex items-center text-gray-600 hover:text-[#00af8f] transition-colors duration-200 group mb-6">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Login</span>
              </Link>

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

            {/* Welcome Message */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-gray-900">Join Our Community!</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create your account and start your personalized learning journey with VARK-based modules.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: User, text: 'Personalized Learning Experience', desc: 'Tailored to your learning style' },
                  { icon: BookOpen, text: 'Interactive Modules', desc: 'Engaging content and activities' },
                  { icon: Shield, text: 'Secure Platform', desc: 'Your data is safe with us' }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 transform hover:translate-x-2 animate-fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold block">{feature.text}</span>
                      <span className="text-gray-600 text-sm">{feature.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Quote */}
            <div className="p-6 bg-gradient-to-br from-[#00af8f]/10 to-teal-400/10 rounded-2xl border border-[#00af8f]/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-gray-700 italic text-lg">
                "The beautiful thing about learning is that no one can take it away from you."
              </p>
              <p className="text-gray-600 text-sm mt-2">— B.B. King</p>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6 animate-fade-in">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-gray-600 hover:text-[#00af8f] transition-colors duration-200 group mb-4">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Login</span>
              </Link>

              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00af8f] to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Join the learning community</p>
            </div>

            {/* Register Card */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                        <span>First Name *</span>
                        {firstNameTouched && firstNameValue && (
                          <span className={`text-xs font-normal ${!errors.firstName && firstNameValid ? 'text-green-600' : 'text-red-500'}`}>
                            {!errors.firstName && firstNameValid ? '✓' : '✗'}
                          </span>
                        )}
                      </Label>
                      <div className="relative group">
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Juan"
                          className={`h-11 text-base !border-2 rounded-xl transition-all duration-300 pr-10 ${
                            firstNameTouched && (errors.firstName || (firstNameValue && !firstNameValid))
                              ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                              : firstNameTouched && firstNameValue && !errors.firstName && firstNameValid
                              ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                              : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                          } group-hover:shadow-md`}
                          {...register('firstName', {
                            onBlur: () => setFirstNameTouched(true),
                            onChange: async () => {
                              setFirstNameTouched(true);
                              await trigger('firstName');
                            }
                          })}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {firstNameTouched && firstNameValue && (
                            <div className="animate-scale-in">
                              {!errors.firstName && firstNameValid ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.firstName && firstNameTouched && (
                        <p className="text-red-500 text-xs font-medium flex items-center space-x-1 animate-slide-down">
                          <X className="w-3 h-3" />
                          <span>{errors.firstName.message}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="middleName"
                        className="text-gray-900 font-semibold text-sm">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        type="text"
                        placeholder="Santos"
                        className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
                        {...register('middleName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                        <span>Last Name *</span>
                        {lastNameTouched && lastNameValue && (
                          <span className={`text-xs font-normal ${!errors.lastName && lastNameValid ? 'text-green-600' : 'text-red-500'}`}>
                            {!errors.lastName && lastNameValid ? '✓' : '✗'}
                          </span>
                        )}
                      </Label>
                      <div className="relative group">
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Dela Cruz"
                          className={`h-11 text-base !border-2 rounded-xl transition-all duration-300 pr-10 ${
                            lastNameTouched && (errors.lastName || (lastNameValue && !lastNameValid))
                              ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                              : lastNameTouched && lastNameValue && !errors.lastName && lastNameValid
                              ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                              : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                          } group-hover:shadow-md`}
                          {...register('lastName', {
                            onBlur: () => setLastNameTouched(true),
                            onChange: async () => {
                              setLastNameTouched(true);
                              await trigger('lastName');
                            }
                          })}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {lastNameTouched && lastNameValue && (
                            <div className="animate-scale-in">
                              {!errors.lastName && lastNameValid ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.lastName && lastNameTouched && (
                        <p className="text-red-500 text-xs font-medium flex items-center space-x-1 animate-slide-down">
                          <X className="w-3 h-3" />
                          <span>{errors.lastName.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                  <span>Email Address *</span>
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
                      onChange: async () => {
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

                  {selectedRole === 'student' && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="gradeLevel"
                        className="text-gray-900 font-semibold text-sm">
                        Grade Level
                      </Label>
                      <Input
                        id="gradeLevel"
                        type="text"
                        placeholder="e.g., Grade 6"
                        className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
                        {...register('gradeLevel')}
                      />
                    </div>
                  )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                    <span>Password *</span>
                    {passwordTouched && passwordValue && (
                      <span className={`text-xs font-normal ${!errors.password && passwordValid ? 'text-green-600' : 'text-red-500'}`}>
                        {!errors.password && passwordValid ? '✓ Strong' : '✗ Weak'}
                      </span>
                    )}
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className={`h-12 text-base !border-2 rounded-xl pr-24 transition-all duration-300 pl-4 ${
                        passwordTouched && (errors.password || (passwordValue && !passwordValid))
                          ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                          : passwordTouched && passwordValue && !errors.password && passwordValid
                          ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                          : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                      } group-hover:shadow-md`}
                      {...register('password', {
                        onBlur: () => setPasswordTouched(true),
                        onChange: async () => {
                          setPasswordTouched(true);
                          await trigger('password');
                          if (confirmPasswordTouched) {
                            await trigger('confirmPassword');
                          }
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
                  
                  {/* Password Strength Indicator */}
                  {passwordValue && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Password strength:</span>
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
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Password should contain:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li className={passwordValue.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                          <li className={/[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue) ? 'text-green-600' : ''}>Upper and lowercase letters</li>
                          <li className={/\d/.test(passwordValue) ? 'text-green-600' : ''}>At least one number</li>
                          <li className={/[^a-zA-Z0-9]/.test(passwordValue) ? 'text-green-600' : ''}>Special character (recommended)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                    <span>Confirm Password *</span>
                    {confirmPasswordTouched && confirmPasswordValue && (
                      <span className={`text-xs font-normal ${!errors.confirmPassword && confirmPasswordValid ? 'text-green-600' : 'text-red-500'}`}>
                        {!errors.confirmPassword && confirmPasswordValid ? '✓ Match' : '✗ No match'}
                      </span>
                    )}
                  </Label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className={`h-12 text-base !border-2 rounded-xl pr-24 transition-all duration-300 pl-4 ${
                        confirmPasswordTouched && (errors.confirmPassword || (confirmPasswordValue && !confirmPasswordValid))
                          ? '!border-red-500 focus:!border-red-600 focus:ring-4 focus:ring-red-500/10 !bg-red-50/30'
                          : confirmPasswordTouched && confirmPasswordValue && !errors.confirmPassword && confirmPasswordValid
                          ? '!border-green-500 focus:!border-green-600 focus:ring-4 focus:ring-green-500/10 !bg-green-50/30'
                          : '!border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 hover:!border-[#00af8f]/50'
                      } group-hover:shadow-md`}
                      {...register('confirmPassword', {
                        onBlur: () => setConfirmPasswordTouched(true),
                        onChange: async () => {
                          setConfirmPasswordTouched(true);
                          await trigger('confirmPassword');
                        }
                      })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                      {confirmPasswordTouched && confirmPasswordValue && (
                        <div className="animate-scale-in">
                          {!errors.confirmPassword && confirmPasswordValid ? (
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }>
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {errors.confirmPassword && confirmPasswordTouched && (
                    <p className="text-red-500 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                      <X className="w-4 h-4" />
                      <span>{errors.confirmPassword.message}</span>
                    </p>
                  )}
                  {!errors.confirmPassword && confirmPasswordTouched && confirmPasswordValid && confirmPasswordValue && (
                    <p className="text-green-600 text-sm font-medium flex items-center space-x-1 animate-slide-down">
                      <Check className="w-4 h-4" />
                      <span>Passwords match!</span>
                    </p>
                  )}
                </div>
              </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 text-base font-bold text-white bg-gradient-to-r from-[#00af8f] via-[#00af90] to-teal-600 hover:from-teal-600 hover:via-[#00af90] hover:to-[#00af8f] shadow-xl transition-all duration-500 rounded-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-3 relative z-10">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 relative z-10">
                        <span>Create Account</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="text-gray-600 text-sm">Already have an account?</p>
                    <Link
                      href="/auth/login"
                      className="text-[#00af8f] hover:text-[#00af90] font-bold text-sm transition-all duration-200 hover:underline inline-flex items-center space-x-1 group">
                      <span>Sign in</span>
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
