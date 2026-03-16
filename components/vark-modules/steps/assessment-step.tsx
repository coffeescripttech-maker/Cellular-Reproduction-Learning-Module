'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Eye,
  Headphones,
  PenTool,
  Zap,
  Database,
  Lightbulb
} from 'lucide-react';
import { VARKModule, VARKAssessmentQuestion } from '@/types/vark-module';

interface AssessmentStepProps {
  formData: Partial<VARKModule>;
  updateFormData: (updates: Partial<VARKModule>) => void;
}

const questionTypes = [
  {
    value: 'single_choice',
    label: 'Single Choice',
    icon: CheckCircle,
    description: 'Choose one correct answer from options'
  },
  {
    value: 'multiple_choice',
    label: 'Multiple Choice',
    icon: CheckCircle,
    description: 'Choose multiple correct answers from options'
  },
  {
    value: 'true_false',
    label: 'True/False',
    icon: CheckCircle,
    description: 'Simple true or false questions'
  },
  {
    value: 'matching',
    label: 'Matching',
    icon: CheckCircle,
    description: 'Match items from two columns'
  },
  {
    value: 'short_answer',
    label: 'Short Answer',
    icon: PenTool,
    description: 'Brief text responses'
  },
  {
    value: 'audio_response',
    label: 'Audio Response',
    icon: Headphones,
    description: 'Voice recording answers'
  },
  {
    value: 'visual_response',
    label: 'Visual Response',
    icon: Eye,
    description: 'Drawing or image responses'
  },
  {
    value: 'interactive_response',
    label: 'Interactive',
    icon: Zap,
    description: 'Complex interactive questions'
  }
];

const learningStyleIcons = {
  everyone: Target,
  visual: Eye,
  auditory: Headphones,
  reading_writing: PenTool,
  kinesthetic: Zap
};

const learningStyleColors = {
  everyone: 'from-teal-500 to-teal-600',
  visual: 'from-blue-500 to-blue-600',
  auditory: 'from-green-500 to-green-600',
  reading_writing: 'from-purple-500 to-purple-600',
  kinesthetic: 'from-orange-500 to-orange-600'
};

