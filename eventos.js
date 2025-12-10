window.VENUE_DATA_PATH = window.VENUE_DATA_PATH || 'venue-data/';

// Detecta automaticamente se a URL atual está rodando em /site2026 (GitHub)
// ou direto na raiz do domínio (winnerstour.com.br)
const BASE_PATH = (function () {
  try {
    const path = window.location && window.location.pathname ? window.location.pathname : '';
    const match = path.match(/^\/(site2026)(\/|$)/);
    // Se a URL começa com /site2026/... usa esse prefixo
    return match ? '/' + match[1] : '';
  } catch (e) {
    return '';
  }
})();

function fixPath(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;          // URLs absolutas (http/https) não mexe
  if (path.startsWith(BASE_PATH + '/')) return path;      // já está com o prefixo certo
  if (path.startsWith('/')) return BASE_PATH + path;      // começa com / -> adiciona BASE_PATH se existir
  return BASE_PATH + '/' + path;                          // caminho relativo -> prefixa também
}



// Monta URL de busca no ComprarViagem para o hotel selecionado
function buildComprarViagemUrl({ destination, startDate, endDate, program }) {
  const baseUrl = 'https://comprarviagem.com.br/busca-avancada/api/busca-hotel#step-1';

  const params = new URLSearchParams();

  if (destination && destination.trim()) {
    params.set('destinationName', destination.trim());
  }

  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  params.set('rooms', JSON.stringify(program.roomsPayload || [{ numberOfAdults: 1, numberOfInfant: 0, numberOfChildren: 0, childAge: [], InfantAge: [] }]));
  params.set('currency', 'BRL');
  params.set('origin', 'BRCWB'); // Pode ser dynamicado no futuro, se desejarem
  params.set('destination', program.destinationCode || '');
  params.set('idEmpresa', program.idEmpresa || '');
  params.set('idIdioma', '1');
  params.set('idPerfil', program.idPerfil || '4'); // Padrão corporativo, se aplicável

  return `${baseUrl}&${params.toString()}`;
}

// Função para formatar datas em "DD MMM YYYY"
// com meses em português e o ano sempre visível
function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthsPt[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Função para formatar datas em "DD MMM"
// sem o ano (quando já estiver claro no contexto)
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthsPt[date.getMonth()];

  return `${day} ${month}`;
}

// Função para montar etiqueta de data (tipo "04–13 SET 2026")
// com a lógica de ano que você utiliza
function buildDateChip(startDate, endDate) {
  if (!startDate && !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) return '';
  if (isNaN(end.getTime())) return formatDateLong(startDate);

  // Mesmo mês e ano
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const startDay = String(start.getDate()).padStart(2, '0');
    const endDay = String(end.getDate()).padStart(2, '0');

    const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = monthsPt[start.getMonth()];
    const year = end.getFullYear();

    return `${startDay}–${endDay} ${month} ${year}`;
  }

  // Meses diferentes, mas mesmo ano
  if (start.getFullYear() === end.getFullYear()) {
    const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    const startDay = String(start.getDate()).padStart(2, '0');
    const startMonth = monthsPt[start.getMonth()];

    const endDay = String(end.getDate()).padStart(2, '0');
    const endMonth = monthsPt[end.getMonth()];

    const year = end.getFullYear();

    return `${startDay} ${startMonth}–${endDay} ${endMonth} ${year}`;
  }

  // Anos diferentes: exibe cada um com seu ano
  return `${formatDateLong(startDate)}–${formatDateLong(endDate)}`;
}

