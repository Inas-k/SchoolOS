// Imagery regenerated in code. Nothing here is downloaded from the original site.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DashboardMock from './components/DashboardMock';

const toUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Hand-drawn "skooly" wordmark (strokes, so it needs no font). 109x47 box. */
export const wordmarkSrc = toUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109 47" width="109" height="47" fill="none" stroke="#d01858" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21C14 17 7 18 7 22C7 27 17 26 17 31C17 36 9 36 6 32"/>
    <path d="M24 8V34M34 18L25 27M28 25L35 34"/>
    <circle cx="48" cy="26" r="8"/>
    <circle cx="68" cy="26" r="8"/>
    <path d="M81 8V34"/>
    <path d="M88 18L96 33M105 18L95 38C93 42 90 44 87 43"/>
  </svg>`,
);

export const academyDashSrc = toUri(renderToStaticMarkup(createElement(DashboardMock, { variant: 'academy' })));
export const preschoolDashSrc = toUri(renderToStaticMarkup(createElement(DashboardMock, { variant: 'preschool' })));

/** 48x48 initials tile standing in for a customer logo. */
export function logoSrc(initials, bg, fg = '#ffffff') {
  return toUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="${bg}"/><text x="24" y="31" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="${fg}">${initials}</text></svg>`,
  );
}
