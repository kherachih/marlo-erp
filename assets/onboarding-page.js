import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React hooks
var S = e(); // JSX runtime

// Secteurs d'activité pré-configurés
const SECTORS = [
  {
    id: 'design_agency',
    name: 'Studio de Création, Média & Design',
    desc: 'Post-production, création 3D, agence digitale, vidéo, motion design & branding.',
    icon: 'folder',
    badge: 'Créatif & Média',
    recommendedModules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity', 'inbox'],
    defaultNeeds: ['crm', 'projects', 'tasks', 'calendar', 'team', 'budget']
  },
  {
    id: 'consulting',
    name: 'Cabinet de Conseil & Services B2B',
    desc: 'Conseil en stratégie, ingénierie, audit, expertise comptable, SSII & prestations intellectuelles.',
    icon: 'users',
    badge: 'Conseil & Services',
    recommendedModules: ['overview', 'crm', 'tasks', 'projects', 'team', 'budget', 'accounting', 'inbox'],
    defaultNeeds: ['crm', 'tasks', 'projects', 'team', 'budget', 'accounting']
  },
  {
    id: 'sales_trade',
    name: 'Commerce, Négoce & Vente B2B',
    desc: 'Négoce inter-entreprises, grossiste, distribution, import-export & commerce B2B.',
    icon: 'wallet',
    badge: 'Vente & Distribution',
    recommendedModules: ['overview', 'crm', 'budget', 'accounting', 'activity', 'inbox'],
    defaultNeeds: ['crm', 'budget', 'accounting']
  },
  {
    id: 'construction',
    name: 'BTP, Architecture & Travaux',
    desc: 'Bâtiment, travaux publics, maîtrise d\'œuvre, architecture d\'intérieur & chantiers industriels.',
    icon: 'grid',
    badge: 'BTP & Chantier',
    recommendedModules: ['overview', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity'],
    defaultNeeds: ['tasks', 'projects', 'calendar', 'team', 'budget']
  },
  {
    id: 'general',
    name: 'Entreprise Générale & PME',
    desc: 'Activité polyvalente, prestations de services diverses et gestion multi-domaines.',
    icon: 'spark',
    badge: 'Généraliste',
    recommendedModules: ['overview', 'crm', 'tasks', 'projects', 'budget', 'inbox'],
    defaultNeeds: ['crm', 'tasks', 'projects', 'budget']
  }
];

// Catalogue des besoins opérationnels pour le diagnostic
const NEEDS_QUESTIONS = [
  {
    id: 'crm',
    title: 'Prospection & Pipeline Commercial (CRM)',
    desc: 'Besoin de suivre des prospects, négocier des devis et maximiser le taux de transformation.',
    moduleId: 'crm',
    icon: 'funnel',
    category: 'Ventes'
  },
  {
    id: 'budget',
    title: 'Facturation, Devis & Règlements',
    desc: 'Besoin d\'émettre des devis, générer des factures d\'acompte et suivre les encaissements.',
    moduleId: 'budget',
    icon: 'wallet',
    category: 'Finance'
  },
  {
    id: 'projects',
    title: 'Gestion de Projets & Timeline (Gantt)',
    desc: 'Besoin d\'un suivi dans le temps, de jalons clés et de coordination des livrables.',
    moduleId: 'projects',
    icon: 'folder',
    category: 'Opérations'
  },
  {
    id: 'tasks',
    title: 'Organisation des Tâches Opérationnelles (Kanban)',
    desc: 'Besoin d\'un tableau visuel interactif (À faire, En cours, Validé) avec sous-tâches.',
    moduleId: 'tasks',
    icon: 'kanban',
    category: 'Opérations'
  },
  {
    id: 'team',
    title: 'Suivi de l\'Équipe & Feuilles de Temps (Timesheets)',
    desc: 'Besoin de piloter la charge de travail, les heures loggées et la capacité des collaborateurs.',
    moduleId: 'team',
    icon: 'users',
    category: 'Ressources Humaines'
  },
  {
    id: 'calendar',
    title: 'Réservation de Salles & Équipements',
    desc: 'Besoin de planifier l\'occupation des studios, suites de montage, bureaux ou matériels partagés.',
    moduleId: 'calendar',
    icon: 'calendar',
    category: 'Opérations'
  },
  {
    id: 'accounting',
    title: 'Comptabilité Générale & Fiscalité',
    desc: 'Besoin de journaux comptables, plan de comptes, grand livre et suivi des débits/crédits.',
    moduleId: 'accounting',
    icon: 'receipt',
    category: 'Finance'
  }
];

// Catalogue des plugins pour l'étape de recommandation
const ALL_MODULES = [
  { id: 'overview', name: 'Overview & Synthèse', desc: 'Tableau de bord central et indicateurs clés.', cat: 'Pilotage', isCore: true },
  { id: 'crm', name: 'CRM & Ventes', desc: 'Gestion des opportunités et conversion en 1 clic.', cat: 'Ventes' },
  { id: 'tasks', name: 'Tâches (Kanban)', desc: 'Glisser-déposer interactif des tâches de production.', cat: 'Opérations' },
  { id: 'projects', name: 'Projets & Gantt', desc: 'Feuille de route, jalons et budgets clients.', cat: 'Opérations' },
  { id: 'calendar', name: 'Planning & Suites', desc: 'Réservation des ressources et espaces partagés.', cat: 'Opérations' },
  { id: 'team', name: 'Équipe & Workload', desc: 'Capacité, temps passés et feuilles d\'heures.', cat: 'Ressources Humaines' },
  { id: 'budget', name: 'Factures & Devis', desc: 'Émission de devis, facturation et tampons PAID.', cat: 'Finance' },
  { id: 'accounting', name: 'Comptabilité', desc: 'Grand livre, écritures comptables et bilan.', cat: 'Finance' },
  { id: 'activity', name: 'Journal d\'Activité', desc: 'Fil d\'audit et historique des événements.', cat: 'Communication' },
  { id: 'inbox', name: 'Boîte de Réception', desc: 'Messages et notifications d\'équipe.', cat: 'Communication' }
];

export default function OnboardingPage({ sub = '1', params = [] }) {
  const [step, setStep] = x.useState(() => {
    try {
      if (sub && /^[1-4]$/.test(sub)) return parseInt(sub, 10);
      const match = location.hash.match(/[/?&]([1-4])\b/);
      return match ? parseInt(match[1], 10) : 1;
    } catch {
      return 1;
    }
  });

  x.useEffect(() => {
    if (sub && /^[1-4]$/.test(sub)) {
      setStep(parseInt(sub, 10));
    }
  }, [sub]);
  const [submitting, setSubmitting] = x.useState(false);
  const [errorMsg, setErrorMsg] = x.useState('');

  // Données du formulaire
  const [formData, setFormData] = x.useState({
    name: '',
    ownerName: '',
    ownerRole: 'Direction / Fondateur',
    ownerEmail: '',
    currency: 'EUR',
    teamSize: '1-5',
    industry: 'design_agency',
    needs: ['crm', 'projects', 'tasks', 'calendar', 'team', 'budget'],
    activeModules: ['overview', 'crm', 'tasks', 'projects', 'calendar', 'team', 'budget', 'activity', 'inbox']
  });

  // Sélection du secteur et calcul automatique des besoins et modules
  const handleSelectSector = (sectorId) => {
    const sector = SECTORS.find(s => s.id === sectorId);
    if (!sector) return;

    setFormData(prev => ({
      ...prev,
      industry: sector.id,
      needs: [...sector.defaultNeeds],
      activeModules: [...sector.recommendedModules]
    }));
  };

  // Bascule d'un besoin opérationnel
  const handleToggleNeed = (needId) => {
    setFormData(prev => {
      const exists = prev.needs.includes(needId);
      const newNeeds = exists ? prev.needs.filter(n => n !== needId) : [...prev.needs, needId];

      // Mettre à jour automatiquement les modules recommandés
      const needObj = NEEDS_QUESTIONS.find(n => n.id === needId);
      let newModules = [...prev.activeModules];
      if (needObj && needObj.moduleId) {
        if (!exists) {
          if (!newModules.includes(needObj.moduleId)) newModules.push(needObj.moduleId);
        } else {
          // Si l'utilisateur désactive ce besoin et que ce n'est pas le module overview
          newModules = newModules.filter(m => m !== needObj.moduleId);
        }
      }
      if (!newModules.includes('overview')) newModules.unshift('overview');

      return {
        ...prev,
        needs: newNeeds,
        activeModules: newModules
      };
    });
  };

  // Bascule manuelle d'un module à l'étape 4
  const handleToggleModule = (modId) => {
    if (modId === 'overview') return; // Module obligatoire
    setFormData(prev => {
      const exists = prev.activeModules.includes(modId);
      const updated = exists ? prev.activeModules.filter(m => m !== modId) : [...prev.activeModules, modId];
      return { ...prev, activeModules: updated };
    });
  };

  // Soumission finale et création de l'espace isolé
  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre entreprise.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          ownerName: formData.ownerName.trim() || `Admin ${formData.name.trim()}`,
          ownerRole: formData.ownerRole.trim() || 'Direction',
          ownerEmail: formData.ownerEmail.trim() || `contact@${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          industry: formData.industry,
          currency: formData.currency,
          teamSize: formData.teamSize,
          needs: formData.needs,
          modules: formData.activeModules
        })
      }).then(r => r.json());

      if (res && res.success && res.tenant) {
        const tenant = res.tenant;
        const starterData = res.starterData;

        // 1. Stocker les données isolées dans localStorage
        if (starterData) {
          localStorage.setItem(`marlo:data:${tenant.id}`, JSON.stringify(starterData));
        }

        // 2. Définir l'entreprise active
        localStorage.setItem('marlo_erp_tenant_id', tenant.id);

        // 3. Recharger le store réactif Marlo avec les données isolées de la nouvelle entreprise
        if (typeof window.MARLO_RELOAD_STORE === 'function') {
          window.MARLO_RELOAD_STORE(tenant.id, starterData);
        }

        // 4. Notifier tous les composants de l'application
        window.dispatchEvent(new CustomEvent('marlo:tenant-changed', { detail: { tenant, starterData } }));
        window.dispatchEvent(new CustomEvent('marlo:modules-updated', { detail: { activeModules: tenant.activeModules } }));

        // 5. Afficher toast et rediriger vers Overview
        showToast(`🎉 Bienvenue chez ${tenant.name} ! Votre ERP isolé est prêt.`);
        setTimeout(() => {
          location.hash = '#/overview';
        }, 600);
      } else {
        setErrorMsg(res.error || 'Une erreur est survenue lors de la création de l\'entreprise.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur de connexion au serveur ERP.');
      setSubmitting(false);
    }
  };

  const showToast = (msg) => {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'erp-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999999;
      background: var(--ink); color: var(--bg);
      padding: 12px 20px; border-radius: var(--r-md);
      font-size: 13px; font-weight: 600; font-family: var(--font);
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      animation: erpFadeIn 0.2s var(--ease);
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const selectedSector = SECTORS.find(s => s.id === formData.industry) || SECTORS[0];

  return (0, S.jsxs)("div", {
    className: "view view--onboarding",
    style: { maxWidth: "1000px", margin: "0 auto", padding: "24px 20px 80px" },
    children: [
      // 1. En-tête de la page Onboarding
      (0, S.jsxs)("header", {
        className: "phead",
        style: { marginBottom: "28px" },
        children: [
          (0, S.jsxs)("div", {
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" },
                children: [
                  (0, S.jsx)("span", { className: "pill pill--accent", children: "Multi-Tenant Option 2" }),
                  (0, S.jsx)("span", { className: "pill", children: "Isolation Totale des Données" })
                ]
              }),
              (0, S.jsx)("h1", {
                className: "phead__title",
                style: { fontSize: "28px", fontWeight: "800", color: "var(--ink)", margin: 0 },
                children: "Création & Configuration d'un Espace Entreprise"
              }),
              (0, S.jsx)("p", {
                className: "phead__desc",
                style: { color: "var(--muted)", fontSize: "14px", margin: "6px 0 0" },
                children: "Questionnaire d'onboarding intelligent : analysez vos besoins opérationnels, débloquez automatiquement les plugins Odoo adaptés et lancez un ERP 100% cloisonné."
              })
            ]
          }),
          (0, S.jsx)("div", {
            className: "phead__actions",
            children: (0, S.jsxs)("button", {
              type: "button",
              onClick: () => { location.hash = '#/overview'; },
              className: "btn btn--ghost btn--sm",
              children: [
                (0, S.jsx)(i, { name: "arrow-left", size: "sm" }),
                " Retour au tableau de bord"
              ]
            })
          })
        ]
      }),

      // 2. Barre d'étapes native Marlo (.steps)
      (0, S.jsx)("nav", {
        style: { marginBottom: "36px" },
        "aria-label": "Étapes de configuration",
        children: (0, S.jsxs)("ol", {
          className: "steps",
          children: [
            (0, S.jsxs)("li", {
              className: step > 1 ? "is-done" : step === 1 ? "is-now" : "",
              children: [
                (0, S.jsx)("span", {
                  className: "steps__dot",
                  children: step > 1 ? (0, S.jsx)(i, { name: "check" }) : null
                }),
                (0, S.jsx)("span", {
                  className: "steps__bar",
                  children: (0, S.jsx)("i", {
                    className: "steps__fill",
                    style: { transform: step > 1 ? "scaleX(1)" : "scaleX(0)" }
                  })
                }),
                (0, S.jsx)("small", { children: "1. Profil Entreprise" })
              ]
            }),
            (0, S.jsxs)("li", {
              className: step > 2 ? "is-done" : step === 2 ? "is-now" : "",
              children: [
                (0, S.jsx)("span", {
                  className: "steps__dot",
                  children: step > 2 ? (0, S.jsx)(i, { name: "check" }) : null
                }),
                (0, S.jsx)("span", {
                  className: "steps__bar",
                  children: (0, S.jsx)("i", {
                    className: "steps__fill",
                    style: { transform: step > 2 ? "scaleX(1)" : "scaleX(0)" }
                  })
                }),
                (0, S.jsx)("small", { children: "2. Secteur Métier" })
              ]
            }),
            (0, S.jsxs)("li", {
              className: step > 3 ? "is-done" : step === 3 ? "is-now" : "",
              children: [
                (0, S.jsx)("span", {
                  className: "steps__dot",
                  children: step > 3 ? (0, S.jsx)(i, { name: "check" }) : null
                }),
                (0, S.jsx)("span", {
                  className: "steps__bar",
                  children: (0, S.jsx)("i", {
                    className: "steps__fill",
                    style: { transform: step > 3 ? "scaleX(1)" : "scaleX(0)" }
                  })
                }),
                (0, S.jsx)("small", { children: "3. Diagnostic Besoins" })
              ]
            }),
            (0, S.jsxs)("li", {
              className: step > 4 ? "is-done" : step === 4 ? "is-now" : "",
              children: [
                (0, S.jsx)("span", {
                  className: "steps__dot",
                  children: step > 4 ? (0, S.jsx)(i, { name: "check" }) : null
                }),
                (0, S.jsx)("small", { children: "4. Plugins & Lancement" })
              ]
            })
          ]
        })
      }),

      // Message d'erreur s'il y a lieu
      errorMsg && (0, S.jsxs)("div", {
        className: "card",
        style: {
          padding: "14px 18px",
          background: "rgba(239, 68, 68, 0.08)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          color: "var(--bad, #ef4444)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px"
        },
        children: [
          (0, S.jsx)("span", { style: { fontWeight: "bold" }, children: "⚠️" }),
          (0, S.jsx)("span", { children: errorMsg })
        ]
      }),

      // CONTENU DES ÉTAPES

      // === ÉTAPE 1 : Identité & Profil Entreprise ===
      step === 1 && (0, S.jsxs)("section", {
        className: "card",
        style: { padding: "32px", animation: "erpFadeIn 0.25s var(--ease)" },
        children: [
          (0, S.jsxs)("div", {
            style: { marginBottom: "24px", borderBottom: "1px solid var(--line-2)", paddingBottom: "16px" },
            children: [
              (0, S.jsx)("span", { className: "badge badge--accent", style: { marginBottom: "8px" }, children: "Étape 1 sur 4" }),
              (0, S.jsx)("h2", { style: { margin: "4px 0", fontSize: "20px", color: "var(--ink)" }, children: "Identité de votre structure" }),
              (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: "Ces informations serviront à initialiser vos documents officiels, factures et paramètres d'équipe." })
            ]
          }),

          (0, S.jsxs)("div", {
            className: "formgrid",
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
            children: [
              // Nom de l'entreprise
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Nom de l'entreprise *" }),
                  (0, S.jsx)("input", {
                    type: "text",
                    required: true,
                    placeholder: "Ex: Studio Horizon, Groupe Alliance, BâtiNova...",
                    value: formData.name,
                    onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                    className: "input",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                  })
                ]
              }),

              // Nom du dirigeant / administrateur
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Nom & Prénom de l'administrateur" }),
                  (0, S.jsx)("input", {
                    type: "text",
                    placeholder: "Ex: Sarah Delorme, Alexandre Martin...",
                    value: formData.ownerName,
                    onChange: (e) => setFormData({ ...formData, ownerName: e.target.value }),
                    className: "input",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                  })
                ]
              }),

              // Rôle / Fonction
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Rôle / Poste" }),
                  (0, S.jsx)("input", {
                    type: "text",
                    placeholder: "Ex: Directrice Générale, CEO, Chef de projet...",
                    value: formData.ownerRole,
                    onChange: (e) => setFormData({ ...formData, ownerRole: e.target.value }),
                    className: "input",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                  })
                ]
              }),

              // Devise principale
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Devise Principale" }),
                  (0, S.jsxs)("select", {
                    value: formData.currency,
                    onChange: (e) => setFormData({ ...formData, currency: e.target.value }),
                    className: "select",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" },
                    children: [
                      (0, S.jsx)("option", { value: "EUR", children: "Euro (€)" }),
                      (0, S.jsx)("option", { value: "USD", children: "Dollar US ($)" }),
                      (0, S.jsx)("option", { value: "GBP", children: "Livre Sterling (£)" }),
                      (0, S.jsx)("option", { value: "CHF", children: "Franc Suisse (CHF)" }),
                      (0, S.jsx)("option", { value: "CAD", children: "Dollar Canadien ($)" })
                    ]
                  })
                ]
              }),

              // Taille de l'équipe
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Taille de l'équipe" }),
                  (0, S.jsxs)("select", {
                    value: formData.teamSize,
                    onChange: (e) => setFormData({ ...formData, teamSize: e.target.value }),
                    className: "select",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" },
                    children: [
                      (0, S.jsx)("option", { value: "1-5", children: "1 à 5 collaborateurs (TPE / Studio)" }),
                      (0, S.jsx)("option", { value: "6-20", children: "6 à 20 collaborateurs (PME en croissance)" }),
                      (0, S.jsx)("option", { value: "21-50", children: "21 à 50 collaborateurs" }),
                      (0, S.jsx)("option", { value: "50+", children: "Plus de 50 collaborateurs" })
                    ]
                  })
                ]
              }),

              // Email professionnel
              (0, S.jsxs)("label", {
                className: "field",
                style: { display: "flex", flexDirection: "column", gap: "6px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink)" }, children: "Email de notification" }),
                  (0, S.jsx)("input", {
                    type: "email",
                    placeholder: "contact@entreprise.com",
                    value: formData.ownerEmail,
                    onChange: (e) => setFormData({ ...formData, ownerEmail: e.target.value }),
                    className: "input",
                    style: { width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                  })
                ]
              })
            ]
          }),

          // Pied de formulaire étape 1
          (0, S.jsxs)("div", {
            style: { display: "flex", justifyContent: "flex-end", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--line-2)" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => {
                  if (!formData.name.trim()) {
                    setErrorMsg("Veuillez saisir le nom de l'entreprise pour continuer.");
                    return;
                  }
                  setErrorMsg("");
                  setStep(2);
                },
                className: "btn btn--primary",
                style: { padding: "10px 24px" },
                children: [
                  "Étape 2 : Secteur d'Activité ",
                  (0, S.jsx)(i, { name: "arrow-right", size: "sm" })
                ]
              })
            ]
          })
        ]
      }),

      // === ÉTAPE 2 : Secteur Métier ===
      step === 2 && (0, S.jsxs)("section", {
        className: "card",
        style: { padding: "32px", animation: "erpFadeIn 0.25s var(--ease)" },
        children: [
          (0, S.jsxs)("div", {
            style: { marginBottom: "24px", borderBottom: "1px solid var(--line-2)", paddingBottom: "16px" },
            children: [
              (0, S.jsx)("span", { className: "badge badge--accent", style: { marginBottom: "8px" }, children: "Étape 2 sur 4" }),
              (0, S.jsx)("h2", { style: { margin: "4px 0", fontSize: "20px", color: "var(--ink)" }, children: "Quel est votre secteur d'activité ?" }),
              (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: "Cette sélection permet d'adapter le vocabulaire, les données types de départ et de pré-sélectionner les modules ERP les plus pertinents." })
            ]
          }),

          (0, S.jsx)("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
            children: SECTORS.map(sec => {
              const isSelected = formData.industry === sec.id;
              return (0, S.jsxs)("div", {
                key: sec.id,
                onClick: () => handleSelectSector(sec.id),
                className: "card",
                style: {
                  padding: "20px",
                  cursor: "pointer",
                  borderRadius: "var(--r-md)",
                  border: isSelected ? "2px solid var(--accent)" : "1px solid var(--line-2)",
                  background: isSelected ? "var(--well)" : "var(--card)",
                  boxShadow: isSelected ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                },
                children: [
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsxs)("div", {
                        style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
                        children: [
                          (0, S.jsx)("span", {
                            className: "pill pill--accent",
                            children: sec.badge
                          }),
                          isSelected ? (0, S.jsx)("span", {
                            style: {
                              width: "22px", height: "22px", borderRadius: "50%",
                              background: "var(--accent)", color: "var(--accent-ink, #fff)",
                              display: "grid", placeItems: "center", fontSize: "12px", fontWeight: "bold"
                            },
                            children: "✓"
                          }) : (0, S.jsx)("span", {
                            style: {
                              width: "20px", height: "20px", borderRadius: "50%",
                              border: "2px solid var(--line-2)"
                            }
                          })
                        ]
                      }),
                      (0, S.jsx)("h3", { style: { margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "var(--ink)" }, children: sec.name }),
                      (0, S.jsx)("p", { style: { margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }, children: sec.desc })
                    ]
                  }),
                  (0, S.jsxs)("div", {
                    style: { marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--line)", fontSize: "11px", color: "var(--muted)" },
                    children: [
                      (0, S.jsx)("b", { style: { color: "var(--ink-2)" }, children: "Modules préconisés : " }),
                      sec.recommendedModules.slice(0, 4).join(', '),
                      sec.recommendedModules.length > 4 ? ` +${sec.recommendedModules.length - 4} autres` : ''
                    ]
                  })
                ]
              });
            })
          }),

          // Pied de formulaire étape 2
          (0, S.jsxs)("div", {
            style: { display: "flex", justifyContent: "space-between", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--line-2)" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setStep(1),
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "arrow-left", size: "sm" }),
                  " Précédent"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setStep(3),
                className: "btn btn--primary",
                style: { padding: "10px 24px" },
                children: [
                  "Étape 3 : Diagnostic des Besoins ",
                  (0, S.jsx)(i, { name: "arrow-right", size: "sm" })
                ]
              })
            ]
          })
        ]
      }),

      // === ÉTAPE 3 : Diagnostic des Besoins Opérationnels ===
      step === 3 && (0, S.jsxs)("section", {
        className: "card",
        style: { padding: "32px", animation: "erpFadeIn 0.25s var(--ease)" },
        children: [
          (0, S.jsxs)("div", {
            style: { marginBottom: "24px", borderBottom: "1px solid var(--line-2)", paddingBottom: "16px" },
            children: [
              (0, S.jsx)("span", { className: "badge badge--accent", style: { marginBottom: "8px" }, children: "Étape 3 sur 4" }),
              (0, S.jsx)("h2", { style: { margin: "4px 0", fontSize: "20px", color: "var(--ink)" }, children: "Quels sont vos besoins au quotidien ?" }),
              (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: "Cochez les processus métiers que vous souhaitez piloter dans votre ERP. Le système débloquera les outils appropriés." })
            ]
          }),

          (0, S.jsx)("div", {
            style: { display: "grid", gridTemplateColumns: "1fr", gap: "12px" },
            children: NEEDS_QUESTIONS.map(q => {
              const isChecked = formData.needs.includes(q.id);
              return (0, S.jsxs)("div", {
                key: q.id,
                onClick: () => handleToggleNeed(q.id),
                className: "card",
                style: {
                  padding: "16px 20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: "var(--r-md)",
                  border: isChecked ? "1px solid var(--accent)" : "1px solid var(--line-2)",
                  background: isChecked ? "var(--well)" : "var(--card)",
                  transition: "all 0.15s ease"
                },
                children: [
                  (0, S.jsxs)("div", {
                    style: { display: "flex", alignItems: "center", gap: "16px" },
                    children: [
                      (0, S.jsx)("div", {
                        style: {
                          width: "36px", height: "36px", borderRadius: "var(--r-sm)",
                          background: isChecked ? "var(--accent)" : "var(--card-2)",
                          color: isChecked ? "var(--accent-ink, #fff)" : "var(--ink)",
                          display: "grid", placeItems: "center"
                        },
                        children: (0, S.jsx)(i, { name: q.icon })
                      }),
                      (0, S.jsxs)("div", {
                        children: [
                          (0, S.jsxs)("div", {
                            style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" },
                            children: [
                              (0, S.jsx)("b", { style: { fontSize: "14px", color: "var(--ink)" }, children: q.title }),
                              (0, S.jsx)("span", { className: "pill", style: { fontSize: "10px" }, children: q.category })
                            ]
                          }),
                          (0, S.jsx)("div", { style: { fontSize: "12px", color: "var(--muted)" }, children: q.desc })
                        ]
                      })
                    ]
                  }),
                  (0, S.jsx)("div", {
                    style: {
                      width: "22px", height: "22px", borderRadius: "6px",
                      border: isChecked ? "none" : "2px solid var(--line-2)",
                      background: isChecked ? "var(--accent)" : "transparent",
                      color: "#fff", display: "grid", placeItems: "center",
                      fontWeight: "bold", fontSize: "12px", flexShrink: 0
                    },
                    children: isChecked ? "✓" : ""
                  })
                ]
              });
            })
          }),

          // Pied de formulaire étape 3
          (0, S.jsxs)("div", {
            style: { display: "flex", justifyContent: "space-between", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--line-2)" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setStep(2),
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "arrow-left", size: "sm" }),
                  " Précédent"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setStep(4),
                className: "btn btn--primary",
                style: { padding: "10px 24px" },
                children: [
                  "Étape 4 : Déblocage des Plugins ",
                  (0, S.jsx)(i, { name: "arrow-right", size: "sm" })
                ]
              })
            ]
          })
        ]
      }),

      // === ÉTAPE 4 : Déblocage des Plugins & Lancement de l'ERP ===
      step === 4 && (0, S.jsxs)("section", {
        className: "card",
        style: { padding: "32px", animation: "erpFadeIn 0.25s var(--ease)" },
        children: [
          (0, S.jsxs)("div", {
            style: { marginBottom: "24px", borderBottom: "1px solid var(--line-2)", paddingBottom: "16px" },
            children: [
              (0, S.jsx)("span", { className: "badge badge--accent", style: { marginBottom: "8px" }, children: "Étape 4 sur 4" }),
              (0, S.jsx)("h2", { style: { margin: "4px 0", fontSize: "20px", color: "var(--ink)" }, children: "Recommandation & Activation des Plugins" }),
              (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: `Basé sur votre profil (${selectedSector.name}) et vos besoins, voici les modules débloqués pour votre structure. Vous pouvez affiner la sélection.` })
            ]
          }),

          // Synthèse de l'espace en cours de création
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "16px 20px", background: "var(--well)", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
            children: [
              (0, S.jsxs)("div", {
                children: [
                  (0, S.jsx)("small", { style: { textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "var(--muted)" }, children: "Espace en cours de création" }),
                  (0, S.jsxs)("div", { style: { fontSize: "16px", fontWeight: "800", color: "var(--ink)", marginTop: "2px" }, children: [formData.name, " (", formData.currency, ")"] }),
                  (0, S.jsxs)("div", { style: { fontSize: "12px", color: "var(--muted)", marginTop: "2px" }, children: ["Administrateur : ", formData.ownerName || "Admin", " • ", formData.teamSize, " personnes"] })
                ]
              }),
              (0, S.jsxs)("div", {
                style: { textAlign: "right" },
                children: [
                  (0, S.jsx)("span", { className: "badge badge--ok", children: `${formData.activeModules.length} plugins activés` }),
                  (0, S.jsx)("div", { style: { fontSize: "11px", color: "var(--muted)", marginTop: "4px" }, children: "Données 100% isolées" })
                ]
              })
            ]
          }),

          // Grille des modules
          (0, S.jsx)("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" },
            children: ALL_MODULES.map(m => {
              const isActive = formData.activeModules.includes(m.id);
              const isSuggested = selectedSector.recommendedModules.includes(m.id) || formData.needs.includes(m.id);

              return (0, S.jsxs)("div", {
                key: m.id,
                onClick: () => handleToggleModule(m.id),
                className: "card",
                style: {
                  padding: "16px",
                  cursor: m.isCore ? "default" : "pointer",
                  borderRadius: "var(--r-md)",
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--line-2)",
                  background: isActive ? "var(--card)" : "var(--well)",
                  opacity: isActive ? 1 : 0.65,
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                },
                children: [
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsxs)("div", {
                        style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
                        children: [
                          (0, S.jsx)("span", { className: "pill", style: { fontSize: "10px" }, children: m.cat }),
                          isSuggested && (0, S.jsx)("span", { className: "badge badge--ok", style: { fontSize: "10px" }, children: "✨ Suggéré" }),
                          m.isCore && (0, S.jsx)("span", { className: "badge badge--accent", style: { fontSize: "10px" }, children: "Obligatoire" })
                        ]
                      }),
                      (0, S.jsx)("b", { style: { fontSize: "14px", color: "var(--ink)", display: "block" }, children: m.name }),
                      (0, S.jsx)("p", { style: { margin: "4px 0 0", fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }, children: m.desc })
                    ]
                  }),
                  (0, S.jsxs)("div", {
                    style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "8px", borderTop: "1px solid var(--line)" },
                    children: [
                      (0, S.jsx)("span", { style: { fontSize: "11px", color: isActive ? "var(--good, #10b981)" : "var(--muted)", fontWeight: "600" }, children: isActive ? "● Débloqué & Actif" : "○ Inactif" }),
                      !m.isCore && (0, S.jsx)("button", {
                        type: "button",
                        onClick: (e) => { e.stopPropagation(); handleToggleModule(m.id); },
                        className: isActive ? "btn btn--ghost btn--sm" : "btn btn--subtle btn--sm",
                        style: { fontSize: "11px", padding: "4px 10px" },
                        children: isActive ? "Désactiver" : "Activer"
                      })
                    ]
                  })
                ]
              });
            })
          }),

          // Pied de formulaire étape 4
          (0, S.jsxs)("div", {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--line-2)" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                disabled: submitting,
                onClick: () => setStep(3),
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "arrow-left", size: "sm" }),
                  " Précédent"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                disabled: submitting,
                onClick: handleFinalSubmit,
                className: "btn btn--primary btn--lg",
                style: { padding: "12px 32px", fontSize: "15px", fontWeight: "700" },
                children: [
                  submitting ? "Initialisation de l'ERP..." : `🚀 Créer et lancer l'ERP "${formData.name || 'Entreprise'}"`
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
