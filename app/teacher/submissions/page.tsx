'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { VARKModulesAPI } from '@/lib/api/unified-api';
import { ExpressStudentProgressAPI } from '@/lib/api/express-student-progress';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Trophy,
  Target,
  BarChart3,
  Loader2,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  Star,
  Zap,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface ModuleSubmission {
  module_id: string;
  module_title: string;
  total_students: number;
  submitted_count: number;
  average_score: number;
  completion_rate: number;
}

interface StudentResult {
  student_id: string;
  student_name: string;
  student_email: string;
  module_id: string;
  module_title: string;
  completion_date: string;
  final_score: number;
  time_spent_minutes: number;
  sections_completed: number;
  perfect_sections: number;
}

export default function TeacherSubmissionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<ModuleSubmission[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedModule !== 'all') {
      loadStudentResults(selectedModule);
    }
  }, [selectedModule]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all modules
      const modulesData = await VARKModulesAPI.getModules();
      setModules(modulesData);

      // Load submission statistics for each module
      const submissionsData: ModuleSubmission[] = [];

      for (const module of modulesData) {
        try {
          const stats = await VARKModulesAPI.getModuleSubmissionStats(module.id);
          console.log(`📊 Stats for module ${module.title}:`, stats);
          submissionsData.push({
            module_id: module.id,
            module_title: module.title,
            total_students: stats.totalStudents,
            submitted_count: stats.submittedCount,
            average_score: stats.averageScore,
            completion_rate: stats.completionRate
          });
        } catch (error) {
          console.error(`Error loading stats for module ${module.id}:`, error);
        }
      }

      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions data:', error);
      toast.error('Failed to load submissions data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentResults = async (moduleId: string) => {
    try {
      // Load all completions for this module
      const completions = await VARKModulesAPI.getModuleCompletions(moduleId);
      
      const results: StudentResult[] = completions.map((completion: any) => ({
        student_id: completion.student_id,
        student_name: `${completion.profiles?.first_name || ''} ${completion.profiles?.last_name || ''}`.trim() || 'Unknown Student',
        student_email: completion.profiles?.email || 'N/A',
        module_id: completion.module_id,
        module_title: modules.find(m => m.id === completion.module_id)?.title || 'Unknown Module',
        completion_date: completion.completion_date,
        final_score: completion.final_score || 0,
        time_spent_minutes: completion.time_spent_minutes || 0,
        sections_completed: completion.sections_completed || 0,
        perfect_sections: completion.perfect_sections || 0
      }));

      setStudentResults(results);
    } catch (error) {
      console.error('Error loading student results:', error);
      toast.error('Failed to load student results');
    }
  };

  const handleViewDetails = async (studentId: string, moduleId: string) => {
    try {
      setLoadingDetails(true);
      setShowDetailsModal(true);

      // Load module data
      const module = await VARKModulesAPI.getModuleById(moduleId);

      // Load completion data
      const completionData = await VARKModulesAPI.getStudentModuleCompletion(
        studentId,
        moduleId
      );

      // Load all section submissions
      const submissionsData = await VARKModulesAPI.getStudentSubmissions(
        studentId,
        moduleId
      );

      // Get student info
      const studentResult = studentResults.find(
        s => s.student_id === studentId && s.module_id === moduleId
      );

      setSelectedStudentData({
        student: studentResult,
        module,
        completion: completionData,
        submissions: submissionsData
      });
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Failed to load student details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResetProgress = async () => {
    if (!selectedStudentData) return;
    
    try {
      setResetting(true);
      
      await ExpressStudentProgressAPI.resetStudentProgress(
        selectedStudentData.student.student_id,
        selectedStudentData.student.module_id
      );
      
      toast.success('Student progress reset successfully');
      setShowResetConfirm(false);
      setShowDetailsModal(false);
      
      // Reload data
      loadData();
      if (selectedModule !== 'all') {
        loadStudentResults(selectedModule);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress');
    } finally {
      setResetting(false);
    }
  };

  const downloadReport = () => {
    const data = selectedModule === 'all' ? submissions : studentResults;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submissions-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const filteredResults = studentResults.filter(result =>
    result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#00af8f]" />
          <p className="text-lg text-gray-600">Loading submissions data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff]">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00af8f] to-[#00af90] rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Student Submissions
                </h1>
                <p className="text-gray-600">
                  Track and analyze student module completions
                </p>
              </div>
            </div>
            <Button 
              onClick={downloadReport} 
              className="bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af8f] text-white border-0 shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Enhanced Search and Filters */}
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-[#00af8f]" />
              Filter & Search
            </h3>
            <p className="text-sm text-gray-600">
              Find specific students or filter by module
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#00af8f] focus:ring-[#00af8f]"
                />
              </div>
            </div>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full lg:w-80 border-gray-300 focus:border-[#00af8f] focus:ring-[#00af8f]">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    All Modules
                  </div>
                </SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Module Overview Cards (when all modules selected) */}
      {selectedModule === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#00af8f]" />
                Module Overview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {submissions.length} module{submissions.length !== 1 ? 's' : ''} with submissions
              </p>
            </div>
          </div>
          
          {submissions.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-gray-600">
                    Students haven't completed any modules yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <Card
                  key={submission.module_id}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => setSelectedModule(submission.module_id)}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00af8f]/10 to-transparent rounded-bl-full" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#00af8f] transition-colors line-clamp-2">
                          {submission.module_title}
                        </h3>
                        <Badge
                          className={`${
                            submission.completion_rate >= 80
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : submission.completion_rate >= 50
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          } border`}>
                          {Number(submission.completion_rate || 0).toFixed(0)}% Complete
                        </Badge>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-[#00af8f] to-[#00af90] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center font-medium">
                          <Users className="w-4 h-4 mr-2 text-blue-600" />
                          Students
                        </span>
                        <span className="font-bold text-gray-900 text-lg">
                          {submission.submitted_count || 0} / {submission.total_students || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center font-medium">
                          <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
                          Avg Score
                        </span>
                        <span className="font-bold text-gray-900 text-lg">
                          {Number(submission.average_score || 0).toFixed(1)}%
                        </span>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span className="font-medium">Completion Progress</span>
                          <span className="font-bold">{Number(submission.completion_rate || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              submission.completion_rate >= 80
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : submission.completion_rate >= 50
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${submission.completion_rate || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center text-[#00af8f] group-hover:text-[#00af90] transition-colors">
                        <span className="text-sm font-medium">View Details</span>
                        <Target className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Results Table (when specific module selected) */}
      {selectedModule !== 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Award className="w-5 h-5 mr-2 text-[#00af8f]" />
                {modules.find(m => m.id === selectedModule)?.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredResults.length} student{filteredResults.length !== 1 ? 's' : ''} completed this module
              </p>
            </div>
            <Button
              onClick={() => setSelectedModule('all')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50">
              <Target className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </div>

          {filteredResults.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No submissions found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try adjusting your search criteria.'
                      : 'No students have completed this module yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredResults.map((result) => (
                <Card
                  key={`${result.student_id}-${result.module_id}`}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {result.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {result.student_name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {result.student_email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Final Score
                            </p>
                            <div className="flex items-center space-x-2">
                              <Trophy
                                className={`w-5 h-5 ${
                                  result.final_score >= 90
                                    ? 'text-green-600'
                                    : result.final_score >= 80
                                    ? 'text-blue-600'
                                    : 'text-yellow-600'
                                }`}
                              />
                              <span className="font-bold text-xl text-gray-900">
                                {result.final_score}%
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Time Spent
                            </p>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <span className="font-bold text-lg text-gray-900">
                                {Math.floor(result.time_spent_minutes / 60) > 0
                                  ? `${Math.floor(result.time_spent_minutes / 60)}h ${result.time_spent_minutes % 60}m`
                                  : `${result.time_spent_minutes}m`}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Sections
                            </p>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                              <span className="font-bold text-lg text-gray-900">
                                {result.sections_completed}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Completed
                            </p>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-5 h-5 text-orange-600" />
                              <span className="font-bold text-sm text-gray-900">
                                {new Date(result.completion_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          handleViewDetails(result.student_id, result.module_id)
                        }
                        className="lg:ml-4 bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af8f] text-white border-0 shadow-lg group-hover:shadow-xl transition-all">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentData({
                            student: result,
                            module: modules.find(m => m.id === result.module_id)
                          });
                          setShowResetConfirm(true);
                        }}
                        variant="outline"
                        className="lg:ml-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Student Performance Details
            </DialogTitle>
            <DialogDescription>
              {selectedStudentData?.student?.student_name} -{' '}
              {selectedStudentData?.module?.title}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : selectedStudentData ? (
            <div className="space-y-6 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Trophy className="w-6 h-6" />
                      <Badge className="bg-white text-green-600 text-xs">
                        Score
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold">
                      {selectedStudentData.completion?.final_score || 0}%
                    </div>
                    <p className="text-green-100 text-sm mt-1">
                      {(selectedStudentData.completion?.final_score || 0) >= 90
                        ? 'Excellent!'
                        : (selectedStudentData.completion?.final_score || 0) >= 80
                        ? 'Great!'
                        : 'Good!'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-6 h-6" />
                      <Badge className="bg-white text-blue-600 text-xs">
                        Time
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold">
                      {Math.floor(
                        (selectedStudentData.completion?.time_spent_minutes || 0) / 60
                      ) > 0
                        ? `${Math.floor(
                            (selectedStudentData.completion?.time_spent_minutes || 0) / 60
                          )}h`
                        : `${selectedStudentData.completion?.time_spent_minutes || 0}m`}
                    </div>
                    <p className="text-blue-100 text-sm mt-1">Study time</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-6 h-6" />
                      <Badge className="bg-white text-purple-600 text-xs">
                        Sections
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold">
                      {selectedStudentData.completion?.sections_completed || 0}
                    </div>
                    <p className="text-purple-100 text-sm mt-1">
                      {selectedStudentData.completion?.perfect_sections || 0} perfect
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Section Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Section Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedStudentData.submissions?.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">
                        No submissions found.
                      </p>
                    ) : (
                      selectedStudentData.submissions?.map(
                        (submission: any, index: number) => (
                          <div
                            key={submission.section_id}
                            className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-sm">
                                    {index + 1}. {submission.section_title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {submission.section_type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {new Date(
                                    submission.submitted_at
                                  ).toLocaleString()}
                                </p>
                              </div>

                              {submission.assessment_results && (
                                <div className="text-right">
                                  <div
                                    className={`text-xl font-bold ${
                                      submission.assessment_results.passed
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                    {submission.assessment_results.percentage.toFixed(
                                      1
                                    )}
                                    %
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {submission.assessment_results.correct_count}/
                                    {submission.assessment_results.total_questions}{' '}
                                    correct
                                  </p>
                                </div>
                              )}
                            </div>

                            {submission.assessment_results && (
                              <Progress
                                value={submission.assessment_results.percentage}
                                className="h-2 mt-2"
                              />
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reset Progress Section */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    Reset this student's progress for this module. This will delete:
                  </p>
                  <ul className="text-sm text-gray-700 mb-4 list-disc list-inside space-y-1">
                    <li>All progress tracking data</li>
                    <li>Module completion record</li>
                    <li>All section submissions and scores</li>
                  </ul>
                  <p className="text-sm font-semibold text-red-700 mb-4">
                    ⚠️ This action cannot be undone!
                  </p>
                  <Button
                    onClick={() => setShowResetConfirm(true)}
                    variant="destructive"
                    className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Student Progress
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Confirm Progress Reset
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset progress for{' '}
              <strong>{selectedStudentData?.student?.student_name}</strong> in{' '}
              <strong>{selectedStudentData?.module?.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold mb-2">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>Progress: {selectedStudentData?.completion?.progress_percentage || 0}%</li>
                <li>Score: {selectedStudentData?.completion?.final_score || 0}%</li>
                <li>Time spent: {selectedStudentData?.completion?.time_spent_minutes || 0} minutes</li>
                <li>All {selectedStudentData?.submissions?.length || 0} section submissions</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              The student will be able to start the module from scratch.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
              disabled={resetting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProgress}
              disabled={resetting}>
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Yes, Reset Progress
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

