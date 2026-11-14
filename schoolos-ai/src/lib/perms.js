// Roles and permissions. Enforced in the action layer (lib/actions.js) AND in route guards.
// NOTE: with no server, this protects the demo's workflows, not the data in browser storage.

export const ROLES = {
  super_admin: { label: 'Super Admin', portal: 'admin' },
  school_admin: { label: 'School Admin', portal: 'admin' },
  principal: { label: 'Principal', portal: 'admin' },
  teacher: { label: 'Teacher', portal: 'teacher' },
  student: { label: 'Student', portal: 'student' },
  parent: { label: 'Parent', portal: 'parent' },
};

const ADMIN_ALL = [
  'students.manage', 'teachers.manage', 'classes.manage', 'subjects.manage', 'timetable.manage', 'fees.manage', 'announce.create',
  'settings.manage', 'marks.approve', 'reports.view', 'insights.view', 'attendance.any', 'exams.manage', 'communication.send', 'growth.view', 'assignments.monitor', 'resources.manage',
];

const SETS = {
  super_admin: [...ADMIN_ALL, 'users.manage'],
  principal: ADMIN_ALL,
  school_admin: ADMIN_ALL.filter((p) => p !== 'marks.approve'),
  teacher: ['attendance.mark', 'assignments.manage', 'marks.enter', 'resources.manage', 'feedback.add', 'copilot.use', 'messages.send', 'meetings.respond', 'growth.edit', 'exams.view'],
  student: ['assignments.submit', 'planner.manage', 'tutor.use', 'prep.manage', 'resources.save', 'achievements.add', 'quiz.take'],
  parent: ['meetings.request', 'fees.pay', 'messages.send'],
};

export const can = (role, perm) => !!role && (SETS[role] || []).includes(perm);
export const portalOf = (role) => ROLES[role]?.portal;
export class PermissionError extends Error {
  constructor(msg = 'You do not have permission to do that.') {
    super(msg);
    this.name = 'PermissionError';
  }
}
