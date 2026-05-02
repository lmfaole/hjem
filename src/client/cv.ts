interface Highlight {
  text: string;
  url?: string;
}

interface Job {
  position: string;
  name: string;
  url?: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: Array<Highlight | string>;
}

interface Education {
  studyType: string;
  area: string;
  areaLang?: string;
  institution: string;
  url?: string;
  startDate: string;
  endDate?: string;
  courses?: string[];
}

interface Certificate {
  name: string;
  nameLang?: string;
  issuer: string;
  date: string;
}

interface Skill {
  name: string;
  keywords: string[];
}

interface Language {
  language: string;
  fluency: string;
}

interface VolunteerRole {
  position: string;
  organization: string;
  startDate: string;
  endDate?: string;
  summary?: string;
}

interface Profile {
  network: string;
  url: string;
}

interface CV {
  basics: {
    name: string;
    label: string;
    url: string;
    location: { city: string };
    profiles: Profile[];
  };
  work: Job[];
  education: Education[];
  certificates: Certificate[];
  skills: Skill[];
  languages: Language[];
  volunteer?: VolunteerRole[];
}

import { formatDate } from './format-date.js';

fetch('/cv.json')
  .then(response => response.ok ? response.json() as Promise<CV> : Promise.reject(response.status))
  .then(cv => render(cv))
  .catch(() => {
    document.getElementById('cv')!.innerHTML = '<p>Klarte ikke å hente CV-data.</p>';
  });

function render(cv: CV): void {
  const { basics, work, education, certificates, skills, languages, volunteer } = cv;

  const section = (title: string, html: string) =>
    `<section><h2>${title}</h2>${html}</section>`;

  const time = (dateString: string | undefined) => dateString
    ? `<time datetime="${dateString}">${formatDate(dateString)}</time>`
    : 'nåtid';

  const header = `
    <hgroup>
      <h1>${basics.name}</h1>
      <p>${basics.label}</p>
    </hgroup>
    <p>
      ${basics.location.city} ·
      <a href="${basics.url}" rel="noopener">${basics.url.replace('https://', '')}</a> ·
      ${basics.profiles.map(profile => `<a href="${profile.url}" rel="noopener">${profile.network}</a>`).join(' · ')}
    </p>`;

  // Highlights are { text, url? } objects. Plain strings are also accepted for
  // forward-compatibility with the standard JSON Resume schema.
  const renderHighlight = (highlight: Highlight | string) => {
    if (typeof highlight === 'string') return highlight;
    return highlight.url
      ? `<a href="${highlight.url}" rel="noopener">${highlight.text}</a>`
      : highlight.text;
  };

  const workHtml = work.map(job => `
    <article>
      <h3>${job.position} i ${job.url ? `<a href="${job.url}" rel="noopener">${job.name}</a>` : job.name}</h3>
      <p>${time(job.startDate)} – ${time(job.endDate)}</p>
      ${job.summary ? `<p>${job.summary}</p>` : ''}
      ${job.highlights?.length ? `<p>${job.highlights.map(renderHighlight).join(', ')}</p>` : ''}
    </article>`).join('');

  const educationHtml = education.map(entry => {
    // areaLang is a custom field: BCP 47 tag for the area when it differs from
    // the page language (no), so screen readers pronounce it correctly.
    const area = entry.areaLang ? `<span lang="${entry.areaLang}">${entry.area}</span>` : entry.area;
    const institution = entry.url ? `<a href="${entry.url}" rel="noopener">${entry.institution}</a>` : entry.institution;
    return `
    <article>
      <h3>${entry.studyType} i ${area} ved ${institution}</h3>
      <p>${time(entry.startDate)} – ${time(entry.endDate)}</p>
      ${entry.courses?.length ? `<p>${entry.courses.join(', ')}</p>` : ''}
    </article>`;
  }).join('');

  const certificatesHtml = certificates.map(certificate => {
    // nameLang: same pattern as areaLang above.
    const name = certificate.nameLang ? `<span lang="${certificate.nameLang}">${certificate.name}</span>` : certificate.name;
    return `
    <article>
      <h3>${name} fra ${certificate.issuer}</h3>
      <p>${time(certificate.date)}</p>
    </article>`;
  }).join('');

  const skillsHtml = `<dl>
    ${skills.map(skill => `
      <dt>${skill.name}</dt>
      <dd>${skill.keywords.join(', ')}</dd>`).join('')}
  </dl>`;

  const languagesHtml = `<dl>
    ${languages.map(language => `
      <dt>${language.language}</dt>
      <dd>${language.fluency}</dd>`).join('')}
  </dl>`;

  const volunteerHtml = volunteer?.map(role => `
    <article>
      <h3>${role.position} hos ${role.organization}</h3>
      <p>${time(role.startDate)} – ${time(role.endDate)}</p>
      ${role.summary ? `<p>${role.summary}</p>` : ''}
    </article>`).join('') ?? '';

  document.getElementById('cv')!.innerHTML = `
    ${header}
    <button onclick="window.print()">Last ned som PDF</button>
    ${section('Erfaring', workHtml)}
    ${section('Utdanning', educationHtml)}
    ${section('Sertifiseringer', certificatesHtml)}
    ${section('Ferdigheter', skillsHtml)}
    ${section('Språk', languagesHtml)}
    ${volunteerHtml ? section('Frivillig arbeid', volunteerHtml) : ''}`;

  document.title = `CV — ${basics.name}`;
}
