/**
 * Unit Tests for ExpressStudentSubmissionsAPI
 * 
 * These tests validate the student submissions API client functionality.
 * 
 * NOTE: These tests require jest and the express-client to be properly configured.
 * 
 * To run these tests:
 * npm test -- express-student-submissions.test.ts
 */

import { ExpressStudentSubmissionsAPI, StudentSubmission, SubmissionCreateData } from '../express-student-submissions';
import { expressClient } from '../express-client';

// Mock the express client
jest.mock('../express-client', () => ({
  expressClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ExpressStudentSubmissionsAPI', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getModuleSubmissions', () => {
    it('should fetch all submissions for a module', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          student_id: 'student-123',
          module_id: 'module-456',
          section_id: 'section-1',
          submission_data: { answer: 'test answer 1' },
          time_spent_seconds: 120,
          submission_status: 'submitted',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'sub-2',
          student_id: 'student-123',
          module_id: 'module-456',
          section_id: 'section-2',
          submission_data: { answer: 'test answer 2' },
          time_spent_seconds: 180,
          submission_status: 'reviewed',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      (expressClient.get as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
      });

      const result = await ExpressStudentSubmissionsAPI.getModuleSubmissions(
        'student-123',
        'module-456'
      );

      expect(expressClient.get).toHaveBeenCalledWith(
        '/api/submissions?studentId=student-123&moduleId=module-456'
      );
      expect(result).toHaveLength(2);
      expect(result[0].studentId).toBe('student-123');
      expect(result[0].submissionData).toEqual({ answer: 'test answer 1' });
    });

    it('should return empty array on error', async () => {
      (expressClient.get as jest.Mock).mockResolvedValue({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database error',
        },
      });

      const result = await ExpressStudentSubmissionsAPI.getModuleSubmissions(
        'student-123',
        'module-456'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when data is not an array', async () => {
      (expressClient.get as jest.Mock).mockResolvedValue({
        data: null,
      });

      const result = await ExpressStudentSubmissionsAPI.getModuleSubmissions(
        'student-123',
        'module-456'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getSectionSubmission', () => {
    it('should fetch submission for a specific section', async () => {
      const mockSubmission = {
        id: 'sub-1',
        student_id: 'student-123',
        module_id: 'module-456',
        section_id: 'section-1',
        submission_data: { answer: 'test answer' },
        assessment_results: { score: 85 },
        time_spent_seconds: 120,
        submission_status: 'reviewed',
        created_at: '2024-01-01T00:00:00Z',
      };

      (expressClient.get as jest.Mock).mockResolvedValue({
        data: mockSubmission,
      });

      const result = await ExpressStudentSubmissionsAPI.getSectionSubmission(
        'student-123',
        'module-456',
        'section-1'
      );

      expect(expressClient.get).toHaveBeenCalledWith(
        '/api/submissions/student/student-123/module/module-456/section/section-1'
      );
      expect(result).not.toBeNull();
      expect(result?.studentId).toBe('student-123');
      expect(result?.sectionId).toBe('section-1');
      expect(result?.assessmentResults).toEqual({ score: 85 });
    });

    it('should return null when submission not found', async () => {
      (expressClient.get as jest.Mock).mockResolvedValue({
        error: {
          code: 'DB_NOT_FOUND',
          message: 'Submission not found',
        },
      });

      const result = await ExpressStudentSubmissionsAPI.getSectionSubmission(
        'student-123',
        'module-456',
        'section-999'
      );

      expect(result).toBeNull();
    });

    it('should return null on other errors', async () => {
      (expressClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await ExpressStudentSubmissionsAPI.getSectionSubmission(
        'student-123',
        'module-456',
        'section-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('createSubmission', () => {
    it('should create submission with valid data', async () => {
      const submissionData: SubmissionCreateData = {
        studentId: 'student-123',
        moduleId: 'module-456',
        sectionId: 'section-1',
        submissionData: { answer: 'My answer' },
        timeSpentSeconds: 120,
        submissionStatus: 'submitted',
      };

      const mockResponse = {
        id: 'sub-new',
        student_id: 'student-123',
        module_id: 'module-456',
        section_id: 'section-1',
        submission_data: { answer: 'My answer' },
        time_spent_seconds: 120,
        submission_status: 'submitted',
        created_at: '2024-01-01T00:00:00Z',
      };

      (expressClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await ExpressStudentSubmissionsAPI.createSubmission(submissionData);

      expect(expressClient.post).toHaveBeenCalledWith(
        '/api/submissions',
        expect.objectContaining({
          student_id: 'student-123',
          module_id: 'module-456',
          section_id: 'section-1',
          submission_data: { answer: 'My answer' },
        })
      );
      expect(result.id).toBe('sub-new');
      expect(result.studentId).toBe('student-123');
    });

    it('should throw error when required fields are missing', async () => {
      const invalidData = {
        studentId: 'student-123',
        moduleId: 'module-456',
        // Missing sectionId
        submissionData: { answer: 'test' },
      } as any;

      await expect(
        ExpressStudentSubmissionsAPI.createSubmission(invalidData)
      ).rejects.toThrow('studentId, moduleId, and sectionId are required');
    });

    it('should throw error when submissionData is missing', async () => {
      const invalidData = {
        studentId: 'student-123',
        moduleId: 'module-456',
        sectionId: 'section-1',
        // Missing submissionData
      } as any;

      await expect(
        ExpressStudentSubmissionsAPI.createSubmission(invalidData)
      ).rejects.toThrow('submissionData is required');
    });

    it('should handle API errors', async () => {
      const submissionData: SubmissionCreateData = {
        studentId: 'student-123',
        moduleId: 'module-456',
        sectionId: 'section-1',
        submissionData: { answer: 'test' },
      };

      (expressClient.post as jest.Mock).mockResolvedValue({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission data',
        },
      });

      await expect(
        ExpressStudentSubmissionsAPI.createSubmission(submissionData)
      ).rejects.toThrow('Invalid submission data');
    });
  });

  describe('updateSubmission', () => {
    it('should update submission successfully', async () => {
      const updates = {
        submissionData: { answer: 'Updated answer' },
        submissionStatus: 'submitted' as const,
      };

      const mockResponse = {
        id: 'sub-1',
        student_id: 'student-123',
        module_id: 'module-456',
        section_id: 'section-1',
        submission_data: { answer: 'Updated answer' },
        submission_status: 'submitted',
        updated_at: '2024-01-02T00:00:00Z',
      };

      (expressClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await ExpressStudentSubmissionsAPI.updateSubmission(
        'sub-1',
        updates
      );

      expect(expressClient.put).toHaveBeenCalledWith(
        '/api/submissions/sub-1',
        expect.objectContaining({
          submission_data: { answer: 'Updated answer' },
          submission_status: 'submitted',
        })
      );
      expect(result.submissionData).toEqual({ answer: 'Updated answer' });
      expect(result.submissionStatus).toBe('submitted');
    });

    it('should handle update errors', async () => {
      (expressClient.put as jest.Mock).mockResolvedValue({
        error: {
          code: 'DB_NOT_FOUND',
          message: 'Submission not found',
        },
      });

      await expect(
        ExpressStudentSubmissionsAPI.updateSubmission('sub-999', {
          submissionData: { answer: 'test' },
        })
      ).rejects.toThrow('Submission not found');
    });
  });

  describe('Helper Methods', () => {
    describe('formatTimeSpent', () => {
      it('should format seconds correctly', () => {
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(30)).toBe('30s');
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(59)).toBe('59s');
      });

      it('should format minutes correctly', () => {
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(60)).toBe('1m');
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(120)).toBe('2m');
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(150)).toBe('2m 30s');
      });

      it('should format hours correctly', () => {
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(3600)).toBe('1h');
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(7200)).toBe('2h');
        expect(ExpressStudentSubmissionsAPI.formatTimeSpent(7320)).toBe('2h 2m');
      });
    });

    describe('getStatusColor', () => {
      it('should return correct colors for each status', () => {
        expect(ExpressStudentSubmissionsAPI.getStatusColor('reviewed')).toBe(
          'bg-green-100 text-green-800'
        );
        expect(ExpressStudentSubmissionsAPI.getStatusColor('submitted')).toBe(
          'bg-blue-100 text-blue-800'
        );
        expect(ExpressStudentSubmissionsAPI.getStatusColor('draft')).toBe(
          'bg-gray-100 text-gray-800'
        );
        expect(ExpressStudentSubmissionsAPI.getStatusColor('unknown')).toBe(
          'bg-gray-100 text-gray-800'
        );
      });
    });

    describe('getStatusText', () => {
      it('should return correct text for each status', () => {
        expect(ExpressStudentSubmissionsAPI.getStatusText('reviewed')).toBe('Reviewed');
        expect(ExpressStudentSubmissionsAPI.getStatusText('submitted')).toBe('Submitted');
        expect(ExpressStudentSubmissionsAPI.getStatusText('draft')).toBe('Draft');
        expect(ExpressStudentSubmissionsAPI.getStatusText('unknown')).toBe('Unknown');
      });
    });

    describe('isGraded', () => {
      it('should return true when assessment results exist', () => {
        const submission: StudentSubmission = {
          id: 'sub-1',
          studentId: 'student-123',
          moduleId: 'module-456',
          sectionId: 'section-1',
          submissionData: {},
          assessmentResults: { score: 85 },
          timeSpentSeconds: 120,
          submissionStatus: 'reviewed',
        };

        expect(ExpressStudentSubmissionsAPI.isGraded(submission)).toBe(true);
      });

      it('should return false when assessment results are null or empty', () => {
        const submission1: StudentSubmission = {
          id: 'sub-1',
          studentId: 'student-123',
          moduleId: 'module-456',
          sectionId: 'section-1',
          submissionData: {},
          assessmentResults: null,
          timeSpentSeconds: 120,
          submissionStatus: 'submitted',
        };

        const submission2: StudentSubmission = {
          ...submission1,
          assessmentResults: {},
        };

        expect(ExpressStudentSubmissionsAPI.isGraded(submission1)).toBe(false);
        expect(ExpressStudentSubmissionsAPI.isGraded(submission2)).toBe(false);
      });
    });

    describe('getScore', () => {
      it('should extract score from various field names', () => {
        expect(ExpressStudentSubmissionsAPI.getScore({ score: 85 })).toBe(85);
        expect(ExpressStudentSubmissionsAPI.getScore({ teacherScore: 90 })).toBe(90);
        expect(ExpressStudentSubmissionsAPI.getScore({ teacher_score: 95 })).toBe(95);
        expect(ExpressStudentSubmissionsAPI.getScore({ finalScore: 88 })).toBe(88);
        expect(ExpressStudentSubmissionsAPI.getScore({ final_score: 92 })).toBe(92);
      });

      it('should return null when no score is found', () => {
        expect(ExpressStudentSubmissionsAPI.getScore(null)).toBeNull();
        expect(ExpressStudentSubmissionsAPI.getScore({})).toBeNull();
        expect(ExpressStudentSubmissionsAPI.getScore({ feedback: 'Good work' })).toBeNull();
      });
    });

    describe('formatSubmissionDate', () => {
      it('should format recent dates as relative time', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        expect(ExpressStudentSubmissionsAPI.formatSubmissionDate(fiveMinutesAgo.toISOString())).toBe(
          '5 minutes ago'
        );
        expect(ExpressStudentSubmissionsAPI.formatSubmissionDate(twoHoursAgo.toISOString())).toBe(
          '2 hours ago'
        );
        expect(ExpressStudentSubmissionsAPI.formatSubmissionDate(threeDaysAgo.toISOString())).toBe(
          '3 days ago'
        );
      });

      it('should handle invalid dates gracefully', () => {
        expect(ExpressStudentSubmissionsAPI.formatSubmissionDate('invalid-date')).toBe('recently');
      });
    });
  });
});
