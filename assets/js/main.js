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
  { date: '2025-09-02', displayDate: 'September', title: 'Zeitstreifen-Platzhalter 1', category: 'Platzhalter', description: 'Hier folgt später ein Meilenstein für den Materialpool.' },
  { date: '2025-10-10', displayDate: 'Oktober', title: 'Zeitstreifen-Platzhalter 2', category: 'Platzhalter', description: 'Platzhalter-Text für eine künftige Aktion oder einen Termin.' },
  { date: '2025-11-18', displayDate: 'November', title: 'Zeitstreifen-Platzhalter 3', category: 'Platzhalter', description: 'Weitere Details werden ergänzt, sobald die Planung steht.' },
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

const subjectPage = document.querySelector('[data-subject-page]');
if(subjectPage){
  const subject = subjectPage.dataset.subject;
  const videoHost = subjectPage.querySelector('[data-subject-video]');
  const gradeHost = subjectPage.querySelector('[data-subject-grade]');
  const materialsHost = subjectPage.querySelector('[data-subject-materials]');

  const loadJSON = (path) => fetch(path).then((response) => response.json());

  Promise.all([
    loadJSON('data/videos.json'),
    loadJSON('data/grades.json'),
    loadJSON('data/materials.json'),
  ])
    .then(([videos, grades, materials]) => {
      const video = videos.find((item) => item.subject === subject);
      const grade = grades.find((item) => item.subject === subject);
      const subjectMaterials = materials.filter((item) => item.subject === subject);

      if(videoHost){
        if(video){
          videoHost.innerHTML = `
            <div class="framed-video">
              <iframe src="${video.url}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>
            <p class="desc">${video.description}</p>
          `;
        } else {
          videoHost.innerHTML = '<p class="desc">Video-Platzhalter wird später ergänzt.</p>';
        }
      }

      if(gradeHost){
        gradeHost.innerHTML = `
          <div class="subject-grade">
            <span class="grade-pill">Ø ${grade ? grade.average : '—'}</span>
            <div>
              <h3>Notenschnitt</h3>
              <p>${grade ? grade.note : 'Platzhalter für den Notendurchschnitt.'}</p>
            </div>
          </div>
        `;
      }

      if(materialsHost){
        if(subjectMaterials.length){
          materialsHost.innerHTML = subjectMaterials.map((item) => `
            <article class="card subject-card">
              <span class="timeline-tag">${item.type}</span>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <a href="${item.link}">Platzhalter-Link</a>
            </article>
          `).join('');
        } else {
          materialsHost.innerHTML = '<p class="desc">Weitere Lerninhalte werden später ergänzt.</p>';
        }
      }
    })
    .catch(() => {
      if(videoHost){
        videoHost.innerHTML = '<p class="desc">Video-Platzhalter wird später ergänzt.</p>';
      }
      if(gradeHost){
        gradeHost.innerHTML = '<p class="desc">Platzhalter für den Notendurchschnitt.</p>';
      }
      if(materialsHost){
        materialsHost.innerHTML = '<p class="desc">Weitere Lerninhalte werden später ergänzt.</p>';
      }
    });
}
