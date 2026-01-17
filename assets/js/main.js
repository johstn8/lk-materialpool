// Navigation toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('navlinks');
const navAnchors = navLinks?.querySelectorAll('a');
const headerEl = document.querySelector('header');
const subjectStrip = document.querySelector('.subject-strip');
const subjectStripLabel = subjectStrip?.querySelector('.subject-strip__label');

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

const setHeaderHeight = () => {
  if(!headerEl){
    return 0;
  }
  const height = headerEl.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height', `${height}px`);
  return height;
};

const setSubjectStripMetrics = () => {
  if(!subjectStrip){
    return { labelHeight: 0, stripHeight: 0, collapsedHeight: 0 };
  }
  const wasCollapsed = subjectStrip.classList.contains('is-collapsed');
  if(wasCollapsed){
    subjectStrip.classList.remove('is-collapsed');
  }
  const labelHeight = subjectStripLabel?.getBoundingClientRect().height ?? 0;
  const stripHeight = subjectStrip.getBoundingClientRect().height;
  const collapsedHeight = Math.max(0, stripHeight - labelHeight);
  document.documentElement.style.setProperty('--subject-strip-height', `${stripHeight}px`);
  document.documentElement.style.setProperty('--subject-strip-collapsed-height', `${collapsedHeight}px`);
  document.documentElement.style.setProperty('--subject-strip-label-height', `${labelHeight}px`);
  if(wasCollapsed){
    subjectStrip.classList.add('is-collapsed');
  }
  return { labelHeight, stripHeight, collapsedHeight };
};

const updateSubjectStripState = () => {
  if(!subjectStrip){
    return;
  }
  setHeaderHeight();
  const { labelHeight } = setSubjectStripMetrics();
  const collapseThreshold = Math.max(0, labelHeight);
  const isCollapsed = window.scrollY > collapseThreshold;
  subjectStrip.classList.toggle('is-collapsed', isCollapsed);
};

setHeaderHeight();
updateSubjectStripState();
window.addEventListener('resize', updateSubjectStripState);
window.addEventListener('scroll', updateSubjectStripState, { passive: true });

// Footer year
const yearEl = document.getElementById('year');
if(yearEl){
  yearEl.textContent = new Date().getFullYear();
}

const parseGermanFloat = (value) => Number.parseFloat(String(value).trim().replace(',', '.'));

const setupGradeCharts = () => {
  const plots = document.querySelectorAll('.grade-chart__plot');

  plots.forEach((plot) => {
    const minGrade = parseGermanFloat(plot.dataset.gradeMin ?? '7.7');
    const maxGrade = parseGermanFloat(plot.dataset.gradeMax ?? '10');
    const points = Array.from(plot.querySelectorAll('.grade-point'));
    if(points.length === 0){
      return;
    }

    const parsedPoints = points.map((point) => {
      const labelValue = point.querySelector('.grade-point__label strong')?.textContent;
      let gradeValue = Number.NaN;
      if(labelValue){
        gradeValue = parseGermanFloat(labelValue);
      }
      if(!Number.isFinite(gradeValue)){
        const inlineGrade = point.style.getPropertyValue('--grade');
        if(inlineGrade){
          gradeValue = Number.parseFloat(inlineGrade);
        }
      }
      if(!Number.isFinite(gradeValue)){
        gradeValue = minGrade;
      }

      if(gradeValue < minGrade || gradeValue > maxGrade){
        point.hidden = true;
        return { point, gradeValue, visible: false };
      }

      const pct = ((gradeValue - minGrade) / (maxGrade - minGrade)) * 100;
      point.hidden = false;
      point.style.setProperty('--grade-pct', `${pct}%`);

      return { point, gradeValue, visible: true };
    });

    parsedPoints
      .slice()
      .filter(({ visible }) => visible)
      .sort((a, b) => b.gradeValue - a.gradeValue)
      .forEach(({ point }) => plot.appendChild(point));
  });
};

if(document.querySelector('.grade-chart__plot')){
  setupGradeCharts();
}

