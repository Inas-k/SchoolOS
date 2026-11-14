import { Route, Routes } from 'react-router-dom';
import { NoAccess, useMe } from '../../app/shell';
import { PageHeader } from '../../ui/kit';
import * as S from '../../lib/selectors';
import AttendanceMarker from '../attendance';
import MarksEntry from '../marks';
import Copilot from './copilot';
import { AnnouncementsPage, ResourceHub, TimetableGrid } from '../shared';
import { AssignmentDetail, Assignments, Dashboard, Exams, Messages, MyClasses, MyStudents, Performance, Profile } from './pages';

function AttendancePage() {
  const { s, user } = useMe();
  return (<><PageHeader title="Attendance" subtitle="Mark present, absent or late. Saving updates student records, the management dashboard and parents." /><AttendanceMarker allowedSectionIds={S.teacherSectionIds(s, user.linkedId)} /></>);
}
function MarksPage() {
  return (<><PageHeader title="Marks Entry" subtitle="Enter marks, save drafts, then submit for the principal's approval. Grades are calculated automatically." /><MarksEntry /></>);
}
function ResourcesPage() {
  const { user } = useMe();
  return (<><PageHeader title="Learning Resources" subtitle="Add notes, worksheets and links for your students." /><ResourceHub canAdd teacherId={user.linkedId} /></>);
}
function TimetablePage() {
  const { user } = useMe();
  return (<><PageHeader title="My Timetable" subtitle="Your weekly periods across all classes." /><TimetableGrid teacherId={user.linkedId} /></>);
}

export default function Teacher() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="classes" element={<MyClasses />} />
      <Route path="students" element={<MyStudents />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="assignments" element={<Assignments />} />
      <Route path="assignments/:id" element={<AssignmentDetail />} />
      <Route path="marks" element={<MarksPage />} />
      <Route path="exams" element={<Exams />} />
      <Route path="resources" element={<ResourcesPage />} />
      <Route path="timetable" element={<TimetablePage />} />
      <Route path="performance" element={<Performance />} />
      <Route path="copilot" element={<Copilot />} />
      <Route path="messages" element={<Messages />} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NoAccess />} />
    </Routes>
  );
}