// Função auxiliar para data curta de chip horizontal (usada, por exemplo, nas listas)
function buildShortDateChip(startDate, endDate) {
  if (!startDate && !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) return '';
  if (isNaN(end.getTime())) return formatDateShort(startDate);

  const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = monthsPt[start.getMonth()];

  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = monthsPt[end.getMonth()];

  // Se for o mesmo mês, não repete o mês na primeira data
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}–${endDay} ${endMonth}`;
  }

  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

// ----------------------
//   CARREGAMENTO EVENTO
// ----------------------
document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const loading = document.getElementById('loading');
  const errorDiv =
    document.getElementById('articleError') ||
    document.getElementById('error');
  const pageTitle = document.getElementById('pageTitle');
  const faviconEl = document.getElementById('faviconEl');

  const heroTitleEl = document.getElementById('heroTitle');
  const heroSubtitleEl = document.getElementById('heroSubtitle');
  const heroChipEl = document.getElementById('heroChip');
  const heroCategoryEl = document.getElementById('heroCategory');
  const heroVenueEl = document.getElementById('heroVenue');
  const heroCityEl = document.getElementById('heroCity');
  const heroRegionEl = document.getElementById('heroRegion');
  const heroThemeEl = document.getElementById('heroTheme');
  const heroOverlayEl = document.getElementById('heroOverlay');

  const tagCategoryEl = document.getElementById('tagCategory');
  const tagThemeEl = document.getElementById('tagTheme');
  const tagAudienceEl = document.getElementById('tagAudience');
  const tagIndustryEl = document.getElementById('tagIndustry');
  const tagVenueEl = document.getElementById('tagVenue');

  const articleIntro = document.getElementById('articleIntro');
  const articleWhy = document.getElementById('articleWhy');
  const articleOption1 = document.getElementById('articleOption1');
  const articleOption2 = document.getElementById('articleOption2');
  const articleOption3 = document.getElementById('articleOption3');
  const articleChecklist = document.getElementById('articleChecklist');
  const articleConclusion = document.getElementById('articleConclusion');

  const heroImageEl = document.getElementById('heroImage');
  const cardImageEl = document.getElementById('cardImage');

  const chipOfficialDates = document.getElementById('chipOfficialDates');
  const chipMainVenue = document.getElementById('chipMainVenue');
  const chipMainCity = document.getElementById('chipMainCity');

  const chipArticleType = document.getElementById('chipArticleType');
  const chipArticleLevel = document.getElementById('chipArticleLevel');
  const chipArticleProfile = document.getElementById('chipArticleProfile');

  const heroBreadcrumbEvent = document.getElementById('heroBreadcrumbEvent');

  const chipOfficialBadge = document.getElementById('chipOfficialBadge');
  const chipFocusArea = document.getElementById('chipFocusArea');
  const chipLeadTime = document.getElementById('chipLeadTime');

  const ctaOption1Button = document.getElementById('ctaOption1Button');
  const ctaOption2Button = document.getElementById('ctaOption2Button');
  const ctaOption3Button = document.getElementById('ctaOption3Button');

  const ctaOption1Desc = document.getElementById('ctaOption1Desc');
  const ctaOption2Desc = document.getElementById('ctaOption2Desc');
  const ctaOption3Desc = document.getElementById('ctaOption3Desc');

  const officialProgramList = document.getElementById('officialProgramList');
  const officialProgramHeader = document.getElementById('officialProgramHeader');
  const officialProgramNotice = document.getElementById('officialProgramNotice');

  const chipOfficialBadgeSecondary = document.getElementById('chipOfficialBadgeSecondary');
  const chipProgramNeutralWarning = document.getElementById('chipProgramNeutralWarning');

  const noticeProgramScope = document.getElementById('noticeProgramScope');
  const noticeProgramScopeSecondary = document.getElementById('noticeProgramScopeSecondary');

  const heroProgramLabel = document.getElementById('heroProgramLabel');

  const btnAnchorIntro = document.getElementById('btnAnchorIntro');
  const btnAnchorWhy = document.getElementById('btnAnchorWhy');
  const btnAnchorOption1 = document.getElementById('btnAnchorOption1');
  const btnAnchorOption2 = document.getElementById('btnAnchorOption2');
  const btnAnchorOption3 = document.getElementById('btnAnchorOption3');
  const btnAnchorChecklist = document.getElementById('btnAnchorChecklist');
  const btnAnchorConclusion = document.getElementById('btnAnchorConclusion');
  const btnAnchorProgram = document.getElementById('btnAnchorProgram');

  const motivesCarouselEl = document.getElementById('motivesCarousel');
  const motivesCarouselWrapperEl = document.getElementById('motivesCarouselWrapper');

  const relatedListEl = document.getElementById('relatedList');

  const locationHeroVenue = document.getElementById('locationHeroVenue');
  const locationHeroAddress = document.getElementById('locationHeroAddress');
  const locationHeroCity = document.getElementById('locationHeroCity');
  const locationHeroRegion = document.getElementById('locationHeroRegion');
  const locationHeroCountry = document.getElementById('locationHeroCountry');

  const locationMapEmbed = document.getElementById('locationMapEmbed');
  const locationHowToGetThere = document.getElementById('locationHowToGetThere');

  const badgeEventPhase = document.getElementById('badgeEventPhase');
  const badgeBookingUrgency = document.getElementById('badgeBookingUrgency');

  const logisticsSummary = document.getElementById('logisticsSummary');
  const logisticsAirports = document.getElementById('logisticsAirports');
  const logisticsTransport = document.getElementById('logisticsTransport');
  const logisticsTrafficTips = document.getElementById('logisticsTrafficTips');
  const logisticsStayAreas = document.getElementById('logisticsStayAreas');
  const logisticsGroupTips = document.getElementById('logisticsGroupTips');

  const logisticsSuggestedAirports = document.getElementById('logisticsSuggestedAirports');
  const logisticsSuggestedTransport = document.getElementById('logisticsSuggestedTransport');
  const logisticsSuggestedLeadTime = document.getElementById('logisticsSuggestedLeadTime');

  const logisticsNoticeProgram = document.getElementById('logisticsNoticeProgram');
  const logisticsNoticeProgramSecondary = document.getElementById('logisticsNoticeProgramSecondary');

  const venueCapacityChip = document.getElementById('venueCapacityChip');
  const venueProfileChip = document.getElementById('venueProfileChip');
  const venueLocationChip = document.getElementById('venueLocationChip');

  const heroProgramSummary = document.getElementById('heroProgramSummary');
  const heroAudienceSummary = document.getElementById('heroAudienceSummary');

  const heroLeadTimeSummary = document.getElementById('heroLeadTimeSummary');
  const heroDecisionSummary = document.getElementById('heroDecisionSummary');

  const heroProgramOfficiality = document.getElementById('heroProgramOfficiality');

  const heroProgramPhase = document.getElementById('heroProgramPhase');
  const heroProgramStatus = document.getElementById('heroProgramStatus');
  const heroProgramNextSteps = document.getElementById('heroProgramNextSteps');

  const heroProgramUpdatedAt = document.getElementById('heroProgramUpdatedAt');

  const heroAudienceProfile = document.getElementById('heroAudienceProfile');
  const heroAudienceRegion = document.getElementById('heroAudienceRegion');

  const heroAudienceSeniority = document.getElementById('heroAudienceSeniority');
  const heroAudienceKeyRoles = document.getElementById('heroAudienceKeyRoles');
  const heroAudienceKeySegments = document.getElementById('heroAudienceKeySegments');

  const heroAudienceDecisionMakers = document.getElementById('heroAudienceDecisionMakers');
  const heroAudienceInfluencers = document.getElementById('heroAudienceInfluencers');

  const heroAudienceBuyingCycle = document.getElementById('heroAudienceBuyingCycle');

  const heroAudienceCompanySize = document.getElementById('heroAudienceCompanySize');

  const eventHeadline = document.getElementById('eventHeadline');
  const eventSubheadline = document.getElementById('eventSubheadline');

  const chipKeySegment = document.getElementById('chipKeySegment');
  const chipKeyDecisionArea = document.getElementById('chipKeyDecisionArea');

  const chipProgrammationStatus = document.getElementById('chipProgrammationStatus');

  const chipLeadTimeSimple = document.getElementById('chipLeadTimeSimple');
  const chipLeadTimeDetailed = document.getElementById('chipLeadTimeDetailed');

  const chipEdition = document.getElementById('chipEdition');
  const chipCityEdition = document.getElementById('chipCityEdition');

  const chipRegionEdition = document.getElementById('chipRegionEdition');
  const chipCountryEdition = document.getElementById('chipCountryEdition');

  const programTabs = document.querySelectorAll('[data-program-tab]');
  const programContents = document.querySelectorAll('[data-program-content]');

  const programOfficialTab = document.querySelector('[data-program-tab="official"]');
  const programSuggestedTab = document.querySelector('[data-program-tab="suggested"]');

  const programOfficialContent = document.querySelector('[data-program-content="official"]');
  const programSuggestedContent = document.querySelector('[data-program-content="suggested"]');

  if (errorDiv) errorDiv.hidden = true;
  if (loading) loading.hidden = false;

  try {
    const jsonPath = fixPath('/eventos/' + slug + '.json');
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error('Não foi possível carregar os dados do evento.');
    }

    const data = await response.json();

    if (pageTitle && data.meta && data.meta.pageTitle) {
      pageTitle.textContent = data.meta.pageTitle;
    } else if (pageTitle && data.title) {
      pageTitle.textContent = data.title + ' – WinnersTour';
    }

    if (faviconEl && data.meta && data.meta.favicon) {
      faviconEl.href = fixPath(data.meta.favicon);
    }

    if (heroTitleEl && data.title) {
      heroTitleEl.textContent = data.title;
    }

    if (heroSubtitleEl && data.subtitle) {
      heroSubtitleEl.textContent = data.subtitle;
    }

    if (heroChipEl && data.dates && data.dates.start && data.dates.end) {
      heroChipEl.textContent = buildDateChip(data.dates.start, data.dates.end);
    }

    if (heroCategoryEl && data.category) {
      heroCategoryEl.textContent = data.category;
    }

    if (heroVenueEl && data.venue && data.venue.name) {
      heroVenueEl.textContent = data.venue.name;
    }

    if (heroCityEl && data.venue && data.venue.city) {
      heroCityEl.textContent = data.venue.city;
    }

    if (heroRegionEl && data.venue && data.venue.region) {
      heroRegionEl.textContent = data.venue.region;
    }

    if (heroThemeEl && data.theme) {
      heroThemeEl.textContent = data.theme;
    }

    if (heroImageEl && data.heroImage) {
      heroImageEl.style.backgroundImage = `url('${fixPath(data.heroImage)}')`;
    }

    if (heroOverlayEl && data.heroOverlay) {
      heroOverlayEl.style.backgroundImage = `url('${fixPath(data.heroOverlay)}')`;
    }

    if (chipOfficialDates && data.dates && data.dates.start && data.dates.end) {
      chipOfficialDates.textContent = buildDateChip(data.dates.start, data.dates.end);
    }

    if (chipMainVenue && data.venue && data.venue.name) {
      chipMainVenue.textContent = data.venue.name;
    }

    if (chipMainCity && data.venue && data.venue.city) {
      chipMainCity.textContent = data.venue.city;
    }

    if (chipArticleType && data.article && data.article.type) {
      chipArticleType.textContent = data.article.type;
    }

    if (chipArticleLevel && data.article && data.article.level) {
      chipArticleLevel.textContent = data.article.level;
    }

    if (chipArticleProfile && data.article && data.article.profile) {
      chipArticleProfile.textContent = data.article.profile;
    }

    if (heroBreadcrumbEvent && data.title) {
      heroBreadcrumbEvent.textContent = data.title;
    }

    if (chipOfficialBadge && data.badges && data.badges.official) {
      chipOfficialBadge.textContent = data.badges.official;
    }

    if (chipFocusArea && data.badges && data.badges.focusArea) {
      chipFocusArea.textContent = data.badges.focusArea;
    }

    if (chipLeadTime && data.badges && data.badges.leadTime) {
      chipLeadTime.textContent = data.badges.leadTime;
    }

    if (tagCategoryEl && data.tags && data.tags.category) {
      tagCategoryEl.textContent = data.tags.category;
    }

    if (tagThemeEl && data.tags && data.tags.theme) {
      tagThemeEl.textContent = data.tags.theme;
    }

    if (tagAudienceEl && data.tags && data.tags.audience) {
      tagAudienceEl.textContent = data.tags.audience;
    }

    if (tagIndustryEl && data.tags && data.tags.industry) {
      tagIndustryEl.textContent = data.tags.industry;
    }

    if (tagVenueEl && data.tags && data.tags.venue) {
      tagVenueEl.textContent = data.tags.venue;
    }

    if (articleIntro && data.article && data.article.sections && data.article.sections.intro) {
      articleIntro.innerHTML = data.article.sections.intro;
    }

    if (articleWhy && data.article && data.article.sections && data.article.sections.why) {
      articleWhy.innerHTML = data.article.sections.why;
    }

    if (articleOption1 && data.article && data.article.sections && data.article.sections.option1) {
      articleOption1.innerHTML = data.article.sections.option1;
    }

    if (articleOption2 && data.article && data.article.sections && data.article.sections.option2) {
      articleOption2.innerHTML = data.article.sections.option2;
    }

    if (articleOption3 && data.article && data.article.sections && data.article.sections.option3) {
      articleOption3.innerHTML = data.article.sections.option3;
    }

    if (articleChecklist && data.article && data.article.sections && data.article.sections.checklist) {
      articleChecklist.innerHTML = data.article.sections.checklist;
    }

    if (articleConclusion && data.article && data.article.sections && data.article.sections.conclusion) {
      articleConclusion.innerHTML = data.article.sections.conclusion;
    }

    if (cardImageEl && data.cardImage) {
      cardImageEl.src = fixPath(data.cardImage);
      cardImageEl.alt = data.title || 'Evento';
    }

    if (chipOfficialBadgeSecondary && data.badges && data.badges.officialSecondary) {
      chipOfficialBadgeSecondary.textContent = data.badges.officialSecondary;
    }

    if (chipProgramNeutralWarning && data.program && data.program.neutralWarning) {
      chipProgramNeutralWarning.textContent = data.program.neutralWarning;
    }

    if (noticeProgramScope && data.program && data.program.scopeNotice) {
      noticeProgramScope.innerHTML = data.program.scopeNotice;
    }

    if (noticeProgramScopeSecondary && data.program && data.program.scopeNoticeSecondary) {
      noticeProgramScopeSecondary.innerHTML = data.program.scopeNoticeSecondary;
    }

    if (heroProgramLabel && data.program && data.program.label) {
      heroProgramLabel.textContent = data.program.label;
    }

    if (btnAnchorIntro && data.anchors && data.anchors.intro) {
      btnAnchorIntro.textContent = data.anchors.intro.label;
      btnAnchorIntro.href = data.anchors.intro.href;
    }

    if (btnAnchorWhy && data.anchors && data.anchors.why) {
      btnAnchorWhy.textContent = data.anchors.why.label;
      btnAnchorWhy.href = data.anchors.why.href;
    }

    if (btnAnchorOption1 && data.anchors && data.anchors.option1) {
      btnAnchorOption1.textContent = data.anchors.option1.label;
      btnAnchorOption1.href = data.anchors.option1.href;
    }

    if (btnAnchorOption2 && data.anchors && data.anchors.option2) {
      btnAnchorOption2.textContent = data.anchors.option2.label;
      btnAnchorOption2.href = data.anchors.option2.href;
    }

    if (btnAnchorOption3 && data.anchors && data.anchors.option3) {
      btnAnchorOption3.textContent = data.anchors.option3.label;
      btnAnchorOption3.href = data.anchors.option3.href;
    }

    if (btnAnchorChecklist && data.anchors && data.anchors.checklist) {
      btnAnchorChecklist.textContent = data.anchors.checklist.label;
      btnAnchorChecklist.href = data.anchors.checklist.href;
    }

    if (btnAnchorConclusion && data.anchors && data.anchors.conclusion) {
      btnAnchorConclusion.textContent = data.anchors.conclusion.label;
      btnAnchorConclusion.href = data.anchors.conclusion.href;
    }

    if (btnAnchorProgram && data.anchors && data.anchors.program) {
      btnAnchorProgram.textContent = data.anchors.program.label;
      btnAnchorProgram.href = data.anchors.program.href;
    }

    if (officialProgramHeader && data.program && data.program.header) {
      officialProgramHeader.textContent = data.program.header;
    }

    if (officialProgramNotice && data.program && data.program.notice) {
      officialProgramNotice.innerHTML = data.program.notice;
    }

    if (officialProgramList && data.program && data.program.days) {
      officialProgramList.innerHTML = '';
      data.program.days.forEach(day => {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'program-day';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'program-day-header';

        const dayTitle = document.createElement('h3');
        dayTitle.className = 'program-day-title';
        dayTitle.textContent = day.title;

        const dayChip = document.createElement('span');
        dayChip.className = 'program-day-chip';
        dayChip.textContent = day.date;

        dayHeader.appendChild(dayTitle);
        dayHeader.appendChild(dayChip);

        const daySessionsList = document.createElement('ul');
        daySessionsList.className = 'program-session-list';

        day.sessions.forEach(session => {
          const li = document.createElement('li');
          li.className = 'program-session';

          const timeSpan = document.createElement('span');
          timeSpan.className = 'program-session-time';
          timeSpan.textContent = session.time;

          const titleSpan = document.createElement('span');
          titleSpan.className = 'program-session-title';
          titleSpan.textContent = session.title;

          if (session.type) {
            const typeChip = document.createElement('span');
            typeChip.className = 'program-session-type';
            typeChip.textContent = session.type;
            li.appendChild(typeChip);
          }

          li.appendChild(timeSpan);
          li.appendChild(titleSpan);

          if (session.description) {
            const descSpan = document.createElement('span');
            descSpan.className = 'program-session-description';
            descSpan.textContent = session.description;
            li.appendChild(descSpan);
          }

          daySessionsList.appendChild(li);
        });

        dayContainer.appendChild(dayHeader);
        dayContainer.appendChild(daySessionsList);
        officialProgramList.appendChild(dayContainer);
      });
    }

    if (heroProgramSummary && data.program && data.program.summary) {
      heroProgramSummary.textContent = data.program.summary;
    }

    if (heroAudienceSummary && data.audience && data.audience.summary) {
      heroAudienceSummary.textContent = data.audience.summary;
    }

    if (heroLeadTimeSummary && data.logistics && data.logistics.leadTimeSummary) {
      heroLeadTimeSummary.textContent = data.logistics.leadTimeSummary;
    }

    if (heroDecisionSummary && data.logistics && data.logistics.decisionSummary) {
      heroDecisionSummary.textContent = data.logistics.decisionSummary;
    }

    if (heroProgramOfficiality && data.program && data.program.officiality) {
      heroProgramOfficiality.textContent = data.program.officiality;
    }

    if (heroProgramPhase && data.program && data.program.phase) {
      heroProgramPhase.textContent = data.program.phase;
    }

    if (heroProgramStatus && data.program && data.program.status) {
      heroProgramStatus.textContent = data.program.status;
    }

    if (heroProgramNextSteps && data.program && data.program.nextSteps) {
      heroProgramNextSteps.textContent = data.program.nextSteps;
    }

    if (heroProgramUpdatedAt && data.program && data.program.updatedAt) {
      heroProgramUpdatedAt.textContent = data.program.updatedAt;
    }

    if (heroAudienceProfile && data.audience && data.audience.profile) {
      heroAudienceProfile.textContent = data.audience.profile;
    }

    if (heroAudienceRegion && data.audience && data.audience.region) {
      heroAudienceRegion.textContent = data.audience.region;
    }

    if (heroAudienceSeniority && data.audience && data.audience.seniority) {
      heroAudienceSeniority.textContent = data.audience.seniority;
    }

    if (heroAudienceKeyRoles && data.audience && data.audience.keyRoles) {
      heroAudienceKeyRoles.textContent = data.audience.keyRoles;
    }

    if (heroAudienceKeySegments && data.audience && data.audience.keySegments) {
      heroAudienceKeySegments.textContent = data.audience.keySegments;
    }

    if (heroAudienceDecisionMakers && data.audience && data.audience.decisionMakers) {
      heroAudienceDecisionMakers.textContent = data.audience.decisionMakers;
    }

    if (heroAudienceInfluencers && data.audience && data.audience.influencers) {
      heroAudienceInfluencers.textContent = data.audience.influencers;
    }

    if (heroAudienceBuyingCycle && data.audience && data.audience.buyingCycle) {
      heroAudienceBuyingCycle.textContent = data.audience.buyingCycle;
    }

    if (heroAudienceCompanySize && data.audience && data.audience.companySize) {
      heroAudienceCompanySize.textContent = data.audience.companySize;
    }

    if (eventHeadline && data.article && data.article.headline) {
      eventHeadline.textContent = data.article.headline;
    }

    if (eventSubheadline && data.article && data.article.subheadline) {
      eventSubheadline.textContent = data.article.subheadline;
    }

    if (chipKeySegment && data.badges && data.badges.keySegment) {
      chipKeySegment.textContent = data.badges.keySegment;
    }

    if (chipKeyDecisionArea && data.badges && data.badges.keyDecisionArea) {
      chipKeyDecisionArea.textContent = data.badges.keyDecisionArea;
    }

    if (chipProgrammationStatus && data.badges && data.badges.programmationStatus) {
      chipProgrammationStatus.textContent = data.badges.programmationStatus;
    }

    if (chipLeadTimeSimple && data.badges && data.badges.leadTimeSimple) {
      chipLeadTimeSimple.textContent = data.badges.leadTimeSimple;
    }

    if (chipLeadTimeDetailed && data.badges && data.badges.leadTimeDetailed) {
      chipLeadTimeDetailed.textContent = data.badges.leadTimeDetailed;
    }

    if (chipEdition && data.badges && data.badges.edition) {
      chipEdition.textContent = data.badges.edition;
    }

    if (chipCityEdition && data.badges && data.badges.cityEdition) {
      chipCityEdition.textContent = data.badges.cityEdition;
    }

    if (chipRegionEdition && data.badges && data.badges.regionEdition) {
      chipRegionEdition.textContent = data.badges.regionEdition;
    }

    if (chipCountryEdition && data.badges && data.badges.countryEdition) {
      chipCountryEdition.textContent = data.badges.countryEdition;
    }

    if (programTabs && programTabs.length && programContents && programContents.length) {
      programTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-program-tab');

          programTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          programContents.forEach(content => {
            if (content.getAttribute('data-program-content') === target) {
              content.classList.add('active');
            } else {
              content.classList.remove('active');
            }
          });
        });
      });
    }

    if (programOfficialTab && programSuggestedTab && programOfficialContent && programSuggestedContent) {
      if (data.program && data.program.officialAvailable) {
        programOfficialTab.classList.remove('disabled');
        programSuggestedTab.classList.remove('active');
        programOfficialTab.classList.add('active');

        programOfficialContent.classList.add('active');
        programSuggestedContent.classList.remove('active');
      } else {
        programOfficialTab.classList.add('disabled');
        programSuggestedTab.classList.add('active');

        programOfficialContent.classList.remove('active');
        programSuggestedContent.classList.add('active');
      }
    }

    if (ctaOption1Button && data.ctas && data.ctas.option1) {
      ctaOption1Button.textContent = data.ctas.option1.label;
      ctaOption1Button.href = data.ctas.option1.href;
    }

    if (ctaOption2Button && data.ctas && data.ctas.option2) {
      ctaOption2Button.textContent = data.ctas.option2.label;
      ctaOption2Button.href = data.ctas.option2.href;
    }

    if (ctaOption3Button && data.ctas && data.ctas.option3) {
      ctaOption3Button.textContent = data.ctas.option3.label;
      ctaOption3Button.href = data.ctas.option3.href;
    }

    if (ctaOption1Desc && data.ctas && data.ctas.option1 && data.ctas.option1.description) {
      ctaOption1Desc.textContent = data.ctas.option1.description;
    }

    if (ctaOption2Desc && data.ctas && data.ctas.option2 && data.ctas.option2.description) {
      ctaOption2Desc.textContent = data.ctas.option2.description;
    }

    if (ctaOption3Desc && data.ctas && data.ctas.option3 && data.ctas.option3.description) {
      ctaOption3Desc.textContent = data.ctas.option3.description;
    }

    if (locationHeroVenue && data.venue && data.venue.name) {
      locationHeroVenue.textContent = data.venue.name;
    }

    if (locationHeroAddress && data.venue && data.venue.address) {
      locationHeroAddress.textContent = data.venue.address;
    }

    if (locationHeroCity && data.venue && data.venue.city) {
      locationHeroCity.textContent = data.venue.city;
    }

    if (locationHeroRegion && data.venue && data.venue.region) {
      locationHeroRegion.textContent = data.venue.region;
    }

    if (locationHeroCountry && data.venue && data.venue.country) {
      locationHeroCountry.textContent = data.venue.country;
    }

    if (locationMapEmbed && data.venue && data.venue.mapEmbed) {
      locationMapEmbed.innerHTML = data.venue.mapEmbed;
    }

    if (locationHowToGetThere && data.venue && data.venue.howToGetThere) {
      locationHowToGetThere.innerHTML = data.venue.howToGetThere;
    }

    if (badgeEventPhase && data.badges && data.badges.eventPhase) {
      badgeEventPhase.textContent = data.badges.eventPhase;
    }

    if (badgeBookingUrgency && data.badges && data.badges.bookingUrgency) {
      badgeBookingUrgency.textContent = data.badges.bookingUrgency;
    }

    if (logisticsSummary && data.logistics && data.logistics.summary) {
      logisticsSummary.innerHTML = data.logistics.summary;
    }

    if (logisticsAirports && data.logistics && data.logistics.airports) {
      logisticsAirports.innerHTML = data.logistics.airports;
    }

    if (logisticsTransport && data.logistics && data.logistics.transport) {
      logisticsTransport.innerHTML = data.logistics.transport;
    }

    if (logisticsTrafficTips && data.logistics && data.logistics.trafficTips) {
      logisticsTrafficTips.innerHTML = data.logistics.trafficTips;
    }

    if (logisticsStayAreas && data.logistics && data.logistics.stayAreas) {
      logisticsStayAreas.innerHTML = data.logistics.stayAreas;
    }

    if (logisticsGroupTips && data.logistics && data.logistics.groupTips) {
      logisticsGroupTips.innerHTML = data.logistics.groupTips;
    }

    if (logisticsSuggestedAirports && data.logistics && data.logistics.suggestedAirports) {
      logisticsSuggestedAirports.innerHTML = data.logistics.suggestedAirports;
    }

    if (logisticsSuggestedTransport && data.logistics && data.logistics.suggestedTransport) {
      logisticsSuggestedTransport.innerHTML = data.logistics.suggestedTransport;
    }

    if (logisticsSuggestedLeadTime && data.logistics && data.logistics.suggestedLeadTime) {
      logisticsSuggestedLeadTime.innerHTML = data.logistics.suggestedLeadTime;
    }

    if (logisticsNoticeProgram && data.logistics && data.logistics.noticeProgram) {
      logisticsNoticeProgram.innerHTML = data.logistics.noticeProgram;
    }

    if (logisticsNoticeProgramSecondary && data.logistics && data.logistics.noticeProgramSecondary) {
      logisticsNoticeProgramSecondary.innerHTML = data.logistics.noticeProgramSecondary;
    }

    if (venueCapacityChip && data.venue && data.venue.capacityChip) {
      venueCapacityChip.textContent = data.venue.capacityChip;
    }

    if (venueProfileChip && data.venue && data.venue.profileChip) {
      venueProfileChip.textContent = data.venue.profileChip;
    }

    if (venueLocationChip && data.venue && data.venue.locationChip) {
      venueLocationChip.textContent = data.venue.locationChip;
    }

    if (motivesCarouselEl && data.motives && Array.isArray(data.motives) && data.motives.length) {
      motivesCarouselEl.innerHTML = '';
      data.motives.forEach(motive => {
        const card = document.createElement('article');
        card.className = 'motive-card';

        const badge = document.createElement('span');
        badge.className = 'motive-badge';
        badge.textContent = motive.badge || 'Motivo';

        const title = document.createElement('h3');
        title.className = 'motive-title';
        title.textContent = motive.title || '';

        const description = document.createElement('p');
        description.className = 'motive-description';
        description.innerHTML = motive.description || '';

        card.appendChild(badge);
        card.appendChild(title);
        card.appendChild(description);

        motivesCarouselEl.appendChild(card);
      });
    }

    if (relatedListEl && data.related && Array.isArray(data.related) && data.related.length) {
      relatedListEl.innerHTML = '';
      data.related.forEach(related => {
        const li = document.createElement('article');
        li.className = 'related-item';

        const link = document.createElement('a');
        link.href = 'evento.html?slug=' + encodeURIComponent(related.slug);
        link.className = 'related-link';

        const title = document.createElement('h3');
        title.className = 'related-title';
        title.textContent = related.title;

        const desc = document.createElement('p');
        desc.className = 'related-description';
        desc.textContent = related.description;

        const dateTag = document.createElement('span');
        dateTag.className = 'related-date';
        dateTag.textContent = buildShortDateChip(related.startDate, related.endDate);

        link.appendChild(title);
        link.appendChild(desc);
        link.appendChild(dateTag);

        li.appendChild(link);
        relatedListEl.appendChild(li);
      });
    }

    if (logisticsSuggestedLeadTime && data.logistics && data.logistics.suggestedLeadTime) {
      logisticsSuggestedLeadTime.innerHTML = data.logistics.suggestedLeadTime;
    }

    if (logisticsTrafficTips && data.logistics && data.logistics.trafficTips) {
      logisticsTrafficTips.innerHTML = data.logistics.trafficTips;
    }

    if (logisticsStayAreas && data.logistics && data.logistics.stayAreas) {
      logisticsStayAreas.innerHTML = data.logistics.stayAreas;
    }

    if (logisticsGroupTips && data.logistics && data.logistics.groupTips) {
      logisticsGroupTips.innerHTML = data.logistics.groupTips;
    }

    if (logisticsSuggestedAirports && data.logistics && data.logistics.suggestedAirports) {
      logisticsSuggestedAirports.innerHTML = data.logistics.suggestedAirports;
    }

    if (logisticsSuggestedTransport && data.logistics && data.logistics.suggestedTransport) {
      logisticsSuggestedTransport.innerHTML = data.logistics.suggestedTransport;
    }

    if (logisticsNoticeProgram && data.logistics && data.logistics.noticeProgram) {
      logisticsNoticeProgram.innerHTML = data.logistics.noticeProgram;
    }

    if (logisticsNoticeProgramSecondary && data.logistics && data.logistics.noticeProgramSecondary) {
      logisticsNoticeProgramSecondary.innerHTML = data.logistics.noticeProgramSecondary;
    }

    if (heroLeadTimeSummary && data.logistics && data.logistics.leadTimeSummary) {
      heroLeadTimeSummary.textContent = data.logistics.leadTimeSummary;
    }

    if (heroDecisionSummary && data.logistics && data.logistics.decisionSummary) {
      heroDecisionSummary.textContent = data.logistics.decisionSummary;
    }

    if (heroProgramOfficiality && data.program && data.program.officiality) {
      heroProgramOfficiality.textContent = data.program.officiality;
    }

    if (heroProgramPhase && data.program && data.program.phase) {
      heroProgramPhase.textContent = data.program.phase;
    }

    if (heroProgramStatus && data.program && data.program.status) {
      heroProgramStatus.textContent = data.program.status;
    }

    if (heroProgramNextSteps && data.program && data.program.nextSteps) {
      heroProgramNextSteps.textContent = data.program.nextSteps;
    }

    if (heroProgramUpdatedAt && data.program && data.program.updatedAt) {
      heroProgramUpdatedAt.textContent = data.program.updatedAt;
    }

    if (heroAudienceProfile && data.audience && data.audience.profile) {
      heroAudienceProfile.textContent = data.audience.profile;
    }

    if (heroAudienceRegion && data.audience && data.audience.region) {
      heroAudienceRegion.textContent = data.audience.region;
    }

    if (heroAudienceSeniority && data.audience && data.audience.seniority) {
      heroAudienceSeniority.textContent = data.audience.seniority;
    }

    if (heroAudienceKeyRoles && data.audience && data.audience.keyRoles) {
      heroAudienceKeyRoles.textContent = data.audience.keyRoles;
    }

    if (heroAudienceKeySegments && data.audience && data.audience.keySegments) {
      heroAudienceKeySegments.textContent = data.audience.keySegments;
    }

    if (heroAudienceDecisionMakers && data.audience && data.audience.decisionMakers) {
      heroAudienceDecisionMakers.textContent = data.audience.decisionMakers;
    }

    if (heroAudienceInfluencers && data.audience && data.audience.influencers) {
      heroAudienceInfluencers.textContent = data.audience.influencers;
    }

    if (heroAudienceBuyingCycle && data.audience && data.audience.buyingCycle) {
      heroAudienceBuyingCycle.textContent = data.audience.buyingCycle;
    }

    if (heroAudienceCompanySize && data.audience && data.audience.companySize) {
      heroAudienceCompanySize.textContent = data.audience.companySize;
    }

    if (eventHeadline && data.article && data.article.headline) {
      eventHeadline.textContent = data.article.headline;
    }

    if (eventSubheadline && data.article && data.article.subheadline) {
      eventSubheadline.textContent = data.article.subheadline;
    }

    if (chipKeySegment && data.badges && data.badges.keySegment) {
      chipKeySegment.textContent = data.badges.keySegment;
    }

    if (chipKeyDecisionArea && data.badges && data.badges.keyDecisionArea) {
      chipKeyDecisionArea.textContent = data.badges.keyDecisionArea;
    }

    if (chipProgrammationStatus && data.badges && data.badges.programmationStatus) {
      chipProgrammationStatus.textContent = data.badges.programmationStatus;
    }

    if (chipLeadTimeSimple && data.badges && data.badges.leadTimeSimple) {
      chipLeadTimeSimple.textContent = data.badges.leadTimeSimple;
    }

    if (chipLeadTimeDetailed && data.badges && data.badges.leadTimeDetailed) {
      chipLeadTimeDetailed.textContent = data.badges.leadTimeDetailed;
    }

    if (chipEdition && data.badges && data.badges.edition) {
      chipEdition.textContent = data.badges.edition;
    }

    if (chipCityEdition && data.badges && data.badges.cityEdition) {
      chipCityEdition.textContent = data.badges.cityEdition;
    }

    if (chipRegionEdition && data.badges && data.badges.regionEdition) {
      chipRegionEdition.textContent = data.badges.regionEdition;
    }

    if (chipCountryEdition && data.badges && data.badges.countryEdition) {
      chipCountryEdition.textContent = data.badges.countryEdition;
    }

    if (programTabs && programTabs.length && programContents && programContents.length) {
      programTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-program-tab');

          programTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          programContents.forEach(content => {
            if (content.getAttribute('data-program-content') === target) {
              content.classList.add('active');
            } else {
              content.classList.remove('active');
            }
          });
        });
      });
    }

    if (programOfficialTab && programSuggestedTab && programOfficialContent && programSuggestedContent) {
      if (data.program && data.program.officialAvailable) {
        programOfficialTab.classList.remove('disabled');
        programSuggestedTab.classList.remove('active');
        programOfficialTab.classList.add('active');

        programOfficialContent.classList.add('active');
        programSuggestedContent.classList.remove('active');
      } else {
        programOfficialTab.classList.add('disabled');
        programSuggestedTab.classList.add('active');

        programOfficialContent.classList.remove('active');
        programSuggestedContent.classList.add('active');
      }
    }

    if (ctaOption1Button && data.ctas && data.ctas.option1) {
      ctaOption1Button.textContent = data.ctas.option1.label;
      ctaOption1Button.href = data.ctas.option1.href;
    }

    if (ctaOption2Button && data.ctas && data.ctas.option2) {
      ctaOption2Button.textContent = data.ctas.option2.label;
      ctaOption2Button.href = data.ctas.option2.href;
    }

    if (ctaOption3Button && data.ctas && data.ctas.option3) {
      ctaOption3Button.textContent = data.ctas.option3.label;
      ctaOption3Button.href = data.ctas.option3.href;
    }

    if (ctaOption1Desc && data.ctas && data.ctas.option1 && data.ctas.option1.description) {
      ctaOption1Desc.textContent = data.ctas.option1.description;
    }

    if (ctaOption2Desc && data.ctas && data.ctas.option2 && data.ctas.option2.description) {
      ctaOption2Desc.textContent = data.ctas.option2.description;
    }

    if (ctaOption3Desc && data.ctas && data.ctas.option3 && data.ctas.option3.description) {
      ctaOption3Desc.textContent = data.ctas.option3.description;
    }

    if (locationHeroVenue && data.venue && data.venue.name) {
      locationHeroVenue.textContent = data.venue.name;
    }

    if (locationHeroAddress && data.venue && data.venue.address) {
      locationHeroAddress.textContent = data.venue.address;
    }

    if (locationHeroCity && data.venue && data.venue.city) {
      locationHeroCity.textContent = data.venue.city;
    }

    if (locationHeroRegion && data.venue && data.venue.region) {
      locationHeroRegion.textContent = data.venue.region;
    }

    if (locationHeroCountry && data.venue && data.venue.country) {
      locationHeroCountry.textContent = data.venue.country;
    }

    if (locationMapEmbed && data.venue && data.venue.mapEmbed) {
      locationMapEmbed.innerHTML = data.venue.mapEmbed;
    }

    if (locationHowToGetThere && data.venue && data.venue.howToGetThere) {
      locationHowToGetThere.innerHTML = data.venue.howToGetThere;
    }

    if (badgeEventPhase && data.badges && data.badges.eventPhase) {
      badgeEventPhase.textContent = data.badges.eventPhase;
    }

    if (badgeBookingUrgency && data.badges && data.badges.bookingUrgency) {
      badgeBookingUrgency.textContent = data.badges.bookingUrgency;
    }

    if (logisticsSummary && data.logistics && data.logistics.summary) {
      logisticsSummary.innerHTML = data.logistics.summary;
    }

    if (logisticsAirports && data.logistics && data.logistics.airports) {
      logisticsAirports.innerHTML = data.logistics.airports;
    }

    if (logisticsTransport && data.logistics && data.logistics.transport) {
      logisticsTransport.innerHTML = data.logistics.transport;
    }

    if (logisticsTrafficTips && data.logistics && data.logistics.trafficTips) {
      logisticsTrafficTips.innerHTML = data.logistics.trafficTips;
    }

    if (logisticsStayAreas && data.logistics && data.logistics.stayAreas) {
      logisticsStayAreas.innerHTML = data.logistics.stayAreas;
    }

    if (logisticsGroupTips && data.logistics && data.logistics.groupTips) {
      logisticsGroupTips.innerHTML = data.logistics.groupTips;
    }

    if (logisticsSuggestedAirports && data.logistics && data.logistics.suggestedAirports) {
      logisticsSuggestedAirports.innerHTML = data.logistics.suggestedAirports;
    }

    if (logisticsSuggestedTransport && data.logistics && data.logistics.suggestedTransport) {
      logisticsSuggestedTransport.innerHTML = data.logistics.suggestedTransport;
    }

    if (logisticsSuggestedLeadTime && data.logistics && data.logistics.suggestedLeadTime) {
      logisticsSuggestedLeadTime.innerHTML = data.logistics.suggestedLeadTime;
    }

    if (logisticsNoticeProgram && data.logistics && data.logistics.noticeProgram) {
      logisticsNoticeProgram.innerHTML = data.logistics.noticeProgram;
    }

    if (logisticsNoticeProgramSecondary && data.logistics && data.logistics.noticeProgramSecondary) {
      logisticsNoticeProgramSecondary.innerHTML = data.logistics.noticeProgramSecondary;
    }

    const motivesContainer = document.getElementById('motivosContainer');
    const motivesWrapperEl = document.getElementById('motivosWrapper');

    if (motivesContainer && motivesWrapperEl && data.motives && Array.isArray(data.motives) && data.motives.length) {
      motivesContainer.innerHTML = '';
      motivesWrapperEl.innerHTML = '';

      const titleEl = document.createElement('h2');
      titleEl.className = 'section-title';
      titleEl.textContent = 'Principais motivos para estar neste evento';

      motivesWrapperEl.appendChild(titleEl);

      const carouselWrapper = document.createElement('div');
      carouselWrapper.className = 'carousel-wrapper';

      const carousel = document.createElement('div');
      carousel.className = 'carousel';
      carousel.id = 'motivesCarousel';

      data.motives.forEach(motive => {
        const card = document.createElement('article');
        card.className = 'motive-card';

        const badge = document.createElement('span');
        badge.className = 'motive-badge';
        badge.textContent = motive.badge || 'Motivo';

        const title = document.createElement('h3');
        title.className = 'motive-title';
        title.textContent = motive.title || '';

        const description = document.createElement('p');
        description.className = 'motive-description';
        description.innerHTML = motive.description || '';

        card.appendChild(badge);
        card.appendChild(title);
        card.appendChild(description);

        carousel.appendChild(card);
      });

      carouselWrapper.appendChild(carousel);

      const navPrev = document.createElement('button');
      navPrev.className = 'carousel-nav prev';
      navPrev.innerHTML = `
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6L8 12L14 18L15.41 16.58L10.83 12L15.41 7.41Z" /></svg>
      `;
      navPrev.addEventListener('click', () => {
        carousel.scrollBy({ left: -318, behavior: 'smooth' });
      });

      const navNext = document.createElement('button');
      navNext.className = 'carousel-nav next';
      navNext.innerHTML = `
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 7.41L10 6L16 12L10 18L8.59 16.58L13.17 12L8.59 7.41Z" /></svg>
      `;
      navNext.addEventListener('click', () => {
        carousel.scrollBy({ left: 318, behavior: 'smooth' });
      });

      carouselWrapper.appendChild(navPrev);
      carouselWrapper.appendChild(navNext);

      motivesWrapperEl.appendChild(carouselWrapper);

      initCarousel('motivesCarousel', 'motivesWrapper', true);
      attachDots('motivesCarousel', 'motivesWrapper');
    }

    if (loading) loading.hidden = true;
    if (errorDiv) errorDiv.hidden = true;
    const eventContent = document.getElementById('eventContent');
    if (eventContent) eventContent.hidden = false;
  } catch (err) {
    console.error(err);
    if (loading) loading.hidden = true;
    renderError(err.message);
  }
});

// Inicializa carrossel horizontal genérico (arraste)
function initCarousel(carouselId, wrapperId, useButtons = false) {
  const carousel = document.getElementById(carouselId);
  const wrapper = document.getElementById(wrapperId);
  if (!carousel || !wrapper) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    carousel.classList.add('dragging');
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener('mouseleave', () => {
    isDown = false;
    carousel.classList.remove('dragging');
  });

  carousel.addEventListener('mouseup', () => {
    isDown = false;
    carousel.classList.remove('dragging');
  });

  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1; // Ajuste de sensibilidade
    carousel.scrollLeft = scrollLeft - walk;
  });

  carousel.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener('touchend', () => {
    isDown = false;
  });

  carousel.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1;
    carousel.scrollLeft = scrollLeft - walk;
  });

  if (useButtons) {
    const prevButton = wrapper.querySelector('.carousel-nav.prev');
    const nextButton = wrapper.querySelector('.carousel-nav.next');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        carousel.scrollBy({ left: -318, behavior: 'smooth' });
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        carousel.scrollBy({ left: 318, behavior: 'smooth' });
      });
    }
  }
}

// Controles por bolinhas (dots) para carrosséis horizontais
function attachDots(carouselId, wrapperId) {
  const carousel = document.getElementById(carouselId);
  const wrapper = document.getElementById(wrapperId);
  if (!carousel || !wrapper) return;

  const slides = Array.from(carousel.children || []);
  if (!slides.length || slides.length === 1) return;

  let dotsContainer = wrapper.querySelector('.carousel-dots');
  if (!dotsContainer) {
    dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    wrapper.appendChild(dotsContainer);
  } else {
    dotsContainer.innerHTML = '';
  }

  const cardWidth = 318;
  const dots = [];

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      const target = index * cardWidth;
      carousel.scrollTo({ left: target, behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  const updateDots = () => {
    if (!dots.length) return;
    const index = Math.round(carousel.scrollLeft / cardWidth);
    dots.forEach((dot, i) => {
      if (i === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  };

  carousel.addEventListener('scroll', updateDots);
  updateDots();
}

// Exibe mensagens de erro de forma amigável na página de evento
function renderError(message) {
  const target =
    document.getElementById('articleError') ||
    document.getElementById('error');

  if (!target) {
    console.error('Erro ao carregar dados do evento:', message);
    return;
  }

  const text =
    message ||
    'Não foi possível carregar as informações deste evento. ' +
    'Tente novamente mais tarde ou fale com nossa equipe.';

  target.innerHTML =
    '<div class="error-box">' + text + '</div>';
}
