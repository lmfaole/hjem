fetch('/cv.json')
  .then(r => r.ok ? r.json() : Promise.reject(r.status))
  .then(cv => render(cv))
  .catch(() => {
    document.getElementById('cv').innerHTML = '<p>Klarte ikke å hente CV-data.</p>';
  });

function fmtDate(str) {
  if (!str) return 'nåtid';
  const [year, month] = str.split('-');
  if (!month) return year;
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' });
}

function render(cv) {
  const { basics, work, education, certificates, skills, languages, volunteer } = cv;

  const section = (title, html) =>
    `<section><h2>${title}</h2>${html}</section>`;

  const time = (str) => str
    ? `<time datetime="${str}">${fmtDate(str)}</time>`
    : 'nåtid';

  const header = `
    <hgroup>
      <h1>${basics.name}</h1>
      <p>${basics.label}</p>
    </hgroup>
    <p>
      ${basics.location.city} ·
      <a href="${basics.url}" rel="noopener">${basics.url.replace('https://', '')}</a> ·
      ${basics.profiles.map(p => `<a href="${p.url}" rel="noopener">${p.network}</a>`).join(' · ')}
    </p>`;

  const highlight = h => h.url
    ? `<a href="${h.url}" rel="noopener">${h.text}</a>`
    : h.text ?? h;

  const workHtml = work.map(job => `
    <article>
      <h3>${job.position} i ${job.url ? `<a href="${job.url}" rel="noopener">${job.name}</a>` : job.name}</h3>
      <p>${time(job.startDate)} – ${time(job.endDate)}</p>
      ${job.summary ? `<p>${job.summary}</p>` : ''}
      ${job.highlights?.length ? `<p>${job.highlights.map(highlight).join(', ')}</p>` : ''}
    </article>`).join('');

  const eduHtml = education.map(e => {
    const area = e.areaLang ? `<span lang="${e.areaLang}">${e.area}</span>` : e.area;
    const inst = e.url ? `<a href="${e.url}" rel="noopener">${e.institution}</a>` : e.institution;
    return `
    <article>
      <h3>${e.studyType} i ${area} ved ${inst}</h3>
      <p>${time(e.startDate)} – ${time(e.endDate)}</p>
      ${e.courses?.length ? `<p>${e.courses.join(', ')}</p>` : ''}
    </article>`;
  }).join('');

  const certHtml = certificates.map(c => {
    const name = c.nameLang ? `<span lang="${c.nameLang}">${c.name}</span>` : c.name;
    return `
    <article>
      <h3>${name} fra ${c.issuer}</h3>
      <p>${time(c.date)}</p>
    </article>`;
  }).join('');

  const skillsHtml = `<dl>
    ${skills.map(s => `
      <dt>${s.name}</dt>
      <dd>${s.keywords.join(', ')}</dd>`).join('')}
  </dl>`;

  const langHtml = `<dl>
    ${languages.map(l => `
      <dt>${l.language}</dt>
      <dd>${l.fluency}</dd>`).join('')}
  </dl>`;

  const volunteerHtml = volunteer?.map(v => `
    <article>
      <h3>${v.position} hos ${v.organization}</h3>
      <p>${time(v.startDate)} – ${time(v.endDate)}</p>
      ${v.summary ? `<p>${v.summary}</p>` : ''}
    </article>`).join('') ?? '';

  document.getElementById('cv').innerHTML = `
    ${header}
    <button onclick="window.print()">Last ned som PDF</button>
    ${section('Erfaring', workHtml)}
    ${section('Utdanning', eduHtml)}
    ${section('Sertifiseringer', certHtml)}
    ${section('Ferdigheter', skillsHtml)}
    ${section('Språk', langHtml)}
    ${volunteerHtml ? section('Frivillig arbeid', volunteerHtml) : ''}`;

  document.title = `CV — ${basics.name}`;
}
