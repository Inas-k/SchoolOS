import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';

function NotCloned({ path }) {
  return (
    <main>
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Not part of this clone</span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-gray-900 leading-[1.1]">
            This page has not been cloned yet
          </h1>
          <p className="mt-5 text-lg text-gray-700 leading-relaxed">
            Only the home page is built. <code className="font-mono">{path}</code> exists on the original site.
          </p>
          <a className="mt-8 inline-block font-semibold text-primary hover:text-primary-dark transition-colors" href="/">
            Back to home →
          </a>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return (
    <>
      <Header />
      {path === '/' ? <Home /> : <NotCloned path={window.location.pathname} />}
      <Footer />
      <ChatWidget />
    </>
  );
}
