import { Suspense, lazy } from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { Demo, Features, Login } from './pages/Public';
import { PortalGuard } from './app/shell';
import { Loading } from './ui/kit';

// Each portal renders its own nested <Routes> (paths are relative to /app/<portal>).
const Admin = lazy(() => import('./portals/admin'));
const Teacher = lazy(() => import('./portals/teacher'));
const Student = lazy(() => import('./portals/student'));
const Parent = lazy(() => import('./portals/parent'));

function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">This page does not exist</h1>
        <Link to="/" className="mt-5 inline-block font-semibold text-cta">Back to home →</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="features" element={<Features />} />
          <Route path="demo" element={<Demo />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="app" element={<Navigate to="/demo" replace />} />
        <Route path="app/admin/*" element={<PortalGuard portal="admin"><Admin /></PortalGuard>} />
        <Route path="app/teacher/*" element={<PortalGuard portal="teacher"><Teacher /></PortalGuard>} />
        <Route path="app/student/*" element={<PortalGuard portal="student"><Student /></PortalGuard>} />
        <Route path="app/parent/*" element={<PortalGuard portal="parent"><Parent /></PortalGuard>} />
      </Routes>
    </Suspense>
  );
}
