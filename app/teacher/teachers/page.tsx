'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TeachersAPI, type Teacher } from '@/lib/api/teachers-api';
import { toast } from 'sonner';
import CreateTeacherModal from '@/components/teacher/create-teacher-modal';
import EditTeacherModal from '@/components/teacher/edit-teacher-modal';
import {
  Plus,
  Search,
  Users,
  GraduationCap,
  BookOpen,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Building,
  Award
} from 'lucide-react';

export default function TeacherTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    const result = await TeachersAPI.getTeachers();
    if (result.success && result.data) {
      setTeachers(result.data);
    }
    setIsLoading(false);
  };

  const handleCreateTeacher = async (data: any) => {
    const result = await TeachersAPI.createTeacher(data);

    if (result.success) {
      toast.success('Teacher created successfully!');
      setShowCreateModal(false);
      fetchTeachers();
    } else {
      toast.error(`Failed to create teacher: ${result.error}`);
    }
  };

  const handleUpdateTeacher = async (data: any) => {
    if (!selectedTeacher) return;

    const result = await TeachersAPI.updateTeacher(selectedTeacher.id, data);

    if (result.success) {
      toast.success('Teacher updated successfully!');
      setShowEditModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } else {
      toast.error(`Failed to update teacher: ${result.error}`);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const result = await TeachersAPI.deleteTeacher(id);
    if (result.success) {
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } else {
      toast.error(`Failed to delete teacher: ${result.error}`);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedTeachers.length === paginatedTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(paginatedTeachers.map(t => t.id));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) return;
    
    if (!confirm(`Delete ${selectedTeachers.length} selected teachers?`)) return;

    let successCount = 0;
    for (const id of selectedTeachers) {
      const result = await TeachersAPI.deleteTeacher(id);
      if (result.success) successCount++;
    }

    toast.success(`Deleted ${successCount} teachers`);
    setSelectedTeachers([]);
    fetchTeachers();
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch =
      (teacher.full_name && teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.department && teacher.department.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#00af8f]" />
          <p className="text-lg text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#feffff] via-[#ffffff] to-[#feffff]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00af8f] to-[#00af90] rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Teacher Management
                </h1>
                <p className="text-gray-600">
                  Manage teacher accounts and permissions
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#00af8f] to-[#00af90] hover:from-[#00af90] hover:to-[#00af8f] text-white border-0 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add New Teacher
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {teachers.length}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Teachers
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {new Set(teachers.map(t => t.department).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Departments
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {new Set(teachers.map(t => t.specialization).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    Specializations
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search teachers by name, email, or department..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#00af8f] focus:ring-[#00af8f]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          {/* Table Controls */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-4">
              {selectedTeachers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedTeachers.length}
                </Button>
              )}
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTeachers.length)} of {filteredTeachers.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px] relative">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#00af8f] to-[#00af90] sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={selectedTeachers.length === paginatedTeachers.length && paginatedTeachers.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-white"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider sticky right-0 bg-gradient-to-r from-[#00af8f] to-[#00af90]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={() => toggleSelectTeacher(teacher.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-[#00af8f] to-[#00af90] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {teacher.first_name && teacher.last_name 
                                ? `${teacher.first_name[0]}${teacher.last_name[0]}`
                                : teacher.email ? teacher.email[0].toUpperCase() : '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.full_name || teacher.email || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {teacher.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {teacher.department ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {teacher.department}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {teacher.specialization ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {teacher.specialization}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeacher(teacher)}
                            className="text-green-600 hover:text-green-900 hover:bg-green-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTeachers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No teachers found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search
                </p>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}>
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}>
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}>
                  Last
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateTeacherModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateTeacher}
      />

      {selectedTeacher && (
        <EditTeacherModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={handleUpdateTeacher}
          teacher={selectedTeacher}
        />
      )}
    </div>
  );
}
