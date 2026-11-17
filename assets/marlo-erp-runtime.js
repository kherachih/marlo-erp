/**
 * Marlo ERP & SaaS Platform - Multi-Tenant Runtime & Enterprise Switcher
 * Gère le multi-tenant, le sélecteur d'entreprise et l'onboarding.
 * Les pages (dont Apps & Plugins) sont désormais des composants React 100% natifs.
 */

(function () {
  const API_BASE = '/api';

  let state = {
    tenants: [],
    currentTenant: null
  };

  async function init() {
    try {
      const res = await fetch(`${API_BASE}/tenants`).then(r => r.json());
      if (res.success && res.tenants) {
        state.tenants = res.tenants;
        const savedId = localStorage.getItem('marlo_erp_tenant_id');
        state.currentTenant = state.tenants.find(t => t.id === savedId) || state.tenants[0];

        if (state.currentTenant) {
          localStorage.setItem('marlo_erp_tenant_id', state.currentTenant.id);
        }

        setupSidebarEnhancements();
      }
    } catch (err) {
      console.error('[Marlo ERP Multi-Tenant] Erreur:', err);
    }

    // Écouteur pour ouvrir la création d'entreprise depuis n'importe où
    window.addEventListener('marlo:open-new-tenant', openNewTenantModal);
    window.MARLO_OPEN_NEW_TENANT = openNewTenantModal;
    window.MARLO_SWITCH_TENANT = switchTenant;

    // Écouteur pour mise à jour des modules
    window.addEventListener('marlo:modules-updated', (e) => {
      if (e.detail && e.detail.activeModules) {
        if (state.currentTenant) state.currentTenant.activeModules = e.detail.activeModules;
        updateSidebarVisibility();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  function setupSidebarEnhancements() {
    const timer = setInterval(() => {
      const brand = document.querySelector('.side__head .brand');
      const sideNav = document.querySelector('.side nav.snav');

      if (brand && sideNav) {
        clearInterval(timer);
        attachTenantSwitcher(brand);
        updateSidebarVisibility();
      }
    }, 100);

    setTimeout(() => clearInterval(timer), 10000);
  }

  function attachTenantSwitcher(brandEl) {
    if (brandEl.dataset.erpBound) return;
    brandEl.dataset.erpBound = 'true';

    brandEl.style.cursor = 'pointer';
    brandEl.setAttribute('title', 'Changer d\'entreprise / Créer un ERP');

    const updateBrandText = () => {
      const brandText = brandEl.querySelector('.brand__text');
      if (brandText && state.currentTenant) {
        brandText.innerHTML = `
          <div style="display:flex; align-items:center; gap:6px;">
            <b style="font-size:14px; color:var(--ink); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">
              ${state.currentTenant.name}
            </b>
            <span style="font-size:10px; opacity:0.6; display:inline-block;" class="erp-chevron">▾</span>
          </div>
          <small style="color:var(--muted); font-size:11px; display:block; text-transform:capitalize;">
            ${state.currentTenant.industry ? state.currentTenant.industry.replace('_', ' ') : 'ERP SaaS'}
          </small>
        `;
      }
    };

    updateBrandText();

    brandEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleTenantDropdown(brandEl);
    });
  }

  function toggleTenantDropdown(anchorEl) {
    const existing = document.getElementById('erp-tenant-dropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.id = 'erp-tenant-dropdown';
    dropdown.className = 'pop';
    dropdown.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 8}px;
      left: ${rect.left}px;
      width: 250px;
      z-index: 9999999;
      background: var(--card);
      border: 1px solid var(--line-2);
      border-radius: var(--r-md);
      box-shadow: 0 16px 36px rgba(0,0,0,0.3);
      padding: 8px;
      animation: erpFadeIn 0.2s var(--ease);
      font-family: var(--font);
    `;

    let html = `
      <div style="padding:6px 10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">
        Entreprises (Tenants)
      </div>
      <div style="display:flex; flex-direction:column; gap:2px; margin-bottom:8px;">
    `;

    state.tenants.forEach(t => {
      const isSelected = t.id === state.currentTenant.id;
      html += `
        <div class="erp-tenant-item" data-id="${t.id}" style="
          padding: 8px 10px;
          border-radius: var(--r-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: ${isSelected ? 'var(--well)' : 'transparent'};
          transition: background 0.15s;
        ">
          <div>
            <div style="font-weight:600; font-size:13px; color:var(--ink);">${t.name}</div>
            <div style="font-size:11px; color:var(--muted);">${(t.activeModules || []).length} modules activés</div>
          </div>
          ${isSelected ? '<span style="color:var(--ink); font-size:14px; font-weight:bold;">✓</span>' : ''}
        </div>
      `;
    });

    html += `
      </div>
      <div style="border-top: 1px solid var(--line); padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
        <button id="erp-new-tenant-btn" class="btn btn--primary btn--sm" style="width:100%; justify-content:center; gap:6px;">
          <span>+</span> Inscrire une Entreprise
        </button>
        <button id="erp-onboarding-link" class="btn btn--ghost btn--sm" style="width:100%; justify-content:center; gap:6px; font-size:11px;">
          <span>📋</span> Questionnaire Plein Écran
        </button>
      </div>
    `;

    dropdown.innerHTML = html;
    document.body.appendChild(dropdown);

    dropdown.querySelectorAll('.erp-tenant-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = 'var(--card-2)');
      item.addEventListener('mouseleave', () => {
        const isSel = item.dataset.id === state.currentTenant.id;
        item.style.background = isSel ? 'var(--well)' : 'transparent';
      });
      item.addEventListener('click', () => {
        switchTenant(item.dataset.id);
        dropdown.remove();
      });
    });

    const newBtn = dropdown.querySelector('#erp-new-tenant-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        dropdown.remove();
        openNewTenantModal();
      });
    }

    const onbLink = dropdown.querySelector('#erp-onboarding-link');
    if (onbLink) {
      onbLink.addEventListener('click', () => {
        dropdown.remove();
        location.hash = '#/onboarding';
      });
    }

    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && !anchorEl.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  async function switchTenant(tenantId, customData) {
    const target = state.tenants.find(t => t.id === tenantId);
    if (!target) return;

    state.currentTenant = target;
    localStorage.setItem('marlo_erp_tenant_id', target.id);

    // Recharger le store réactif React Marlo avec les données isolées du tenant
    if (typeof window.MARLO_RELOAD_STORE === 'function') {
      if (customData) {
        window.MARLO_RELOAD_STORE(target.id, customData);
      } else {
        const key = 'marlo:data:' + target.id;
        const local = localStorage.getItem(key);
        if (local) {
          window.MARLO_RELOAD_STORE(target.id);
        } else {
          try {
            const res = await fetch(`${API_BASE}/tenants/${target.id}/data`).then(r => r.json());
            if (res && res.success && res.data) {
              localStorage.setItem(key, JSON.stringify(res.data));
              window.MARLO_RELOAD_STORE(target.id, res.data);
            } else {
              window.MARLO_RELOAD_STORE(target.id);
            }
          } catch {
            window.MARLO_RELOAD_STORE(target.id);
          }
        }
      }
    }

    const brand = document.querySelector('.side__head .brand');
    if (brand) {
      brand.dataset.erpBound = '';
      attachTenantSwitcher(brand);
    }

    updateSidebarVisibility();
    window.dispatchEvent(new CustomEvent('marlo:tenant-changed', { detail: { tenant: target } }));
    showToast(`Espace commuté : ${target.name}`);
  }

  function updateSidebarVisibility() {
    if (!state.currentTenant) return;
    const active = state.currentTenant.activeModules || [];
    const managedModules = ['crm', 'tasks', 'projects', 'calendar', 'team', 'activity', 'budget', 'accounting', 'inbox'];

    managedModules.forEach(modId => {
      const link = document.querySelector(`.side a.snav__item[data-id="${modId}"]`);
      if (link) {
        link.style.display = active.includes(modId) ? '' : 'none';
      }
    });
  }

  function openNewTenantModal() {
    closeAllModals();

    const SECTORS_LIST = [
      { id: 'design_agency', name: 'Studio Créatif, Média & Design', badge: 'Créatif & Média', desc: 'Post-production, 3D, agence digitale, vidéo & branding.', defaultNeeds: ['crm', 'projects', 'tasks', 'calendar', 'team', 'budget'], recModules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity', 'inbox'] },
      { id: 'consulting', name: 'Cabinet Conseil & Services B2B', badge: 'Conseil & Services', desc: 'Stratégie, ingénierie, audit, IT & prestations intellectuelles.', defaultNeeds: ['crm', 'tasks', 'projects', 'team', 'budget', 'accounting'], recModules: ['overview', 'crm', 'tasks', 'projects', 'team', 'budget', 'accounting', 'inbox'] },
      { id: 'sales_trade', name: 'Commerce, Négoce & Vente B2B', badge: 'Vente & Distribution', desc: 'Négoce, grossiste, distribution & commerce B2B.', defaultNeeds: ['crm', 'budget', 'accounting'], recModules: ['overview', 'crm', 'budget', 'accounting', 'activity', 'inbox'] },
      { id: 'construction', name: 'BTP, Architecture & Travaux', badge: 'BTP & Chantier', desc: 'Chantiers, maîtrise d\'œuvre, ingénierie & sous-traitance.', defaultNeeds: ['tasks', 'projects', 'calendar', 'team', 'budget'], recModules: ['overview', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity'] },
      { id: 'general', name: 'Entreprise Générale & PME', badge: 'Généraliste', desc: 'Activité polyvalente et prestations de services diversifiées.', defaultNeeds: ['crm', 'tasks', 'projects', 'budget'], recModules: ['overview', 'crm', 'tasks', 'projects', 'budget', 'inbox'] }
    ];

    const NEEDS_LIST = [
      { id: 'crm', title: 'Prospection & Pipeline Commercial (CRM)', mod: 'crm', cat: 'Ventes', desc: 'Opportunités, qualification et devis' },
      { id: 'budget', title: 'Facturation, Devis & Encaissements', mod: 'budget', cat: 'Finance', desc: 'Acomptes, factures et suivi des règlements' },
      { id: 'projects', title: 'Gestion de Projets & Timeline (Gantt)', mod: 'projects', cat: 'Opérations', desc: 'Jalons de livraison et coordination d\'équipe' },
      { id: 'tasks', title: 'Organisation des Tâches (Kanban)', mod: 'tasks', cat: 'Opérations', desc: 'Tableau visuel interactif glisser-déposer' },
      { id: 'team', title: 'Équipe & Feuilles d\'Heures (Timesheets)', mod: 'team', cat: 'RH', desc: 'Capacité, charge de travail et rentabilité' },
      { id: 'calendar', title: 'Réservation de Salles & Équipements', mod: 'calendar', cat: 'Opérations', desc: 'Planning d\'occupation des studios et postes' },
      { id: 'accounting', title: 'Comptabilité Générale & Fiscalité', mod: 'accounting', cat: 'Finance', desc: 'Grand livre, journaux et suivi de la TVA' }
    ];

    const ALL_MODS = [
      { id: 'overview', name: 'Overview & Synthèse', isCore: true, cat: 'Pilotage' },
      { id: 'crm', name: 'CRM & Ventes', cat: 'Ventes' },
      { id: 'tasks', name: 'Tâches (Kanban)', cat: 'Opérations' },
      { id: 'projects', name: 'Projets & Gantt', cat: 'Opérations' },
      { id: 'calendar', name: 'Planning & Suites', cat: 'Opérations' },
      { id: 'team', name: 'Équipe & Workload', cat: 'RH' },
      { id: 'budget', name: 'Factures & Devis', cat: 'Finance' },
      { id: 'accounting', name: 'Comptabilité', cat: 'Finance' },
      { id: 'activity', name: 'Journal d\'Activité', cat: 'Communication' },
      { id: 'inbox', name: 'Boîte de Réception', cat: 'Communication' }
    ];

    let currentStep = 1;
    let wizardData = {
      name: '',
      ownerName: '',
      ownerRole: 'Direction / CEO',
      ownerEmail: '',
      currency: 'EUR',
      teamSize: '1-5',
      industry: 'design_agency',
      needs: ['crm', 'projects', 'tasks', 'calendar', 'team', 'budget'],
      activeModules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity', 'inbox']
    };

    const wrap = document.createElement('div');
    wrap.id = 'erp-new-tenant-modal';
    wrap.className = 'modal-wrap';
    wrap.style.cssText = `
      position: fixed; inset: 0; z-index: 9999999;
      background: rgba(18, 19, 21, 0.78); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px; animation: erpFadeIn 0.25s var(--ease);
      font-family: var(--font);
    `;

    const modalBox = document.createElement('div');
    modalBox.className = 'modal card';
    modalBox.style.cssText = `
      width: 100%; max-width: 660px; max-height: 90vh; overflow-y: auto;
      padding: 28px; border-radius: var(--r-lg); box-shadow: 0 24px 48px rgba(0,0,0,0.38);
      border: 1px solid var(--line-2); background: var(--bg);
    `;

    wrap.appendChild(modalBox);
    document.body.appendChild(wrap);

    const close = () => wrap.remove();
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) close();
    });

    function renderModalContent() {
      const selectedSec = SECTORS_LIST.find(s => s.id === wizardData.industry) || SECTORS_LIST[0];

      let html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--line-2); padding-bottom: 14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="pill pill--accent">Onboarding ERP</span>
              <span class="pill">Isolation Option 2</span>
            </div>
            <h2 style="font-size:19px; font-weight:800; color:var(--ink); margin:0;">Inscrire une Entreprise</h2>
            <p style="color:var(--muted); font-size:12px; margin:4px 0 0;">Questionnaire intelligent pour débloquer automatiquement vos modules adaptés.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="modal-to-fullscreen" class="btn btn--subtle btn--sm" style="font-size:11px;" title="Ouvrir en plein écran">
              Plein écran ↗
            </button>
            <button id="modal-close-x" class="btn btn--ghost btn--sm" style="font-size:16px;">✕</button>
          </div>
        </div>

        <!-- Stepper -->
        <ol class="steps" style="margin-bottom: 24px;">
          <li class="${currentStep > 1 ? 'is-done' : currentStep === 1 ? 'is-now' : ''}">
            <span class="steps__dot">${currentStep > 1 ? '✓' : ''}</span>
            <span class="steps__bar"><i class="steps__fill" style="transform: ${currentStep > 1 ? 'scaleX(1)' : 'scaleX(0)'}"></i></span>
            <small>1. Profil</small>
          </li>
          <li class="${currentStep > 2 ? 'is-done' : currentStep === 2 ? 'is-now' : ''}">
            <span class="steps__dot">${currentStep > 2 ? '✓' : ''}</span>
            <span class="steps__bar"><i class="steps__fill" style="transform: ${currentStep > 2 ? 'scaleX(1)' : 'scaleX(0)'}"></i></span>
            <small>2. Métier</small>
          </li>
          <li class="${currentStep > 3 ? 'is-done' : currentStep === 3 ? 'is-now' : ''}">
            <span class="steps__dot">${currentStep > 3 ? '✓' : ''}</span>
            <span class="steps__bar"><i class="steps__fill" style="transform: ${currentStep > 3 ? 'scaleX(1)' : 'scaleX(0)'}"></i></span>
            <small>3. Besoins</small>
          </li>
          <li class="${currentStep > 4 ? 'is-done' : currentStep === 4 ? 'is-now' : ''}">
            <span class="steps__dot">${currentStep > 4 ? '✓' : ''}</span>
            <small>4. Modules</small>
          </li>
        </ol>
      `;

      // Step 1: Profil
      if (currentStep === 1) {
        html += `
          <div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:14px;">
              <div class="field">
                <label style="font-size:11px; font-weight:700; color:var(--ink); text-transform:uppercase; margin-bottom:4px; display:block;">Nom de l'entreprise *</label>
                <input type="text" id="w-input-name" required value="${wizardData.name}" placeholder="Ex: Studio Horizon, Groupe Alliance..." class="input" style="width:100%; box-sizing:border-box; padding:8px 12px; background:var(--well); border:1px solid var(--line-2); border-radius:var(--r-sm); color:var(--ink);" />
              </div>
              <div class="field">
                <label style="font-size:11px; font-weight:700; color:var(--ink); text-transform:uppercase; margin-bottom:4px; display:block;">Nom de l'administrateur</label>
                <input type="text" id="w-input-owner" value="${wizardData.ownerName}" placeholder="Ex: Sarah Martin" class="input" style="width:100%; box-sizing:border-box; padding:8px 12px; background:var(--well); border:1px solid var(--line-2); border-radius:var(--r-sm); color:var(--ink);" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:20px;">
              <div class="field">
                <label style="font-size:11px; font-weight:700; color:var(--ink); text-transform:uppercase; margin-bottom:4px; display:block;">Devise de Facturation</label>
                <select id="w-select-currency" class="select" style="width:100%; box-sizing:border-box; padding:8px 12px; background:var(--well); border:1px solid var(--line-2); border-radius:var(--r-sm); color:var(--ink);">
                  <option value="EUR" ${wizardData.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                  <option value="USD" ${wizardData.currency === 'USD' ? 'selected' : ''}>Dollar US ($)</option>
                  <option value="GBP" ${wizardData.currency === 'GBP' ? 'selected' : ''}>Livre Sterling (£)</option>
                  <option value="CHF" ${wizardData.currency === 'CHF' ? 'selected' : ''}>Franc Suisse (CHF)</option>
                  <option value="CAD" ${wizardData.currency === 'CAD' ? 'selected' : ''}>Dollar Canadien ($)</option>
                </select>
              </div>
              <div class="field">
                <label style="font-size:11px; font-weight:700; color:var(--ink); text-transform:uppercase; margin-bottom:4px; display:block;">Taille de l'équipe</label>
                <select id="w-select-teamsize" class="select" style="width:100%; box-sizing:border-box; padding:8px 12px; background:var(--well); border:1px solid var(--line-2); border-radius:var(--r-sm); color:var(--ink);">
                  <option value="1-5" ${wizardData.teamSize === '1-5' ? 'selected' : ''}>1 à 5 collaborateurs</option>
                  <option value="6-20" ${wizardData.teamSize === '6-20' ? 'selected' : ''}>6 à 20 collaborateurs</option>
                  <option value="21-50" ${wizardData.teamSize === '21-50' ? 'selected' : ''}>21 à 50 collaborateurs</option>
                  <option value="50+" ${wizardData.teamSize === '50+' ? 'selected' : ''}>Plus de 50 collaborateurs</option>
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--line); padding-top:16px;">
              <button type="button" id="w-btn-cancel" class="btn btn--ghost">Annuler</button>
              <button type="button" id="w-btn-step1-next" class="btn btn--primary">Secteur Métier →</button>
            </div>
          </div>
        `;
      }

      // Step 2: Secteur Métier
      if (currentStep === 2) {
        html += `
          <div>
            <div style="font-size:12px; color:var(--muted); margin-bottom:12px;">Choisissez le profil métier correspondant le mieux à votre activité :</div>
            <div style="display:grid; grid-template-columns: 1fr; gap:8px; margin-bottom:20px;">
        `;

        SECTORS_LIST.forEach(s => {
          const isSel = wizardData.industry === s.id;
          html += `
            <div class="w-sector-item card" data-id="${s.id}" style="
              padding: 12px 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
              border: ${isSel ? '2px solid var(--accent)' : '1px solid var(--line-2)'};
              background: ${isSel ? 'var(--well)' : 'var(--card)'};
              transition: all 0.15s ease; border-radius: var(--r-md);
            ">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px;">
                  <b style="font-size:13px; color:var(--ink);">${s.name}</b>
                  <span class="pill pill--accent" style="font-size:10px;">${s.badge}</span>
                </div>
                <div style="font-size:11px; color:var(--muted);">${s.desc}</div>
              </div>
              <div style="
                width: 20px; height: 20px; border-radius: 50%;
                background: ${isSel ? 'var(--accent)' : 'transparent'};
                border: ${isSel ? 'none' : '2px solid var(--line-2)'};
                color: #fff; display: grid; placeItems: center; font-size: 11px; font-weight: bold; flex-shrink: 0;
              ">
                ${isSel ? '✓' : ''}
              </div>
            </div>
          `;
        });

        html += `
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--line); padding-top:16px;">
              <button type="button" id="w-btn-prev" class="btn btn--ghost">← Précédent</button>
              <button type="button" id="w-btn-step2-next" class="btn btn--primary">Diagnostic Besoins →</button>
            </div>
          </div>
        `;
      }

      // Step 3: Diagnostic Besoins
      if (currentStep === 3) {
        html += `
          <div>
            <div style="font-size:12px; color:var(--muted); margin-bottom:12px;">Cochez les besoins clés de votre entreprise au quotidien :</div>
            <div style="display:grid; grid-template-columns: 1fr; gap:8px; margin-bottom:20px; max-height:300px; overflow-y:auto; padding-right:4px;">
        `;

        NEEDS_LIST.forEach(n => {
          const isChecked = wizardData.needs.includes(n.id);
          html += `
            <div class="w-need-item card" data-id="${n.id}" style="
              padding: 10px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
              border: ${isChecked ? '1px solid var(--accent)' : '1px solid var(--line-2)'};
              background: ${isChecked ? 'var(--well)' : 'var(--card)'};
              border-radius: var(--r-md); transition: all 0.12s ease;
            ">
              <div>
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                  <b style="font-size:13px; color:var(--ink);">${n.title}</b>
                  <span class="pill" style="font-size:9px;">${n.cat}</span>
                </div>
                <div style="font-size:11px; color:var(--muted);">${n.desc}</div>
              </div>
              <div style="
                width: 20px; height: 20px; border-radius: 4px;
                background: ${isChecked ? 'var(--accent)' : 'transparent'};
                border: ${isChecked ? 'none' : '2px solid var(--line-2)'};
                color: #fff; display: grid; placeItems: center; font-size: 11px; font-weight: bold; flex-shrink: 0;
              ">
                ${isChecked ? '✓' : ''}
              </div>
            </div>
          `;
        });

        html += `
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--line); padding-top:16px;">
              <button type="button" id="w-btn-prev" class="btn btn--ghost">← Précédent</button>
              <button type="button" id="w-btn-step3-next" class="btn btn--primary">Modules Suggérés →</button>
            </div>
          </div>
        `;
      }

      // Step 4: Modules recommandés & Lancement
      if (currentStep === 4) {
        html += `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:var(--well); padding:10px 14px; border-radius:var(--r-sm);">
              <div>
                <div style="font-weight:700; font-size:13px; color:var(--ink);">${wizardData.name}</div>
                <div style="font-size:11px; color:var(--muted);">${selectedSec.name} • ${wizardData.currency}</div>
              </div>
              <span class="badge badge--ok" style="font-size:11px;">${wizardData.activeModules.length} modules débloqués</span>
            </div>

            <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Modules activés selon votre diagnostic (cliquez pour ajuster) :</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:20px; max-height:260px; overflow-y:auto; padding-right:4px;">
        `;

        ALL_MODS.forEach(m => {
          const isActive = wizardData.activeModules.includes(m.id);
          const isSuggested = selectedSec.recModules.includes(m.id) || wizardData.needs.includes(m.id);
          html += `
            <div class="w-module-item card" data-id="${m.id}" style="
              padding: 10px 12px; cursor: ${m.isCore ? 'default' : 'pointer'};
              border: ${isActive ? '1px solid var(--accent)' : '1px solid var(--line-2)'};
              background: ${isActive ? 'var(--card)' : 'var(--well)'};
              opacity: ${isActive ? 1 : 0.6}; border-radius: var(--r-sm);
              display: flex; align-items: center; justify-content: space-between;
            ">
              <div>
                <div style="font-weight:600; font-size:12px; color:var(--ink);">${m.name}</div>
                <div style="font-size:10px; color:var(--muted);">${m.isCore ? 'Obligatoire' : isSuggested ? '✨ Suggéré' : 'Optionnel'}</div>
              </div>
              <span style="font-size:11px; font-weight:bold; color:${isActive ? 'var(--good, #10b981)' : 'var(--muted)'};">
                ${isActive ? 'Actif' : 'Off'}
              </span>
            </div>
          `;
        });

        html += `
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line); padding-top:16px;">
              <button type="button" id="w-btn-prev" class="btn btn--ghost">← Précédent</button>
              <button type="button" id="w-btn-submit" class="btn btn--primary btn--lg" style="padding:10px 24px; font-weight:700;">
                🚀 Lancer l'ERP
              </button>
            </div>
          </div>
        `;
      }

      modalBox.innerHTML = html;
      attachEvents();
    }

    function attachEvents() {
      const closeBtn = modalBox.querySelector('#modal-close-x');
      if (closeBtn) closeBtn.onclick = close;

      const cancelBtn = modalBox.querySelector('#w-btn-cancel');
      if (cancelBtn) cancelBtn.onclick = close;

      const fsBtn = modalBox.querySelector('#modal-to-fullscreen');
      if (fsBtn) {
        fsBtn.onclick = () => {
          close();
          location.hash = '#/onboarding';
        };
      }

      const prevBtn = modalBox.querySelector('#w-btn-prev');
      if (prevBtn) {
        prevBtn.onclick = () => {
          currentStep = Math.max(1, currentStep - 1);
          renderModalContent();
        };
      }

      if (currentStep === 1) {
        const next1 = modalBox.querySelector('#w-btn-step1-next');
        if (next1) {
          next1.onclick = () => {
            const nameInput = modalBox.querySelector('#w-input-name');
            const ownerInput = modalBox.querySelector('#w-input-owner');
            const currSelect = modalBox.querySelector('#w-select-currency');
            const teamSelect = modalBox.querySelector('#w-select-teamsize');

            if (!nameInput.value.trim()) {
              nameInput.focus();
              nameInput.style.borderColor = 'var(--bad, #ef4444)';
              return;
            }

            wizardData.name = nameInput.value.trim();
            wizardData.ownerName = ownerInput.value.trim();
            wizardData.currency = currSelect.value;
            wizardData.teamSize = teamSelect.value;
            currentStep = 2;
            renderModalContent();
          };
        }
      }

      if (currentStep === 2) {
        modalBox.querySelectorAll('.w-sector-item').forEach(item => {
          item.onclick = () => {
            const secId = item.dataset.id;
            wizardData.industry = secId;
            const sec = SECTORS_LIST.find(s => s.id === secId);
            if (sec) {
              wizardData.needs = [...sec.defaultNeeds];
              wizardData.activeModules = [...sec.recModules];
            }
            renderModalContent();
          };
        });

        const next2 = modalBox.querySelector('#w-btn-step2-next');
        if (next2) {
          next2.onclick = () => {
            currentStep = 3;
            renderModalContent();
          };
        }
      }

      if (currentStep === 3) {
        modalBox.querySelectorAll('.w-need-item').forEach(item => {
          item.onclick = () => {
            const needId = item.dataset.id;
            const exists = wizardData.needs.includes(needId);
            if (exists) {
              wizardData.needs = wizardData.needs.filter(n => n !== needId);
              const needObj = NEEDS_LIST.find(n => n.id === needId);
              if (needObj && needObj.mod) {
                wizardData.activeModules = wizardData.activeModules.filter(m => m !== needObj.mod);
              }
            } else {
              wizardData.needs.push(needId);
              const needObj = NEEDS_LIST.find(n => n.id === needId);
              if (needObj && needObj.mod && !wizardData.activeModules.includes(needObj.mod)) {
                wizardData.activeModules.push(needObj.mod);
              }
            }
            if (!wizardData.activeModules.includes('overview')) wizardData.activeModules.unshift('overview');
            renderModalContent();
          };
        });

        const next3 = modalBox.querySelector('#w-btn-step3-next');
        if (next3) {
          next3.onclick = () => {
            currentStep = 4;
            renderModalContent();
          };
        }
      }

      if (currentStep === 4) {
        modalBox.querySelectorAll('.w-module-item').forEach(item => {
          item.onclick = () => {
            const modId = item.dataset.id;
            if (modId === 'overview') return;
            const exists = wizardData.activeModules.includes(modId);
            if (exists) {
              wizardData.activeModules = wizardData.activeModules.filter(m => m !== modId);
            } else {
              wizardData.activeModules.push(modId);
            }
            renderModalContent();
          };
        });

        const submitBtn = modalBox.querySelector('#w-btn-submit');
        if (submitBtn) {
          submitBtn.onclick = async () => {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Création en cours...';

            try {
              const res = await fetch(`${API_BASE}/tenants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: wizardData.name,
                  ownerName: wizardData.ownerName || `Admin ${wizardData.name}`,
                  ownerRole: wizardData.ownerRole,
                  industry: wizardData.industry,
                  currency: wizardData.currency,
                  teamSize: wizardData.teamSize,
                  needs: wizardData.needs,
                  modules: wizardData.activeModules
                })
              }).then(r => r.json());

              if (res && res.success && res.tenant) {
                state.tenants.push(res.tenant);
                if (res.starterData) {
                  localStorage.setItem(`marlo:data:${res.tenant.id}`, JSON.stringify(res.starterData));
                }
                close();
                await switchTenant(res.tenant.id, res.starterData);
                location.hash = '#/overview';
                showToast(`🎉 Bienvenue chez ${res.tenant.name} ! Votre ERP isolé est prêt.`);
              } else {
                alert(res.error || 'Erreur lors de la création');
                submitBtn.disabled = false;
                submitBtn.innerText = "🚀 Lancer l'ERP";
              }
            } catch (err) {
              console.error(err);
              alert('Erreur serveur');
              submitBtn.disabled = false;
              submitBtn.innerText = "🚀 Lancer l'ERP";
            }
          };
        }
      }
    }

    renderModalContent();
  }

  function closeAllModals() {
    const newTenant = document.getElementById('erp-new-tenant-modal');
    if (newTenant) newTenant.remove();
    const dropdown = document.getElementById('erp-tenant-dropdown');
    if (dropdown) dropdown.remove();
  }

  function showToast(msg) {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'erp-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999999;
      background: var(--ink); color: var(--bg);
      padding: 10px 18px; border-radius: var(--r-md);
      font-size: 13px; font-weight: 600; font-family: var(--font);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      animation: erpFadeIn 0.2s var(--ease);
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes erpFadeIn {
      from { opacity: 0; transform: scale(0.98) translateY(-4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(styleEl);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
