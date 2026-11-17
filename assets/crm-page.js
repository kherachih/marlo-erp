import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

// Étapes standards du pipeline Odoo CRM
const STAGES = [
  { id: 'new', name: 'Nouveau', color: 'var(--ink-2)', tone: 'plain', defaultProb: 20 },
  { id: 'qualified', name: 'Qualifié', color: 'var(--accent)', tone: 'accent', defaultProb: 50 },
  { id: 'proposal', name: 'Proposition', color: 'var(--accent)', tone: 'accent', defaultProb: 75 },
  { id: 'negotiation', name: 'Négociation', color: 'var(--amber, #f59e0b)', tone: 'accent', defaultProb: 90 },
  { id: 'won', name: 'Gagné', color: 'var(--good, #10b981)', tone: 'good', defaultProb: 100 }
];

export default function CrmPage({ sub = 'pipeline', params = [] }) {
  const [currentTab, setCurrentTab] = x.useState(sub || 'pipeline');
  const [tenant, setTenant] = x.useState(() => {
    return {
      id: localStorage.getItem('marlo_erp_tenant_id') || 'northbank-post',
      name: 'Northbank Post',
      currency: 'EUR'
    };
  });

  const [leads, setLeads] = x.useState([]);
  const [loading, setLoading] = x.useState(true);
  const [metrics, setMetrics] = x.useState({
    totalValue: 0,
    weightedValue: 0,
    wonValue: 0,
    counts: { new: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, total: 0 }
  });

  const [search, setSearch] = x.useState('');
  const [stageFilter, setStageFilter] = x.useState('all');
  const [assignedFilter, setAssignedFilter] = x.useState('all');
  const [isModalOpen, setIsModalOpen] = x.useState(false);
  const [selectedLead, setSelectedLead] = x.useState(null);

  // Formulaire nouveau prospect
  const [formData, setFormData] = x.useState({
    title: '',
    company: '',
    value: '',
    stage: 'new',
    probability: 25,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    expectedClose: '',
    notes: ''
  });

  // Charger les pistes depuis l'API
  const fetchCrmData = async (tenantId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${tenantId}/crm`).then(r => r.json());
      if (res && res.success) {
        setLeads(res.leads || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.warn('Erreur chargement CRM:', err);
    } finally {
      setLoading(false);
    }
  };

  x.useEffect(() => {
    fetchCrmData(tenant.id);
  }, [tenant.id]);

  // Synchronisation avec les changements de tenant Marlo
  x.useEffect(() => {
    const handleTenantChange = (ev) => {
      if (ev.detail && ev.detail.tenant) {
        setTenant(ev.detail.tenant);
        fetchCrmData(ev.detail.tenant.id);
      }
    };
    window.addEventListener('marlo:tenant-changed', handleTenantChange);
    return () => window.removeEventListener('marlo:tenant-changed', handleTenantChange);
  }, []);

  // Déplacement / Changement d'étape
  const moveLeadStage = async (leadId, nextStage) => {
    try {
      const stageObj = STAGES.find(s => s.id === nextStage);
      const prob = stageObj ? stageObj.defaultProb : undefined;

      const res = await fetch(`/api/tenants/${tenant.id}/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage, probability: prob })
      }).then(r => r.json());

      if (res && res.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? res.lead : l));
        fetchCrmData(tenant.id);
        showMarloToast(`Piste déplacée vers "${stageObj?.name || nextStage}"`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Convertir une affaire gagnée en Projet & Facture
  const convertLead = async (lead) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/crm/leads/${lead.id}/convert`, {
        method: 'POST'
      }).then(r => r.json());

      if (res && res.success) {
        setLeads(prev => prev.map(l => l.id === lead.id ? res.lead : l));
        fetchCrmData(tenant.id);
        showMarloToast(`Succès : Opportunité convertie en projet & devis !`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Création d'une nouvelle opportunité
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company) return;

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());

      if (res && res.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          company: '',
          value: '',
          stage: 'new',
          probability: 25,
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          expectedClose: '',
          notes: ''
        });
        fetchCrmData(tenant.id);
        showMarloToast(`Prospect "${res.lead.company}" ajouté au pipeline !`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showMarloToast = (msg) => {
    const existing = document.getElementById('erp-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'erp-toast';
    t.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999999;
      background: var(--ink); color: var(--bg);
      padding: 10px 18px; border-radius: var(--r-md);
      font-size: 13px; font-weight: 600; font-family: var(--font);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    `;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  // Filtrage des leads
  const filteredLeads = leads.filter(l => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      (l.contactName && l.contactName.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (stageFilter !== 'all' && l.stage !== stageFilter) return false;
    if (assignedFilter !== 'all' && l.assignedTo?.id !== assignedFilter) return false;

    if (currentTab === 'won' && l.stage !== 'won') return false;

    return true;
  });

  const formatMoney = (val) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: tenant.currency || 'EUR',
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  return (0, S.jsxs)("div", {
    className: "page crm",
    style: { maxWidth: "var(--max)", margin: "0 auto", paddingBottom: "60px" },
    children: [
      // 1. En-tête Marlo (.phead)
      (0, S.jsxs)("header", {
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
                    children: "CRM & Pipeline Commercial"
                  }),
                  (0, S.jsx)("span", {
                    className: "pill pill--accent",
                    children: tenant.name
                  })
                ]
              }),
              (0, S.jsx)("p", {
                style: { color: "var(--muted)", fontSize: "var(--fs-base)", marginTop: "6px" },
                children: "Gestion des opportunités, qualification des prospects et conversion en projets & factures en 1 clic."
              })
            ]
          }),

          // Actions
          (0, S.jsxs)("div", {
            style: { display: "flex", alignItems: "center", gap: "10px" },
            children: [
              (0, S.jsxs)("span", {
                className: "pill pill--good",
                children: [formatMoney(metrics.weightedValue), " pondéré"]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                className: "btn btn--primary btn--sm magnetic",
                onClick: () => setIsModalOpen(true),
                children: [
                  (0, S.jsx)(i, { name: "plus" }),
                  " Nouveau Prospect"
                ]
              })
            ]
          })
        ]
      }),

      // 2. Barres de sous-onglets Marlo (.tabs)
      (0, S.jsxs)("div", {
        className: "tabs",
        style: { marginBottom: "18px" },
        children: [
          (0, S.jsxs)("button", {
            type: "button",
            className: `tab ${currentTab === 'pipeline' ? 'is-active' : ''}`,
            onClick: () => setCurrentTab('pipeline'),
            children: [
              (0, S.jsx)(i, { name: "kanban" }),
              " Pipeline Kanban ",
              (0, S.jsx)("span", { className: "badge", children: leads.filter(l => l.stage !== 'won').length })
            ]
          }),
          (0, S.jsxs)("button", {
            type: "button",
            className: `tab ${currentTab === 'list' ? 'is-active' : ''}`,
            onClick: () => setCurrentTab('list'),
            children: [
              (0, S.jsx)(i, { name: "grid" }),
              " Toutes les Pistes ",
              (0, S.jsx)("span", { className: "badge", children: leads.length })
            ]
          }),
          (0, S.jsxs)("button", {
            type: "button",
            className: `tab ${currentTab === 'won' ? 'is-active' : ''}`,
            onClick: () => setCurrentTab('won'),
            children: [
              (0, S.jsx)(i, { name: "check" }),
              " Affaires Gagnées ",
              (0, S.jsx)("span", { className: "badge badge--accent", children: leads.filter(l => l.stage === 'won').length })
            ]
          })
        ]
      }),

      // 3. Cartes de synthèse KPI (Design Marlo .card)
      (0, S.jsxs)("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--gap)",
          marginBottom: "20px"
        },
        children: [
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "16px 20px" },
            children: [
              (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" }, children: "Volume Total du Pipeline" }),
              (0, S.jsx)("h2", { style: { fontSize: "var(--fs-2xl)", color: "var(--ink)", margin: "4px 0 0" }, children: formatMoney(metrics.totalValue) })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "16px 20px" },
            children: [
              (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" }, children: "Revenu Prévisionnel Pondéré" }),
              (0, S.jsx)("h2", { style: { fontSize: "var(--fs-2xl)", color: "var(--accent)", margin: "4px 0 0" }, children: formatMoney(metrics.weightedValue) })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "16px 20px" },
            children: [
              (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" }, children: "Affaires Gagnées (Closing)" }),
              (0, S.jsx)("h2", { style: { fontSize: "var(--fs-2xl)", color: "var(--good, #10b981)", margin: "4px 0 0" }, children: formatMoney(metrics.wonValue) })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "16px 20px" },
            children: [
              (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" }, children: "Opportunités Actives" }),
              (0, S.jsxs)("h2", { style: { fontSize: "var(--fs-2xl)", color: "var(--ink)", margin: "4px 0 0" }, children: [leads.filter(l => l.stage !== 'won').length, " pistes"] })
            ]
          })
        ]
      }),

      // 4. Barre d'outils & Filtres (.toolbar)
      (0, S.jsxs)("div", {
        className: "toolbar",
        style: { marginBottom: "20px" },
        children: [
          (0, S.jsxs)("div", {
            className: "search",
            style: { flex: "0 1 300px", height: "36px" },
            children: [
              (0, S.jsx)(i, { name: "search" }),
              (0, S.jsx)("input", {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Chercher une entreprise, projet...",
                style: { background: "transparent", border: "none", color: "var(--ink)", width: "100%", outline: "none", fontFamily: "var(--font)", fontSize: "var(--fs-sm)" }
              }),
              search && (0, S.jsx)("button", {
                type: "button",
                onClick: () => setSearch(''),
                style: { background: "none", border: "none", color: "var(--muted)", cursor: "pointer" },
                children: "✕"
              })
            ]
          }),

          // Sélecteur d'étape
          (0, S.jsxs)("select", {
            className: "select select--sm",
            value: stageFilter,
            onChange: (e) => setStageFilter(e.target.value),
            style: { minWidth: "150px" },
            children: [
              (0, S.jsx)("option", { value: "all", children: "Toutes les étapes" }),
              STAGES.map(s => (0, S.jsx)("option", { value: s.id, children: s.name }, s.id))
            ]
          }),

          // Sélecteur de commercial
          (0, S.jsxs)("select", {
            className: "select select--sm",
            value: assignedFilter,
            onChange: (e) => setAssignedFilter(e.target.value),
            style: { minWidth: "150px" },
            children: [
              (0, S.jsx)("option", { value: "all", children: "Tous les responsables" }),
              (0, S.jsx)("option", { value: "dara", children: "Dara Whitfield" }),
              (0, S.jsx)("option", { value: "maya", children: "Maya Lin" }),
              (0, S.jsx)("option", { value: "hasib", children: "Hasib" })
            ]
          }),

          (search || stageFilter !== 'all' || assignedFilter !== 'all') && (
            (0, S.jsx)("button", {
              type: "button",
              className: "linkbtn",
              onClick: () => { setSearch(''); setStageFilter('all'); setAssignedFilter('all'); },
              children: "Effacer les filtres"
            })
          )
        ]
      }),

      // 5. Vue 1 : Pipeline Kanban (.board & .lane)
      currentTab === 'pipeline' && (
        (0, S.jsx)("div", {
          className: "board",
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(280px, 1fr))",
            gap: "16px",
            overflowX: "auto",
            alignItems: "start",
            paddingBottom: "16px"
          },
          children: STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

            return (0, S.jsxs)("section", {
              className: "lane",
              key: stage.id,
              style: { minWidth: "270px" },
              children: [
                // En-tête de la colonne
                (0, S.jsxs)("header", {
                  className: "lane__head",
                  children: [
                    (0, S.jsx)("span", {
                      style: {
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: stage.color,
                        display: "inline-block"
                      }
                    }),
                    (0, S.jsx)("b", { children: stage.name }),
                    (0, S.jsx)("span", { className: "badge", children: stageLeads.length }),
                    (0, S.jsx)("span", {
                      style: { marginLeft: "auto", fontSize: "11px", color: "var(--muted)", fontWeight: "600" },
                      children: formatMoney(stageTotal)
                    })
                  ]
                }),

                // Liste des cartes de l'étape
                (0, S.jsx)("div", {
                  className: "lane__list",
                  style: { minHeight: "220px", display: "flex", flexDirection: "column", gap: "10px" },
                  children: stageLeads.length === 0 ? (
                    (0, S.jsx)("div", { className: "lane__empty", children: "Aucune opportunité" })
                  ) : (
                    stageLeads.map(lead => {
                      const nextStageIdx = STAGES.findIndex(s => s.id === lead.stage) + 1;
                      const nextStage = STAGES[nextStageIdx];

                      return (0, S.jsxs)("article", {
                        className: "card",
                        key: lead.id,
                        style: {
                          padding: "14px",
                          borderRadius: "var(--r-md)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          border: "1px solid var(--line-2)",
                          cursor: "pointer",
                          transition: "transform 0.15s, box-shadow 0.15s"
                        },
                        onClick: () => setSelectedLead(lead),
                        children: [
                          (0, S.jsxs)("div", {
                            style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
                            children: [
                              (0, S.jsx)("b", {
                                style: { fontSize: "var(--fs-sm)", color: "var(--ink)", fontWeight: "700" },
                                children: lead.company
                              }),
                              (0, S.jsx)("span", {
                                className: `pill pill--${stage.tone}`,
                                style: { fontSize: "10px", padding: "2px 6px" },
                                children: `${lead.probability}%`
                              })
                            ]
                          }),

                          (0, S.jsx)("span", {
                            style: { fontSize: "var(--fs-xs)", color: "var(--muted)", lineHeight: 1.4 },
                            children: lead.title
                          }),

                          (0, S.jsxs)("div", {
                            style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" },
                            children: [
                              (0, S.jsx)("b", {
                                style: { fontSize: "var(--fs-md)", color: "var(--ink)", fontWeight: "800" },
                                children: formatMoney(lead.value)
                              }),
                              lead.expectedClose && (
                                (0, S.jsxs)("span", {
                                  style: { fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" },
                                  children: [
                                    (0, S.jsx)(i, { name: "clock", size: "sm" }),
                                    lead.expectedClose
                                  ]
                                })
                              )
                            ]
                          }),

                          // Pied de carte avec actions rapides
                          (0, S.jsxs)("div", {
                            style: {
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderTop: "1px solid var(--line)",
                              paddingTop: "8px",
                              marginTop: "4px"
                            },
                            children: [
                              (0, S.jsxs)("small", {
                                style: { color: "var(--muted)", fontSize: "11px" },
                                children: [lead.assignedTo?.name ? lead.assignedTo.name.split(' ')[0] : "Assigné"]
                              }),

                              // Bouton d'avancement d'étape ou de conversion
                              stage.id === 'won' ? (
                                (0, S.jsxs)("button", {
                                  type: "button",
                                  className: "btn btn--subtle btn--sm",
                                  style: { fontSize: "10px", padding: "3px 8px" },
                                  onClick: (e) => { e.stopPropagation(); convertLead(lead); },
                                  children: [(0, S.jsx)(i, { name: "check" }), " Convertir en Projet"]
                                })
                              ) : (
                                nextStage && (
                                  (0, S.jsxs)("button", {
                                    type: "button",
                                    className: "btn btn--ghost btn--sm",
                                    style: { fontSize: "10px", padding: "3px 8px" },
                                    onClick: (e) => { e.stopPropagation(); moveLeadStage(lead.id, nextStage.id); },
                                    children: ["→ ", nextStage.name]
                                  })
                                )
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
          })
        })
      ),

      // 6. Vue 2 : Liste / Tableau des opportunités (.table)
      (currentTab === 'list' || currentTab === 'won') && (
        (0, S.jsx)("section", {
          className: "card card--flush",
          children: filteredLeads.length === 0 ? (
            (0, S.jsx)("div", { style: { padding: "40px", textAlign: "center", color: "var(--muted)" }, children: "Aucune opportunité dans cette vue." })
          ) : (
            (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Société / Client" }),
                        (0, S.jsx)("th", { children: "Opportunité" }),
                        (0, S.jsx)("th", { className: "r", children: "Valeur Estimée" }),
                        (0, S.jsx)("th", { children: "Probabilité" }),
                        (0, S.jsx)("th", { children: "Étape Pipeline" }),
                        (0, S.jsx)("th", { children: "Responsable" }),
                        (0, S.jsx)("th", { children: "Closing Prévu" }),
                        (0, S.jsx)("th", { className: "r", children: "Actions" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: filteredLeads.map(lead => {
                      const stageObj = STAGES.find(s => s.id === lead.stage);
                      return (0, S.jsxs)("tr", {
                        key: lead.id,
                        className: "is-click",
                        onClick: () => setSelectedLead(lead),
                        children: [
                          (0, S.jsx)("td", { children: (0, S.jsx)("b", { children: lead.company }) }),
                          (0, S.jsx)("td", { children: lead.title }),
                          (0, S.jsx)("td", { className: "r", children: (0, S.jsx)("b", { children: formatMoney(lead.value) }) }),
                          (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: `pill pill--${stageObj?.tone || 'plain'}`, children: `${lead.probability}%` }) }),
                          (0, S.jsx)("td", { children: stageObj?.name || lead.stage }),
                          (0, S.jsx)("td", { children: lead.assignedTo?.name || "—" }),
                          (0, S.jsx)("td", { children: lead.expectedClose || "—" }),
                          (0, S.jsx)("td", {
                            className: "r",
                            children: (0, S.jsxs)("div", {
                              style: { display: "flex", justifyContent: "flex-end", gap: "6px" },
                              children: [
                                lead.stage === 'won' ? (
                                  (0, S.jsxs)("button", {
                                    type: "button",
                                    className: "btn btn--subtle btn--sm",
                                    onClick: (e) => { e.stopPropagation(); convertLead(lead); },
                                    children: [(0, S.jsx)(i, { name: "check" }), " Convertir"]
                                  })
                                ) : (
                                  (0, S.jsx)("button", {
                                    type: "button",
                                    className: "btn btn--ghost btn--sm",
                                    onClick: (e) => { e.stopPropagation(); moveLeadStage(lead.id, 'won'); },
                                    children: "Marquer Gagné"
                                  })
                                )
                              ]
                            })
                          })
                        ]
                      });
                    })
                  })
                ]
              })
            })
          )
        })
      ),

      // 7. Modale "Nouveau Prospect" (Respect strict du design Marlo)
      isModalOpen && (
        (0, S.jsx)("div", {
          className: "modal-wrap",
          style: {
            position: "fixed", inset: 0, zIndex: 9999999,
            background: "rgba(18, 19, 21, 0.75)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
          },
          children: (0, S.jsxs)("div", {
            className: "card modal",
            style: { width: "100%", maxWidth: "560px", padding: "28px", borderRadius: "var(--r-lg)", background: "var(--bg)", border: "1px solid var(--line-2)" },
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
                children: [
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsx)("h2", { style: { margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--ink)" }, children: "Nouveau Prospect / Opportunité" }),
                      (0, S.jsx)("p", { style: { margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }, children: "Ajoutez un contrat potentiel dans le pipeline commercial." })
                    ]
                  }),
                  (0, S.jsx)("button", {
                    type: "button",
                    className: "btn btn--ghost btn--sm",
                    onClick: () => setIsModalOpen(false),
                    children: "✕"
                  })
                ]
              }),

              (0, S.jsxs)("form", {
                onSubmit: handleCreateLead,
                children: [
                  (0, S.jsxs)("div", {
                    className: "formgrid",
                    style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" },
                    children: [
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Société / Client *" }),
                          (0, S.jsx)("input", {
                            className: "input",
                            required: true,
                            value: formData.company,
                            onChange: (e) => setFormData({ ...formData, company: e.target.value }),
                            placeholder: "Ex: Pathé Films, L'Oréal..."
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Titre du projet / opportunité *" }),
                          (0, S.jsx)("input", {
                            className: "input",
                            required: true,
                            value: formData.title,
                            onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                            placeholder: "Ex: Spot TV 30s, Refonte Marque..."
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Valeur estimée (€)" }),
                          (0, S.jsx)("input", {
                            type: "number",
                            className: "input",
                            value: formData.value,
                            onChange: (e) => setFormData({ ...formData, value: e.target.value }),
                            placeholder: "25000"
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Étape initiale" }),
                          (0, S.jsx)("select", {
                            className: "select",
                            value: formData.stage,
                            onChange: (e) => {
                              const st = STAGES.find(s => s.id === e.target.value);
                              setFormData({ ...formData, stage: e.target.value, probability: st ? st.defaultProb : 25 });
                            },
                            children: STAGES.map(s => (0, S.jsx)("option", { value: s.id, children: s.name }, s.id))
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Contact (Nom & Prénom)" }),
                          (0, S.jsx)("input", {
                            className: "input",
                            value: formData.contactName,
                            onChange: (e) => setFormData({ ...formData, contactName: e.target.value }),
                            placeholder: "Margaux Lefebvre"
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, S.jsx)("span", { children: "Email contact" }),
                          (0, S.jsx)("input", {
                            type: "email",
                            className: "input",
                            value: formData.contactEmail,
                            onChange: (e) => setFormData({ ...formData, contactEmail: e.target.value }),
                            placeholder: "contact@client.com"
                          })
                        ]
                      }),
                      (0, S.jsxs)("label", {
                        className: "field span2",
                        style: { gridColumn: "1 / -1" },
                        children: [
                          (0, S.jsx)("span", { children: "Date de closing estimée" }),
                          (0, S.jsx)("input", {
                            type: "date",
                            className: "input",
                            value: formData.expectedClose,
                            onChange: (e) => setFormData({ ...formData, expectedClose: e.target.value })
                          })
                        ]
                      })
                    ]
                  }),

                  (0, S.jsxs)("div", {
                    className: "formfoot",
                    style: { display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" },
                    children: [
                      (0, S.jsx)("button", {
                        type: "button",
                        className: "btn btn--ghost",
                        onClick: () => setIsModalOpen(false),
                        children: "Annuler"
                      }),
                      (0, S.jsx)("button", {
                        type: "submit",
                        className: "btn btn--primary",
                        children: "Enregistrer la piste →"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        })
      ),

      // 8. Tiroir de détail du prospect (quand on clique sur une carte)
      selectedLead && (
        (0, S.jsx)("div", {
          className: "modal-wrap",
          style: {
            position: "fixed", inset: 0, zIndex: 9999999,
            background: "rgba(18, 19, 21, 0.75)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "flex-end"
          },
          onClick: () => setSelectedLead(null),
          children: (0, S.jsxs)("div", {
            className: "card",
            style: {
              width: "100%", maxWidth: "480px", height: "100%", background: "var(--bg)",
              padding: "28px", boxSizing: "border-box", overflowY: "auto", borderLeft: "1px solid var(--line-2)"
            },
            onClick: (e) => e.stopPropagation(),
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
                children: [
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsx)("span", { className: `pill pill--${STAGES.find(s => s.id === selectedLead.stage)?.tone || 'plain'}`, children: STAGES.find(s => s.id === selectedLead.stage)?.name }),
                      (0, S.jsx)("h2", { style: { margin: "8px 0 2px", fontSize: "20px", color: "var(--ink)", fontWeight: "800" }, children: selectedLead.company }),
                      (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: selectedLead.title })
                    ]
                  }),
                  (0, S.jsx)("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => setSelectedLead(null), children: "✕" })
                ]
              }),

              (0, S.jsxs)("dl", {
                className: "dl",
                style: { marginBottom: "24px" },
                children: [
                  (0, S.jsx)("dt", { children: "Valeur estimée" }),
                  (0, S.jsx)("dd", { children: (0, S.jsx)("b", { style: { fontSize: "16px", color: "var(--ink)" }, children: formatMoney(selectedLead.value) }) }),
                  (0, S.jsx)("dt", { children: "Probabilité de succès" }),
                  (0, S.jsxs)("dd", { children: [selectedLead.probability, " %"] }),
                  (0, S.jsx)("dt", { children: "Contact principal" }),
                  (0, S.jsxs)("dd", { children: [selectedLead.contactName || "Non spécifié", selectedLead.contactEmail && ` (${selectedLead.contactEmail})`] }),
                  (0, S.jsx)("dt", { children: "Date de closing prévue" }),
                  (0, S.jsx)("dd", { children: selectedLead.expectedClose || "—" }),
                  (0, S.jsx)("dt", { children: "Responsable" }),
                  (0, S.jsx)("dd", { children: selectedLead.assignedTo?.name || "Dara Whitfield" }),
                  (0, S.jsx)("dt", { children: "Notes & Brief" }),
                  (0, S.jsx)("dd", { style: { lineHeight: 1.5, color: "var(--ink-2)" }, children: selectedLead.notes || "Aucune note particulière." })
                ]
              }),

              (0, S.jsxs)("div", {
                style: { display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "18px" },
                children: [
                  (0, S.jsxs)("button", {
                    type: "button",
                    className: "btn btn--primary btn--block",
                    onClick: () => { convertLead(selectedLead); setSelectedLead(null); },
                    children: [(0, S.jsx)(i, { name: "check" }), " Convertir en Projet & Facture Odoo"]
                  }),
                  (0, S.jsx)("button", {
                    type: "button",
                    className: "btn btn--ghost btn--block",
                    onClick: () => setSelectedLead(null),
                    children: "Fermer"
                  })
                ]
              })
            ]
          })
        })
      )
    ]
  });
}
