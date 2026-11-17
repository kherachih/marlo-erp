import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

// Catalogue de base initial (Garantit un rendu instantané sans écran blanc)
const INITIAL_MODULES = [
  {
    id: 'overview',
    name: 'Overview & KPIs',
    category: 'Vue d\'ensemble',
    description: 'Tableau de bord central récapitulatif avec indicateurs clés de performance et synthèse en direct.',
    icon: 'grid',
    isCore: true
  },
  {
    id: 'tasks',
    name: 'Tâches (Kanban)',
    category: 'Opérations',
    description: 'Tableau Kanban interactif avec glisser-déposer des tâches (Up next, In progress, Done).',
    icon: 'kanban',
    isCore: false
  },
  {
    id: 'projects',
    name: 'Projets & Timeline',
    category: 'Opérations',
    description: 'Suivi de la ligne de temps des livrables (Gantt), jalons de production et budgets projets.',
    icon: 'folder',
    isCore: false
  },
  {
    id: 'calendar',
    name: 'Calendrier & Suites',
    category: 'Opérations',
    description: 'Réservation des suites de montage, studios de tournage, postes de travail et équipements.',
    icon: 'calendar',
    isCore: false
  },
  {
    id: 'team',
    name: 'Équipe & Workload',
    category: 'Ressources Humaines',
    description: 'Capacité de travail, feuilles de temps (timesheets) et heures loggées par collaborateur.',
    icon: 'users',
    isCore: false
  },
  {
    id: 'budget',
    name: 'Facturation & Devis',
    category: 'Finance',
    description: 'Création et émission des devis, facturation client avec tampons PAID et exports comptables.',
    icon: 'wallet',
    isCore: false
  },
  {
    id: 'accounting',
    name: 'Comptabilité Générale',
    category: 'Finance',
    description: 'Journaux comptables, plan de comptes, suivi de la TVA et rapprochement financier.',
    icon: 'receipt',
    isCore: false
  },
  {
    id: 'crm',
    name: 'CRM & Prospects',
    category: 'Ventes',
    description: 'Pipeline commercial, qualification des opportunités et gestion de la relation client.',
    icon: 'funnel',
    isCore: false
  },
  {
    id: 'activity',
    name: 'Fil d\'Activité',
    category: 'Communication',
    description: 'Audit trail des modifications, livraisons de projets et historique des actions d\'équipe.',
    icon: 'activity',
    isCore: false
  },
  {
    id: 'inbox',
    name: 'Messagerie & Inbox',
    category: 'Communication',
    description: 'Boîte de réception centralisée pour les notifications studio, messages clients et alertes.',
    icon: 'inbox',
    isCore: false
  }
];

