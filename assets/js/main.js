// Navigation toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('navlinks');
const navAnchors = navLinks?.querySelectorAll('a');

if(navToggle && navLinks){
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

navAnchors?.forEach((link) => {
  link.addEventListener('click', () => {
    if(navLinks?.classList.contains('is-open')){
      navLinks.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Footer year
const yearEl = document.getElementById('year');
if(yearEl){
  yearEl.textContent = new Date().getFullYear();
}

// Timeline data: maintain events here
const timelineEvents = [
  { date: '2025-09-08', title: 'Schuljahresbeginn', category: 'Start', description: '' },
  { date: '2025-09-08', displayDate: '08.09. – 22.09.', title: 'Wahl der Klassen- und Jahrgangssprecher:innen', category: 'Wahlen', description: 'Gemeinsam habt ihr eure Klassen- und Jahrgangssprecher:innen gewählt – mit klaren Zuständigkeiten für die neuen Teams.' },
  { date: '2025-10-01', title: 'Wahl des Schülersprecher:innen-Teams', category: 'Wahlen', description: 'Mit eurer Mehrheit wurde das neue Schülersprecher:innen-Team gewählt – Danke für das Vertrauen!' },
  { date: '2025-10-07', title: '1. GSV', category: 'GSV', description: 'Auftakt der Gesamtschülervertretung, Sammeln eurer Themen für das Schuljahr.' },
  { date: '2025-10-20', title: 'Video über die Gremien an unserer Schule', category: 'Transparenz', description: 'Kurzes Erklärvideo zu GSV, Schulkonferenz und Fachkonferenzen – damit klar ist, wo ihr mitsprechen könnt.' },
  { date: '2025-11-14', title: 'YOLO-Party & Kultur-Dinner', category: 'Event', description: 'Gemeinsam mit dem Stadtteilzentrum Kladow und Raneem Hachim für Vielfalt: Party, Kultur-Dinner und eure Playlist.' },
  { date: '2025-11-17', title: '1. Schulkonferenz', category: 'Schulkonferenz', description: 'Erfolgreicher Antrag: Protokolle sollen zeitnah veröffentlicht werden, damit alle informiert bleiben.' },
  { date: '2025-11-29', title: 'Bestellung 2. Hygiene-Box', category: 'Hygiene', description: 'Wir haben die zweite Box bestellt, damit Hygieneartikel verlässlich an mehreren Standorten verfügbar sind.' },
  { date: '2025-12-05', displayDate: 'Dezember', title: 'Hygiene-Artikel & 1. Schulkonferenz', category: 'Hygiene', description: 'Weitere Box bestellt, kostenlose Hygieneartikel aufgefüllt und unser Schulkonferenz-Antrag zur Veröffentlichung der Protokolle angenommen.' },
  { date: '2025-12-08', displayDate: 'Dezember', title: 'Upload LK Materialpool', category: 'LK', description: 'Materialien zur Leistungskurswahl plus Notenrechner – alles an einem Ort für eure Entscheidung.' },
  { date: '2025-12-12', displayDate: 'Dezember', title: 'Schachturnier', category: 'Event', description: 'Turnier für die 5.–7. Klassen – Taktik, Teamgeist und faire Partien kurz vor den Ferien.' },
  { date: '2025-12-17', title: '2. GSV', category: 'GSV', description: 'Rückblick auf erste Maßnahmen und Planung weiterer Projekte.' },
  { date: '2026-02-10', displayDate: 'Februar 2026', title: 'Zwischenumfrage zur SV-Arbeit', category: 'Transparenz', description: 'Wir wollen Feedback: Was läuft gut, wo können wir nachsteuern? Deine Meinung entscheidet über die nächsten Schritte.' },
  { date: '2026-06-20', displayDate: 'Juni/Juli 2026', title: 'Fußballspiel', category: 'Sport', description: 'Geplantes Fußballspiel für mehrere Jahrgänge. Genauer Termin folgt.' },
];

const formatDate = (event) => event.displayDate ?? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(new Date(event.dateObj));

const scroller = document.querySelector('[data-timeline-scroller]');
const trackPast = document.querySelector('[data-track-past]');
const trackFuture = document.querySelector('[data-track-future]');
const todayMarker = document.querySelector('[data-today-marker]');
const eventsHost = document.querySelector('[data-timeline-events]');

if(eventsHost && scroller && trackPast && trackFuture && todayMarker){
  const now = new Date();
  const parsedEvents = timelineEvents
    .map((event) => ({ ...event, dateObj: new Date(event.date) }))
    .sort((a, b) => a.dateObj - b.dateObj)
    .map((event) => ({
      ...event,
      status: now.toDateString() === event.dateObj.toDateString() ? 'today' : now > event.dateObj ? 'past' : 'future',
    }));

  parsedEvents.forEach((event) => {
    const card = document.createElement('article');
    card.className = `timeline-card ${event.status}`;
    card.innerHTML = `
      <p class="timeline-date">${formatDate(event)}</p>
      <h3 class="timeline-title">${event.title}</h3>
      <p class="timeline-desc">${event.description}</p>
      <span class="timeline-tag" aria-hidden="true">${event.category}</span>
    `;
    eventsHost.appendChild(card);
  });

  const dates = parsedEvents.map((event) => event.dateObj.getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const timelineRange = Math.max(maxDate - minDate, 1);
  const eventPositions = parsedEvents.map((event) => ((event.dateObj - minDate) / timelineRange) * 100);

  let markerPercent = 0;
  if(now <= minDate){
    markerPercent = 0;
  } else if(now >= maxDate){
    markerPercent = 100;
  } else {
    const futureIndex = parsedEvents.findIndex((event) => now <= event.dateObj);
    const prevIndex = Math.max(0, futureIndex - 1);
    const nextIndex = futureIndex === -1 ? parsedEvents.length - 1 : futureIndex;
    const prevEvent = parsedEvents[prevIndex];
    const nextEvent = parsedEvents[nextIndex];
    const prevPos = eventPositions[prevIndex];
    const nextPos = eventPositions[nextIndex];

    if(now.toDateString() === nextEvent.dateObj.toDateString()){
      markerPercent = nextPos;
    } else {
      const span = Math.max(nextEvent.dateObj - prevEvent.dateObj, 1);
      const progress = Math.min(Math.max(now - prevEvent.dateObj, 0), span);
      const ratio = progress / span;
      markerPercent = prevPos + (nextPos - prevPos) * ratio;
    }
  }

  trackPast.style.width = `${markerPercent}%`;
  trackFuture.style.width = `${100 - markerPercent}%`;
  trackFuture.style.left = `${markerPercent}%`;
  todayMarker.style.left = `${markerPercent}%`;
  const todayLabel = todayMarker.querySelector('.today-label');
  if(todayLabel){
    todayLabel.textContent = 'Heute';
  }
}

// Dummy form submission: clear form and show confirmation
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    alert('Danke! Dein Formular wurde abgeschickt.');
  });
});
