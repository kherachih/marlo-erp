const { readDb, writeDb, CATALOG_MODULES, PRESETS, generateStarterDataForTenant } = require('./db');

function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Helper pour réponse JSON
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

  // 404 Route API
  return sendJson(404, { success: false, error: 'Route API introuvable' });
}

module.exports = {
  handleApiRequest
};