export default function AppsPage() {
  const [tenants, setTenants] = x.useState([]);
  const [currentTenant, setCurrentTenant] = x.useState(() => {
    return {
      id: localStorage.getItem('marlo_erp_tenant_id') || 'northbank-post',
      name: 'Northbank Post',
      activeModules: ['overview', 'tasks', 'projects', 'calendar', 'team', 'activity', 'budget', 'inbox']
    };
  });
  const [modules, setModules] = x.useState(INITIAL_MODULES);
  const [activeModules, setActiveModules] = x.useState(() => {
    return ['overview', 'tasks', 'projects', 'calendar', 'team', 'activity', 'budget', 'inbox'];
  });
  const [search, setSearch] = x.useState('');
  const [category, setCategory] = x.useState('all');

  // Synchronisation avec l'API backend
  x.useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [tenantsRes, modulesRes] = await Promise.all([
          fetch('/api/tenants').then(r => r.json()).catch(() => ({})),
          fetch('/api/modules').then(r => r.json()).catch(() => ({}))
        ]);

        if (!mounted) return;

        if (tenantsRes && tenantsRes.success && tenantsRes.tenants) {
          setTenants(tenantsRes.tenants);
          const savedId = localStorage.getItem('marlo_erp_tenant_id');
          const curr = tenantsRes.tenants.find(t => t.id === savedId) || tenantsRes.tenants[0];
          if (curr) {
            setCurrentTenant(curr);
            setActiveModules(curr.activeModules || []);
          }
        }

        if (modulesRes && modulesRes.success && modulesRes.modules) {
          setModules(modulesRes.modules);
        }
      } catch (e) {
        console.warn('API sync warning:', e);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Écouter les changements d'entreprise
  x.useEffect(() => {
    const handleTenantChange = (e) => {
      if (e.detail && e.detail.tenant) {
        setCurrentTenant(e.detail.tenant);
        setActiveModules(e.detail.tenant.activeModules || []);
      }
    };
    window.addEventListener('marlo:tenant-changed', handleTenantChange);
    return () => window.removeEventListener('marlo:tenant-changed', handleTenantChange);
  }, []);

  // Activer ou désactiver un module
  const toggleModule = async (moduleId) => {
    if (!currentTenant) return;
    try {
      const res = await fetch(`/api/tenants/${currentTenant.id}/modules/${moduleId}/toggle`, {
        method: 'POST'
      }).then(r => r.json());

      if (res && res.success) {
        setActiveModules(res.activeModules);
        currentTenant.activeModules = res.activeModules;

        // Mise à jour de la barre latérale en direct
        window.dispatchEvent(new CustomEvent('marlo:modules-updated', {
          detail: { activeModules: res.activeModules, tenantId: currentTenant.id }
        }));
      }
    } catch (e) {
      console.error('Erreur toggle module:', e);
    }
  };

  // Appliquer un preset
  const applyPreset = async (presetKey) => {
    if (!currentTenant) return;
    try {
      const res = await fetch(`/api/tenants/${currentTenant.id}/preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetKey })
      }).then(r => r.json());

      if (res && res.success) {
        setActiveModules(res.activeModules);
        currentTenant.activeModules = res.activeModules;

        window.dispatchEvent(new CustomEvent('marlo:modules-updated', {
          detail: { activeModules: res.activeModules, tenantId: currentTenant.id }
        }));
      }
    } catch (e) {
      console.error('Erreur preset:', e);
    }
  };

  // Filtrage
  const filteredModules = modules.filter(mod => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      mod.name.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.category.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (category === 'all') return true;
    if (category === 'installed') return activeModules.includes(mod.id);
    if (category === 'sales') return mod.category === 'Ventes';
    if (category === 'finance') return mod.category === 'Finance';
    if (category === 'ops') return mod.category === 'Opérations' || mod.category === 'Vue d\'ensemble';
    if (category === 'hr') return mod.category === 'Ressources Humaines';
    if (category === 'comm') return mod.category === 'Communication';

    return true;
  });

  const countAll = modules.length;
  const countInstalled = modules.filter(m => activeModules.includes(m.id)).length;
  const countSales = modules.filter(m => m.category === 'Ventes').length;
  const countFinance = modules.filter(m => m.category === 'Finance').length;
  const countOps = modules.filter(m => m.category === 'Opérations' || m.category === 'Vue d\'ensemble').length;
  const countHr = modules.filter(m => m.category === 'Ressources Humaines').length;
  const countComm = modules.filter(m => m.category === 'Communication').length;

  return (0, S.jsxs)("div", {
    className: "page apps",
    style: { maxWidth: "var(--max)", margin: "0 auto", paddingBottom: "60px" },
    children: [
      // 1. En-tête Marlo officiel (.phead)
      (0, S.jsxs)("div", {
        className: "phead",
        style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" },
        children: [
          (0, S.jsxs)("div", {
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", alignItems: "center", gap: "10px" },
                children: [
                  (0, S.jsx)("h1", {
                    style: { fontSize: "var(--fs-4xl)", fontWeight: "800", color: "var(--ink)", margin: 0 },
                    children: "Apps & Extensions ERP"
                  }),
                  (0, S.jsx)("span", {
                    className: "pill pill--accent",
                    children: currentTenant?.name || "Entreprise"
                  })
                ]
              }),
              (0, S.jsx)("p", {
                style: { color: "var(--muted)", fontSize: "var(--fs-base)", marginTop: "6px" },
                children: "Catalogue complet des applications et plugins modulaires. Personnalisez votre environnement de travail à la carte."
              })
            ]
          }),

          // Actions
          (0, S.jsxs)("div", {
            style: { display: "flex", alignItems: "center", gap: "10px" },
            children: [
              (0, S.jsxs)("span", {
                className: "pill pill--good",
                children: [activeModules.length, " modules actifs"]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "btn btn--primary btn--sm",
                onClick: () => window.dispatchEvent(new CustomEvent('marlo:open-new-tenant')),
                children: [(0, S.jsx)("span", { children: "+" }), " Nouvelle Entreprise"]
              })
            ]
          })
        ]
      }),

      // 2. Profils d'onboarding rapides (.card)
      (0, S.jsx)("section", {
        className: "card",
        style: { marginBottom: "20px", padding: "14px 18px" },
        children: (0, S.jsxs)("div", {
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" },
          children: [
            (0, S.jsxs)("div", {
              style: { display: "flex", alignItems: "center", gap: "8px" },
              children: [
                (0, S.jsx)(i, { name: "marlo" }),
                (0, S.jsx)("b", { style: { fontSize: "var(--fs-sm)", color: "var(--ink)" }, children: "Profils sectoriels en 1 clic :" }),
                (0, S.jsx)("span", { style: { fontSize: "var(--fs-xs)", color: "var(--muted)" }, children: "Appliquez une sélection recommandée" })
              ]
            }),
            (0, S.jsxs)("div", {
              style: { display: "flex", gap: "8px", flexWrap: "wrap" },
              children: [
                (0, S.jsx)("button", { type: "button", className: "btn btn--subtle btn--sm", onClick: () => applyPreset('design_agency'), children: "Studio de Design" }),
                (0, S.jsx)("button", { type: "button", className: "btn btn--subtle btn--sm", onClick: () => applyPreset('consulting'), children: "Cabinet Conseil" }),
                (0, S.jsx)("button", { type: "button", className: "btn btn--subtle btn--sm", onClick: () => applyPreset('sales_trade'), children: "Négoce & Vente" }),
                (0, S.jsx)("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => applyPreset('minimal'), children: "Essentiel" })
              ]
            })
          ]
        })
      }),

      // 3. Recherche et Catégories (.chips & .search)
      (0, S.jsxs)("div", {
        style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "20px" },
        children: [
          (0, S.jsxs)("div", {
            className: "chips",
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'all',
                onClick: () => setCategory('all'),
                children: ["Toutes", (0, S.jsx)("span", { className: "badge", children: countAll })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'installed',
                onClick: () => setCategory('installed'),
                children: ["Installées", (0, S.jsx)("span", { className: "badge", children: countInstalled })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'sales',
                onClick: () => setCategory('sales'),
                children: ["Ventes & CRM", (0, S.jsx)("span", { className: "badge", children: countSales })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'finance',
                onClick: () => setCategory('finance'),
                children: ["Finance & Facturation", (0, S.jsx)("span", { className: "badge", children: countFinance })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'ops',
                onClick: () => setCategory('ops'),
                children: ["Opérations & Projets", (0, S.jsx)("span", { className: "badge", children: countOps })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'hr',
                onClick: () => setCategory('hr'),
                children: ["RH & Équipe", (0, S.jsx)("span", { className: "badge", children: countHr })]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "chip",
                "aria-pressed": category === 'comm',
                onClick: () => setCategory('comm'),
                children: ["Communication", (0, S.jsx)("span", { className: "badge", children: countComm })]
              })
            ]
          }),

          // Recherche
          (0, S.jsxs)("div", {
            className: "search",
            style: { flex: "0 1 320px", height: "38px" },
            children: [
              (0, S.jsx)(i, { name: "search" }),
              (0, S.jsx)("input", {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Rechercher un module, mot-clé...",
                style: { background: "transparent", border: "none", color: "var(--ink)", width: "100%", outline: "none", fontFamily: "var(--font)", fontSize: "var(--fs-sm)" }
              }),
              search && (0, S.jsx)("button", {
                type: "button",
                onClick: () => setSearch(''),
                style: { background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "14px" },
                children: "✕"
              })
            ]
          })
        ]
      }),

      // 4. Grille des modules
      (0, S.jsx)("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "var(--gap)"
        },
        children: filteredModules.length === 0 ? (
          (0, S.jsxs)("div", {
            className: "card",
            style: { gridColumn: "1 / -1", textAlign: "center", padding: "48px 24px" },
            children: [
              (0, S.jsx)(i, { name: "inbox" }),
              (0, S.jsx)("h3", { style: { marginTop: "12px", color: "var(--ink)" }, children: "Aucun module trouvé" }),
              (0, S.jsx)("p", { style: { color: "var(--muted)", fontSize: "var(--fs-sm)" }, children: "Essayez de modifier votre recherche ou de sélectionner une autre catégorie." })
            ]
          })
        ) : (
          filteredModules.map(mod => {
            const isActive = activeModules.includes(mod.id);
            const isCore = mod.isCore;

            return (0, S.jsxs)("section", {
              className: "card",
              key: mod.id,
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: isActive ? "1px solid var(--line-2)" : "1px solid var(--line)",
                transition: "transform 0.2s var(--ease), box-shadow 0.2s var(--ease)"
              },
              children: [
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsxs)("div", {
                      className: "chead",
                      style: { marginBottom: "12px" },
                      children: [
                        (0, S.jsx)("div", {
                          style: {
                            width: "40px",
                            height: "40px",
                            borderRadius: "var(--r-md)",
                            background: "var(--well)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--ink)"
                          },
                          children: (0, S.jsx)(i, { name: mod.icon })
                        }),
                        (0, S.jsxs)("div", {
                          className: "chead__text",
                          children: [
                            (0, S.jsx)("h2", { style: { margin: 0, fontSize: "var(--fs-lg)", fontWeight: "700" }, children: mod.name }),
                            (0, S.jsx)("p", { style: { margin: "2px 0 0", color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.04em", fontWeight: "600" }, children: mod.category })
                          ]
                        }),
                        (0, S.jsx)("span", {
                          className: `pill ${isActive ? 'pill--good' : 'pill--plain'}`,
                          style: { fontSize: "11px" },
                          children: isActive ? "Activé" : "Disponible"
                        })
                      ]
                    }),

                    (0, S.jsx)("p", {
                      style: { fontSize: "var(--fs-sm)", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 16px 0", minHeight: "42px" },
                      children: mod.description
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--line)"
                  },
                  children: [
                    (0, S.jsx)("span", {
                      style: { fontSize: "var(--fs-xs)", color: "var(--muted)" },
                      children: isCore ? "Noyau obligatoire" : (isActive ? "Intégré à la sidebar" : "Prêt à être activé")
                    }),

                    isCore ? (
                      (0, S.jsx)("button", {
                        type: "button",
                        className: "btn btn--ghost btn--sm",
                        disabled: true,
                        style: { opacity: 0.6 },
                        children: "Requis"
                      })
                    ) : (
                      (0, S.jsx)("button", {
                        type: "button",
                        className: `btn btn--sm ${isActive ? 'btn--ghost' : 'btn--primary'}`,
                        onClick: () => toggleModule(mod.id),
                        style: { minWidth: "96px", justifyContent: "center" },
                        children: isActive ? "Désactiver" : "Activer"
                      })
                    )
                  ]
                })
              ]
            });
          })
        )
      })
    ]
  });
}
