import { Route, Routes } from 'react-router-dom';
import { NoAccess, useActiveStudent } from '../../app/shell';
import { PageHeader } from '../../ui/kit';
import { AnnouncementsPage, ResourceHub } from '../shared';
import { Academics, AssignmentDetail, Assignments, Attendance, Dashboard, PassportPage, Performance, Profile, Timetable } from './pages';
import { Planner, Practice, Prep, Tutor } from './tools';

function Hub() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="Learning Hub" subtitle="Notes, worksheets, previous papers and videos for your class." /><ResourceHub classId={student.classId} student={student} /></>);
}

export default function Student() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="timetable" element={<Timetable />} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="academics" element={<Academics />} />
      <Route path="assignments" element={<Assignments />} />
      <Route path="assignments/:id" element={<AssignmentDetail />} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="resources" element={<Hub />} />
      <Route path="tutor" element={<Tutor />} />
      <Route path="planner" element={<Planner />} />
      <Route path="practice" element={<Practice />} />
      <Route path="prep" element={<Prep />} />
      <Route path="performance" element={<Performance />} />
      <Route path="passport" element={<PassportPage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NoAccess />} />
    </Routes>
  );
}
