'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UnifiedClassesAPI, UnifiedVARKModulesAPI } from '@/lib/api/unified-api';
import { type Class } from '@/types/class';
import {
  BookOpen,
  Users,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Headphones,
  PenTool,
  Zap,
  Loader2,
  Clock,
  Target,
  TrendingUp,
  Lock,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const learningStyleIcons = {
  visual: Eye,
  auditory: Headphones,
  reading_writing: PenTool,
  kinesthetic: Zap
};

const learningStyleColors = {
  visual: 'from-blue-500 to-blue-600',
  auditory: 'from-green-500 to-green-600',
  reading_writing: 'from-purple-500 to-purple-600',
  kinesthetic: 'from-orange-500 to-orange-600'
};

const learningStyleLabels = {
  visual: 'Visual',
  auditory: 'Auditory',
  reading_writing: 'Reading/Writing',
  kinesthetic: 'Kinesthetic'
};

const difficultyColors = {
  beginner: 'from-green-500 to-green-600',
  intermediate: 'from-yellow-500 to-yellow-600',
  advanced: 'from-red-500 to-red-600'
};

export default function StudentClassDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string>('all');

  useEffect(() => {
    if (user && classId) {
      loadClassData();
    }
  }, [user, classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      // Load class details
      const classDetails = await UnifiedClassesAPI.getClassById(classId);
      setClassData(classDetails);

      // Load modules for this class
      const allModules = await UnifiedVARKModulesAPI.getAll();
      
      // Filter modules assigned to this class
      const classModules = allModules.filter(
        (module: any) => module.target_class_id === classId && module.is_published
      );
      
      setModules(classModules);
    } catch (error) {
      console.error('Error loading class data:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty =
      selectedDifficulty === 'all' || module.difficulty_level === selectedDifficulty;
    
    const matchesLearningStyle =
      selectedLearningStyle === 'all' ||
      module.target_learning_styles?.includes(selectedLearningStyle) ||
      module.category?.learning_style === selectedLearningStyle;
    
    return matchesSearch && matchesDifficulty && matchesLearningStyle;
  });

  const difficulties = Array.from(new Set(modules.map(m => m.difficulty_level))).filter(Boolean).sort();
  const learningStyles = Array.from(
    new Set(
      modules.flatMap((m: any) => 
        m.target_learning_styles || (m.category?.learning_style ? [m.category.learning_style] : [])
      )
    )
  ).filter(Boolean).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00af8f]" />
          <p className="text-lg text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md">
          <CardContent className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Class not found
            </h3>
            <p className="text-gray-600 mb-6">
              The class you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button
              onClick={() => router.push('/student/classes')}
              className="bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af90] text-white border-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Button
                variant="ghost"
                onClick={() => router.push('/student/classes')}
                className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-[#00af8f] to-[#00af90] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
                <p className="text-gray-600">
                  {classData.subject} • {classData.grade_level} • {classData.teacher_name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {classData.student_count} students
              </Badge>
            </div>
          </div>

          {classData.description && (
            <div className="mt-4">
              <p className="text-gray-600">{classData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            {difficulties.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00af8f] focus:border-transparent">
                  <option value="all">All Difficulties</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Learning Style Filter */}
            {learningStyles.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedLearningStyle}
                  onChange={e => setSelectedLearningStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00af8f] focus:border-transparent">
                  <option value="all">All Learning Styles</option>
                  {learningStyles.map(style => (
                    <option key={style} value={style}>
                      {learningStyleLabels[style as keyof typeof learningStyleLabels] || style}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedDifficulty !== 'all' || selectedLearningStyle !== 'all'
                  ? 'No modules found'
                  : 'No modules assigned'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedDifficulty !== 'all' || selectedLearningStyle !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Your teacher hasn\'t assigned any modules to this class yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => {
              const learningStyle = module.category?.learning_style || module.target_learning_styles?.[0];
              const Icon = learningStyle ? learningStyleIcons[learningStyle as keyof typeof learningStyleIcons] : BookOpen;
              const colorClass = learningStyle ? learningStyleColors[learningStyle as keyof typeof learningStyleColors] : 'from-gray-500 to-gray-600';
              const difficultyColor = module.difficulty_level ? difficultyColors[module.difficulty_level as keyof typeof difficultyColors] : 'from-gray-500 to-gray-600';

              return (
                <Card
                  key={module.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {module.difficulty_level && (
                        <Badge variant="outline" className="text-xs">
                          {module.difficulty_level}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-[#00af8f] transition-colors">
                      {module.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {module.description || 'No description available.'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {module.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <Badge variant="secondary" className="text-xs">
                            {module.category.name}
                          </Badge>
                        </div>
                      )}
                      {module.estimated_duration && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {module.estimated_duration} min
                          </span>
                        </div>
                      )}
                      {learningStyle && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Learning Style:</span>
                          <Badge variant="outline" className="text-xs">
                            {learningStyleLabels[learningStyle as keyof typeof learningStyleLabels]}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Link href={`/student/vark-modules/${module.id}`}>
                        <Button className="w-full bg-[#00af8f] hover:bg-[#00af90] text-white">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start Module
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Module Stats */}
        {modules.length > 0 && (
          <div className="mt-12">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Module Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00af8f]">
                      {modules.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Modules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {difficulties.length}
                    </div>
                    <div className="text-sm text-gray-600">Difficulty Levels</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {learningStyles.length}
                    </div>
                    <div className="text-sm text-gray-600">Learning Styles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(modules.reduce((sum, m) => sum + (m.estimated_duration || 0), 0) / 60)}h
                    </div>
                    <div className="text-sm text-gray-600">Total Duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
