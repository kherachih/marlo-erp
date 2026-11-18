const { readDb, writeDb, CATALOG_MODULES, PRESETS, DEFAULT_CHART_OF_ACCOUNTS, generateStarterDataForTenant } = require('./db');
const { FISCAL_PACKAGES, DEFAULT_EXCHANGE_RATES } = require('./fiscal-packages');
const { renderInvoiceHtml, generateInvoicePdfFile } = require('./invoice-pdf');
const path = require('path');
const fs = require('fs');

async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Helper pour réponse JSON
  const parseBody = () => new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (_) { resolve({}); }
    });
  });

  const sendJson = (status, payload) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id'
    });
    res.end(JSON.stringify(payload));
  };

  // Helper lecture body JSON
  const getBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id'
    });
    return res.end();
  }

  // Client error logging
  if (pathname === '/api/client-error' && method === 'POST') {
    return getBody().then(err => {
      console.error('[BROWSER ERROR]:', JSON.stringify(err, null, 2));
      return sendJson(200, { ok: true });
    }).catch(() => sendJson(200, { ok: false }));
  }

  // 0. Fiscal Packages & Currency Exchange Rates
  if (pathname === '/api/fiscal-packages' && method === 'GET') {
    return sendJson(200, { success: true, packages: Object.values(FISCAL_PACKAGES) });
  }

  const pkgMatch = pathname.match(/^\/api\/fiscal-packages\/([a-zA-Z]{2})$/);
  if (pkgMatch && method === 'GET') {
    const code = pkgMatch[1].toUpperCase();
    const pkg = FISCAL_PACKAGES[code];
    if (!pkg) return sendJson(404, { success: false, error: 'Package fiscal non trouvé.' });
    return sendJson(200, { success: true, package: pkg });
  }

  if (pathname === '/api/currencies/rates' && method === 'GET') {
    return sendJson(200, {
      success: true,
      base: 'EUR',
      rates: DEFAULT_EXCHANGE_RATES,
      timestamp: new Date().toISOString()
    });
  }

  // Mise à jour du profil fiscal d'un tenant
  const fiscalProfileMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/fiscal-profile$/);
  if (fiscalProfileMatch && (method === 'PUT' || method === 'POST')) {
    return getBody().then(data => {
      const tenantId = fiscalProfileMatch[1];
      const db = readDb();
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable.' });

      tenant.country = data.country || tenant.country || 'DZ';
      tenant.currency = data.currency || tenant.currency || 'DZD';
      tenant.fiscalData = {
        ...(tenant.fiscalData || {}),
        ...(data.fiscalData || {}),
        nif: data.nif || (tenant.fiscalData && tenant.fiscalData.nif),
        nis: data.nis || (tenant.fiscalData && tenant.fiscalData.nis),
        rc: data.rc || (tenant.fiscalData && tenant.fiscalData.rc),
        ai: data.ai || (tenant.fiscalData && tenant.fiscalData.ai),
        matricule_fiscal: data.matricule_fiscal || (tenant.fiscalData && tenant.fiscalData.matricule_fiscal),
        vatNumber: data.vatNumber || tenant.vatNumber
      };

      writeDb(db);
      return sendJson(200, { success: true, tenant, fiscalProfile: tenant.fiscalData });
    });
  }

  // 1. GET /api/modules : Catalogue complet des modules Odoo
  if (pathname === '/api/modules' && method === 'GET') {
    const db = readDb();
    return sendJson(200, { success: true, modules: db.modules, presets: db.presets });
  }

  // 2. GET /api/tenants : Liste des entreprises disponibles
  if (pathname === '/api/tenants' && method === 'GET') {
    const db = readDb();
    return sendJson(200, { success: true, tenants: db.tenants });
  }

  // 3. POST /api/tenants : Créer une nouvelle entreprise (Onboarding & Questionnaire ERP)
  if (pathname === '/api/tenants' && method === 'POST') {
    return getBody().then(data => {
      if (!data.name || data.name.trim().length < 2) {
        return sendJson(400, { success: false, error: 'Le nom de l\'entreprise est obligatoire.' });
      }

      const db = readDb();
      if (!db.tenantsData) db.tenantsData = {};

      const baseSlug = (data.name)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `ent-${Date.now()}`;

      let slug = baseSlug;
      let counter = 1;
      while (db.tenants.some(t => t.id === slug || t.slug === slug)) {
        slug = `${baseSlug}-${counter++}`;
      }

      // Déterminer les modules initiaux selon la sélection de l'onboarding ou le preset
      let initialModules = ['overview'];
      if (Array.isArray(data.modules) && data.modules.length > 0) {
        initialModules = Array.from(new Set(['overview', ...data.modules]));
      } else if (data.preset && PRESETS[data.preset]) {
        initialModules = PRESETS[data.preset].modules;
      } else if (data.industry && PRESETS[data.industry]) {
        initialModules = PRESETS[data.industry].modules;
      } else {
        initialModules = PRESETS.design_agency.modules;
      }

      const newTenant = {
        id: slug,
        name: data.name.trim(),
        slug: slug,
        ownerName: data.ownerName || 'Admin ' + data.name.trim(),
        ownerRole: data.ownerRole || 'Direction',
        ownerEmail: data.ownerEmail || `contact@${slug}.com`,
        teamSize: data.teamSize || '1-5',
        needs: Array.isArray(data.needs) ? data.needs : [],
        industry: data.industry || 'design_agency',
        currency: data.currency || 'EUR',
        plan: data.plan || 'pro',
        activeModules: initialModules,
        createdAt: new Date().toISOString()
      };

      // Générer le starter data isolé complet pour cette entreprise
      const starterData = generateStarterDataForTenant(newTenant);

      db.tenants.push(newTenant);
      db.tenantsData[slug] = starterData;

      // Ajouter les leads CRM de départ s'il y en a
      if (starterData.crmLeads && Array.isArray(starterData.crmLeads)) {
        if (!db.crmLeads) db.crmLeads = [];
        db.crmLeads.push(...starterData.crmLeads);
      }

      writeDb(db);

      return sendJson(201, { success: true, tenant: newTenant, starterData });
    }).catch(err => {
      console.error('Error creating tenant:', err);
      return sendJson(400, { success: false, error: 'Payload JSON invalide' });
    });
  }

  // 4. GET /api/tenants/:id : Obtenir une entreprise spécifique
  const tenantMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)$/);
  if (tenantMatch && method === 'GET') {
    const tenantId = tenantMatch[1];
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant) {
      return sendJson(404, { success: false, error: 'Entreprise introuvable' });
    }
    return sendJson(200, { success: true, tenant });
  }

  // 5. POST /api/tenants/:id/modules/:moduleId/toggle : Activer/Désactiver un module
  const toggleMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/modules\/([a-zA-Z0-9_\-]+)\/toggle$/);
  if (toggleMatch && method === 'POST') {
    const tenantId = toggleMatch[1];
    const moduleId = toggleMatch[2];

    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant) {
      return sendJson(404, { success: false, error: 'Entreprise introuvable' });
    }

    // Le module overview ne peut pas être désactivé
    if (moduleId === 'overview') {
      return sendJson(400, { success: false, error: 'Le module Overview est obligatoire et ne peut être désactivé.' });
    }

    const exists = tenant.activeModules.includes(moduleId);
    if (exists) {
      tenant.activeModules = tenant.activeModules.filter(m => m !== moduleId);
    } else {
      tenant.activeModules.push(moduleId);
    }

    writeDb(db);
    return sendJson(200, {
      success: true,
      tenant,
      moduleId,
      isActive: !exists,
      activeModules: tenant.activeModules
    });
  }

  // 6. POST /api/tenants/:id/preset : Appliquer un preset complet
  const presetMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/preset$/);
  if (presetMatch && method === 'POST') {
    return getBody().then(data => {
      const tenantId = presetMatch[1];
      const presetKey = data.preset;

      if (!PRESETS[presetKey]) {
        return sendJson(400, { success: false, error: 'Preset inconnu' });
      }

      const db = readDb();
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant) {
        return sendJson(404, { success: false, error: 'Entreprise introuvable' });
      }

      tenant.activeModules = [...PRESETS[presetKey].modules];
      writeDb(db);

      return sendJson(200, { success: true, tenant, activeModules: tenant.activeModules });
    });
  }

  // 7. GET /api/tenants/:id/crm : Liste des opportunités CRM & métriques de pipeline
  const crmMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/crm$/);
  if (crmMatch && method === 'GET') {
    const tenantId = crmMatch[1];
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const allLeads = db.crmLeads || [];
    // Filtrer les leads appartenant au tenant ou partager les démos pour northbank
    const leads = allLeads.filter(l => l.tenantId === tenant.id || (!l.tenantId && tenant.id === 'northbank-post'));

    const totalValue = leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    const weightedValue = leads.reduce((acc, l) => acc + ((Number(l.value) || 0) * ((Number(l.probability) || 0) / 100)), 0);
    const wonValue = leads.filter(l => l.stage === 'won').reduce((acc, l) => acc + (Number(l.value) || 0), 0);

    const counts = {
      new: leads.filter(l => l.stage === 'new').length,
      qualified: leads.filter(l => l.stage === 'qualified').length,
      proposal: leads.filter(l => l.stage === 'proposal').length,
      negotiation: leads.filter(l => l.stage === 'negotiation').length,
      won: leads.filter(l => l.stage === 'won').length,
      lost: leads.filter(l => l.stage === 'lost').length,
      total: leads.length
    };

    return sendJson(200, {
      success: true,
      tenantId: tenant.id,
      leads,
      metrics: {
        totalValue,
        weightedValue: Math.round(weightedValue),
        wonValue,
        counts
      }
    });
  }

  // 8. POST /api/tenants/:id/crm/leads : Créer un nouveau lead
  const createLeadMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/crm\/leads$/);
  if (createLeadMatch && method === 'POST') {
    return getBody().then(data => {
      const tenantId = createLeadMatch[1];
      const db = readDb();
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

      if (!data.title || !data.company) {
        return sendJson(400, { success: false, error: 'Titre et Société sont requis' });
      }

      const newLead = {
        id: `lead-${Date.now()}`,
        tenantId: tenant.id,
        title: data.title.trim(),
        company: data.company.trim(),
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        value: Number(data.value) || 0,
        currency: tenant.currency || 'EUR',
        stage: data.stage || 'new',
        probability: Number(data.probability) || (data.stage === 'won' ? 100 : 25),
        expectedClose: data.expectedClose || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        assignedTo: data.assignedTo || { id: 'dara', name: 'Dara Whitfield', role: 'Head of Post' },
        notes: data.notes || '',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()) : []),
        createdAt: new Date().toISOString()
      };

      if (!db.crmLeads) db.crmLeads = [];
      db.crmLeads.unshift(newLead);
      writeDb(db);

      return sendJson(201, { success: true, lead: newLead });
    });
  }

  // 9. PUT /api/tenants/:id/crm/leads/:leadId : Mettre à jour un lead
  const updateLeadMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/crm\/leads\/([a-zA-Z0-9_\-]+)$/);
  if (updateLeadMatch && method === 'PUT') {
    return getBody().then(data => {
      const tenantId = updateLeadMatch[1];
      const leadId = updateLeadMatch[2];
      const db = readDb();

      if (!db.crmLeads) db.crmLeads = [];
      const leadIdx = db.crmLeads.findIndex(l => l.id === leadId);
      if (leadIdx === -1) return sendJson(404, { success: false, error: 'Opportunité introuvable' });

      const updated = {
        ...db.crmLeads[leadIdx],
        ...data,
        id: leadId,
        tenantId: db.crmLeads[leadIdx].tenantId
      };

      // Si le stage passe à won, la probabilité devient 100%
      if (data.stage === 'won' && !data.probability) {
        updated.probability = 100;
      }

      db.crmLeads[leadIdx] = updated;
      writeDb(db);

      return sendJson(200, { success: true, lead: updated });
    });
  }

  // 10. POST /api/tenants/:id/crm/leads/:leadId/convert : Convertir une opportunité en Projet & Facture
  const convertMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/crm\/leads\/([a-zA-Z0-9_\-]+)\/convert$/);
  if (convertMatch && method === 'POST') {
    const tenantId = convertMatch[1];
    const leadId = convertMatch[2];
    const db = readDb();

    if (!db.crmLeads) db.crmLeads = [];
    const lead = db.crmLeads.find(l => l.id === leadId);
    if (!lead) return sendJson(404, { success: false, error: 'Opportunité introuvable' });

    lead.stage = 'won';
    lead.probability = 100;
    lead.convertedAt = new Date().toISOString();
    lead.convertedProject = {
      name: lead.title,
      client: lead.company,
      budget: lead.value
    };

    writeDb(db);
    return sendJson(200, {
      success: true,
      message: `Opportunité convertie avec succès en projet pour ${lead.company} !`,
      lead
    });
  }

  // 11. DELETE /api/tenants/:id/crm/leads/:leadId : Supprimer une opportunité
  const deleteLeadMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/crm\/leads\/([a-zA-Z0-9_\-]+)$/);
  if (deleteLeadMatch && method === 'DELETE') {
    const tenantId = deleteLeadMatch[1];
    const leadId = deleteLeadMatch[2];
    const db = readDb();

    if (!db.crmLeads) db.crmLeads = [];
    db.crmLeads = db.crmLeads.filter(l => l.id !== leadId);
    writeDb(db);

    return sendJson(200, { success: true, message: 'Opportunité supprimée' });
  }

  // 12. GET /api/tenants/:id/data : Obtenir les données isolées complètes d'une entreprise
  const tenantDataMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/data$/);
  if (tenantDataMatch && method === 'GET') {
    const tenantId = tenantDataMatch[1];
    const db = readDb();
    if (!db.tenantsData) db.tenantsData = {};
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    let tData = db.tenantsData[tenant.id];
    if (!tData) {
      tData = generateStarterDataForTenant(tenant);
      db.tenantsData[tenant.id] = tData;
      writeDb(db);
    }
    return sendJson(200, { success: true, tenantId: tenant.id, data: tData });
  }

  // 13. PUT /api/tenants/:id/data : Sauvegarder les données isolées d'une entreprise
  if (tenantDataMatch && method === 'PUT') {
    return getBody().then(payload => {
      const tenantId = tenantDataMatch[1];
      const db = readDb();
      if (!db.tenantsData) db.tenantsData = {};
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

      db.tenantsData[tenant.id] = payload;
      writeDb(db);
      return sendJson(200, { success: true, message: 'Données enregistrées avec succès' });
    });
  }

  // 14. GET /api/tenants/:id/accounting : Données comptables complètes (Grand Livre, Plan de comptes, TVA, KPIs)
  const acctMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/accounting$/);
  if (acctMatch && method === 'GET') {
    const tenantId = acctMatch[1];
    const db = readDb();
    if (!db.tenantsData) db.tenantsData = {};
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    let tData = db.tenantsData[tenant.id];
    if (!tData) {
      tData = generateStarterDataForTenant(tenant);
      db.tenantsData[tenant.id] = tData;
      writeDb(db);
    }

    if (!tData.accountingEntries || !Array.isArray(tData.accountingEntries)) {
      const fresh = generateStarterDataForTenant(tenant);
      tData.accountingEntries = fresh.accountingEntries;
      tData.chartOfAccounts = fresh.chartOfAccounts;
      db.tenantsData[tenant.id] = tData;
      writeDb(db);
    }

    const entries = tData.accountingEntries || [];
    const chart = tData.chartOfAccounts || DEFAULT_CHART_OF_ACCOUNTS;

    // Calcul des soldes par compte
    const accountsWithBalance = chart.map(acc => {
      const accEntries = entries.filter(e => e.account === acc.code);
      const totalDebit = accEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
      const totalCredit = accEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
      let balance = 0;
      if (acc.class === 6 || acc.class === 2 || acc.class === 5 || acc.code === '411000' || acc.code === '445660') {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }
      return {
        ...acc,
        debit: totalDebit,
        credit: totalCredit,
        balance,
        entriesCount: accEntries.length
      };
    });

    // Synthèse par Journal (VT: Ventes, AC: Achats, BQ: Banque, OD: Opérations diverses)
    const journalMap = {
      VT: { code: 'VT', name: 'Journal des Ventes', debit: 0, credit: 0, count: 0 },
      AC: { code: 'AC', name: 'Journal des Achats', debit: 0, credit: 0, count: 0 },
      BQ: { code: 'BQ', name: 'Journal de Banque', debit: 0, credit: 0, count: 0 },
      OD: { code: 'OD', name: 'Opérations Diverses', debit: 0, credit: 0, count: 0 }
    };

    entries.forEach(e => {
      const j = journalMap[e.journal] || journalMap.OD;
      j.debit += Number(e.debit) || 0;
      j.credit += Number(e.credit) || 0;
      j.count += 1;
    });

    // Bilan TVA
    const vatSalesHT = entries.filter(e => e.account.startsWith('7')).reduce((sum, e) => sum + (Number(e.credit) - Number(e.debit)), 0);
    const vatCollected = entries.filter(e => e.account === '445710').reduce((sum, e) => sum + (Number(e.credit) - Number(e.debit)), 0);
    const vatDeductible = entries.filter(e => e.account === '445660').reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0);
    const netVatDue = Math.round((vatCollected - vatDeductible) * 100) / 100;

    // KPIs Financiers
    const revenueHT = Math.max(0, vatSalesHT);
    const expensesHT = entries.filter(e => e.account.startsWith('6')).reduce((sum, e) => sum + (Number(e.debit) - Number(e.credit)), 0);
    const operatingProfit = revenueHT - expensesHT;
    const bankAccount = accountsWithBalance.find(a => a.code === '512000');
    const bankBalance = bankAccount ? bankAccount.balance : 0;
    const unreconciledCount = entries.filter(e => !e.reconciled).length;

    return sendJson(200, {
      success: true,
      tenantId: tenant.id,
      currency: tenant.currency || 'EUR',
      entries,
      accounts: accountsWithBalance,
      journals: Object.values(journalMap),
      vat: {
        baseHT: revenueHT,
        vatCollected,
        vatDeductible,
        netVatDue,
        status: netVatDue >= 0 ? 'to_pay' : 'credit'
      },
      kpis: {
        revenueHT,
        expensesHT,
        operatingProfit,
        bankBalance,
        unreconciledCount,
        totalEntries: entries.length
      }
    });
  }

  // 15. POST /api/tenants/:id/accounting/entries : Ajouter une écriture comptable
  const acctEntryMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/accounting\/entries$/);
  if (acctEntryMatch && method === 'POST') {
    return getBody().then(data => {
      const tenantId = acctEntryMatch[1];
      const db = readDb();
      if (!db.tenantsData) db.tenantsData = {};
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

      let tData = db.tenantsData[tenant.id];
      if (!tData) {
        tData = generateStarterDataForTenant(tenant);
        db.tenantsData[tenant.id] = tData;
      }
      if (!tData.accountingEntries) tData.accountingEntries = [];

      // Si c'est un lot de lignes (partie double complète) ou une ligne unique
      const lines = Array.isArray(data.lines) ? data.lines : [data];
      const nowStr = new Date().toISOString().split('T')[0];

      const createdEntries = lines.map((l, idx) => ({
        id: `ecr-${tenant.slug}-${Date.now()}-${idx}`,
        date: l.date || data.date || nowStr,
        journal: l.journal || data.journal || 'OD',
        journalName: l.journalName || (l.journal === 'VT' ? 'Ventes' : l.journal === 'AC' ? 'Achats' : l.journal === 'BQ' ? 'Banque' : 'Opérations Diverses'),
        piece: l.piece || data.piece || `PCE-${Date.now().toString().slice(-4)}`,
        account: l.account || '471000',
        accountName: l.accountName || 'Compte d\'attente',
        label: l.label || data.label || 'Écriture diverse',
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        reconciled: false,
        letter: ''
      }));

      tData.accountingEntries.push(...createdEntries);
      writeDb(db);

      return sendJson(201, { success: true, count: createdEntries.length, entries: createdEntries });
    });
  }

  // 16. POST /api/tenants/:id/accounting/reconcile : Lettrer des écritures
  const reconcileMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/accounting\/reconcile$/);
  if (reconcileMatch && method === 'POST') {
    return getBody().then(data => {
      const tenantId = reconcileMatch[1];
      const { entryIds, letter } = data;
      if (!Array.isArray(entryIds) || entryIds.length < 2) {
        return sendJson(400, { success: false, error: 'Sélectionnez au moins 2 écritures à lettrer.' });
      }

      const db = readDb();
      const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
      if (!tenant || !db.tenantsData[tenant.id]) return sendJson(404, { success: false, error: 'Données introuvables' });

      const tData = db.tenantsData[tenant.id];
      const code = (letter || String.fromCharCode(65 + Math.floor(Math.random() * 26))).toUpperCase();

      tData.accountingEntries.forEach(e => {
        if (entryIds.includes(e.id)) {
          e.reconciled = true;
          e.letter = code;
        }
      });

      writeDb(db);
      return sendJson(200, { success: true, letter: code, reconciledCount: entryIds.length });
    });
  }

  // 17. GET /api/tenants/:id/accounting/fec : Télécharger le Fichier des Écritures Comptables (FEC)
  const fecMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_\-]+)\/accounting\/fec$/);
  if (fecMatch && method === 'GET') {
    const tenantId = fecMatch[1];
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId || t.slug === tenantId);
    if (!tenant || !db.tenantsData[tenant.id]) return sendJson(404, { success: false, error: 'Données introuvables' });

    const entries = db.tenantsData[tenant.id].accountingEntries || [];
    const headers = [
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'PieceRef', 'PieceDate',
      'EcritureLib', 'Debit', 'Credit', 'EcritureLet', 'DateLet'
    ];

    let rows = [headers.join('\t')];
    entries.forEach((e, idx) => {
      const row = [
        e.journal,
        e.journalName || e.journal,
        `ECR${String(idx + 1).padStart(5, '0')}`,
        (e.date || '').replace(/-/g, ''),
        e.account,
        e.accountName || e.account,
        e.piece,
        (e.date || '').replace(/-/g, ''),
        e.label,
        (Number(e.debit) || 0).toFixed(2).replace('.', ','),
        (Number(e.credit) || 0).toFixed(2).replace('.', ','),
        e.letter || '',
        e.reconciled ? (e.date || '').replace(/-/g, '') : ''
      ];
      rows.push(row.join('\t'));
    });

    const fecContent = rows.join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="FEC_${tenant.slug}_2026.txt"`,
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(fecContent);
  }

  // ==========================================
  // FACTURATION & DEVIS OFFICIELS (OPTION B)
  // ==========================================

  // GET /api/tenants/:id/invoices
  const invoicesMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invoices$/);
  if (invoicesMatch && method === 'GET') {
    const tenantId = invoicesMatch[1];
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const invoices = tenantData.invoices || [];
    const quotes = tenantData.quotes || [];

    return sendJson(200, {
      success: true,
      invoices,
      quotes,
      currency: tenant.currency || 'EUR'
    });
  }

  // GET /api/tenants/:id/invoices/:invId (JSON)
  const singleInvoiceMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invoices\/([a-zA-Z0-9_-]+)$/);
  if (singleInvoiceMatch && method === 'GET') {
    const [_, tenantId, invId] = singleInvoiceMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const inv = (tenantData.invoices || []).find(i => i.id === invId || i.number === invId);
    if (!inv) return sendJson(404, { success: false, error: 'Facture introuvable' });

    return sendJson(200, { success: true, invoice: inv });
  }

  // GET /api/tenants/:id/invoices/:invId/html (Vue imprimable officielle)
  const invoiceHtmlMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invoices\/([a-zA-Z0-9_-]+)\/html$/);
  if (invoiceHtmlMatch && method === 'GET') {
    const [_, tenantId, invId] = invoiceHtmlMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const inv = (tenantData.invoices || []).find(i => i.id === invId || i.number === invId);
    if (!inv) return sendJson(404, { success: false, error: 'Facture introuvable' });

    const html = renderInvoiceHtml(tenant, inv, { isQuote: false });
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(html);
  }

  // GET /api/tenants/:id/invoices/:invId/pdf (Téléchargement direct du PDF certifié)
  const invoicePdfMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/invoices\/([a-zA-Z0-9_-]+)\/pdf$/);
  if (invoicePdfMatch && method === 'GET') {
    const [_, tenantId, invId] = invoicePdfMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const inv = (tenantData.invoices || []).find(i => i.id === invId || i.number === invId);
    if (!inv) return sendJson(404, { success: false, error: 'Facture introuvable' });

    const tempDir = path.resolve(__dirname, '../.scripts');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `Facture_${inv.number || inv.id}.pdf`);

    try {
      await generateInvoicePdfFile(tenant, inv, pdfPath, { isQuote: false });
      const pdfBuffer = fs.readFileSync(pdfPath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Facture_${inv.number || inv.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(pdfBuffer);
    } catch (err) {
      console.error('[PDF Export] Erreur:', err);
      res.writeHead(302, { 'Location': `/api/tenants/${tenantId}/invoices/${invId}/html` });
      return res.end();
    }
  }

  // GET /api/tenants/:id/quotes/:quoteId/html (Vue Devis imprimable)
  const quoteHtmlMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/quotes\/([a-zA-Z0-9_-]+)\/html$/);
  if (quoteHtmlMatch && method === 'GET') {
    const [_, tenantId, quoteId] = quoteHtmlMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const quote = (tenantData.quotes || []).find(q => q.id === quoteId || q.number === quoteId);
    if (!quote) return sendJson(404, { success: false, error: 'Devis introuvable' });

    const html = renderInvoiceHtml(tenant, quote, { isQuote: true });
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(html);
  }

  // GET /api/tenants/:id/quotes/:quoteId/pdf (Téléchargement direct du Devis PDF)
  const quotePdfMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/quotes\/([a-zA-Z0-9_-]+)\/pdf$/);
  if (quotePdfMatch && method === 'GET') {
    const [_, tenantId, quoteId] = quotePdfMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const quote = (tenantData.quotes || []).find(q => q.id === quoteId || q.number === quoteId);
    if (!quote) return sendJson(404, { success: false, error: 'Devis introuvable' });

    const tempDir = path.resolve(__dirname, '../.scripts');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `Devis_${quote.number || quote.id}.pdf`);

    try {
      await generateInvoicePdfFile(tenant, quote, pdfPath, { isQuote: true });
      const pdfBuffer = fs.readFileSync(pdfPath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Devis_${quote.number || quote.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(pdfBuffer);
    } catch (err) {
      console.error('[PDF Export Devis] Erreur:', err);
      res.writeHead(302, { 'Location': `/api/tenants/${tenantId}/quotes/${quoteId}/html` });
      return res.end();
    }
  }

  // POST /api/tenants/:id/quotes/:quoteId/convert (Convertir un Devis en Facture officielle)
  const convertQuoteMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/quotes\/([a-zA-Z0-9_-]+)\/convert$/);
  if (convertQuoteMatch && method === 'POST') {
    const [_, tenantId, quoteId] = convertQuoteMatch;
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    tenantData.quotes = tenantData.quotes || [];
    tenantData.invoices = tenantData.invoices || [];
    tenantData.accountingEntries = tenantData.accountingEntries || [];

    const quote = tenantData.quotes.find(q => q.id === quoteId || q.number === quoteId);
    if (!quote) return sendJson(404, { success: false, error: 'Devis introuvable' });

    quote.status = 'accepted';
    quote.acceptedAt = Date.now();

    const nextNum = (tenantData.invoices.length + 1).toString().padStart(3, '0');
    const invNumber = `FAC-2026-${nextNum}`;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      number: invNumber,
      client: quote.client,
      clientContact: quote.clientContact,
      clientAddress: quote.clientAddress,
      clientVat: quote.clientVat,
      projectId: quote.projectId,
      title: quote.title,
      amount: quote.amount,
      issued: Date.now(),
      due: Date.now() + 30 * 86400000,
      status: 'sent',
      items: quote.items || []
    };

    tenantData.invoices.push(newInvoice);

    // Écriture comptable automatique (Journal des Ventes VT)
    const rawHT = quote.items ? quote.items.reduce((acc, l) => acc + (Number(l.totalHT) || 0), 0) : Math.round(quote.amount / 1.2);
    const vat = Math.round(rawHT * 0.2);
    const ttc = rawHT + vat;
    const dStr = new Date().toISOString().split('T')[0];

    tenantData.accountingEntries.push(
      {
        id: `entry-${Date.now()}-1`,
        num: `ECR${(tenantData.accountingEntries.length + 1).toString().padStart(5, '0')}`,
        journal: 'VT',
        journalName: 'Ventes',
        date: dStr,
        piece: invNumber,
        account: '411000',
        accountName: 'Clients',
        label: `${invNumber} - ${quote.client}`,
        debit: ttc,
        credit: 0,
        reconciled: false
      },
      {
        id: `entry-${Date.now()}-2`,
        num: `ECR${(tenantData.accountingEntries.length + 2).toString().padStart(5, '0')}`,
        journal: 'VT',
        journalName: 'Ventes',
        date: dStr,
        piece: invNumber,
        account: '706000',
        accountName: 'Prestations de services',
        label: `${invNumber} - ${quote.title}`,
        debit: 0,
        credit: rawHT,
        reconciled: false
      },
      {
        id: `entry-${Date.now()}-3`,
        num: `ECR${(tenantData.accountingEntries.length + 3).toString().padStart(5, '0')}`,
        journal: 'VT',
        journalName: 'Ventes',
        date: dStr,
        piece: invNumber,
        account: '445710',
        accountName: 'TVA Collectée (20%)',
        label: `TVA s/ ${invNumber}`,
        debit: 0,
        credit: vat,
        reconciled: false
      }
    );

    writeDb(db);
    return sendJson(200, {
      success: true,
      message: 'Devis converti avec succès en facture officielle',
      invoice: newInvoice,
      quote
    });
  }

  // ==========================================
  // AUTHENTIFICATION & RÔLES RBAC (OPTION C)
  // ==========================================

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody();
    const { email, password, tenantId, rbacRole } = body || {};

    const db = readDb();
    const targetTenantId = tenantId || db.tenants[0]?.id || 'northbank-post';
    const tenant = db.tenants.find(t => t.id === targetTenantId) || db.tenants[0];
    const tenantData = db.tenantsData[tenant.id] || {};
    const members = tenantData.members || [];

    // Recherche de l'utilisateur
    let user = null;
    if (rbacRole) {
      user = members.find(m => m.rbacRole === rbacRole);
    }
    if (!user && email) {
      user = members.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
    }
    if (!user) {
      user = members[0] || { id: 'owner', name: 'Admin', rbacRole: 'admin', email: 'admin@marlo.io' };
    }

    if (password && user.password && user.password !== password && password !== 'northbank' && password !== 'marlo2026') {
      return sendJson(401, { success: false, error: 'Mot de passe incorrect' });
    }

    const token = `marlo_${user.id}_${Date.now()}`;

    return sendJson(200, {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        rbacRole: user.rbacRole || 'admin',
        email: user.email,
        hue: user.hue || 1
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        currency: tenant.currency || 'EUR'
      }
    });
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    const db = readDb();
    const tenantId = url.searchParams.get('tenantId') || db.tenants[0]?.id || 'northbank-post';
    const tenant = db.tenants.find(t => t.id === tenantId) || db.tenants[0];
    const tenantData = db.tenantsData[tenant.id] || {};
    const user = (tenantData.members && tenantData.members[0]) || { id: 'owner', name: 'Admin', rbacRole: 'admin' };

    return sendJson(200, {
      success: true,
      user,
      tenant
    });
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return sendJson(200, { success: true, message: 'Déconnexion réussie' });
  }

  // GET & POST /api/tenants/:id/users
  const usersMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/users$/);
  if (usersMatch && method === 'GET') {
    const tenantId = usersMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    return sendJson(200, {
      success: true,
      users: tenantData.members || []
    });
  }

  if (usersMatch && method === 'POST') {
    const tenantId = usersMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const body = await parseBody();
    if (!body || !body.name || !body.email) {
      return sendJson(400, { success: false, error: 'Nom et Email obligatoires' });
    }

    tenantData.members = tenantData.members || [];
    const newUser = {
      id: `mem-${Date.now()}`,
      name: body.name,
      role: body.role || 'Collaborateur',
      rbacRole: body.rbacRole || 'member',
      email: body.email,
      password: body.password || 'marlo2026',
      hue: Math.floor(Math.random() * 6) + 1,
      capacity: Number(body.capacity) || 35,
      skill: body.skill || 'general',
      status: 'in'
    };

    tenantData.members.push(newUser);
    writeDb(db);

    return sendJson(201, {
      success: true,
      message: 'Utilisateur créé avec succès',
      user: newUser
    });
  }

  // ==========================================
  // ACHATS, NOTES DE FRAIS & FOURNISSEURS (OPTION D)
  // ==========================================

  // GET /api/tenants/:id/purchases
  const purchasesMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases$/);
  if (purchasesMatch && method === 'GET') {
    const tenantId = purchasesMatch[1];
    const db = readDb();
    const tenant = db.tenants.find(t => t.id === tenantId);
    if (!tenant) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const tenantData = db.tenantsData[tenantId] || {};
    const orders = tenantData.purchaseOrders || [];
    const expenses = tenantData.expenses || [];
    const vendors = tenantData.vendors || [];

    const totalSpentHT = orders
      .filter(o => o.status === 'billed' || o.status === 'received')
      .reduce((sum, o) => sum + (Number(o.amountHT) || 0), 0) +
      expenses
      .filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + (Number(e.amountHT) || 0), 0);

    const pendingOrdersCount = orders.filter(o => o.status === 'draft' || o.status === 'sent').length;
    const pendingExpensesCount = expenses.filter(e => e.status === 'pending').length;

    return sendJson(200, {
      success: true,
      orders,
      expenses,
      vendors,
      currency: tenant.currency || 'EUR',
      kpis: {
        totalSpentHT,
        pendingOrdersCount,
        pendingExpensesCount,
        vendorsCount: vendors.length
      }
    });
  }

  // POST /api/tenants/:id/purchases/orders (Créer un bon de commande)
  const createOrderMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases\/orders$/);
  if (createOrderMatch && method === 'POST') {
    const tenantId = createOrderMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const body = await parseBody();
    tenantData.purchaseOrders = tenantData.purchaseOrders || [];

    const nextNum = (tenantData.purchaseOrders.length + 1).toString().padStart(3, '0');
    const orderNumber = `PO-2026-${nextNum}`;
    const ht = Number(body.amountHT) || 0;
    const rate = Number(body.vatRate) || 20;
    const vat = Math.round(ht * (rate / 100) * 100) / 100;

    const newOrder = {
      id: `po-${Date.now()}`,
      number: orderNumber,
      vendorId: body.vendorId || 'ven-1',
      vendorName: body.vendorName || 'Fournisseur Externe',
      title: body.title || 'Commande de fournitures / prestations',
      date: Date.now(),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate).getTime() : (Date.now() + 7 * 86400000),
      amountHT: ht,
      vatRate: rate,
      vatAmount: vat,
      totalTTC: ht + vat,
      status: 'sent',
      account: body.account || '606000',
      accountName: body.accountName || 'Achats & Fournitures',
      items: [
        { description: body.title || 'Ligne de commande', quantity: 1, unitPriceHT: ht, vatRate: rate, totalHT: ht }
      ]
    };

    tenantData.purchaseOrders.unshift(newOrder);
    writeDb(db);

    return sendJson(201, { success: true, message: 'Bon de commande créé', order: newOrder });
  }

  // POST /api/tenants/:id/purchases/orders/:orderId/bill (Valider la facture fournisseur & Écriture comptable)
  const billOrderMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases\/orders\/([a-zA-Z0-9_-]+)\/bill$/);
  if (billOrderMatch && method === 'POST') {
    const [_, tenantId, orderId] = billOrderMatch;
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.purchaseOrders = tenantData.purchaseOrders || [];
    tenantData.accountingEntries = tenantData.accountingEntries || [];

    const order = tenantData.purchaseOrders.find(o => o.id === orderId);
    if (!order) return sendJson(404, { success: false, error: 'Commande introuvable' });

    order.status = 'billed';
    order.billedAt = Date.now();

    // Passer automatiquement l'écriture en partie double dans le journal des Achats (AC)
    const dStr = new Date().toISOString().split('T')[0];
    const ecrBase = tenantData.accountingEntries.length + 1;

    tenantData.accountingEntries.push(
      {
        id: `entry-${Date.now()}-1`,
        num: `ECR${ecrBase.toString().padStart(5, '0')}`,
        journal: 'AC',
        journalName: 'Achats',
        date: dStr,
        piece: order.number,
        account: order.account || '606000',
        accountName: order.accountName || 'Achats non stockés',
        label: `Facture ${order.vendorName} - ${order.title}`,
        debit: order.amountHT,
        credit: 0,
        reconciled: false
      },
      {
        id: `entry-${Date.now()}-2`,
        num: `ECR${(ecrBase + 1).toString().padStart(5, '0')}`,
        journal: 'AC',
        journalName: 'Achats',
        date: dStr,
        piece: order.number,
        account: '445660',
        accountName: 'TVA Déductible sur biens et services (20%)',
        label: `TVA déductible s/ ${order.number}`,
        debit: order.vatAmount,
        credit: 0,
        reconciled: false
      },
      {
        id: `entry-${Date.now()}-3`,
        num: `ECR${(ecrBase + 2).toString().padStart(5, '0')}`,
        journal: 'AC',
        journalName: 'Achats',
        date: dStr,
        piece: order.number,
        account: '401000',
        accountName: 'Fournisseurs d\'exploitation',
        label: `Dette ${order.vendorName} - ${order.number}`,
        debit: 0,
        credit: order.totalTTC,
        reconciled: false
      }
    );

    writeDb(db);
    return sendJson(200, {
      success: true,
      message: 'Facture fournisseur validée et comptabilisée dans le Journal des Achats (AC)',
      order
    });
  }

  // POST /api/tenants/:id/purchases/expenses (Déposer une note de frais)
  const createExpMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases\/expenses$/);
  if (createExpMatch && method === 'POST') {
    const tenantId = createExpMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const body = await parseBody();
    tenantData.expenses = tenantData.expenses || [];

    const nextNum = (tenantData.expenses.length + 1).toString().padStart(3, '0');
    const ttc = Number(body.amountTTC) || 0;
    const ht = Math.round((ttc / 1.2) * 100) / 100;
    const vat = Math.round((ttc - ht) * 100) / 100;

    const newExp = {
      id: `exp-${Date.now()}`,
      number: `NDF-2026-${nextNum}`,
      userId: body.userId || 'mem2',
      userName: body.userName || 'Lucas Martin',
      date: Date.now(),
      category: body.category || 'Frais de mission',
      description: body.description || 'Dépense professionnelle engagée',
      amountHT: ht,
      vatAmount: vat,
      amountTTC: ttc,
      status: 'pending',
      receipt: body.receipt || 'recu_justificatif.pdf'
    };

    tenantData.expenses.unshift(newExp);
    writeDb(db);

    return sendJson(201, { success: true, message: 'Note de frais enregistrée', expense: newExp });
  }

  // POST /api/tenants/:id/purchases/expenses/:expId/approve
  const approveExpMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases\/expenses\/([a-zA-Z0-9_-]+)\/approve$/);
  if (approveExpMatch && method === 'POST') {
    const [_, tenantId, expId] = approveExpMatch;
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.expenses = tenantData.expenses || [];
    const exp = tenantData.expenses.find(e => e.id === expId);
    if (!exp) return sendJson(404, { success: false, error: 'Note de frais introuvable' });

    exp.status = 'approved';
    exp.approvedAt = Date.now();

    writeDb(db);
    return sendJson(200, { success: true, message: 'Note de frais approuvée', expense: exp });
  }

  // POST /api/tenants/:id/purchases/vendors
  const createVendorMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/purchases\/vendors$/);
  if (createVendorMatch && method === 'POST') {
    const tenantId = createVendorMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    const body = await parseBody();
    tenantData.vendors = tenantData.vendors || [];

    const newVen = {
      id: `ven-${Date.now()}`,
      name: body.name || 'Nouveau Fournisseur',
      category: body.category || 'Services & Prestations',
      contact: body.contact || 'Service Comptabilité Fournisseurs',
      email: body.email || 'compta@fournisseur.com',
      phone: body.phone || '+33 (0)1 00 00 00 00',
      siret: body.siret || '000 000 000 00000',
      vatNumber: body.vatNumber || 'FR 00 000000000',
      iban: body.iban || 'FR76 0000 0000 0000 0000 0000 000',
      bic: body.bic || 'BANKFRPPXXX',
      totalSpent: 0,
      activeOrders: 0
    };

    tenantData.vendors.unshift(newVen);
    writeDb(db);

    return sendJson(201, { success: true, message: 'Fournisseur ajouté', vendor: newVen });
  }


  // ==========================================
  // INVENTORY & STOCK MANAGEMENT (MODULE STOCK)
  // ==========================================

  // GET /api/tenants/:id/inventory
  const getInventoryMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/inventory$/);
  if (getInventoryMatch && method === 'GET') {
    const tenantId = getInventoryMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.inventoryProducts = tenantData.inventoryProducts || [];
    tenantData.inventoryMovements = tenantData.inventoryMovements || [];

    // Recalculate statuses
    tenantData.inventoryProducts.forEach(p => {
      const q = Number(p.quantity) || 0;
      const min = Number(p.minQuantity) || 0;
      if (q <= 0) p.status = 'out_of_stock';
      else if (q <= min) p.status = 'low_stock';
      else p.status = 'in_stock';
    });

    const totalValuation = tenantData.inventoryProducts.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.costPrice) || 0)), 0);
    const totalPotentialRevenue = tenantData.inventoryProducts.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.sellingPrice) || 0)), 0);
    const totalUnits = tenantData.inventoryProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const lowStockCount = tenantData.inventoryProducts.filter(p => p.status === 'low_stock').length;
    const outOfStockCount = tenantData.inventoryProducts.filter(p => p.status === 'out_of_stock').length;

    return sendJson(200, {
      success: true,
      products: tenantData.inventoryProducts,
      movements: tenantData.inventoryMovements.sort((a, b) => b.date - a.date),
      stats: {
        totalProducts: tenantData.inventoryProducts.length,
        totalUnits,
        totalValuation: Math.round(totalValuation * 100) / 100,
        totalPotentialRevenue: Math.round(totalPotentialRevenue * 100) / 100,
        potentialMargin: Math.round((totalPotentialRevenue - totalValuation) * 100) / 100,
        lowStockCount,
        outOfStockCount
      }
    });
  }

  // POST /api/tenants/:id/inventory/products (Créer un article)
  const postProductMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/inventory\/products$/);
  if (postProductMatch && method === 'POST') {
    const tenantId = postProductMatch[1];
    const body = await parseBody(req);
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.inventoryProducts = tenantData.inventoryProducts || [];
    tenantData.inventoryMovements = tenantData.inventoryMovements || [];

    const quantity = Number(body.quantity) || 0;
    const minQuantity = Number(body.minQuantity) || 0;
    const costPrice = Number(body.costPrice) || 0;
    const sellingPrice = Number(body.sellingPrice) || 0;

    let status = 'in_stock';
    if (quantity <= 0) status = 'out_of_stock';
    else if (quantity <= minQuantity) status = 'low_stock';

    const newProduct = {
      id: 'prod-' + Date.now(),
      sku: body.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: body.name || 'Nouvel Article',
      category: body.category || 'Général',
      unit: body.unit || 'unité',
      quantity,
      minQuantity,
      costPrice,
      sellingPrice,
      location: body.location || 'Entrepôt Principal',
      status
    };

    tenantData.inventoryProducts.unshift(newProduct);

    if (quantity > 0) {
      tenantData.inventoryMovements.unshift({
        id: 'mov-' + Date.now(),
        date: Date.now(),
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'in',
        quantity,
        reference: 'Stock initial',
        user: body.user || 'Administrateur',
        notes: 'Initialisation de la fiche produit'
      });
    }

    writeDb(db);
    return sendJson(201, { success: true, message: 'Article créé avec succès', product: newProduct });
  }

  // POST /api/tenants/:id/inventory/movements (Mouvement de stock Entrée/Sortie/Ajustement)
  const postMovementMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/inventory\/movements$/);
  if (postMovementMatch && method === 'POST') {
    const tenantId = postMovementMatch[1];
    const body = await parseBody(req);
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.inventoryProducts = tenantData.inventoryProducts || [];
    tenantData.inventoryMovements = tenantData.inventoryMovements || [];

    const product = tenantData.inventoryProducts.find(p => p.id === body.productId);
    if (!product) return sendJson(404, { success: false, error: 'Article introuvable' });

    const qty = Math.abs(Number(body.quantity)) || 0;
    if (qty === 0) return sendJson(400, { success: false, error: 'Quantité invalide' });

    if (body.type === 'in') {
      product.quantity = (Number(product.quantity) || 0) + qty;
    } else if (body.type === 'out') {
      if ((Number(product.quantity) || 0) < qty) {
        return sendJson(400, { success: false, error: 'Stock insuffisant pour cette sortie (' + product.quantity + ' dispo)' });
      }
      product.quantity = (Number(product.quantity) || 0) - qty;
    } else if (body.type === 'adjustment') {
      product.quantity = qty;
    }

    if (product.quantity <= 0) product.status = 'out_of_stock';
    else if (product.quantity <= (Number(product.minQuantity) || 0)) product.status = 'low_stock';
    else product.status = 'in_stock';

    const newMovement = {
      id: 'mov-' + Date.now(),
      date: Date.now(),
      productId: product.id,
      productName: product.name,
      type: body.type || 'in',
      quantity: qty,
      reference: body.reference || 'Mouvement manuel',
      user: body.user || 'Gestionnaire de Stock',
      notes: body.notes || ''
    };

    tenantData.inventoryMovements.unshift(newMovement);
    writeDb(db);

    return sendJson(201, {
      success: true,
      message: 'Mouvement de stock enregistré',
      movement: newMovement,
      product
    });
  }


  // ==========================================
  // CLIENT PORTAL & ELECTRONIC SIGNATURE
  // ==========================================

  // GET /api/portal/quote/:quoteId (Accès public devis sécurisé)
  const getPortalQuoteMatch = pathname.match(/^\/api\/portal\/quote\/([a-zA-Z0-9_-]+)$/);
  if (getPortalQuoteMatch && method === 'GET') {
    const quoteId = getPortalQuoteMatch[1];
    const db = readDb();

    // Chercher le devis dans tous les tenants
    let foundQuote = null;
    let foundTenant = null;

    for (const tenant of db.tenants) {
      const tData = db.tenantsData[tenant.id];
      if (tData && tData.quotes) {
        const q = tData.quotes.find(item => item.id === quoteId || item.number === quoteId);
        if (q) {
          foundQuote = q;
          foundTenant = tenant;
          break;
        }
      }
    }

    if (!foundQuote || !foundTenant) {
      return sendJson(404, { success: false, error: 'Devis introuvable ou lien expiré' });
    }

    const tData = db.tenantsData[foundTenant.id];
    return sendJson(200, {
      success: true,
      quote: foundQuote,
      company: {
        id: foundTenant.id,
        name: foundTenant.name,
        sector: foundTenant.sector,
        settings: tData.settings || {}
      }
    });
  }

  // POST /api/portal/quote/:quoteId/sign (Signature électronique client)
  const postPortalSignMatch = pathname.match(/^\/api\/portal\/quote\/([a-zA-Z0-9_-]+)\/sign$/);
  if (postPortalSignMatch && method === 'POST') {
    const quoteId = postPortalSignMatch[1];
    const body = await parseBody(req);
    const db = readDb();

    let foundQuote = null;
    let foundTenant = null;
    let tenantData = null;

    for (const tenant of db.tenants) {
      const tData = db.tenantsData[tenant.id];
      if (tData && tData.quotes) {
        const q = tData.quotes.find(item => item.id === quoteId || item.number === quoteId);
        if (q) {
          foundQuote = q;
          foundTenant = tenant;
          tenantData = tData;
          break;
        }
      }
    }

    if (!foundQuote || !foundTenant) {
      return sendJson(404, { success: false, error: 'Devis introuvable' });
    }

    const signedAt = Date.now();
    foundQuote.status = 'won';
    foundQuote.signedAt = signedAt;
    foundQuote.signerName = body.signerName || 'Client';
    foundQuote.signerRole = body.signerRole || 'Représentant Légal';
    foundQuote.signatureDataUrl = body.signatureDataUrl || null;
    foundQuote.signatureIp = req.socket.remoteAddress || '127.0.0.1';

    // Log in activity feed
    tenantData.activity = tenantData.activity || [];
    tenantData.activity.unshift({
      id: 'act-' + Date.now(),
      type: 'signature',
      title: 'Devis ' + foundQuote.number + ' signé en ligne !',
      desc: body.signerName + ' (' + (body.signerRole || 'Client') + ') a validé le devis de ' + (foundQuote.totalTTC || foundQuote.amount || 0).toLocaleString('fr-FR') + ' € TTC.',
      t: signedAt
    });

    writeDb(db);

    return sendJson(200, {
      success: true,
      message: 'Devis accepté et signé électroniquement avec succès',
      quote: foundQuote
    });
  }


  // ==========================================
  // HR, EMPLOYEES & LEAVES MANAGEMENT
  // ==========================================

  // GET /api/tenants/:id/hr
  const getHrMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/hr$/);
  if (getHrMatch && method === 'GET') {
    const tenantId = getHrMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.employees = tenantData.employees || [];
    tenantData.leaves = tenantData.leaves || [];

    const totalEmployees = tenantData.employees.length;
    const pendingLeaves = tenantData.leaves.filter(l => l.status === 'pending');
    const totalGrossPayroll = tenantData.employees.reduce((s, e) => s + (Number(e.salaryBrut) || 0), 0);
    const estimatedEmployerCharges = Math.round(totalGrossPayroll * 0.42 * 100) / 100;
    const estimatedEmployeeCharges = Math.round(totalGrossPayroll * 0.22 * 100) / 100;
    const estimatedNetPayroll = Math.round((totalGrossPayroll - estimatedEmployeeCharges) * 100) / 100;
    const totalCompanyCost = Math.round((totalGrossPayroll + estimatedEmployerCharges) * 100) / 100;

    return sendJson(200, {
      success: true,
      employees: tenantData.employees,
      leaves: tenantData.leaves.sort((a, b) => b.requestedAt - a.requestedAt),
      stats: {
        totalEmployees,
        pendingLeavesCount: pendingLeaves.length,
        totalGrossPayroll,
        estimatedEmployerCharges,
        estimatedNetPayroll,
        totalCompanyCost
      }
    });
  }

  // POST /api/tenants/:id/hr/employees (Créer un salarié)
  const postEmployeeMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/hr\/employees$/);
  if (postEmployeeMatch && method === 'POST') {
    const tenantId = postEmployeeMatch[1];
    const body = await parseBody(req);
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.employees = tenantData.employees || [];

    const newEmp = {
      id: 'emp-' + Date.now(),
      name: body.name || 'Nouveau Salarié',
      role: body.role || 'Poste non défini',
      department: body.department || 'Production',
      email: body.email || '',
      phone: body.phone || '',
      contractType: body.contractType || 'CDI',
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      salaryBrut: Number(body.salaryBrut) || 3000,
      paidLeavesBalance: Number(body.paidLeavesBalance) || 25,
      rttBalance: Number(body.rttBalance) || 5,
      status: 'active'
    };

    tenantData.employees.unshift(newEmp);
    writeDb(db);

    return sendJson(201, { success: true, message: 'Fiche collaborateur créée avec succès', employee: newEmp });
  }

  // POST /api/tenants/:id/hr/leaves (Poser une demande de congé)
  const postLeaveMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/hr\/leaves$/);
  if (postLeaveMatch && method === 'POST') {
    const tenantId = postLeaveMatch[1];
    const body = await parseBody(req);
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.employees = tenantData.employees || [];
    tenantData.leaves = tenantData.leaves || [];

    const emp = tenantData.employees.find(e => e.id === body.employeeId);
    if (!emp) return sendJson(404, { success: false, error: 'Salarié introuvable' });

    const newLeave = {
      id: 'leave-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      type: body.type || 'paid',
      typeName: body.type === 'rtt' ? 'RTT' : body.type === 'sick' ? 'Maladie' : 'Congés Payés',
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      endDate: body.endDate || new Date().toISOString().slice(0, 10),
      daysCount: Number(body.daysCount) || 1,
      status: 'pending',
      reason: body.reason || '',
      requestedAt: Date.now()
    };

    tenantData.leaves.unshift(newLeave);
    writeDb(db);

    return sendJson(201, { success: true, message: 'Demande de congés enregistrée', leave: newLeave });
  }

  // POST /api/tenants/:id/hr/leaves/:leaveId/approve (Approuver une demande de congé)
  const approveLeaveMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/hr\/leaves\/([a-zA-Z0-9_-]+)\/approve$/);
  if (approveLeaveMatch && method === 'POST') {
    const [_, tenantId, leaveId] = approveLeaveMatch;
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.employees = tenantData.employees || [];
    tenantData.leaves = tenantData.leaves || [];

    const leave = tenantData.leaves.find(l => l.id === leaveId);
    if (!leave) return sendJson(404, { success: false, error: 'Demande introuvable' });

    leave.status = 'approved';
    leave.approver = 'Alexandre Martin (Manager)';
    leave.approvedAt = Date.now();

    // Déduire les jours du solde de l'employé
    const emp = tenantData.employees.find(e => e.id === leave.employeeId);
    if (emp) {
      if (leave.type === 'paid') {
        emp.paidLeavesBalance = Math.max(0, (Number(emp.paidLeavesBalance) || 0) - leave.daysCount);
      } else if (leave.type === 'rtt') {
        emp.rttBalance = Math.max(0, (Number(emp.rttBalance) || 0) - leave.daysCount);
      }
    }

    writeDb(db);
    return sendJson(200, { success: true, message: 'Demande de congés approuvée et solde actualisé', leave, employee: emp });
  }


  // ==========================================
  // BANKING, CASHFLOW RUNWAY & AI RECONCILIATION
  // ==========================================

  // GET /api/tenants/:id/banking
  const getBankingMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/banking$/);
  if (getBankingMatch && method === 'GET') {
    const tenantId = getBankingMatch[1];
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.bankTransactions = tenantData.bankTransactions || [];
    tenantData.invoices = tenantData.invoices || [];
    tenantData.quotes = tenantData.quotes || [];
    tenantData.purchaseOrders = tenantData.purchaseOrders || [];

    // Current bank balance
    const currentBalance = 48520.00;

    // Incoming pipeline (pending invoices + accepted quotes)
    const pendingInvoicesAmount = tenantData.invoices
      .filter(i => i.status === 'sent')
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const acceptedQuotesAmount = tenantData.quotes
      .filter(q => q.status === 'won' || q.status === 'accepted')
      .reduce((s, q) => s + (Number(q.amount) || 0), 0);

    const totalExpectedInflows = pendingInvoicesAmount + (acceptedQuotesAmount * 0.7); // 70% realization

    // Outgoing commitments (PO pending + monthly fixed expenses)
    const pendingPoAmount = tenantData.purchaseOrders
      .filter(p => p.status !== 'billed')
      .reduce((s, p) => s + (Number(p.totalTTC) || 0), 0);

    const monthlyFixedCharges = 12500; // loyer, salaires, serveurs

    // Forecast at 30, 60, 90 days
    const forecast30 = Math.round(currentBalance + pendingInvoicesAmount - (pendingPoAmount + monthlyFixedCharges));
    const forecast60 = Math.round(forecast30 + (acceptedQuotesAmount * 0.5) - monthlyFixedCharges);
    const forecast90 = Math.round(forecast60 + (acceptedQuotesAmount * 0.5) - monthlyFixedCharges);

    const runwayMonths = Math.round((currentBalance / monthlyFixedCharges) * 10) / 10;

    return sendJson(200, {
      success: true,
      currentBalance,
      transactions: tenantData.bankTransactions,
      runwayMonths,
      forecast: {
        now: currentBalance,
        d30: forecast30,
        d60: forecast60,
        d90: forecast90
      },
      stats: {
        unreconciledCount: tenantData.bankTransactions.filter(t => !t.reconciled).length,
        totalExpectedInflows,
        monthlyFixedCharges
      }
    });
  }

  // POST /api/tenants/:id/banking/reconcile
  const postReconcileMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/banking\/reconcile$/);
  if (postReconcileMatch && method === 'POST') {
    const tenantId = postReconcileMatch[1];
    const body = await parseBody(req);
    const db = readDb();
    const tenantData = db.tenantsData[tenantId];
    if (!tenantData) return sendJson(404, { success: false, error: 'Entreprise introuvable' });

    tenantData.bankTransactions = tenantData.bankTransactions || [];
    const btx = tenantData.bankTransactions.find(t => t.id === body.transactionId);
    if (!btx) return sendJson(404, { success: false, error: 'Transaction introuvable' });

    btx.reconciled = true;
    btx.reconciledAt = Date.now();
    btx.reconciledBy = 'IA Rapprochement Automatisé';

    writeDb(db);
    return sendJson(200, { success: true, message: 'Transaction rapprochée avec succès', transaction: btx });
  }

  // POST /api/tenants/:id/banking/ai-chat (Copilote IA Financier)
  const postAiChatMatch = pathname.match(/^\/api\/tenants\/([a-zA-Z0-9_-]+)\/banking\/ai-chat$/);
  if (postAiChatMatch && method === 'POST') {
    const tenantId = postAiChatMatch[1];
    const body = await parseBody(req);
    const prompt = (body.prompt || '').toLowerCase();

    let responseText = "";

    if (prompt.includes('trésorerie') || prompt.includes('solde') || prompt.includes('banque')) {
      responseText = "Votre solde bancaire actuel est de 48 520,00 €. Grâce à la signature du devis Vortex Gaming (26 400 € TTC) et aux factures en attente (9 100 €), votre visibilité financière est de 4.2 mois de runway sécurisé.";
    } else if (prompt.includes('tva') || prompt.includes('impot') || prompt.includes('fisc')) {
      responseText = "Pour la déclaration TVA de ce mois : TVA collectée sur ventes : 3 640,00 € | TVA déductible sur achats : 740,00 €. Votre solde net prévisionnel à reverser au Trésor Public est de 2 900,00 € le 20 du mois.";
    } else if (prompt.includes('relance') || prompt.includes('retard') || prompt.includes('impayé')) {
      responseText = "Modèle de relance prêt pour Lumina Studio (Facture FAC-2026-001 de 9 100,00 € échue) :\n\n« Chère Éléonore,\n\nSauf erreur de notre part, la facture FAC-2026-001 du 02/11/2026 concernant la Direction Artistique reste en attente de règlement. Pourriez-vous nous confirmer l'ordre de virement ?\nBien à vous, Alexandre Martin »";
    } else {
      responseText = "Analyse financière Marlo : Votre situation de gestion est saine. Ratio de marge commerciale brute : 64%, trésorerie positive et 100% des déclarations fiscales FEC à jour.";
    }

    return sendJson(200, {
      success: true,
      answer: responseText,
      timestamp: Date.now()
    });
  }

  // 404 Route API
  return sendJson(404, { success: false, error: 'Route API introuvable' });
}

module.exports = {
  handleApiRequest
};