const subjectPillsContainers = document.querySelectorAll('.subject-pills');
subjectPillsContainers.forEach((container) => {
  const pills = Array.from(container.querySelectorAll('.subject-pill'));
  if(pills.length === 0){
    return;
  }

  const MIN_PILL_PADDING = 6;
  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'subject-pill subject-pill--more';
  prevButton.textContent = '...';
  prevButton.setAttribute('aria-label', 'Vorherige Fächer');

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'subject-pill subject-pill--more';
  nextButton.textContent = '...';
  nextButton.setAttribute('aria-label', 'Weitere Fächer');

  let pages = [];
  let currentPage = 0;

  const measureTextWidths = () => {
    const previousPadding = container.style.getPropertyValue('--pill-padding');
    container.style.setProperty('--pill-padding', '0px');
    const widths = pills.map((pill) => pill.getBoundingClientRect().width);
    if(previousPadding){
      container.style.setProperty('--pill-padding', previousPadding);
    } else {
      container.style.removeProperty('--pill-padding');
    }
    return widths;
  };

  const updatePillPadding = () => {
    const availableWidth = container.clientWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 0;
    const textWidths = measureTextWidths();
    const totalTextWidth = textWidths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, textWidths.length - 1);
    let padding = Math.floor((availableWidth - totalTextWidth) / (2 * textWidths.length));
    if(!Number.isFinite(padding)){
      padding = MIN_PILL_PADDING;
    }
    padding = Math.max(MIN_PILL_PADDING, padding);
    container.style.setProperty('--pill-padding', `${padding}px`);
  };

  const measureButtonWidth = () => {
    if(!container.contains(nextButton)){
      nextButton.hidden = false;
      nextButton.style.position = 'absolute';
      nextButton.style.visibility = 'hidden';
      container.append(nextButton);
    }
    const width = nextButton.getBoundingClientRect().width;
    nextButton.remove();
    nextButton.style.position = '';
    nextButton.style.visibility = '';
    return width;
  };

  const buildPages = () => {
    const availableWidth = container.clientWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 0;
    const moreWidth = measureButtonWidth();
    const pillWidths = pills.map((pill) => {
      pill.hidden = false;
      return pill.getBoundingClientRect().width;
    });
    const totalWidth = pillWidths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, pillWidths.length - 1);
    if(totalWidth <= availableWidth){
      pages = [pills];
      return;
    }

    pages = [];
    let index = 0;
    while(index < pills.length){
      const needsPrev = pages.length > 0;
      const reservePrev = needsPrev ? moreWidth + gap : 0;
      const available = availableWidth - reservePrev;
      let page = [];
      let used = 0;

      while(index < pills.length){
        const width = pillWidths[index];
        const nextGap = page.length > 0 ? gap : 0;
        if(used + nextGap + width <= available){
          page.push(pills[index]);
          used += nextGap + width;
          index += 1;
        } else {
          break;
        }
      }

      if(index < pills.length){
        const needsNext = true;
        const reserveNext = needsNext ? moreWidth + (page.length > 0 ? gap : 0) : 0;
        while(page.length > 1 && used + reserveNext > available){
          index -= 1;
          const width = pillWidths[index];
          used -= width;
          if(page.length > 1){
            used -= gap;
          }
          page.pop();
        }
      }

      if(page.length === 0){
        page = [pills[index]];
        index += 1;
      }

      pages.push(page);
    }
  };

  const renderPage = () => {
    pills.forEach((pill) => {
      pill.hidden = true;
    });
    const totalPages = pages.length;
    if(totalPages <= 1){
      prevButton.remove();
      nextButton.remove();
      pills.forEach((pill) => {
        pill.hidden = false;
      });
      return;
    }

    pages[currentPage].forEach((pill) => {
      pill.hidden = false;
    });

    if(currentPage > 0){
      if(!container.contains(prevButton)){
        container.prepend(prevButton);
      }
      prevButton.hidden = false;
    } else {
      prevButton.hidden = true;
      prevButton.remove();
    }

    if(currentPage < totalPages - 1){
      if(!container.contains(nextButton)){
        container.append(nextButton);
      }
      nextButton.hidden = false;
    } else {
      nextButton.hidden = true;
      nextButton.remove();
    }
  };

  const update = () => {
    updatePillPadding();
    buildPages();
    currentPage = Math.min(currentPage, pages.length - 1);
    renderPage();
  };

  prevButton.addEventListener('click', () => {
    currentPage = Math.max(0, currentPage - 1);
    renderPage();
  });

  nextButton.addEventListener('click', () => {
    currentPage = Math.min(pages.length - 1, currentPage + 1);
    renderPage();
  });

  update();

  if('ResizeObserver' in window){
    const observer = new ResizeObserver(update);
    observer.observe(container);
  } else {
    window.addEventListener('resize', update);
  }
});

