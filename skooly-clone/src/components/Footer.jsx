import { Apple, Play } from 'lucide-react';
import Wordmark from './Wordmark';
import { LINKS } from '../config';

const LINK = 'text-base text-gray-300 hover:text-white transition-colors';
const H3 = 'text-xs font-bold uppercase tracking-[0.2em] text-white mb-5';

const COLUMNS = [
  [
    'Academy',
    [
      ['/academy/features/student-management/', 'Student Management'],
      ['/academy/features/class-scheduling/', 'Class Scheduling'],
      ['/academy/features/enrollment-booking/', 'Enrollment & Booking'],
      ['/academy/features/attendance-tracking/', 'Attendance & Make-ups'],
      ['/academy/features/billing-payments/', 'Billing & Payments'],
      ['/academy/features/communications/', 'Communications'],
      ['/academy/features/', 'All Academy Features', true],
    ],
  ],
  [
    'Preschool',
    [
      ['/preschool/features/children-management/', 'Children Management'],
      ['/preschool/features/daily-reports/', 'Daily Reports'],
      ['/preschool/features/daily-attendance/', 'Daily Attendance'],
      ['/preschool/features/development-tracking/', 'Development Tracking'],
      ['/preschool/features/finance-management/', 'Finance Management'],
      ['/preschool/features/preschool-communications/', 'Communications'],
      ['/preschool/features/', 'All Preschool Features', true],
    ],
  ],
  [
    'Company',
    [
      ['/academy/pricing/', 'Academy Pricing'],
      ['/preschool/pricing/', 'Preschool Pricing'],
      ['/demo/', 'Schedule a Demo'],
      ['/support/', 'Support'],
    ],
  ],
  [
    'Resources',
    [
      ['/blog/', 'Blog'],
      [LINKS.helpCenter, 'Help Center', false, true],
    ],
  ],
  [
    'Legal',
    [
      ['/terms/', 'Terms of Service'],
      ['/privacy/', 'Privacy Policy'],
      ['/delete-account/', 'Delete Account'],
    ],
  ],
];

const COUNTRIES = [
  ['Singapore', [['/tuition-centre-software-singapore/', 'Tuition centre'], ['/preschool-software-singapore/', 'Preschool'], ['/music-school-software-singapore/', 'Music school'], ['/dance-studio-software-singapore/', 'Dance studio']]],
  ['Malaysia', [['/tuition-centre-software-malaysia/', 'Tuition centre'], ['/preschool-software-malaysia/', 'Preschool'], ['/sistem-tadika/', 'Sistem Tadika (Bahasa Malaysia)'], ['/music-school-software-malaysia/', 'Music school'], ['/dance-studio-software-malaysia/', 'Dance studio']]],
  ['Indonesia', [['/preschool-software-indonesia/', 'Preschool'], ['/aplikasi-paud/', 'Aplikasi PAUD (Bahasa Indonesia)']]],
  ['Vietnam', [['/phan-mem-quan-ly-mam-non/', 'Phần mềm quản lý mầm non (Tiếng Việt)']]],
  ['Philippines', [['/preschool-software-philippines/', 'Preschool']]],
  ['India', [['/preschool-software-india/', 'Preschool']]],
  ['Australia', [['/tuition-centre-software-australia/', 'Tutoring centre'], ['/sports-club-software-australia/', 'Sports clubs & coaching']]],
  ['Gulf & Middle East', [['/nursery-management-software/', 'Nursery software'], ['/ar/nursery-management-software/', 'برنامج إدارة الحضانة (العربية)', 'ar']]],
  ['South Africa', [['/preschool-software-south-africa/', 'Preschool']]],
  ['North America', [['/us/preschool/', 'United States'], ['/ca/preschool/', 'Canada'], ['/fr/ca/preschool/', 'Canada (français)', 'fr']]],
  ['Brazil', [['/pt/software-para-escola-infantil/', 'Escola infantil (Português)', 'pt']]],
];

const STORE =
  'inline-flex items-center gap-2.5 rounded-lg border border-white/25 bg-black/30 ps-3 pe-4 py-2 text-gray-200 hover:border-white/50 hover:bg-black/50 transition-colors';

export default function Footer() {
  return (
    <footer className="bg-ink text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {COLUMNS.map(([title, links]) => (
            <div key={title}>
              <h3 className={H3}>{title}</h3>
              <ul className="space-y-3">
                {links.map(([href, label, strong, external]) => (
                  <li key={href}>
                    <a
                      className={`${LINK}${strong ? ' font-medium' : ''}`}
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className={H3}>Connect</h3>
            <ul className="space-y-3">
              <li>
                <a href={LINKS.supportEmail} className={LINK}>support@getskooly.com</a>
              </li>
              <li>
                <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer" className={LINK}>YouTube</a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href={LINKS.appStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <Apple className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                <span className="text-start leading-tight">
                  <span className="block text-[10px] text-gray-400">Download on the</span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </a>
              <a href={LINKS.playStore} target="_blank" rel="noopener noreferrer" className={STORE}>
                <Play className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="text-start leading-tight">
                  <span className="block text-[10px] text-gray-400">Get it on</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Skooly by country</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">
            {COUNTRIES.map(([country, links]) => (
              <div key={country}>
                <h4 className="text-sm font-semibold text-white mb-3">{country}</h4>
                <ul className="space-y-2">
                  {links.map(([href, label, lang]) => (
                    <li key={href}>
                      <a className="text-sm text-gray-300 hover:text-white transition-colors" href={href} {...(lang ? { hrefLang: lang } : {})}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Wordmark className="h-5 w-auto brightness-0 invert opacity-60" loading="lazy" />
            <span className="text-xs text-gray-500">© 2026 Skooly Pte Ltd. All rights reserved.</span>
          </div>
          <div className="text-xs text-gray-500">Management Software for Education</div>
        </div>
      </div>
    </footer>
  );
}