export default function AssessmentStep({
  formData,
  updateFormData
}: AssessmentStepProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<
    number | null
  >(null);
  const questions = formData.assessment_questions || [];

  // Debug logging
  console.log('AssessmentStep - formData:', formData);
  console.log('AssessmentStep - questions:', questions);

  // Set initial selected question if questions exist
  React.useEffect(() => {
    if (questions.length > 0 && selectedQuestionIndex === null) {
      setSelectedQuestionIndex(0);
    }
  }, [questions, selectedQuestionIndex]);

  // Sample assessment questions for quick population
  const sampleAssessmentQuestions: VARKAssessmentQuestion[] = [
    {
      id: 'sample-pre-test-1',
      question: 'What is the main purpose of cell division?',
      type: 'single_choice',
      options: [
        'A. Produce energy',
        'B. Stop cell growth', 
        'C. Create new cells for growth, repair, and reproduction',
        'D. Eliminate old cells'
      ],
      correct_answer: 'C. Create new cells for growth, repair, and reproduction',
      points: 10,
      time_limit: 60,
      hints: ['Think about why organisms need new cells', 'Consider growth and healing processes']
    },
    {
      id: 'sample-pre-test-2',
      question: 'Which type of cell division results in genetically identical daughter cells?',
      type: 'single_choice',
      options: [
        'A. Mitosis',
        'B. Fertilization',
        'C. Binary fission', 
        'D. Meiosis'
      ],
      correct_answer: 'A. Mitosis',
      points: 10,
      time_limit: 45,
      hints: ['This process is used for growth and repair', 'The daughter cells have the same genetic material as the parent']
    },
    {
      id: 'sample-pre-test-3',
      question: 'During which phase of mitosis do chromosomes align at the cell center?',
      type: 'single_choice',
      options: [
        'A. Prophase',
        'B. Metaphase',
        'C. Anaphase',
        'D. Telophase'
      ],
      correct_answer: 'B. Metaphase',
      points: 10,
      time_limit: 45,
      hints: ['Think about chromosome positioning', 'This phase comes after prophase']
    },
    {
      id: 'sample-post-test-1',
      question: 'What is the chromosome number in human gametes?',
      type: 'single_choice',
      options: ['A. 23', 'B. 92', 'C. 46', 'D. 12'],
      correct_answer: 'A. 23',
      points: 10,
      time_limit: 30,
      hints: ['Gametes are sex cells', 'They have half the chromosome number of body cells']
    },
    {
      id: 'sample-post-test-2',
      question: 'Which process produces genetic variation in offspring?',
      type: 'single_choice',
      options: [
        'A. Mitosis',
        'B. Meiosis',
        'C. Binary fission',
        'D. Budding'
      ],
      correct_answer: 'B. Meiosis',
      points: 10,
      time_limit: 45,
      hints: ['This process creates sex cells', 'Crossing over occurs during this process']
    },
    {
      id: 'sample-true-false-1',
      question: 'Meiosis produces four genetically different gametes from one parent cell.',
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True',
      points: 5,
      time_limit: 20,
      hints: ['Think about genetic variation', 'Consider crossing over and independent assortment']
    },
    {
      id: 'sample-true-false-2',
      question: 'Mitosis and meiosis both result in the same number of daughter cells.',
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'False',
      points: 5,
      time_limit: 20,
      hints: ['Count the daughter cells produced by each process', 'Mitosis produces 2, meiosis produces 4']
    },
    {
      id: 'sample-multiple-choice-1',
      question: 'Which of the following are phases of mitosis? (Select all that apply)',
      type: 'multiple_choice',
      options: [
        'A. Prophase',
        'B. Metaphase',
        'C. Interphase',
        'D. Anaphase',
        'E. Telophase',
        'F. Cytokinesis'
      ],
      correct_answer: 'A. Prophase, B. Metaphase, D. Anaphase, E. Telophase',
      points: 15,
      time_limit: 90,
      hints: ['Interphase is not part of mitosis', 'Cytokinesis follows mitosis but is separate']
    }
  ];

  const quickPopulateSampleAssessments = () => {
    // Validate that all sample questions have correct answers
    const validatedQuestions = sampleAssessmentQuestions.map(question => ({
      ...question,
      // Ensure correct_answer is properly set
      correct_answer: question.correct_answer || question.options?.[0] || '',
      // Ensure all required fields are present
      points: question.points || 10,
      time_limit: question.time_limit || 60
    }));

    updateFormData({ assessment_questions: validatedQuestions });
    setSelectedQuestionIndex(0);
    
    console.log('✅ Sample assessments populated:', validatedQuestions);
    console.log('📊 Total questions added:', validatedQuestions.length);
    console.log('🎯 Questions with correct answers:', validatedQuestions.filter(q => q.correct_answer).length);
    
    // Show success message
    const totalPoints = validatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    alert(`✅ Successfully populated ${validatedQuestions.length} sample assessment questions!\n\n📊 Total Points: ${totalPoints}\n🎯 Question Types: ${Array.from(new Set(validatedQuestions.map(q => q.type))).join(', ')}\n\n💡 All questions include correct answers and hints for students.`);
  };

  const addQuestion = () => {
    const newQuestion: VARKAssessmentQuestion = {
      id: `question-${Date.now()}`,
      type: 'single_choice',
      question: '',
      options: [''],
      correct_answer: '',
      points: 10
    };

    const updatedQuestions = [...questions, newQuestion];
    updateFormData({ assessment_questions: updatedQuestions });
    setSelectedQuestionIndex(updatedQuestions.length - 1);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    updateFormData({ assessment_questions: updatedQuestions });
    if (selectedQuestionIndex === index) {
      setSelectedQuestionIndex(null);
    } else if (
      selectedQuestionIndex !== null &&
      selectedQuestionIndex > index
    ) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  };

  const updateQuestion = (
    index: number,
    updates: Partial<VARKAssessmentQuestion>
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    updateFormData({ assessment_questions: updatedQuestions });
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || []), ''];
    updateQuestion(questionIndex, { options: newOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const newOptions = question.options?.filter(
      (_, i) => i !== optionIndex
    ) || [''];
    updateQuestion(questionIndex, { options: newOptions });
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const renderQuestionForm = (
    question: VARKAssessmentQuestion,
    index: number
  ) => {
    const { type } = question;

    return (
      <div className="space-y-6">
        {/* Question Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Question Type
          </Label>
          <Select
            value={type}
            onValueChange={value =>
              updateQuestion(index, { type: value as any })
            }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map(qt => {
                const Icon = qt.icon;
                return (
                  <SelectItem key={qt.value} value={qt.value}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{qt.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Question Text */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Question</Label>
          <Textarea
            placeholder="Enter your question..."
            value={question.question || ''}
            onChange={e => updateQuestion(index, { question: e.target.value })}
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Options for Multiple Choice */}
        {(type === 'single_choice' ||
          type === 'multiple_choice' ||
          type === 'matching') && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Options</Label>
            <div className="space-y-2">
              {(question.options || ['']).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={e =>
                      updateOption(index, optionIndex, e.target.value)
                    }
                    className="flex-1"
                  />
                  {(question.options || []).length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index, optionIndex)}
                      className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addOption(index)}
                className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400">
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Correct Answer *
            <span className="text-xs text-gray-500 ml-1">
              (Required for grading)
            </span>
          </Label>
          {(type === 'single_choice' || type === 'multiple_choice') && question.options && question.options.length > 0 ? (
            <Select
              value={question.correct_answer || ''}
              onValueChange={value => updateQuestion(index, { correct_answer: value })}>
              <SelectTrigger className={!question.correct_answer ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select the correct answer..." />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option, optionIndex) => (
                  <SelectItem key={optionIndex} value={option}>
                    {option || `Option ${optionIndex + 1}`}
                  </SelectItem>
                ))}
                {type === 'multiple_choice' && (
                  <SelectItem value="multiple">
                    Multiple correct answers (specify in text field below)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : type === 'true_false' ? (
            <Select
              value={question.correct_answer || ''}
              onValueChange={value => updateQuestion(index, { correct_answer: value })}>
              <SelectTrigger className={!question.correct_answer ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select True or False..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True">True</SelectItem>
                <SelectItem value="False">False</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Enter the correct answer..."
              value={question.correct_answer || ''}
              onChange={e =>
                updateQuestion(index, { correct_answer: e.target.value })
              }
              className={!question.correct_answer ? 'border-red-300' : ''}
            />
          )}
          {!question.correct_answer && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-xs text-red-600">Correct answer is required for grading</p>
            </div>
          )}
          {type === 'multiple_choice' && question.correct_answer === 'multiple' && (
            <div className="mt-2">
              <Input
                placeholder="Enter multiple correct answers (e.g., A. Option 1, C. Option 3)"
                value={question.correct_answer || ''}
                onChange={e =>
                  updateQuestion(index, { correct_answer: e.target.value })
                }
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                For multiple correct answers, list them separated by commas
              </p>
            </div>
          )}
        </div>

        {/* Time Limit */}
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Time Limit (seconds)
            <span className="text-xs text-gray-500 ml-1">
              (0 = no time limit)
            </span>
          </Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={question.time_limit || ''}
            onChange={e =>
              updateQuestion(index, { time_limit: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        {/* Hints */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Hints</Label>
          <Textarea
            placeholder="Enter helpful hints for students (optional)..."
            value={question.hints?.join('\n') || ''}
            onChange={e =>
              updateQuestion(index, { 
                hints: e.target.value.split('\n').filter(hint => hint.trim()) 
              })
            }
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter each hint on a new line
          </p>
        </div>

        {/* Points */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Points</Label>
          <Input
            type="number"
            min="1"
            placeholder="10"
            value={question.points || ''}
            onChange={e =>
              updateQuestion(index, { points: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        {/* Max Duration for Audio/Visual */}
        {(type === 'audio_response' || type === 'visual_response') && (
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Max Duration (seconds)
            </Label>
            <Input
              type="number"
              min="10"
              placeholder="60"
              value={question.max_duration || ''}
              onChange={e =>
                updateQuestion(index, {
                  max_duration: parseInt(e.target.value) || 0
                })
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <FileText className="w-8 h-8 mx-auto mb-3 text-green-600" />
          Assessment Questions
        </h2>
        <p className="text-gray-600">
          Create assessment questions to evaluate student understanding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Question List */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Assessment Questions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={quickPopulateSampleAssessments}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Database className="w-4 h-4 mr-1" />
                    Quick Populate Sample Assessments
                  </Button>
                  <Button
                    onClick={addQuestion}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Choose a pre-made assessment to quickly populate questions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuestionIndex === index
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedQuestionIndex(index)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {question.question || `Question ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          removeQuestion(index);
                        }}
                        className="text-red-600 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {question.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {question.points || 0} pts
                      </span>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No assessment questions yet</p>
                    <p className="text-sm">
                      Click "Add Question" to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Question Editor */}
        <div className="lg:col-span-2">
          {selectedQuestionIndex !== null &&
          questions[selectedQuestionIndex] ? (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Edit Question:{' '}
                  {questions[selectedQuestionIndex].question ||
                    `Question ${selectedQuestionIndex + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderQuestionForm(
                  questions[selectedQuestionIndex],
                  selectedQuestionIndex
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Question Selected
                </h3>
                <p className="text-gray-500">
                  Select a question from the list to edit its properties and
                  content.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assessment Summary */}
      {questions.length > 0 && (
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Assessment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {questions.length}
                </div>
                <div className="text-blue-800">Total Questions</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                </div>
                <div className="text-green-800">Total Points</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {questions.filter(q => q.correct_answer).length}
                </div>
                <div className="text-purple-800">With Answers</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Array.from(new Set(questions.map(q => q.type))).length}
                </div>
                <div className="text-orange-800">Question Types</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-800">
              <strong>Question Types:</strong> {Array.from(new Set(questions.map(q => q.type))).join(', ')}
            </div>
            {questions.some(q => !q.correct_answer) && (
              <div className="mt-2 p-2 bg-red-100 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ {questions.filter(q => !q.correct_answer).length} question(s) missing correct answers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assessment Tips */}
      <Card className="border-0 shadow-sm bg-green-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            📝 Assessment Best Practices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-green-800">
            <div>
              <h4 className="font-medium mb-2">Question Design:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use clear, unambiguous language</li>
                <li>Include a mix of difficulty levels</li>
                <li>Provide immediate feedback</li>
                <li>Align with learning objectives</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Learning Style Integration:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Visual: Include diagrams and images</li>
                <li>Auditory: Add audio questions</li>
                <li>Reading/Writing: Use text-based questions</li>
                <li>Kinesthetic: Include interactive elements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
