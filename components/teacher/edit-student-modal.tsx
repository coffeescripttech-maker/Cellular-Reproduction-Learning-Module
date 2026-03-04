'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Save } from 'lucide-react';

// Validation schema
const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gradeLevel: z.string(),
  learningStyle: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic']),
  preferredModules: z.array(z.string()),
  learningType: z.string().optional(),
  bypassOnboarding: z.boolean()
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade_level: string;
  learning_style: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';
  preferred_modules?: string[];
  learning_type?: string;
  status: 'active' | 'inactive' | 'graduated';
}

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  student: Student | null;
  availableModules: string[];
  learningTypes: string[];
}

export default function EditStudentModal({
  open,
  onOpenChange,
  onSubmit,
  student,
  availableModules,
  learningTypes
}: EditStudentModalProps) {
  // Validation states
  const [firstNameTouched, setFirstNameTouched] = React.useState(false);
  const [lastNameTouched, setLastNameTouched] = React.useState(false);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [firstNameValid, setFirstNameValid] = React.useState(false);
  const [lastNameValid, setLastNameValid] = React.useState(false);
  const [emailValid, setEmailValid] = React.useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
    reset
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      password: 'learn2025',
      gradeLevel: 'Grade 7',
      learningStyle: 'reading_writing',
      preferredModules: [],
      learningType: '',
      bypassOnboarding: true
    },
    mode: 'onChange'
  });

  // Watch form values
  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');
  const emailValue = watch('email');
  const preferredModules = watch('preferredModules');

  // Auto-update Learning Type based on selected modules
  React.useEffect(() => {
    const count = preferredModules?.length || 0;
    let learningType = '';
    
    if (count === 1) learningType = 'Unimodal';
    else if (count === 2) learningType = 'Bimodal';
    else if (count === 3) learningType = 'Trimodal';
    else if (count >= 4) learningType = 'Multimodal';
    
    setValue('learningType', learningType);
  }, [preferredModules, setValue]);

  // Populate form when student changes
  React.useEffect(() => {
    if (student) {
      reset({
        firstName: student.first_name,
        middleName: '',
        lastName: student.last_name,
        email: student.email,
        password: 'learn2025',
        gradeLevel: student.grade_level,
        learningStyle: student.learning_style,
        preferredModules: student.preferred_modules || [],
        learningType: student.learning_type || '',
        bypassOnboarding: student.status === 'active'
      });
      setFirstNameTouched(false);
      setLastNameTouched(false);
      setEmailTouched(false);
    }
  }, [student, reset]);

  // Validation functions
  const validateName = (name: string) => {
    return !!(name && name.length >= 1);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update validation states
  React.useEffect(() => {
    if (firstNameTouched) {
      setFirstNameValid(validateName(firstNameValue) && !errors.firstName);
    }
  }, [firstNameValue, firstNameTouched, errors.firstName]);

  React.useEffect(() => {
    if (lastNameTouched) {
      setLastNameValid(validateName(lastNameValue) && !errors.lastName);
    }
  }, [lastNameValue, lastNameTouched, errors.lastName]);

  React.useEffect(() => {
    if (emailTouched) {
      setEmailValid(validateEmail(emailValue) && !errors.email);
    }
  }, [emailValue, emailTouched, errors.email]);

  // Module toggle
  const toggleModule = (module: string) => {
    const current = preferredModules || [];
    const updated = current.includes(module)
      ? current.filter(m => m !== module)
      : [...current, module];
    setValue('preferredModules', updated);
  };

  // Handle form submission
  const handleFormSubmit = async (data: StudentFormData) => {
    await onSubmit(data);
    reset();
    setFirstNameTouched(false);
    setLastNameTouched(false);
    setEmailTouched(false);
  };

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setFirstNameTouched(false);
    setLastNameTouched(false);
    setEmailTouched(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit Student</DialogTitle>
          <DialogDescription className="text-gray-600">
            Update student information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">

            {/* First Name - with validation */}
            <div className="space-y-2">
              <Label htmlFor="editFirstName" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                <span>First Name *</span>
                {firstNameTouched && firstNameValue && (
                  <span className={`text-xs font-normal ${!errors.firstName && firstNameValid ? 'text-green-600' : 'text-red-500'}`}>
                    {!errors.firstName && firstNameValid ? '✓' : '✗'}
                  </span>
                )}
              </Label>
              <div className="relative group">
                <Input
                  id="editFirstName"
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

            {/* Middle Name - simple */}
            <div className="space-y-2">
              <Label htmlFor="editMiddleName" className="text-gray-900 font-semibold text-sm">
                Middle Name
              </Label>
              <Input
                id="editMiddleName"
                type="text"
                placeholder="Santos"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
                {...register('middleName')}
              />
            </div>

            {/* Last Name - with validation */}
            <div className="space-y-2">
              <Label htmlFor="editLastName" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
                <span>Last Name *</span>
                {lastNameTouched && lastNameValue && (
                  <span className={`text-xs font-normal ${!errors.lastName && lastNameValid ? 'text-green-600' : 'text-red-500'}`}>
                    {!errors.lastName && lastNameValid ? '✓' : '✗'}
                  </span>
                )}
              </Label>
              <div className="relative group">
                <Input
                  id="editLastName"
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

          {/* Email - with validation */}
          <div className="space-y-2">
            <Label htmlFor="editEmail" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
              <span>Email Address *</span>
              {emailTouched && emailValue && (
                <span className={`text-xs font-normal ${!errors.email && emailValid ? 'text-green-600' : 'text-red-500'}`}>
                  {!errors.email && emailValid ? '✓ Valid' : '✗ Invalid format'}
                </span>
              )}
            </Label>
            <div className="relative group">
              <Input
                id="editEmail"
                type="email"
                placeholder="juan.delacruz@student.com"
                className={`h-11 text-base !border-2 rounded-xl transition-all duration-300 pr-10 ${
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
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {errors.email && emailTouched && (
              <p className="text-red-500 text-xs font-medium flex items-center space-x-1 animate-slide-down">
                <X className="w-3 h-3" />
                <span>{errors.email.message}</span>
              </p>
            )}
            {!errors.email && emailTouched && emailValid && emailValue && (
              <p className="text-green-600 text-xs font-medium flex items-center space-x-1 animate-slide-down">
                <Check className="w-3 h-3" />
                <span>Email looks good!</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Password - simple */}
            <div className="space-y-2">
              <Label htmlFor="editPassword" className="text-gray-900 font-semibold text-sm">Password</Label>
              <Input
                id="editPassword"
                type="password"
                placeholder="Leave blank to keep current"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
                {...register('password')}
              />
            </div>

            {/* Grade Level - select */}
            <div className="space-y-2">
              <Label htmlFor="editGradeLevel" className="text-gray-900 font-semibold text-sm">Grade Level</Label>
              <select
                id="editGradeLevel"
                className="w-full h-11 px-3 py-2 !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
                {...register('gradeLevel')}
              >
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
            </div>
          </div>

          {/* Learning Style - select */}
          <div className="space-y-2">
            <Label htmlFor="editLearningStyle" className="text-gray-900 font-semibold text-sm">Learning Style</Label>
            <select
              id="editLearningStyle"
              className="w-full h-11 px-3 py-2 !border-2 !border-gray-200 focus:!border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-xl transition-all duration-300 hover:!border-[#00af8f]/50 hover:shadow-md"
              {...register('learningStyle')}
            >
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="reading_writing">Reading/Writing</option>
              <option value="kinesthetic">Kinesthetic</option>
            </select>
          </div>

          {/* Preferred Modules - toggle buttons */}
          <div className="space-y-2">
            <Label className="text-gray-900 font-semibold text-sm">Preferred Modules</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableModules.map((module) => (
                <div
                  key={module}
                  onClick={() => toggleModule(module)}
                  className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all duration-300 font-medium ${
                    preferredModules?.includes(module)
                      ? 'bg-gradient-to-r from-[#00af8f] to-[#00af90] text-white border-[#00af8f] shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#00af8f] hover:shadow-md hover:scale-105'
                  }`}>
                  {module}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Type - auto-calculated, read-only */}
          <div className="space-y-2">
            <Label htmlFor="editLearningType" className="text-gray-900 font-semibold text-sm flex items-center space-x-2">
              <span>Learning Type</span>
              <span className="text-xs font-normal text-gray-500">(Auto-calculated)</span>
            </Label>
            <div className="relative">
              <Input
                id="editLearningType"
                value={watch('learningType') || 'Select modules first'}
                readOnly
                className="h-11 text-base !border-2 !border-gray-200 bg-gray-50 rounded-xl cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <div className="text-xs text-gray-500">
                  {preferredModules?.length || 0} module{(preferredModules?.length || 0) !== 1 ? 's' : ''} selected
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 flex items-center space-x-1">
              <span>💡</span>
              <span>1 module = Unimodal, 2 = Bimodal, 3 = Trimodal, 4+ = Multimodal</span>
            </p>
          </div>

          {/* Bypass Onboarding - checkbox */}
          <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Checkbox
              id="editBypassOnboarding"
              checked={watch('bypassOnboarding')}
              onCheckedChange={(checked) => 
                setValue('bypassOnboarding', checked as boolean)
              }
            />
            <Label htmlFor="editBypassOnboarding" className="text-sm text-gray-700 cursor-pointer">
              Mark as active (onboarding completed)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="px-6">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="px-6 bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af8f] text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
