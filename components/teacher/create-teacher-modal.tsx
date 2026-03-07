'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, X, Save } from 'lucide-react';

const teacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional()
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface CreateTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeacherFormData) => Promise<void>;
}

export default function CreateTeacherModal({
  open,
  onOpenChange,
  onSubmit
}: CreateTeacherModalProps) {
  const [firstNameTouched, setFirstNameTouched] = React.useState(false);
  const [lastNameTouched, setLastNameTouched] = React.useState(false);
  const [emailTouched, setEmailTouched] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    reset
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      password: 'teach2025',
      phoneNumber: '',
      department: '',
      specialization: ''
    },
    mode: 'onChange'
  });

  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');
  const emailValue = watch('email');

  const handleFormSubmit = async (data: TeacherFormData) => {
    await onSubmit(data);
    reset();
    setFirstNameTouched(false);
    setLastNameTouched(false);
    setEmailTouched(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setFirstNameTouched(false);
    setLastNameTouched(false);
    setEmailTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New Teacher</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new teacher account. Default password is 'teach2025'.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-900 font-semibold text-sm">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Juan"
                className={`h-11 text-base !border-2 rounded-xl transition-all ${
                  errors.firstName && firstNameTouched
                    ? '!border-red-500'
                    : '!border-gray-200 focus:!border-[#00af8f]'
                }`}
                {...register('firstName', {
                  onBlur: () => setFirstNameTouched(true),
                  onChange: async () => {
                    setFirstNameTouched(true);
                    await trigger('firstName');
                  }
                })}
              />
              {errors.firstName && firstNameTouched && (
                <p className="text-red-500 text-xs">{errors.firstName.message}</p>
              )}
            </div>

            {/* Middle Name */}
            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-gray-900 font-semibold text-sm">
                Middle Name
              </Label>
              <Input
                id="middleName"
                type="text"
                placeholder="Santos"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] rounded-xl"
                {...register('middleName')}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-900 font-semibold text-sm">
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Dela Cruz"
                className={`h-11 text-base !border-2 rounded-xl transition-all ${
                  errors.lastName && lastNameTouched
                    ? '!border-red-500'
                    : '!border-gray-200 focus:!border-[#00af8f]'
                }`}
                {...register('lastName', {
                  onBlur: () => setLastNameTouched(true),
                  onChange: async () => {
                    setLastNameTouched(true);
                    await trigger('lastName');
                  }
                })}
              />
              {errors.lastName && lastNameTouched && (
                <p className="text-red-500 text-xs">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-semibold text-sm">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="juan.delacruz@teacher.com"
              className={`h-11 text-base !border-2 rounded-xl transition-all ${
                errors.email && emailTouched
                  ? '!border-red-500'
                  : '!border-gray-200 focus:!border-[#00af8f]'
              }`}
              {...register('email', {
                onBlur: () => setEmailTouched(true),
                onChange: async () => {
                  setEmailTouched(true);
                  await trigger('email');
                }
              })}
            />
            {errors.email && emailTouched && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900 font-semibold text-sm">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="teach2025"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] rounded-xl"
                {...register('password')}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-gray-900 font-semibold text-sm">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+63 912 345 6789"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] rounded-xl"
                {...register('phoneNumber')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-gray-900 font-semibold text-sm">Department</Label>
              <Input
                id="department"
                type="text"
                placeholder="Science Department"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] rounded-xl"
                {...register('department')}
              />
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-gray-900 font-semibold text-sm">Specialization</Label>
              <Input
                id="specialization"
                type="text"
                placeholder="Biology"
                className="h-11 text-base !border-2 !border-gray-200 focus:!border-[#00af8f] rounded-xl"
                {...register('specialization')}
              />
            </div>
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
              className="px-6 bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af8f] text-white shadow-lg">
              <Save className="w-4 h-4 mr-2" />
              Create Teacher
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
