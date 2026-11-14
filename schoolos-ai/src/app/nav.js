import { Award, BarChart3, BookOpen, Bell, Bot, Brain, Calendar, CalendarCheck, ClipboardCheck, ClipboardList, CreditCard, FileText, FlaskConical, GraduationCap, Heart, Home, Layers, LayoutDashboard, Library, LineChart, Megaphone, MessageSquare, NotebookPen, Settings, Shield, Sparkles, Target, User, UserCheck, Users, Wand2, Wallet, Handshake, TrendingUp, School } from 'lucide-react';

// perm: optional permission required to see/open the item.
export const NAV = {
  admin: [
    { group: 'Overview', items: [
      { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: 'insights', label: 'AI School Insights', icon: Sparkles, perm: 'insights.view' },
    ] },
    { group: 'People', items: [
      { to: 'students', label: 'Students', icon: GraduationCap },
      { to: 'teachers', label: 'Teachers', icon: Users },
      { to: 'users', label: 'Users & Roles', icon: Shield, perm: 'users.manage' },
    ] },
    { group: 'Academics', items: [
      { to: 'classes', label: 'Classes & Sections', icon: Layers },
      { to: 'subjects', label: 'Subjects', icon: BookOpen },
      { to: 'timetable', label: 'Timetable', icon: Calendar },
      { to: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { to: 'exams', label: 'Examinations', icon: ClipboardList },
      { to: 'marks', label: 'Marks', icon: ClipboardCheck },
      { to: 'report-cards', label: 'Report Cards', icon: FileText },
      { to: 'assignments', label: 'Assignments', icon: NotebookPen },
    ] },
    { group: 'Engagement', items: [
      { to: 'announcements', label: 'Announcements', icon: Megaphone },
      { to: 'communication', label: 'Parent Communication', icon: MessageSquare },
      { to: 'resources', label: 'Learning Resources', icon: Library },
      { to: 'fees', label: 'Fees', icon: Wallet },
    ] },
    { group: 'Intelligence', items: [
      { to: 'growth', label: 'Student Growth', icon: TrendingUp },
      { to: 'reports', label: 'Reports & Analytics', icon: BarChart3, perm: 'reports.view' },
      { to: 'settings', label: 'School Settings', icon: Settings, perm: 'settings.manage' },
    ] },
  ],
  teacher: [
    { group: 'Teaching', items: [
      { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: 'classes', label: 'My Classes', icon: Layers },
      { to: 'students', label: 'My Students', icon: GraduationCap },
      { to: 'timetable', label: 'Timetable', icon: Calendar },
      { to: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { to: 'assignments', label: 'Assignments', icon: NotebookPen },
      { to: 'exams', label: 'Examinations', icon: ClipboardList },
      { to: 'marks', label: 'Marks Entry', icon: ClipboardCheck },
    ] },
    { group: 'Insight and tools', items: [
      { to: 'performance', label: 'Student Performance', icon: TrendingUp },
      { to: 'copilot', label: 'AI Teacher Copilot', icon: Wand2 },
      { to: 'resources', label: 'Learning Resources', icon: Library },
      { to: 'messages', label: 'Messages & Meetings', icon: MessageSquare },
      { to: 'announcements', label: 'Announcements', icon: Megaphone },
      { to: 'profile', label: 'Profile', icon: User },
    ] },
  ],
  student: [
    { group: 'My school', items: [
      { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: 'timetable', label: 'Timetable', icon: Calendar },
      { to: 'attendance', label: 'My Attendance', icon: CalendarCheck },
      { to: 'academics', label: 'My Academics', icon: GraduationCap },
      { to: 'assignments', label: 'My Assignments', icon: NotebookPen },
      { to: 'announcements', label: 'Announcements', icon: Megaphone },
    ] },
    { group: 'Learning', items: [
      { to: 'resources', label: 'Learning Hub', icon: Library },
      { to: 'tutor', label: 'AI Tutor', icon: Bot },
      { to: 'planner', label: 'Study Planner', icon: Target },
      { to: 'practice', label: 'Practice & Quizzes', icon: FlaskConical },
      { to: 'prep', label: 'Board / JEE / NEET', icon: Brain },
    ] },
    { group: 'Growth', items: [
      { to: 'performance', label: 'My Performance', icon: LineChart },
      { to: 'passport', label: 'Growth Passport', icon: Award },
      { to: 'profile', label: 'My Profile', icon: User },
    ] },
  ],
  parent: [
    { group: 'My children', items: [
      { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: 'children', label: 'My Children', icon: Heart },
      { to: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { to: 'academics', label: 'Academic Performance', icon: GraduationCap },
      { to: 'assignments', label: 'Assignments', icon: NotebookPen },
      { to: 'feedback', label: 'Teacher Feedback', icon: UserCheck },
    ] },
    { group: 'School', items: [
      { to: 'announcements', label: 'Announcements', icon: Megaphone },
      { to: 'communication', label: 'Communication', icon: MessageSquare },
      { to: 'meetings', label: 'Meeting Requests', icon: Handshake },
      { to: 'fees', label: 'Fee Status', icon: CreditCard },
      { to: 'profile', label: 'Profile', icon: User },
    ] },
  ],
};
export const PORTAL_ICON = { admin: School, teacher: Home, student: GraduationCap, parent: Heart };
export const PORTAL_LABEL = { admin: 'Management', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
export { Bell, Settings };