// Timeline data: maintain events here
const timelineEvents = [
  {
    date: '2025-01-12',
    displayDate: '12.–16.01.',
    title: 'Infos durch Herrn Ruge',
    category: 'Info',
    description: 'Herr Ruge informiert euch über die bevorstehende Leistungskurswahl.',
  },
  {
    date: '2025-01-16',
    displayDate: '16.01.',
    title: 'Upload LK-Materialpool',
    category: 'Erste Eindrücke',
    description: 'Der LK-Materialpool wird für euch zugänglich veröffentlicht.',
  },
  {
    date: '2025-02-16',
    displayDate: '16.02.',
    title: 'LK-Börse',
    category: 'Einblicke',
    description: 'Ihr könnt in vier verschiedene Leistungskurse für jeweils eine Stunde reinschauen.',
  },
  {
    date: '2025-02-18',
    displayDate: '18.02.',
    title: 'LK-Infomarkt',
    category: 'Austausch',
    description: 'Ihr könnt mit Schülerinnen und Schülern aus den jeweiligen LKs ins Gespräch gehen und Erfahrungen austauschen.',
  },
  {
    date: '2025-02-23',
    displayDate: '23.02.',
    title: 'LK-Wahl',
    category: 'Abgabe',
    description: 'Ihr gebt eure finale Kurswahl für die Oberstufe bei der Oberstufenkoordination ab.',
  },
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
}

// Dummy form submission: clear form and show confirmation
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    alert('Danke! Dein Formular wurde abgeschickt.');
  });
});

