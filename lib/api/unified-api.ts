/**
 * Unified API Module
 * 
 * This module provides a unified interface that switches between
 * Supabase and Express backends based on the NEXT_PUBLIC_USE_NEW_API flag.
 */

// Supabase APIs
import { AuthAPI } from './auth';
import { StudentAPI } from './students';
import { VARKModulesAPI } from './vark-modules';
import { StatsAPI } from './stats';
import { ClassesAPI } from './classes';
import { TeacherDashboardAPI } from './teacher-dashboard';

// Express APIs
import { ExpressAuthAPI } from './express-auth';
import { ExpressStudentAPI } from './express-students';
import { ExpressVARKModulesAPI, expressVARKModulesAPI } from './express-vark-modules';
import { ExpressFilesAPI } from './express-files';
import { ExpressStatsAPI } from './express-stats';
import { expressClassesAPI } from './express-classes';
import { ExpressTeacherDashboardAPI } from './express-teacher-dashboard';
import { ExpressStudentDashboardAPI } from './express-student-dashboard';
import { ExpressStudentProgressAPI } from './express-student-progress';
import { ExpressStudentCompletionsAPI } from './express-student-completions';
import { ExpressStudentSubmissionsAPI } from './express-student-submissions';

// Check feature flag
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';

/**
 * Unified Auth API
 */
export const UnifiedAuthAPI = USE_NEW_API ? ExpressAuthAPI : AuthAPI;

/**
 * Unified Student API
 */
export const UnifiedStudentAPI = USE_NEW_API ? ExpressStudentAPI : StudentAPI;

/**
 * Unified VARK Modules API
 */
export const UnifiedVARKModulesAPI = USE_NEW_API ? expressVARKModulesAPI : new VARKModulesAPI();

/**
 * Unified Files API
 */
export const UnifiedFilesAPI = ExpressFilesAPI; // Files API is Express-only for now

/**
 * Unified Stats API
 */
export const UnifiedStatsAPI = USE_NEW_API ? ExpressStatsAPI : StatsAPI;

/**
 * Unified Classes API
 */
export const UnifiedClassesAPI = USE_NEW_API ? expressClassesAPI : ClassesAPI;

/**
 * Unified Teacher Dashboard API
 */
export const UnifiedTeacherDashboardAPI = USE_NEW_API ? ExpressTeacherDashboardAPI : TeacherDashboardAPI;

/**
 * Unified Student Dashboard API
 * Note: Student Dashboard is Express-only (no Supabase equivalent)
 */
export const UnifiedStudentDashboardAPI = ExpressStudentDashboardAPI;

/**
 * Unified Student Progress API
 * Note: Student Progress is Express-only (no Supabase equivalent)
 */
export const UnifiedStudentProgressAPI = ExpressStudentProgressAPI;

/**
 * Unified Student Completions API
 * Note: Student Completions is Express-only (no Supabase equivalent)
 */
export const UnifiedStudentCompletionsAPI = ExpressStudentCompletionsAPI;

/**
 * Unified Student Submissions API
 * Note: Student Submissions is Express-only (no Supabase equivalent)
 */
export const UnifiedStudentSubmissionsAPI = ExpressStudentSubmissionsAPI;

// Export for backward compatibility
export { UnifiedAuthAPI as AuthAPI };
export { UnifiedStudentAPI as StudentAPI };
export { UnifiedVARKModulesAPI as VARKModulesAPI };
export { UnifiedFilesAPI as FilesAPI };
export { UnifiedStatsAPI as StatsAPI };
export { UnifiedClassesAPI as ClassesAPI };
export { UnifiedTeacherDashboardAPI as TeacherDashboardAPI };
export { UnifiedStudentDashboardAPI as StudentDashboardAPI };
export { UnifiedStudentProgressAPI as StudentProgressAPI };
export { UnifiedStudentCompletionsAPI as StudentCompletionsAPI };
export { UnifiedStudentSubmissionsAPI as StudentSubmissionsAPI };
