/**
 * Integration Tests for Student Dashboard Page
 * 
 * These tests validate the student dashboard page functionality including:
 * - Dashboard loads with mock data
 * - Refresh button updates data
 * - Error handling displays error message
 * - Loading states show correctly
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * NOTE: These tests require Jest and React Testing Library to be configured.
 * See lib/api/__tests__/TEST_SETUP_REQUIRED.md for setup instructions.
 * 
 * To run these tests:
 * npm test -- page.integration.test.tsx
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentDashboard from '../page';
import { UnifiedStudentDashboardAPI } from '@/lib/api/unified-api';
import { VARKModulesAPI, ClassesAPI } from '@/lib/api/unified-api';
import { useAuth } from '@/hooks/useAuth';

// Mock the dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/api/unified-api', () => ({
  UnifiedStudentDashboardAPI: {
    getDashboardStats: jest.fn(),
    getRecentActivities: jest.fn(),
    getProgressData: jest.fn(),
  },
  VARKModulesAPI: {
    getModules: jest.fn(),
  },
  ClassesAPI: {
    getStudentClasses: jest.fn(),
  },
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('@/components/student/completion-dashboard', () => {
  return function MockCompletionDashboard() {
    return <div data-testid="completion-dashboard">Completion Dashboard</div>;
  };
});

describe('Student Dashboard Page - Integration Tests', () => {
  const mockUser = {
    id: 'student-123',
    fullName: 'John Doe',
    firstName: 'John',
    learningStyle: 'visual',
    learningType: 'Unimodal',
    preferredModules: ['Visual'],
  };

  const mockStats = {
    modulesCompleted: 5,
    modulesInProgress: 3,
    averageScore: 85,
    totalTimeSpent: 120,
    perfectSections: 2,
    totalModulesAvailable: 20,
  };

  const mockActivities = [
    {
      id: 'activity-1',
      type: 'module_completion' as const,
      title: 'Cell Division Module',
      status: 'completed' as const,
      timestamp: new Date().toISOString(),
      icon: 'CheckCircle',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      score: 90,
    },
    {
      id: 'activity-2',
      type: 'module_progress' as const,
      title: 'Photosynthesis Module',
      status: 'in_progress' as const,
      timestamp: new Date().toISOString(),
      icon: 'Clock',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      progress: 65,
    },
  ];

  const mockProgressData = {
    modules: { completed: 5, inProgress: 3, total: 20, percentage: 25 },
    averageScore: 85,
    totalTimeSpent: 120,
    perfectSections: 2,
  };

  const mockModules = [
    {
      id: 'module-1',
      title: 'Visual Learning Module',
      description: 'Learn with diagrams',
      target_learning_styles: ['visual'],
      difficulty_level: 'beginner',
      estimated_duration_minutes: 30,
    },
  ];

  const mockClasses = [
    {
      id: 'class-1',
      name: 'Biology 101',
      subject: 'Biology',
      students: ['student-1', 'student-2'],
      modules: ['module-1'],
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (UnifiedStudentDashboardAPI.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);
    (UnifiedStudentDashboardAPI.getRecentActivities as jest.Mock).mockResolvedValue(mockActivities);
    (UnifiedStudentDashboardAPI.getProgressData as jest.Mock).mockResolvedValue(mockProgressData);
    (VARKModulesAPI.getModules as jest.Mock).mockResolvedValue(mockModules);
    (ClassesAPI.getStudentClasses as jest.Mock).mockResolvedValue(mockClasses);
  });

  describe('Dashboard Loading', () => {
    it('should display loading spinner initially', () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Dashboard displays loading state
       * Validates: Requirements 1.1, 14.1
       */
      render(<StudentDashboard />);
      
      expect(screen.getByText('Loading your learning dashboard...')).toBeInTheDocument();
    });

    it('should load dashboard with mock data', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Dashboard loads with data
       * Validates: Requirements 1.1, 1.2, 1.3, 1.4
       */
      render(<StudentDashboard />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      // Verify API calls were made
      expect(UnifiedStudentDashboardAPI.getDashboardStats).toHaveBeenCalledWith('student-123');
      expect(UnifiedStudentDashboardAPI.getRecentActivities).toHaveBeenCalledWith('student-123');
      expect(UnifiedStudentDashboardAPI.getProgressData).toHaveBeenCalledWith('student-123');

      // Verify dashboard content is displayed
      expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Modules completed
    });

    it('should display user learning style information', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Dashboard shows learning style
       * Validates: Requirements 1.2, 8.1
       */
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Unimodal/i)).toBeInTheDocument();
      expect(screen.getByText('Visual')).toBeInTheDocument();
    });
  });

  describe('Recent Activities', () => {
    it('should display recent activities', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Recent activities are displayed
       * Validates: Requirements 1.4, 10.1, 10.2
       */
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Cell Division Module')).toBeInTheDocument();
      expect(screen.getByText('Photosynthesis Module')).toBeInTheDocument();
      expect(screen.getByText('90.0%')).toBeInTheDocument(); // Score
      expect(screen.getByText('65% done')).toBeInTheDocument(); // Progress
    });

    it('should display empty state when no activities', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Empty state for no activities
       * Validates: Requirements 1.4, 14.1
       */
      (UnifiedStudentDashboardAPI.getRecentActivities as jest.Mock).mockResolvedValue([]);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('No recent activities')).toBeInTheDocument();
      expect(screen.getByText('Start learning to see your progress')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh dashboard data when refresh button is clicked', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Refresh button updates data
       * Validates: Requirements 1.1, 14.2, 14.4
       */
      const { toast } = require('sonner');
      
      render(<StudentDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Verify refreshing state
      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      });

      // Verify API calls were made again
      await waitFor(() => {
        expect(UnifiedStudentDashboardAPI.getDashboardStats).toHaveBeenCalledWith('student-123');
        expect(UnifiedStudentDashboardAPI.getRecentActivities).toHaveBeenCalledWith('student-123');
        expect(UnifiedStudentDashboardAPI.getProgressData).toHaveBeenCalledWith('student-123');
      });

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Dashboard refreshed');
      });
    });

    it('should show refreshing indicator during refresh', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Refreshing indicator displays
       * Validates: Requirements 14.2
       */
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Mock a slow API call
      (UnifiedStudentDashboardAPI.getDashboardStats as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStats), 100))
      );

      fireEvent.click(refreshButton);

      // Check that button is disabled during refresh
      expect(refreshButton).toBeDisabled();
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();

      // Wait for refresh to complete
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fails to load', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Error handling displays error message
       * Validates: Requirements 1.5, 13.1, 13.2, 13.4
       */
      const { toast } = require('sonner');
      
      // Mock API failure
      (UnifiedStudentDashboardAPI.getDashboardStats as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<StudentDashboard />);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load dashboard data. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Failed to load dashboard data');
    });

    it('should allow retry after error', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Retry button works after error
       * Validates: Requirements 1.5, 13.4
       */
      // Mock initial failure
      (UnifiedStudentDashboardAPI.getDashboardStats as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StudentDashboard />);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      });

      // Mock success on retry
      (UnifiedStudentDashboardAPI.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Wait for successful load
      await waitFor(() => {
        expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
        expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
      });
    });

    it('should handle partial data load failures gracefully', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Partial failures don't break the page
       * Validates: Requirements 13.1, 13.5
       */
      // Mock classes API failure
      (ClassesAPI.getStudentClasses as jest.Mock).mockRejectedValue(
        new Error('Classes service unavailable')
      );

      render(<StudentDashboard />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      // Dashboard should still display with other data
      expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Modules completed

      // Classes section should not appear (no error thrown)
      expect(screen.queryByText('Your Classes')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state correctly', () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Loading states show correctly
       * Validates: Requirements 14.1, 14.4
       */
      render(<StudentDashboard />);

      const loadingElement = screen.getByText('Loading your learning dashboard...');
      expect(loadingElement).toBeInTheDocument();
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Loading state hides after load
       * Validates: Requirements 14.4
       */
      render(<StudentDashboard />);

      expect(screen.getByText('Loading your learning dashboard...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
    });
  });

  describe('Enrolled Classes', () => {
    it('should display enrolled classes when available', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: Enrolled classes display
       * Validates: Requirements 7.1, 7.2
       */
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Your Classes')).toBeInTheDocument();
      expect(screen.getByText('Biology 101')).toBeInTheDocument();
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });

    it('should not display classes section when no classes enrolled', async () => {
      /**
       * Feature: student-pages-api-migration
       * Test: No classes section when empty
       * Validates: Requirements 7.4
       */
      (ClassesAPI.getStudentClasses as jest.Mock).mockResolvedValue([]);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading your learning dashboard...')).not.toBeInTheDocument();
      });

      expect(screen.queryByText('Your Classes')).not.toBeInTheDocument();
    });
  });
});

</content>
