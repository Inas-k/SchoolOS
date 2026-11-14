import { Route, Routes } from 'react-router-dom';
import { RequirePerm, NoAccess } from '../../app/shell';
import { PageHeader } from '../../ui/kit';
import { AnnouncementsPage, ResourceHub } from '../shared';
import Dashboard from './dashboard';
import { StudentDetail, Students, Teachers, Users } from './people';
import { AssignmentsMonitor, AttendanceAdmin, Classes, Exams, MarksAdmin, ReportCards, Subjects, TimetablePage } from './academics';
import { Communication, Fees, Growth } from './engage';
import { Insights, Reports, Settings } from './insights';
import { useMe } from '../../app/shell';
import { can } from '../../lib/perms';

function Resources() {
  const { role } = useMe();
  return (
    <>
      <PageHeader title="Learning Resources" subtitle="Everything uploaded by teachers. Administrators can add or remove any resource." />
      <ResourceHub canAdd={can(role, 'resources.manage')} canDeleteAll />
    </>
  );
}
const guard = (perm, el) => <RequirePerm perm={perm}>{el}</RequirePerm>;

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="insights" element={guard('insights.view', <Insights />)} />
      <Route path="students" element={<Students />} />
      <Route path="students/:id" element={<StudentDetail />} />
      <Route path="teachers" element={<Teachers />} />
      <Route path="users" element={guard('users.manage', <Users />)} />
      <Route path="classes" element={<Classes />} />
      <Route path="subjects" element={<Subjects />} />
      <Route path="timetable" element={<TimetablePage />} />
      <Route path="attendance" element={<AttendanceAdmin />} />
      <Route path="exams" element={<Exams />} />
      <Route path="marks" element={<MarksAdmin />} />
      <Route path="report-cards" element={<ReportCards />} />
      <Route path="assignments" element={<AssignmentsMonitor />} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="communication" element={<Communication />} />
      <Route path="resources" element={<Resources />} />
      <Route path="fees" element={<Fees />} />
      <Route path="growth" element={<Growth />} />
      <Route path="reports" element={guard('reports.view', <Reports />)} />
      <Route path="settings" element={guard('settings.manage', <Settings />)} />
      <Route path="*" element={<NoAccess />} />
    </Routes>
  );
}
