const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'erp_store.json');

// S'assurer que le dossier de données existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Catalogue Global des Modules Disponibles (Type Odoo)
const CATALOG_MODULES = [
  {
    id: 'overview',
    name: 'Overview & KPIs',
    category: 'Vue d\'ensemble',
    description: 'Tableau de bord central récapitulatif avec indicateurs clés de performance et synthèse en direct.',
    icon: 'grid',
    isCore: true,
    defaultEnabled: true
  },
  {
    id: 'crm',
    name: 'CRM & Prospects',
    category: 'Ventes',
    description: 'Pipeline commercial, qualification des opportunités et gestion de la relation client.',
    icon: 'funnel',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'tasks',
    name: 'Tâches (Kanban)',
    category: 'Opérations',
    description: 'Tableau Kanban interactif avec glisser-déposer des tâches (Up next, In progress, Done).',
    icon: 'kanban',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'projects',
    name: 'Projets & Timeline',
    category: 'Opérations',
    description: 'Suivi de la ligne de temps des livrables (Gantt), jalons de production et budgets projets.',
    icon: 'folder',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'calendar',
    name: 'Calendrier & Suites',
    category: 'Opérations',
    description: 'Réservation des suites de montage, studios de tournage, postes de travail et équipements.',
    icon: 'calendar',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'team',
    name: 'Équipe & Workload',
    category: 'Ressources Humaines',
    description: 'Capacité de travail, feuilles de temps (timesheets) et heures loggées par collaborateur.',
    icon: 'users',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'budget',
    name: 'Facturation & Devis',
    category: 'Finance',
    description: 'Création et émission des devis, facturation client avec tampons PAID et exports comptables.',
    icon: 'wallet',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'accounting',
    name: 'Comptabilité Générale',
    category: 'Finance',
    description: 'Journaux comptables, plan de comptes, suivi de la TVA et rapprochement financier.',
    icon: 'receipt',
    isCore: false,
    defaultEnabled: false
  },
  {
    id: 'activity',
    name: 'Fil d\'Activité',
    category: 'Communication',
    description: 'Audit trail des modifications, livraisons de projets et historique des actions d\'équipe.',
    icon: 'activity',
    isCore: false,
    defaultEnabled: true
  },
  {
    id: 'inbox',
    name: 'Messagerie & Inbox',
    category: 'Communication',
    description: 'Boîte de réception centralisée pour les notifications studio, messages clients et alertes.',
    icon: 'inbox',
    isCore: false,
    defaultEnabled: true
  }
];