const excelLink = document.querySelector('[data-excel-link]');
if(excelLink){
  const source = excelLink.dataset.excelSource || excelLink.getAttribute('href');
  if(source){
    const absoluteUrl = new URL(source, window.location.href).toString();
    const excelOnlineUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`;
    excelLink.setAttribute('href', excelOnlineUrl);
    excelLink.setAttribute('target', '_blank');
    excelLink.setAttribute('rel', 'noopener');
    excelLink.removeAttribute('download');
  }
}

const loadJSON = (path) => fetch(path).then((response) => response.json());
const withHdVideoParams = (url) => {
  if(!url || (!url.includes('youtube.com/embed') && !url.includes('youtube-nocookie.com/embed'))){
    return url;
  }
  const sanitizedUrl = url.replace('https://www.youtube.com/embed', 'https://www.youtube-nocookie.com/embed');
  const parsed = new URL(sanitizedUrl, window.location.href);
  parsed.searchParams.set('vq', 'hd1080');
  parsed.searchParams.set('quality', 'hd1080');
  parsed.searchParams.set('hd', '1');
  parsed.searchParams.set('rel', '0');
  parsed.searchParams.set('modestbranding', '1');
  parsed.searchParams.set('showinfo', '0');
  parsed.searchParams.set('iv_load_policy', '3');
  parsed.searchParams.set('playsinline', '1');
  return parsed.toString();
};

const overviewPage = document.querySelector('[data-overview-page]');
if(overviewPage){
  const overviewType = overviewPage.dataset.overviewPage;
  const contentHost = overviewPage.querySelector('[data-overview-content]');

  const renderMaterialsBySubject = (materials, filter) => {
    const filtered = materials.filter(filter);
    const grouped = filtered.reduce((acc, item) => {
      acc[item.subject] = acc[item.subject] || [];
      acc[item.subject].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([subject, items]) => {
      const linksMarkup = items.map((item) => {
        if(item.links && item.links.length){
          return item.links.map((link) => `
            <a class="subject-modal__link" href="${link.url}" target="_blank" rel="noopener">
              <span>${link.title}</span>
              <span class="subject-modal__cta">Öffnen</span>
            </a>
          `).join('');
        }

        if(item.link){
          return `
            <a class="subject-modal__link" href="${item.link}" target="_blank" rel="noopener">
              <span>${item.title}</span>
              <span class="subject-modal__cta">Öffnen</span>
            </a>
          `;
        }

        return '';
      }).join('');

      return `
        <section class="overview-modal__group">
          <h3>${subject}</h3>
          <div class="subject-modal__links">
            ${linksMarkup}
          </div>
        </section>
      `;
    }).join('');
  };

  Promise.all([loadJSON('data/videos.json'), loadJSON('data/materials.json')])
    .then(([videos, materials]) => {
      if(!contentHost){
        return;
      }

      if(overviewType === 'videos'){
        const videoMarkup = videos.map((video) => {
          const description = video.description ? `<p>${video.description}</p>` : '';
          const media = video.url
            ? `
            <div class="framed-video">
              <iframe src="${withHdVideoParams(video.url)}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>
          `
            : `<p class="desc">${video.description || 'Video folgt.'}</p>`;

          return `
            <article class="overview-modal__video">
              <h3>${video.subject}</h3>
              ${media}
              ${video.url ? description : ''}
            </article>
          `;
        }).join('');
        contentHost.innerHTML = videoMarkup || '<p class="desc">Video-Platzhalter wird später ergänzt.</p>';
        return;
      }

      if(overviewType === 'klausuren'){
        const klausurenMarkup = renderMaterialsBySubject(materials, (item) => /klausur/i.test(item.type));
        contentHost.innerHTML = klausurenMarkup;
        return;
      }

      if(overviewType === 'abs'){
        const absMarkup = renderMaterialsBySubject(materials, (item) => /arbeitsblätter|aufgaben/i.test(item.type));
        contentHost.innerHTML = absMarkup;
      }
    })
    .catch(() => {
      if(contentHost){
        contentHost.innerHTML = '<p class="desc">Inhalte werden später ergänzt.</p>';
      }
    });
}

const subjectPage = document.querySelector('[data-subject-page]');
if(subjectPage){
  const subject = subjectPage.dataset.subject;
  const videoHost = subjectPage.querySelector('[data-subject-video]');
  const klausurenHost = subjectPage.querySelector('[data-subject-klausuren]');
  const assignmentsHost = subjectPage.querySelector('[data-subject-assignments]');
  const learningProductsHost = subjectPage.querySelector('[data-subject-learning-products]');
  const learningProductsTitle = subjectPage.querySelector('[data-learning-products-title]');
  const learningProductsDesc = subjectPage.querySelector('[data-learning-products-desc]');
  const learningProductsDivider = subjectPage.querySelector('[data-learning-products-divider]');
  const subjectSlug = subject ? subject.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'subject';

  Promise.all([
    loadJSON('data/videos.json'),
    loadJSON('data/materials.json'),
  ])
    .then(([videos, materials]) => {
      const video = videos.find((item) => item.subject === subject);
      const subjectMaterials = materials
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.subject === subject);
      const isKlausur = (item) => /klausur/i.test(item.type);
      const isAssignment = (item) => /arbeitsblätter|aufgaben/i.test(item.type);

      if(videoHost){
        if(video?.url){
          videoHost.innerHTML = `
            <div class="framed-video">
              <iframe src="${withHdVideoParams(video.url)}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>
          `;
        } else if(video){
          videoHost.innerHTML = `<p class="desc">${video.description || 'Video folgt.'}</p>`;
        } else {
          videoHost.innerHTML = '<p class="desc">Video-Platzhalter wird später ergänzt.</p>';
        }
      }

      const buildMaterialMarkup = ({ item, index }) => {
        if(item.links && item.links.length === 1 && isAssignment(item)){
          const link = item.links[0];
          const ctaLabel = item.modalCta || 'Arbeitsblatt öffnen';
          return `
            <a class="card subject-card subject-card--link" href="${link.url}" target="_blank" rel="noopener">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <span class="subject-card__cta">${ctaLabel}</span>
            </a>
          `;
        }

        if(item.links && item.links.length){
          const modalId = `material-modal-${subjectSlug}-${index}`;
          const linksClass = item.modalVariant === 'cards' ? 'subject-modal__link subject-modal__link--large' : 'subject-modal__link';
          const linksMarkup = item.links.map((link) => `
            <a class="${linksClass}" href="${link.url}" target="_blank" rel="noopener">
              <span>${link.title}</span>
              <span class="subject-modal__cta">Öffnen</span>
            </a>
          `).join('');
          const modalButtonCta = item.modalCta
            || (isAssignment(item) ? 'Arbeitsblätter auswählen' : isKlausur(item) ? 'Klausur auswählen' : 'Material öffnen');

          return `
            <button class="subject-card subject-card--button" type="button" data-modal-open="${modalId}">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <span class="subject-card__cta">${modalButtonCta}</span>
            </button>
            <div class="goal-overlay subject-modal" id="${modalId}" hidden>
              <div class="goal-overlay__card subject-modal__card" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
                <button class="goal-overlay__close" type="button" data-modal-close aria-label="Pop-up schließen">×</button>
                <div class="goal-overlay__body">
                  <h2 id="${modalId}-title">${item.title}</h2>
                  <p>${item.description}</p>
                  <div class="subject-modal__links${item.modalVariant === 'cards' ? ' subject-modal__links--cards' : ''}">
                    ${linksMarkup}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        if(item.link){
          return `
            <a class="card subject-card subject-card--link" href="${item.link}" target="_blank" rel="noopener">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <span class="subject-card__cta">Zum Öffnen klicken</span>
            </a>
          `;
        }

        return '';
      };

      const renderSection = (items, host, { hideParent = false } = {}) => {
        if(!host){
          return;
        }
        if(!items.length){
          host.innerHTML = '';
          host.setAttribute('hidden', '');
          if(hideParent){
            host.closest('.subject-materials-block')?.setAttribute('hidden', '');
          }
          return;
        }
        host.removeAttribute('hidden');
        host.innerHTML = items.map(buildMaterialMarkup).join('');
      };

      const klausuren = subjectMaterials.filter(({ item }) => isKlausur(item));
      const assignments = subjectMaterials.filter(({ item }) => isAssignment(item));
      const learningProducts = subjectMaterials.filter(({ item }) => !isKlausur(item) && !isAssignment(item));

      renderSection(klausuren, klausurenHost, { hideParent: true });
      renderSection(assignments, assignmentsHost, { hideParent: true });
      if(!learningProducts.length){
        learningProductsHost.innerHTML = '';
        learningProductsHost.setAttribute('hidden', '');
        learningProductsTitle?.setAttribute('hidden', '');
        learningProductsDesc?.setAttribute('hidden', '');
        learningProductsDivider?.setAttribute('hidden', '');
      } else {
        learningProductsHost.removeAttribute('hidden');
        learningProductsTitle?.removeAttribute('hidden');
        learningProductsDesc?.removeAttribute('hidden');
        learningProductsDivider?.removeAttribute('hidden');
        learningProductsHost.innerHTML = learningProducts.map(buildMaterialMarkup).join('');
      }

      const modalButtons = subjectPage.querySelectorAll('[data-modal-open]');
      const closeButtons = subjectPage.querySelectorAll('[data-modal-close]');
      const closeModal = (modal) => {
        if(!modal){
          return;
        }
        modal.setAttribute('hidden', '');
        document.body.classList.remove('is-modal-open');
      };
      const openModal = (modal) => {
        if(!modal){
          return;
        }
        modal.removeAttribute('hidden');
        document.body.classList.add('is-modal-open');
      };

      modalButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const modalId = button.getAttribute('data-modal-open');
          const modal = subjectPage.querySelector(`#${modalId}`);
          openModal(modal);
        });
      });

      closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const modal = button.closest('.subject-modal');
          closeModal(modal);
        });
      });

      const modals = subjectPage.querySelectorAll('.subject-modal');
      modals.forEach((modal) => {
        modal.addEventListener('click', (event) => {
          if(event.target === modal){
            closeModal(modal);
          }
        });
      });

      document.addEventListener('keydown', (event) => {
        if(event.key !== 'Escape'){
          return;
        }
        const activeModal = document.querySelector('.subject-modal:not([hidden])');
        if(activeModal){
          closeModal(activeModal);
        }
      });
    })
    .catch(() => {
      if(videoHost){
        videoHost.innerHTML = '<p class="desc">Video-Platzhalter wird später ergänzt.</p>';
      }
      if(klausurenHost){
        klausurenHost.innerHTML = '';
      }
      if(assignmentsHost){
        assignmentsHost.innerHTML = '';
      }
      if(learningProductsHost){
        learningProductsHost.innerHTML = '';
      }
    });
}
