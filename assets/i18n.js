/**
 * Marlo ERP - Internationalization (i18n) & Multi-Language Engine
 * Supports French, Arabic (with native RTL), English, Spanish, German.
 */

(function () {
  const SUPPORTED_LANGS = {
    fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    ar: { name: 'العربية', flag: '🇩🇿', dir: 'rtl' },
    en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
    es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
    de: { name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' }
  };

  let currentLang = localStorage.getItem('marlo:lang') || 'fr';
  let dictionaries = {};

  // Dictionnaires intégrés par défaut pour exécution instantanée (zéro latence)
  const PRELOADED_LOCALES = {
    fr: {
      "nav.workspace": "ESPACE DE TRAVAIL",
      "nav.studio": "STUDIO & GESTION",
      "nav.overview": "Vue d'ensemble",
      "nav.crm": "CRM & Ventes",
      "nav.tasks": "Tâches (Kanban)",
      "nav.projects": "Projets & Livrables",
      "nav.calendar": "Calendrier & Suites",
      "nav.team": "Équipe & Charge",
      "nav.budget": "Facturation & Devis",
      "nav.accounting": "Comptabilité Générale",
      "nav.purchases": "Achats & Fournisseurs",
      "nav.inventory": "Stocks & Inventaire",
      "nav.portal": "Portail Client & Signature",
      "nav.hr": "RH & Gestion des Congés",
      "nav.banking": "Trésorerie & Copilote IA",
      "nav.activity": "Fil d'activité",
      "nav.inbox": "Messagerie & Alertes",
      "nav.settings": "Paramètres",
      "common.new": "Nouveau",
      "common.search": "Rechercher...",
      "common.save": "Enregistrer",
      "common.cancel": "Annuler",
      "common.filter": "Filtrer",
      "common.language": "Langue",
      "common.currency": "Devise"
    },
    ar: {
      "nav.workspace": "مساحة العمل",
      "nav.studio": "إدارة المؤسسة",
      "nav.overview": "نظرة عامة",
      "nav.crm": "العملاء والمبيعات",
      "nav.tasks": "المهام (كانبان)",
      "nav.projects": "المشاريع والمخرجات",
      "nav.calendar": "التقويم والحجوزات",
      "nav.team": "فريق العمل والإنتاجية",
      "nav.budget": "الفواتير وعروض الأسعار",
      "nav.accounting": "المحاسبة العامة",
      "nav.purchases": "المشتريات والموردين",
      "nav.inventory": "المخزون والمستودعات",
      "nav.portal": "بوابة العملاء والتوقيع",
      "nav.hr": "الموارد البشرية والإجازات",
      "nav.banking": "الخزينة والذكاء الاصطناعي",
      "nav.activity": "سجل النشاطات",
      "nav.inbox": "صندوق الرسائل والتنبيهات",
      "nav.settings": "الإعدادات العامة",
      "common.new": "جديد",
      "common.search": "بحث...",
      "common.save": "حفظ",
      "common.cancel": "إلغاء",
      "common.filter": "تصفية",
      "common.language": "اللغة",
      "common.currency": "العملة"
    },
    en: {
      "nav.workspace": "WORKSPACE",
      "nav.studio": "STUDIO & OPERATIONS",
      "nav.overview": "Overview",
      "nav.crm": "CRM & Leads",
      "nav.tasks": "Tasks (Kanban)",
      "nav.projects": "Projects & Timeline",
      "nav.calendar": "Calendar & Suites",
      "nav.team": "Team & Workload",
      "nav.budget": "Invoices & Quotes",
      "nav.accounting": "General Accounting",
      "nav.purchases": "Purchases & Vendors",
      "nav.inventory": "Inventory & Stock",
      "nav.portal": "Client Portal & E-Sign",
      "nav.hr": "HR & Leave Management",
      "nav.banking": "Treasury & AI Copilot",
      "nav.activity": "Activity Feed",
      "nav.inbox": "Inbox & Alerts",
      "nav.settings": "Settings",
      "common.new": "New",
      "common.search": "Search...",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.filter": "Filter",
      "common.language": "Language",
      "common.currency": "Currency"
    },
    es: {
      "nav.workspace": "ESPACIO DE TRABAJO",
      "nav.studio": "GESTIÓN & ESTUDIO",
      "nav.overview": "Visión general",
      "nav.crm": "CRM & Ventas",
      "nav.tasks": "Tareas (Kanban)",
      "nav.projects": "Proyectos & Cronograma",
      "nav.calendar": "Calendario & Reservas",
      "nav.team": "Equipo & Capacidad",
      "nav.budget": "Facturación & Presupuestos",
      "nav.accounting": "Contabilidad General",
      "nav.purchases": "Compras & Proveedores",
      "nav.inventory": "Existencias & Inventario",
      "nav.portal": "Portal de Clientes & Firma",
      "nav.hr": "RRHH & Gestión de Permisos",
      "nav.banking": "Tesorería & Copiloto IA",
      "nav.activity": "Registro de Actividad",
      "nav.inbox": "Buzón de Mensajes",
      "nav.settings": "Ajustes",
      "common.new": "Nuevo",
      "common.search": "Buscar...",
      "common.save": "Guardar",
      "common.cancel": "Cancelar",
      "common.filter": "Filtrar",
      "common.language": "Idioma",
      "common.currency": "Moneda"
    },
    de: {
      "nav.workspace": "ARBEITSBEREICH",
      "nav.studio": "STUDIO & BETRIEB",
      "nav.overview": "Übersicht",
      "nav.crm": "CRM & Vertrieb",
      "nav.tasks": "Aufgaben (Kanban)",
      "nav.projects": "Projekte & Zeitplan",
      "nav.calendar": "Kalender & Suiten",
      "nav.team": "Team & Auslastung",
      "nav.budget": "Rechnungen & Angebote",
      "nav.accounting": "Buchhaltung",
      "nav.purchases": "Einkauf & Lieferanten",
      "nav.inventory": "Warenlager & Bestand",
      "nav.portal": "Kundenportal & E-Signatur",
      "nav.hr": "Personal & Urlaubsverwaltung",
      "nav.banking": "Liquidität & KI-Finanzassistent",
      "nav.activity": "Aktivitätsverlauf",
      "nav.inbox": "Posteingang & Benachrichtigungen",
      "nav.settings": "Einstellungen",
      "common.new": "Neu",
      "common.search": "Suchen...",
      "common.save": "Speichern",
      "common.cancel": "Abbrechen",
      "common.filter": "Filtern",
      "common.language": "Sprache",
      "common.currency": "Währung"
    }
  };

  dictionaries = PRELOADED_LOCALES;

  function t(key, fallback) {
    const dict = dictionaries[currentLang] || dictionaries.fr || {};
    return dict[key] || fallback || key;
  }

  function applyDirectionAndLocale(lang) {
    const info = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.fr;
    const isRtl = info.dir === 'rtl';

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', info.dir);

    if (isRtl) {
      document.documentElement.classList.add('is-rtl');
      document.body && document.body.classList.add('is-rtl');
    } else {
      document.documentElement.classList.remove('is-rtl');
      document.body && document.body.classList.remove('is-rtl');
    }

    // Traduction dynamique des éléments de navigation dans le DOM
    translateDom();

    // Mettre à jour l'intitulé du bouton sélecteur
    updateSelectorButton();
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS[lang]) return;
    currentLang = lang;
    localStorage.setItem('marlo:lang', lang);
    applyDirectionAndLocale(lang);

    window.dispatchEvent(new CustomEvent('marlo:language-changed', {
      detail: { lang, info: SUPPORTED_LANGS[lang] }
    }));
  }

  let isTranslating = false;
  function translateDom() {
    if (isTranslating) return;
    isTranslating = true;
    try {
      // 1. Navigation latérale (Sidebar items)
      const navMapping = [
        { href: '#/overview', key: 'nav.overview' },
        { href: '#/crm', key: 'nav.crm' },
        { href: '#/tasks', key: 'nav.tasks' },
        { href: '#/projects', key: 'nav.projects' },
        { href: '#/calendar', key: 'nav.calendar' },
        { href: '#/team', key: 'nav.team' },
        { href: '#/budget', key: 'nav.budget' },
        { href: '#/accounting', key: 'nav.accounting' },
        { href: '#/purchases', key: 'nav.purchases' },
        { href: '#/inventory', key: 'nav.inventory' },
        { href: '#/portal', key: 'nav.portal' },
        { href: '#/hr', key: 'nav.hr' },
        { href: '#/banking', key: 'nav.banking' },
        { href: '#/activity', key: 'nav.activity' },
        { href: '#/inbox', key: 'nav.inbox' },
        { href: '#/settings', key: 'nav.settings' }
      ];

      navMapping.forEach(item => {
        const link = document.querySelector(`.side nav.snav a[href="${item.href}"]`);
        if (link) {
          let labelSpan = link.querySelector('.snav__label');
          if (!labelSpan) {
            const childNodes = Array.from(link.childNodes);
            const textNode = childNodes.find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
            if (textNode) {
              labelSpan = document.createElement('span');
              labelSpan.className = 'snav__label';
              labelSpan.textContent = textNode.textContent.trim();
              link.replaceChild(labelSpan, textNode);
            }
          }
          if (labelSpan) {
            const translated = t(item.key, labelSpan.textContent);
            if (labelSpan.textContent !== translated) {
              labelSpan.textContent = translated;
            }
          }
        }
      });

      // 2. Sections de la sidebar
      const titles = document.querySelectorAll('.side nav.snav .snav__title');
      if (titles.length >= 2) {
        const wTitle = t('nav.workspace', 'ESPACE DE TRAVAIL');
        const sTitle = t('nav.studio', 'STUDIO');
        if (titles[0].textContent !== wTitle) titles[0].textContent = wTitle;
        if (titles[1].textContent !== sTitle) titles[1].textContent = sTitle;
      }
    } finally {
      isTranslating = false;
    }
  }

  function setupLanguageSwitcher() {
    const timer = setInterval(() => {
      // Find topbar or header container
      const topbarActions = document.querySelector('.topbar__actions') || document.querySelector('.topbar');
      const sideHead = document.querySelector('.side__head');

      const target = topbarActions || sideHead;
      if (target && !document.getElementById('marlo-lang-switcher')) {
        clearInterval(timer);
        renderSwitcherWidget(target, topbarActions ? 'topbar' : 'side');
      }
    }, 200);

    setTimeout(() => clearInterval(timer), 10000);
  }

  function updateSelectorButton() {
    const btn = document.getElementById('marlo-lang-btn');
    if (btn) {
      const info = SUPPORTED_LANGS[currentLang] || SUPPORTED_LANGS.fr;
      btn.innerHTML = `<span style="font-size:14px;">${info.flag}</span> <span style="font-size:11px; font-weight:700; text-transform:uppercase;">${currentLang}</span> <span style="font-size:9px; opacity:0.6;">▾</span>`;
    }
  }

  function renderSwitcherWidget(container, mode) {
    if (document.getElementById('marlo-lang-switcher')) return;

    const wrap = document.createElement('div');
    wrap.id = 'marlo-lang-switcher';
    wrap.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      margin: 0 4px;
      z-index: 999;
    `;

    const info = SUPPORTED_LANGS[currentLang] || SUPPORTED_LANGS.fr;
    wrap.innerHTML = `
      <button id="marlo-lang-btn" type="button" class="btn btn--ghost btn--sm" style="
        display:flex;
        align-items:center;
        gap:5px;
        padding:4px 8px;
        height:28px;
        border-radius:6px;
        background:var(--card-2);
        border:1px solid var(--line);
        cursor:pointer;
        color:var(--ink);
      " title="Changer de langue / Select language / تغيير اللغة">
        <span style="font-size:14px;">${info.flag}</span>
        <span style="font-size:11px; font-weight:700; text-transform:uppercase;">${currentLang}</span>
        <span style="font-size:9px; opacity:0.6;">▾</span>
      </button>
    `;

    if (mode === 'topbar') {
      container.insertBefore(wrap, container.firstChild);
    } else {
      container.appendChild(wrap);
    }

    const btn = wrap.querySelector('#marlo-lang-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangDropdown(wrap);
    });
  }

  function toggleLangDropdown(anchorEl) {
    const existing = document.getElementById('marlo-lang-dropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const drop = document.createElement('div');
    drop.id = 'marlo-lang-dropdown';
    drop.className = 'pop';
    drop.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 6}px;
      ${document.documentElement.getAttribute('dir') === 'rtl' ? `left: ${rect.left}px;` : `right: ${window.innerWidth - rect.right}px;`}
      width: 170px;
      background: var(--card);
      border: 1px solid var(--line-2);
      border-radius: 8px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.25);
      padding: 6px;
      z-index: 99999999;
      font-family: var(--font);
    `;

    let html = `
      <div style="padding:4px 8px; font-size:10px; font-weight:700; text-transform:uppercase; color:var(--muted); letter-spacing:0.05em;">
        ${t('common.language', 'Langue')} / Language
      </div>
    `;

    Object.entries(SUPPORTED_LANGS).forEach(([code, item]) => {
      const isSel = code === currentLang;
      html += `
        <div class="lang-opt" data-code="${code}" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: ${isSel ? '700' : '500'};
          background: ${isSel ? 'var(--well)' : 'transparent'};
          color: var(--ink);
          margin-bottom: 2px;
        ">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">${item.flag}</span>
            <span>${item.name}</span>
          </div>
          ${isSel ? '<span style="color:var(--accent); font-weight:bold;">✓</span>' : ''}
        </div>
      `;
    });

    drop.innerHTML = html;
    document.body.appendChild(drop);

    drop.querySelectorAll('.lang-opt').forEach(opt => {
      opt.addEventListener('mouseenter', () => opt.style.background = 'var(--card-2)');
      opt.addEventListener('mouseleave', () => {
        opt.style.background = opt.dataset.code === currentLang ? 'var(--well)' : 'transparent';
      });
      opt.addEventListener('click', () => {
        setLanguage(opt.dataset.code);
        drop.remove();
      });
    });

    const closeHandler = (e) => {
      if (!drop.contains(e.target) && !anchorEl.contains(e.target)) {
        drop.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  window.addEventListener('hashchange', () => {
    setTimeout(translateDom, 50);
  });
  window.addEventListener('marlo:tenant-changed', () => {
    setTimeout(translateDom, 50);
  });

  window.addEventListener('DOMContentLoaded', () => {
    applyDirectionAndLocale(currentLang);
    setupLanguageSwitcher();
  });

  // Export global API
  window.t = t;
  window.setMarloLanguage = setLanguage;
  window.getMarloLanguage = () => currentLang;
  window.MARLO_I18N = {
    t,
    setLanguage,
    getLanguage: () => currentLang,
    SUPPORTED_LANGS
  };

  // Exécution immédiate au cas où le DOM est déjà chargé
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    applyDirectionAndLocale(currentLang);
    setupLanguageSwitcher();
  }
})();
