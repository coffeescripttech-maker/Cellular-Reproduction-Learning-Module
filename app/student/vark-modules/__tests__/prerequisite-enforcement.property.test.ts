/**
 * Property-Based Test: Prerequisite Enforcement
 * 
 * Feature: student-pages-api-migration
 * Property 7: Prerequisite Enforcement
 * Validates: Requirements 6.1, 6.2, 6.4
 * 
 * This test verifies that modules with prerequisites are locked
 * if and only if the prerequisite module is not completed.
 */

import fc from 'fast-check';

// Mock types
interface VARKModule {
  id: string;
  title: string;
  prerequisite_module_id?: string;
}

interface ModuleProgress {
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
}

/**
 * Check if module is locked due to prerequisite
 */
function isModuleLocked(
  module: VARKModule,
  progress: ModuleProgress[]
): boolean {
  const prerequisiteId = module.prerequisite_module_id;
  if (!prerequisiteId) return false; // No prerequisite = unlocked

  // Check if prerequisite module is completed
  const prerequisiteProgress = progress.find(
    p => p.module_id === prerequisiteId
  );

  if (!prerequisiteProgress) {
    return true; // Locked if no progress
  }

  // Unlocked if prerequisite is completed (check both status and percentage)
  const isPrerequisiteCompleted =
    prerequisiteProgress.status === 'completed' ||
    prerequisiteProgress.progress_percentage === 100;

  return !isPrerequisiteCompleted; // Locked if prerequisite NOT completed
}

describe('Property 7: Prerequisite Enforcement', () => {
  it('module with no prerequisite should never be locked', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          title: fc.string(),
          prerequisite_module_id: fc.constant(undefined)
        }),
        fc.array(
          fc.record({
            module_id: fc.uuid(),
            status: fc.constantFrom('not_started', 'in_progress', 'completed'),
            progress_percentage: fc.integer({ min: 0, max: 100 })
          })
        ),
        (module, progress) => {
          const locked = isModuleLocked(module, progress);
          expect(locked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('module with prerequisite should be locked if prerequisite not completed', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // prerequisite module ID
        fc.uuid(), // current module ID
        fc.string(), // module title
        fc.constantFrom('not_started', 'in_progress'), // prerequisite status (not completed)
        fc.integer({ min: 0, max: 99 }), // prerequisite progress (not 100%)
        (prerequisiteId, moduleId, title, prerequisiteStatus, prerequisiteProgress) => {
          const module: VARKModule = {
            id: moduleId,
            title,
            prerequisite_module_id: prerequisiteId
          };

          const progress: ModuleProgress[] = [
            {
              module_id: prerequisiteId,
              status: prerequisiteStatus as any,
              progress_percentage: prerequisiteProgress
            }
          ];

          const locked = isModuleLocked(module, progress);
          expect(locked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('module with prerequisite should be unlocked if prerequisite completed', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // prerequisite module ID
        fc.uuid(), // current module ID
        fc.string(), // module title
        (prerequisiteId, moduleId, title) => {
          const module: VARKModule = {
            id: moduleId,
            title,
            prerequisite_module_id: prerequisiteId
          };

          const progress: ModuleProgress[] = [
            {
              module_id: prerequisiteId,
              status: 'completed',
              progress_percentage: 100
            }
          ];

          const locked = isModuleLocked(module, progress);
          expect(locked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('module with prerequisite should be locked if prerequisite has no progress', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // prerequisite module ID
        fc.uuid(), // current module ID
        fc.string(), // module title
        (prerequisiteId, moduleId, title) => {
          const module: VARKModule = {
            id: moduleId,
            title,
            prerequisite_module_id: prerequisiteId
          };

          const progress: ModuleProgress[] = []; // No progress for prerequisite

          const locked = isModuleLocked(module, progress);
          expect(locked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('module locked status should be consistent with prerequisite completion', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // prerequisite module ID
        fc.uuid(), // current module ID
        fc.string(), // module title
        fc.record({
          status: fc.constantFrom('not_started', 'in_progress', 'completed'),
          progress_percentage: fc.integer({ min: 0, max: 100 })
        }),
        (prerequisiteId, moduleId, title, prerequisiteProgress) => {
          const module: VARKModule = {
            id: moduleId,
            title,
            prerequisite_module_id: prerequisiteId
          };

          const progress: ModuleProgress[] = [
            {
              module_id: prerequisiteId,
              status: prerequisiteProgress.status as any,
              progress_percentage: prerequisiteProgress.progress_percentage
            }
          ];

          const locked = isModuleLocked(module, progress);
          const isPrerequisiteCompleted =
            prerequisiteProgress.status === 'completed' ||
            prerequisiteProgress.progress_percentage === 100;

          // Module should be locked if and only if prerequisite is NOT completed
          expect(locked).toBe(!isPrerequisiteCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