// Presets d'onboarding par industrie
const PRESETS = {
  design_agency: {
    name: 'Studio de Création, Média & Design',
    modules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity', 'inbox']
  },
  consulting: {
    name: 'Cabinet de Conseil & Services B2B',
    modules: ['overview', 'crm', 'tasks', 'projects', 'team', 'budget', 'accounting', 'inbox']
  },
  sales_trade: {
    name: 'Commerce, Négoce & Vente B2B',
    modules: ['overview', 'crm', 'budget', 'accounting', 'activity', 'inbox']
  },
  construction: {
    name: 'BTP, Architecture & Travaux',
    modules: ['overview', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity']
  },
  general: {
    name: 'Entreprise Générale & PME',
    modules: ['overview', 'crm', 'tasks', 'projects', 'budget', 'inbox']
  },
  minimal: {
    name: 'Essentiel (Tâches & Factures)',
    modules: ['overview', 'tasks', 'projects', 'budget']
  }
};

const DEFAULT_CRM_LEADS = [
  {
    id: 'lead-1',
    tenantId: 'northbank-post',
    title: 'Campagne Spot TV 30s - Automne 2026',
    company: 'Volvo France',
    contactName: 'Margaux Lefebvre',
    contactEmail: 'm.lefebvre@volvocars.fr',
    contactPhone: '+33 6 42 18 90 23',
    value: 38000,
    currency: 'EUR',
    stage: 'proposal', // 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
    probability: 75,
    expectedClose: '2026-11-25',
    assignedTo: { id: 'dara', name: 'Dara Whitfield', role: 'Head of Post' },
    notes: 'Brief créatif validé. Proposition budgétaire transmise avec 2 options de montage son immersif Dolby Atmos.',
    tags: ['Automobile', 'Spot TV', 'Dolby Atmos'],
    createdAt: '2026-11-05T09:30:00.000Z'
  },
  {
    id: 'lead-2',
    tenantId: 'northbank-post',
    title: 'Étalonnage & Sound Design Long-Métrage',
    company: 'Pathé Films',
    contactName: 'Antoine Bérard',
    contactEmail: 'aberard@pathe.com',
    contactPhone: '+33 6 12 78 45 90',
    value: 62000,
    currency: 'EUR',
    stage: 'negotiation',
    probability: 90,
    expectedClose: '2026-11-20',
    assignedTo: { id: 'dara', name: 'Dara Whitfield', role: 'Head of Post' },
    notes: 'Validation des créneaux en Suite 01 (HDR DaVinci) et Suite 03 Son. Contrat en relecture juridique.',
    tags: ['Cinéma', 'Étalonnage HDR', 'Long-Métrage'],
    createdAt: '2026-11-02T14:15:00.000Z'
  },
  {
    id: 'lead-3',
    tenantId: 'northbank-post',
    title: 'Série Animation 3D (Teaser 60s)',
    company: 'Ubisoft Originals',
    contactName: 'Sébastien Rey',
    contactEmail: 's.rey@ubisoft.com',
    contactPhone: '+33 7 89 23 45 12',
    value: 45000,
    currency: 'EUR',
    stage: 'qualified',
    probability: 50,
    expectedClose: '2026-12-05',
    assignedTo: { id: 'maya', name: 'Maya Lin', role: 'Lead Artist' },
    notes: 'Revue de concept art et test de rendu Blender/Unreal. Attente de la validation du comité de production.',
    tags: ['Gaming', 'Animation 3D', 'Unreal Engine'],
    createdAt: '2026-11-08T11:00:00.000Z'
  },
  {
    id: 'lead-4',
    tenantId: 'northbank-post',
    title: 'Post-Production Clip Musical & VFX',
    company: 'Wagram Music',
    contactName: 'Chloé Girard',
    contactEmail: 'c.girard@wagram.fr',
    contactPhone: '+33 6 55 44 33 22',
    value: 14500,
    currency: 'EUR',
    stage: 'new',
    probability: 25,
    expectedClose: '2026-12-15',
    assignedTo: { id: 'hasib', name: 'Hasib', role: 'Producer' },
    notes: 'Formulaire de contact web reçu ce matin. Tournage prévu fin novembre, livraison mi-décembre.',
    tags: ['Musique', 'VFX', 'Clip'],
    createdAt: '2026-11-12T08:45:00.000Z'
  },
  {
    id: 'lead-5',
    tenantId: 'northbank-post',
    title: 'Brand Film & Heritage Video',
    company: 'Mossgiel Distillery',
    contactName: 'James MacLeod',
    contactEmail: 'j.macleod@mossgiel.co.uk',
    contactPhone: '+44 7700 900123',
    value: 28000,
    currency: 'EUR',
    stage: 'won',
    probability: 100,
    expectedClose: '2026-11-08',
    assignedTo: { id: 'dara', name: 'Dara Whitfield', role: 'Head of Post' },
    notes: 'Contrat signé ! Converti en projet de production actif et acompte de 40% émis.',
    tags: ['Luxe & Spiritueux', 'Brand Film'],
    createdAt: '2026-10-28T10:00:00.000Z'
  }
];

// Données initiales par défaut (Seed)
const INITIAL_DATA = {
  tenants: [
    {
      id: 'northbank-post',
      name: 'Northbank Post',
      slug: 'northbank-post',
      industry: 'design_agency',
      currency: 'EUR',
      plan: 'enterprise',
      activeModules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'activity', 'budget', 'inbox'],
      createdAt: '2026-11-01T08:00:00.000Z'
    },
    {
      id: 'atelier-design-co',
      name: 'Atelier Design & Co',
      slug: 'atelier-design-co',
      industry: 'design_agency',
      currency: 'EUR',
      plan: 'pro',
      activeModules: ['overview', 'crm', 'tasks', 'projects', 'team', 'budget'],
      createdAt: '2026-11-10T10:30:00.000Z'
    },
    {
      id: 'techflow-consulting',
      name: 'TechFlow Consulting',
      slug: 'techflow-consulting',
      industry: 'consulting',
      currency: 'EUR',
      plan: 'pro',
      activeModules: ['overview', 'crm', 'tasks', 'team', 'budget', 'accounting', 'inbox'],
      createdAt: '2026-11-12T14:15:00.000Z'
    }
  ],
  modules: CATALOG_MODULES,
  presets: PRESETS,
  crmLeads: DEFAULT_CRM_LEADS
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.crmLeads) {
      data.crmLeads = [...DEFAULT_CRM_LEADS];
      writeDb(data);
    }
    if (!data.tenantsData) {
      data.tenantsData = {};
      writeDb(data);
    }
    return data;
  } catch (e) {
    console.error('Error reading db file, restoring initial data:', e);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Générateur de données de démarrage isolées et personnalisées selon les réponses au questionnaire
function generateStarterDataForTenant(tenant) {
  const now = Date.now();
  const day = 86400000;
  const ownerName = tenant.ownerName || 'Admin ' + tenant.name;
  const ownerEmail = tenant.ownerEmail || `admin@${tenant.slug}.com`;
  const ownerRole = tenant.ownerRole || 'Fondateur / CEO';

  const isAgency = tenant.industry === 'design_agency';
  const isConsulting = tenant.industry === 'consulting';
  const isTrade = tenant.industry === 'sales_trade';
  const isConstruction = tenant.industry === 'construction';

  // Projets d'exemple selon le métier
  const projects = isConsulting ? [
    {
      id: 'p1',
      name: 'Transformation Digitale & IA',
      client: 'Groupe Alliance',
      status: 'active',
      c: 1,
      start: now - 10 * day,
      due: now + 30 * day,
      budget: 35000,
      team: ['owner', 'mem1']
    },
    {
      id: 'p2',
      name: 'Audit Financier & Organisation',
      client: 'Novatech Labs',
      status: 'active',
      c: 2,
      start: now - 5 * day,
      due: now + 20 * day,
      budget: 18500,
      team: ['owner', 'mem2']
    }
  ] : isTrade ? [
    {
      id: 'p1',
      name: 'Déploiement Partenariats B2B',
      client: 'Centrale Distri',
      status: 'active',
      c: 1,
      start: now - 12 * day,
      due: now + 25 * day,
      budget: 42000,
      team: ['owner', 'mem1']
    },
    {
      id: 'p2',
      name: 'Lancement Catalogue Hiver',
      client: 'Réseau Élite',
      status: 'active',
      c: 2,
      start: now - 4 * day,
      due: now + 15 * day,
      budget: 21000,
      team: ['owner', 'mem2']
    }
  ] : isConstruction ? [
    {
      id: 'p1',
      name: 'Rénovation Éco-responsable Siège Social',
      client: 'ImmoCorp France',
      status: 'active',
      c: 1,
      start: now - 14 * day,
      due: now + 45 * day,
      budget: 85000,
      team: ['owner', 'mem1']
    },
    {
      id: 'p2',
      name: 'Maîtrise d\'Œuvre Lot Fluides & Énergie',
      client: 'Grand Paris Bâtiment',
      status: 'active',
      c: 2,
      start: now - 6 * day,
      due: now + 28 * day,
      budget: 48000,
      team: ['owner', 'mem2']
    }
  ] : isAgency ? [
    {
      id: 'p1',
      name: 'Refonte Identité Visuelle & Direction Artistique',
      client: 'Lumina Studio',
      status: 'active',
      c: 1,
      start: now - 8 * day,
      due: now + 25 * day,
      budget: 28000,
      team: ['owner', 'mem1']
    },
    {
      id: 'p2',
      name: 'Campagne Digitale & Vidéo 3D',
      client: 'Apex Brands',
      status: 'active',
      c: 2,
      start: now - 3 * day,
      due: now + 18 * day,
      budget: 19500,
      team: ['owner', 'mem2']
    }
  ] : [
    {
      id: 'p1',
      name: 'Développement d\'Activité & Contrats Cadres',
      client: 'Partenaire Horizon',
      status: 'active',
      c: 1,
      start: now - 8 * day,
      due: now + 25 * day,
      budget: 25000,
      team: ['owner', 'mem1']
    },
    {
      id: 'p2',
      name: 'Optimisation de la Relation Client',
      client: 'Client Référence',
      status: 'active',
      c: 2,
      start: now - 3 * day,
      due: now + 18 * day,
      budget: 15000,
      team: ['owner', 'mem2']
    }
  ];

  const tasks = [
    {
      id: 't1',
      projectId: 'p1',
      title: 'Cadrage des objectifs et livrables clés',
      desc: 'Réunion de lancement avec les parties prenantes et validation du périmètre.',
      status: 'done',
      who: 'owner',
      kind: 'produce',
      priority: 'high',
      est: 4,
      due: now - 2 * day,
      doneAt: now - 1 * day,
      checks: [
        { id: 'c1', label: 'Brief initial validé', done: true },
        { id: 'c2', label: 'Planning partagé', done: true }
      ]
    },
    {
      id: 't2',
      projectId: 'p1',
      title: 'Élaboration de la proposition technique / créative',
      desc: 'Développement des premières pistes et revue intermédiaire.',
      status: 'doing',
      who: 'mem1',
      kind: 'edit',
      priority: 'high',
      est: 12,
      due: now + 4 * day,
      checks: [
        { id: 'c3', label: 'Première ébauche', done: true },
        { id: 'c4', label: 'Revue interne', done: false }
      ]
    },
    {
      id: 't3',
      projectId: 'p2',
      title: 'Revue finale et préparation des livrables',
      desc: 'Contrôle qualité avant présentation au client.',
      status: 'todo',
      who: 'mem2',
      kind: 'colour',
      priority: 'med',
      est: 8,
      due: now + 7 * day,
      checks: [
        { id: 'c5', label: 'Vérification conformité', done: false }
      ]
    }
  ];

  const invoices = [
    {
      id: 'inv-1',
      number: 'FAC-2026-001',
      client: projects[0].client,
      projectId: 'p1',
      title: 'Acompte de démarrage (40%)',
      amount: Math.round(projects[0].budget * 0.4),
      issued: now - 8 * day,
      due: now + 15 * day,
      status: 'paid',
      paidAt: now - 2 * day
    },
    {
      id: 'inv-2',
      number: 'FAC-2026-002',
      client: projects[1].client,
      projectId: 'p2',
      title: 'Acompte de commande (30%)',
      amount: Math.round(projects[1].budget * 0.3),
      issued: now - 3 * day,
      due: now + 25 * day,
      status: 'sent'
    }
  ];

  const members = [
    {
      id: 'owner',
      name: ownerName,
      role: ownerRole,
      email: ownerEmail,
      hue: 1,
      capacity: 35,
      skill: 'produce',
      status: 'in'
    },
    {
      id: 'mem1',
      name: 'Camille Bernard',
      role: 'Responsable de Projet',
      email: `c.bernard@${tenant.slug}.com`,
      hue: 2,
      capacity: 35,
      skill: 'edit',
      status: 'in'
    },
    {
      id: 'mem2',
      name: 'Lucas Martin',
      role: 'Consultant & Spécialiste',
      email: `l.martin@${tenant.slug}.com`,
      hue: 3,
      capacity: 35,
      skill: 'colour',
      status: 'in'
    }
  ];

  const settings = {
    studio: tenant.name,
    name: ownerName,
    email: ownerEmail,
    role: ownerRole,
    city: tenant.city || 'Paris',
    dayHours: 7.5,
    weekStart: 1,
    notify: { assigned: true, reviews: true, invoices: true, digest: true }
  };

  const crmLeads = [
    {
      id: `lead-${tenant.slug}-1`,
      tenantId: tenant.id,
      title: isConsulting ? 'Audit Conseil Stratégique' : isTrade ? 'Contrat Distribution Réseau' : 'Production Campagne Vidéo',
      company: 'Groupe Horizon',
      contactName: 'Nathalie Roux',
      contactEmail: 'n.roux@horizon.fr',
      contactPhone: '+33 6 11 22 33 44',
      value: 28000,
      currency: tenant.currency || 'EUR',
      stage: 'proposal',
      probability: 70,
      expectedClose: new Date(now + 12 * day).toISOString().split('T')[0],
      assignedTo: { id: 'owner', name: ownerName, role: ownerRole },
      notes: 'Demande reçue via le formulaire de qualification. Proposition budgétaire transmise.',
      tags: ['Opportunité Qualifiée'],
      createdAt: new Date().toISOString()
    },
    {
      id: `lead-${tenant.slug}-2`,
      tenantId: tenant.id,
      title: isConsulting ? 'Accompagnement Organisationnel' : isTrade ? 'Fourniture Équipements' : 'Création Contenus Multimédia',
      company: 'SoluTech France',
      contactName: 'Marc Vasseur',
      contactEmail: 'm.vasseur@solutech.com',
      contactPhone: '+33 6 88 99 00 11',
      value: 16500,
      currency: tenant.currency || 'EUR',
      stage: 'new',
      probability: 30,
      expectedClose: new Date(now + 20 * day).toISOString().split('T')[0],
      assignedTo: { id: 'mem1', name: 'Camille Bernard', role: 'Responsable' },
      notes: 'Premier échange très positif. Rendez-vous de cadrage prévu la semaine prochaine.',
      tags: ['Lead Entrant'],
      createdAt: new Date().toISOString()
    }
  ];

  return {
    version: 1,
    settings,
    members,
    projects,
    tasks,
    invoices,
    crmLeads,
    sessions: [],
    ledger: [
      { id: 'tx-1', t: now - 2 * day, kind: 'in', amount: invoices[0].amount, desc: `Règlement ${invoices[0].number} - ${invoices[0].client}`, cat: 'sales' }
    ],
    threads: [],
    logs: [],
    activity: [
      { id: 'act-1', t: now, who: 'owner', what: `a initialisé l'espace ERP pour ${tenant.name}`, icon: 'sparkle', href: 'overview' }
    ],
    opening: 25000,
    seq: { task: 10, project: 10, session: 10, invoice: 10, tx: 10, log: 10, ticket: 1, thread: 1, msg: 1 }
  };
}

module.exports = {
  readDb,
  writeDb,
  CATALOG_MODULES,
  PRESETS,
  generateStarterDataForTenant
};
