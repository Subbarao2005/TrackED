import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentTasks from './pages/StudentTasks';
import StudentMarks from './pages/StudentMarks';
import StudentFees from './pages/StudentFees';
import MentorDashboard from './pages/MentorDashboard';
import MentorStudents from './pages/MentorStudents';
import MentorAttendance from './pages/MentorAttendance';
import MentorTasks from './pages/MentorTasks';
import MentorSalary from './pages/MentorSalary';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherUsers from './pages/TeacherUsers';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherExams from './pages/TeacherExams';
import TeacherFinance from './pages/TeacherFinance';
import StudentExam from './pages/StudentExam';
import StudentLeaderboard from './pages/StudentLeaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/profile" 
          element={<ProtectedRoute allowedRoles={['student', 'mentor', 'teacher', 'admin', 'developer']}><Profile /></ProtectedRoute>} 
        />
        <Route 
          path="/admin" 
          element={<ProtectedRoute allowedRoles={['admin', 'developer']}><AdminDashboard /></ProtectedRoute>} 
        />
        
        <Route 
          path="/student" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/student/tasks" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentTasks /></ProtectedRoute>} 
        />
        <Route 
          path="/student/exam" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentExam /></ProtectedRoute>} 
        />
        <Route 
          path="/student/marks" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentMarks /></ProtectedRoute>} 
        />
        <Route 
          path="/student/fees" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentFees /></ProtectedRoute>} 
        />
        <Route 
          path="/student/leaderboard" 
          element={<ProtectedRoute allowedRoles={['student', 'admin', 'developer']}><StudentLeaderboard /></ProtectedRoute>} 
        />
        
        <Route 
          path="/mentor" 
          element={<ProtectedRoute allowedRoles={['mentor', 'teacher', 'admin', 'developer']}><MentorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/mentor/students" 
          element={<ProtectedRoute allowedRoles={['mentor', 'teacher', 'admin', 'developer']}><MentorStudents /></ProtectedRoute>} 
        />
        <Route 
          path="/mentor/attendance" 
          element={<ProtectedRoute allowedRoles={['mentor', 'teacher', 'admin', 'developer']}><MentorAttendance /></ProtectedRoute>} 
        />
        <Route 
          path="/mentor/tasks" 
          element={<ProtectedRoute allowedRoles={['mentor', 'teacher', 'admin', 'developer']}><MentorTasks /></ProtectedRoute>} 
        />
        <Route 
          path="/mentor/salary" 
          element={<ProtectedRoute allowedRoles={['mentor', 'teacher', 'admin', 'developer']}><MentorSalary /></ProtectedRoute>} 
        />
        
        <Route 
          path="/teacher" 
          element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'developer']}><TeacherDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/teacher/users" 
          element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'developer']}><TeacherUsers /></ProtectedRoute>} 
        />
        <Route 
          path="/teacher/assignments" 
          element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'developer']}><TeacherAssignments /></ProtectedRoute>} 
        />
        <Route 
          path="/teacher/exams" 
          element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'developer']}><TeacherExams /></ProtectedRoute>} 
        />
        <Route 
          path="/teacher/finance" 
          element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'developer']}><TeacherFinance /></ProtectedRoute>} 
        />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
