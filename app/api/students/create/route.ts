import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Server-side admin client with service role key
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

interface StudentData {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gradeLevel?: string;
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';
  preferredModules?: string[];
  learningType?: string;
  onboardingCompleted?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const data: StudentData = await request.json();

    console.log('🔍 Creating student single:', data.email);
    console.log('📋 Full request data:', JSON.stringify(data, null, 2));
    console.log('🗄️  Database URL:', config.supabase.url);
    console.log('🔑 Using service role key:', config.supabase.serviceRoleKey.substring(0, 20) + '...');

    // Generate email if not provided
    const email =
      data.email ||
      `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@student.com`;

    // Check if student with this email already exists
    // Note: If RLS blocks this check, we'll catch the duplicate error on insert
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email, id')
      .eq('email', email);

    console.log('🔍 Existing profile check:', { 
      existingProfiles, 
      checkError,
      foundCount: existingProfiles?.length || 0,
      note: 'If this returns null but insert fails, RLS is blocking the check'
    });

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: `A student with email ${email} already exists` },
        { status: 400 }
      );
    }
    
    // If check error, log it but continue (database constraint will catch duplicates)
    if (checkError) {
      console.warn('⚠️  Duplicate check failed (RLS issue?), relying on database constraint:', checkError);
    }

    // Create user in Supabase Auth using admin client
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          role: 'student',
          learning_style: data.learningStyle,
          grade_level: data.gradeLevel,
        },
      });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      console.error('❌ Auth error details:', JSON.stringify(authError, null, 2));
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Create profile
    const profileData: any = {
      id: authData.user.id,
      email: email,
      first_name: data.firstName,
      middle_name: data.middleName || null,
      last_name: data.lastName,
      full_name:
        data.fullName ||
        `${data.firstName} ${data.middleName || ''} ${data.lastName}`.trim(),
      role: 'student',
      learning_style: data.learningStyle || null,
      grade_level: data.gradeLevel || null,
      onboarding_completed: data.onboardingCompleted ?? true,
    };

    // Add preferred_modules and learning_type as JSONB
    if (data.preferredModules && data.preferredModules.length > 0) {
      profileData.preferred_modules = data.preferredModules;
    }
    if (data.learningType) {
      profileData.learning_type = data.learningType;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();


      console.log({profileError});
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      console.error('❌ Profile error details:', JSON.stringify(profileError, null, 2));
      console.error('❌ Profile data attempted:', JSON.stringify(profileData, null, 2));
      
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      // Check if it's a duplicate email error (PostgreSQL error code 23505)
      if (profileError.code === '23505' && profileError.message.includes('profiles_email_key')) {
        return NextResponse.json(
          { error: `A student with email ${email} already exists (database constraint)` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    console.log('✅ Student created:', email);
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('❌ Error creating student:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create student',
      },
      { status: 500 }
    );
  }
}
