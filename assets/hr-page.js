import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

const DEPARTMENTS = [
  'Direction & Stratégie',
  'Production & Création',
  'Technique & CGI',
  'Post-Production',
  'Tournage & Studio',
  'Finance & Administration'
];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Intermittent', 'Freelance', 'Stage / Alternance', 'Mandataire'];

export default function HrPage({ sub = 'employees', params = [] }) {
  const [activeTab, setActiveTab] = x.useState(sub || 'employees');
  const [employees, setEmployees] = x.useState([]);
  const [leaves, setLeaves] = x.useState([]);
  const [stats, setStats] = x.useState({
    totalEmployees: 0,
    pendingLeavesCount: 0,
    totalGrossPayroll: 0,
    estimatedEmployerCharges: 0,
    estimatedNetPayroll: 0,
    totalCompanyCost: 0
  });
  const [isLoading, setIsLoading] = x.useState(true);
  const [search, setSearch] = x.useState('');
  const [selectedDept, setSelectedDept] = x.useState('all');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = x.useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = x.useState(false);

  // Forms
  const [newEmployeeForm, setNewEmployeeForm] = x.useState({
    name: '',
    role: '',
    department: 'Production & Création',
    email: '',
    phone: '',
    contractType: 'CDI',
    salaryBrut: 3500,
    paidLeavesBalance: 25,
    rttBalance: 5
  });

  const [newLeaveForm, setNewLeaveForm] = x.useState({
    employeeId: '',
    type: 'paid',
    startDate: '',
    endDate: '',
    daysCount: 1,
    reason: ''
  });

  const activeTenantId = x.useMemo(() => {
    try {
      return localStorage.getItem('marlo_active_tenant') || 'northbank-post';
    } catch (e) {
      return 'northbank-post';
    }
  }, []);

  const loadHrData = x.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/hr`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setLeaves(data.leaves || []);
        setStats(data.stats || {});
        if (data.employees?.length > 0 && !newLeaveForm.employeeId) {
          setNewLeaveForm(prev => ({ ...prev, employeeId: data.employees[0].id }));
        }
      }
    } catch (err) {
      console.error('Erreur chargement RH:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId, newLeaveForm.employeeId]);

  x.useEffect(() => {
    loadHrData();
  }, [loadHrData]);

  x.useEffect(() => {
    if (sub && ['employees', 'leaves', 'calendar', 'payroll'].includes(sub)) {
      setActiveTab(sub);
    }
  }, [sub]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#/hr/${tabId}`;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/hr/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployeeForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsEmployeeModalOpen(false);
        setNewEmployeeForm({
          name: '',
          role: '',
          department: 'Production & Création',
          email: '',
          phone: '',
          contractType: 'CDI',
          salaryBrut: 3500,
          paidLeavesBalance: 25,
          rttBalance: 5
        });
        await loadHrData();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/hr/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeaveForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsLeaveModalOpen(false);
        setNewLeaveForm({
          employeeId: employees[0]?.id || '',
          type: 'paid',
          startDate: '',
          endDate: '',
          daysCount: 1,
          reason: ''
        });
        await loadHrData();
      } else {
        alert(data.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/hr/leaves/${leaveId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await loadHrData();
      } else {
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  const filteredEmployees = x.useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = (emp.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.role || '').toLowerCase().includes(search.toLowerCase()) ||
                          (emp.email || '').toLowerCase().includes(search.toLowerCase());
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, search, selectedDept]);

  return (0, S.jsxs)("div", {
    className: "p-shell",
    children: [
      // 1. PAGE HEADER
      (0, S.jsxs)("header", {
        className: "phead",
        children: [
          (0, S.jsxs)("div", {
            className: "phead__titles",
            children: [
              (0, S.jsx)("span", { className: "eyebrow", children: "RESSOURCES HUMAINES & TALENTS" }),
              (0, S.jsx)("h1", { children: "Équipe, Salariés & Gestion des Congés" }),
              (0, S.jsx)("p", {
                className: "phead__sub",
                children: "Fiches collaborateurs, validation des congés payés & RTT, planning d'équipe et masse salariale."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "phead__actions",
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsLeaveModalOpen(true),
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "calendar" }),
                  " Poser un Congé"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsEmployeeModalOpen(true),
                className: "btn btn--primary",
                children: [
                  (0, S.jsx)(i, { name: "plus" }),
                  " Nouveau Salarié"
                ]
              })
            ]
          })
        ]
      }),

      // 2. SUB-TABS
      (0, S.jsx)("nav", {
        className: "tabs",
        children: [
          { id: 'employees', label: 'Trombinoscope & Collaborateurs', count: employees.length },
          { id: 'leaves', label: 'Demandes de Congés & RTT', count: stats.pendingLeavesCount > 0 ? stats.pendingLeavesCount : null },
          { id: 'calendar', label: 'Planning de Présence', count: null },
          { id: 'payroll', label: 'Masse Salariale & Charges', count: null }
        ].map(tab => (
          (0, S.jsxs)("button", {
            key: tab.id,
            type: "button",
            onClick: () => handleTabClick(tab.id),
            className: `tabs__btn ${activeTab === tab.id ? 'is-active' : ''}`,
            children: [
              tab.label,
              tab.count !== null && (0, S.jsx)("span", {
                className: "pill",
                style: {
                  marginLeft: '8px',
                  fontSize: '11px',
                  backgroundColor: tab.id === 'leaves' ? '#f59e0b' : 'var(--c-brand)',
                  color: '#fff'
                },
                children: tab.count
              })
            ]
          }, tab.id)
        ))
      }),

      // 3. STATS STRIP
      (0, S.jsxs)("div", {
        className: "kpi-grid",
        style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '20px 0' },
        children: [
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "EFFECTIF TOTAL ACTIF" }),
              (0, S.jsxs)("div", { className: "kpi__val", children: [stats.totalEmployees || 0, " pers."] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "CDI, CDD et Intermittents" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "DEMANDES DE CONGÉS EN ATTENTE" }),
              (0, S.jsx)("div", {
                className: "kpi__val",
                style: { color: (stats.pendingLeavesCount || 0) > 0 ? '#f59e0b' : '#10b981' },
                children: stats.pendingLeavesCount || 0
              }),
              (0, S.jsx)("span", { className: "kpi__foot", children: (stats.pendingLeavesCount || 0) > 0 ? "Action managériale requise" : "Toutes demandes traitées" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "MASSE SALARIALE BRUTE MENSUELLE" }),
              (0, S.jsxs)("div", { className: "kpi__val", children: [(stats.totalGrossPayroll || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsxs)("span", { className: "kpi__foot", children: ["Charges pat. est. : ", (stats.estimatedEmployerCharges || 0).toLocaleString('fr-FR'), " €"] })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "COÛT EMPLOYEUR GLOBAL" }),
              (0, S.jsxs)("div", { className: "kpi__val", style: { color: 'var(--c-brand)' }, children: [(stats.totalCompanyCost || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Salaires bruts + cotisations URSSAF" })
            ]
          })
        ]
      }),

      // 4. TAB 1: EMPLOYEES DIRECTORY
      activeTab === 'employees' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '20px' },
        children: [
          (0, S.jsxs)("div", {
            className: "toolbar",
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
            children: [
              (0, S.jsxs)("div", {
                style: { display: 'flex', gap: '12px', alignItems: 'center' },
                children: [
                  (0, S.jsx)("input", {
                    type: "text",
                    placeholder: "Rechercher par nom, rôle ou email...",
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    className: "input",
                    style: { width: '300px' }
                  }),
                  (0, S.jsxs)("select", {
                    value: selectedDept,
                    onChange: (e) => setSelectedDept(e.target.value),
                    className: "input",
                    style: { width: '220px' },
                    children: [
                      (0, S.jsx)("option", { value: "all", children: "Tous les départements" }),
                      DEPARTMENTS.map(d => (0, S.jsx)("option", { value: d, children: d }, d))
                    ]
                  })
                ]
              }),
              (0, S.jsxs)("span", { className: "eyebrow", children: [filteredEmployees.length, " collaborateur(s)"] })
            ]
          }),

          isLoading ? (
            (0, S.jsx)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Chargement de l'équipe..." })
          ) : (
            (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Collaborateur" }),
                        (0, S.jsx)("th", { children: "Département & Rôle" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Contrat" }),
                        (0, S.jsx)("th", { children: "Contact" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Solde CP" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Solde RTT" }),
                        (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Salaire Brut" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: filteredEmployees.map(emp => (
                      (0, S.jsxs)("tr", {
                        key: emp.id,
                        children: [
                          (0, S.jsx)("td", {
                            children: (0, S.jsxs)("div", {
                              style: { display: 'flex', alignItems: 'center', gap: '10px' },
                              children: [
                                (0, S.jsx)("span", {
                                  style: {
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--c-brand)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '13px'
                                  },
                                  children: emp.name.split(' ').map(n => n[0]).join('')
                                }),
                                (0, S.jsxs)("div", {
                                  children: [
                                    (0, S.jsx)("div", { style: { fontWeight: 600 }, children: emp.name }),
                                    (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: emp.role })
                                  ]
                                })
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsx)("span", { className: "pill pill--ghost", children: emp.department })
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center' },
                            children: (0, S.jsx)("span", {
                              className: "badge badge--outline",
                              style: {
                                color: emp.contractType === 'CDI' ? '#10b981' : emp.contractType === 'CDD' ? '#f59e0b' : '#8b5cf6',
                                borderColor: 'currentColor'
                              },
                              children: emp.contractType
                            })
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsxs)("div", {
                              style: { fontSize: '13px', display: 'flex', flexDirection: 'column' },
                              children: [
                                (0, S.jsx)("span", { children: emp.email }),
                                (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: emp.phone || 'Non renseigné' })
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center', fontWeight: 600, color: '#10b981' },
                            children: `${emp.paidLeavesBalance} j`
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center', fontWeight: 600, color: 'var(--c-brand)' },
                            children: `${emp.rttBalance} j`
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'right', fontWeight: 600 },
                            children: `${(Number(emp.salaryBrut) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                          })
                        ]
                      }, emp.id)
                    ))
                  })
                ]
              })
            })
          )
        ]
      }),

      // 5. TAB 2: DEMANDES DE CONGÉS & RTT
      activeTab === 'leaves' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '20px' },
        children: [
          (0, S.jsxs)("div", {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
            children: [
              (0, S.jsxs)("div", {
                children: [
                  (0, S.jsx)("h3", { style: { margin: '0 0 4px 0' }, children: "Workflow de Validation des Absences" }),
                  (0, S.jsx)("p", { className: "phead__sub", children: "Approbation managériale et décompte automatique sur les soldes des collaborateurs." })
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsLeaveModalOpen(true),
                className: "btn btn--primary",
                children: [
                  (0, S.jsx)(i, { name: "plus" }),
                  " Déposer une Demande"
                ]
              })
            ]
          }),

          leaves.length === 0 ? (
            (0, S.jsx)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Aucune demande de congé enregistrée." })
          ) : (
            (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Collaborateur" }),
                        (0, S.jsx)("th", { children: "Type d'Absence" }),
                        (0, S.jsx)("th", { children: "Période" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Durée" }),
                        (0, S.jsx)("th", { children: "Motif" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Statut" }),
                        (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Action Manager" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: leaves.map(l => {
                      const isPending = l.status === 'pending';
                      return (0, S.jsxs)("tr", {
                        key: l.id,
                        children: [
                          (0, S.jsx)("td", { style: { fontWeight: 600 }, children: l.employeeName }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsx)("span", {
                              className: "badge badge--outline",
                              style: {
                                color: l.type === 'paid' ? '#10b981' : l.type === 'rtt' ? 'var(--c-brand)' : '#ef4444'
                              },
                              children: l.typeName || l.type
                            })
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsxs)("span", {
                              style: { fontFamily: 'monospace' },
                              children: [
                                new Date(l.startDate).toLocaleDateString('fr-FR'),
                                " → ",
                                new Date(l.endDate).toLocaleDateString('fr-FR')
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center', fontWeight: 700 },
                            children: `${l.daysCount} jour(s)`
                          }),
                          (0, S.jsx)("td", { style: { color: 'var(--c-sub)' }, children: l.reason || '-' }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center' },
                            children: isPending ? (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }, children: "⏳ En attente" })
                            ) : (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }, children: "✓ Approuvé" })
                            )
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'right' },
                            children: isPending ? (
                              (0, S.jsx)("button", {
                                type: "button",
                                onClick: () => handleApproveLeave(l.id),
                                className: "btn btn--primary",
                                style: { padding: '4px 12px', fontSize: '12px' },
                                children: "Approuver ✓"
                              })
                            ) : (
                              (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: l.approver || 'Validé' })
                            )
                          })
                        ]
                      }, l.id);
                    })
                  })
                ]
              })
            })
          )
        ]
      }),

      // 6. TAB 3: CALENDRIER & PRÉSENCES
      activeTab === 'calendar' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Planning Mensuel des Présences & Absences" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '20px' }, children: "Visibilité transverse de l'équipe pour anticiper les charges de production et plannings de tournage." }),

          (0, S.jsx)("div", {
            className: "table-wrap",
            children: (0, S.jsxs)("table", {
              className: "table",
              style: { textAlign: 'center' },
              children: [
                (0, S.jsx)("thead", {
                  children: (0, S.jsxs)("tr", {
                    children: [
                      (0, S.jsx)("th", { style: { textAlign: 'left', width: '200px' }, children: "Collaborateur" }),
                      (0, S.jsx)("th", { children: "Lun 16" }),
                      (0, S.jsx)("th", { children: "Mar 17 (Aujourd'hui)" }),
                      (0, S.jsx)("th", { children: "Mer 18" }),
                      (0, S.jsx)("th", { children: "Jeu 19" }),
                      (0, S.jsx)("th", { children: "Ven 20" }),
                      (0, S.jsx)("th", { children: "Semaine Prochaine" })
                    ]
                  })
                }),
                (0, S.jsx)("tbody", {
                  children: employees.map(emp => (
                    (0, S.jsxs)("tr", {
                      key: emp.id,
                      children: [
                        (0, S.jsx)("td", { style: { textAlign: 'left', fontWeight: 600 }, children: emp.name }),
                        (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill pill--ghost", style: { color: '#10b981' }, children: "Présent" }) }),
                        (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill pill--ghost", style: { color: '#10b981', fontWeight: 700 }, children: "Présent" }) }),
                        (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill pill--ghost", style: { color: '#10b981' }, children: "Présent" }) }),
                        (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill pill--ghost", style: { color: '#10b981' }, children: "Présent" }) }),
                        (0, S.jsx)("td", {
                          children: emp.name === 'Thomas Dubois' ? (
                            (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }, children: "RTT" })
                          ) : (
                            (0, S.jsx)("span", { className: "pill pill--ghost", style: { color: '#10b981' }, children: "Présent" })
                          )
                        }),
                        (0, S.jsx)("td", {
                          children: emp.name === 'Sarah Chen' ? (
                            (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }, children: "CP (2j)" })
                          ) : (
                            (0, S.jsx)("span", { style: { color: 'var(--c-sub)' }, children: "100% Dispo" })
                          )
                        })
                      ]
                    }, emp.id)
                  ))
                })
              ]
            })
          })
        ]
      }),

      // 7. TAB 4: MASSE SALARIALE & CHARGES
      activeTab === 'payroll' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Décomposition de la Masse Salariale & Cotisations Sociales" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '24px' }, children: "Estimations conformes URSSAF et régimes de retraite prévoyance pour le pilotage financier de l'entreprise." }),

          (0, S.jsxs)("div", {
            style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' },
            children: [
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "SALAIRES BRUTS GLOBAUX" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0' }, children: [(stats.totalGrossPayroll || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Compte 641000 (Rémunérations du personnel)" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "CHARGES PATRONALES ESTIMÉES (~42%)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0', color: '#f59e0b' }, children: [(stats.estimatedEmployerCharges || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Compte 645000 (Cotisations de sécurité sociale)" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "NET GLOBAL ESTIMÉ (~78% BRUT)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0', color: '#10b981' }, children: [(stats.estimatedNetPayroll || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Montant net viré aux collaborateurs (Compte 421000)" })
                ]
              })
            ]
          })
        ]
      }),

      // MODAL NOUVEAU SALARIÉ
      isEmployeeModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        children: (0, S.jsxs)("div", {
          className: "card modal",
          style: { width: '540px', maxWidth: '90vw', padding: '24px' },
          children: [
            (0, S.jsxs)("div", {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0 }, children: "Créer une fiche collaborateur" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsEmployeeModalOpen(false), className: "btn btn--ghost", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateEmployee,
              style: { display: 'flex', flexDirection: 'column', gap: '14px' },
              children: [
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "NOM ET PRÉNOM" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      required: true,
                      value: newEmployeeForm.name,
                      placeholder: "ex: Julien Lefevre",
                      onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value }),
                      className: "input"
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "INTITULÉ DU POSTE" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          required: true,
                          value: newEmployeeForm.role,
                          placeholder: "ex: Concepteur Rédacteur",
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, role: e.target.value }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "DÉPARTEMENT" }),
                        (0, S.jsx)("select", {
                          value: newEmployeeForm.department,
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value }),
                          className: "input",
                          children: DEPARTMENTS.map(d => (0, S.jsx)("option", { value: d, children: d }, d))
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "TYPE DE CONTRAT" }),
                        (0, S.jsx)("select", {
                          value: newEmployeeForm.contractType,
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, contractType: e.target.value }),
                          className: "input",
                          children: CONTRACT_TYPES.map(c => (0, S.jsx)("option", { value: c, children: c }, c))
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "SALAIRE BRUT MENSUEL (€)" }),
                        (0, S.jsx)("input", {
                          type: "number",
                          min: 0,
                          value: newEmployeeForm.salaryBrut,
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, salaryBrut: Number(e.target.value) }),
                          className: "input"
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "EMAIL PROFESSIONNEL" }),
                        (0, S.jsx)("input", {
                          type: "email",
                          value: newEmployeeForm.email,
                          placeholder: "j.lefevre@agence.com",
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "TÉLÉPHONE" }),
                        (0, S.jsx)("input", {
                          type: "tel",
                          value: newEmployeeForm.phone,
                          placeholder: "+33 (0)6 00 00 00 00",
                          onChange: (e) => setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value }),
                          className: "input"
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsEmployeeModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Enregistrer le salarié →" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // MODAL DEMANDE DE CONGÉ
      isLeaveModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        children: (0, S.jsxs)("div", {
          className: "card modal",
          style: { width: '480px', maxWidth: '90vw', padding: '24px' },
          children: [
            (0, S.jsxs)("div", {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0 }, children: "Déposer une demande de congé" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsLeaveModalOpen(false), className: "btn btn--ghost", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateLeave,
              style: { display: 'flex', flexDirection: 'column', gap: '14px' },
              children: [
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "COLLABORATEUR CONCERNÉ" }),
                    (0, S.jsx)("select", {
                      value: newLeaveForm.employeeId,
                      onChange: (e) => setNewLeaveForm({ ...newLeaveForm, employeeId: e.target.value }),
                      className: "input",
                      required: true,
                      children: employees.map(emp => (
                        (0, S.jsxs)("option", { value: emp.id, children: [emp.name, " (CP: ", emp.paidLeavesBalance, "j / RTT: ", emp.rttBalance, "j)"] }, emp.id)
                      ))
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "TYPE D'ABSENCE" }),
                    (0, S.jsxs)("select", {
                      value: newLeaveForm.type,
                      onChange: (e) => setNewLeaveForm({ ...newLeaveForm, type: e.target.value }),
                      className: "input",
                      children: [
                        (0, S.jsx)("option", { value: "paid", children: "Congés Payés (CP)" }),
                        (0, S.jsx)("option", { value: "rtt", children: "RTT (Récupération Temps Travail)" }),
                        (0, S.jsx)("option", { value: "sick", children: "Arrêt Maladie" }),
                        (0, S.jsx)("option", { value: "family", children: "Événement Familial / Mariage / Naissance" })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "DATE DE DÉBUT" }),
                        (0, S.jsx)("input", {
                          type: "date",
                          required: true,
                          value: newLeaveForm.startDate,
                          onChange: (e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "DATE DE FIN" }),
                        (0, S.jsx)("input", {
                          type: "date",
                          required: true,
                          value: newLeaveForm.endDate,
                          onChange: (e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value }),
                          className: "input"
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "NOMBRE DE JOURS OUVRÉS" }),
                    (0, S.jsx)("input", {
                      type: "number",
                      min: 0.5,
                      step: "0.5",
                      required: true,
                      value: newLeaveForm.daysCount,
                      onChange: (e) => setNewLeaveForm({ ...newLeaveForm, daysCount: Number(e.target.value) }),
                      className: "input"
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "MOTIF / COMMENTAIRE" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      value: newLeaveForm.reason,
                      placeholder: "ex: Congés d'été, repos...",
                      onChange: (e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value }),
                      className: "input"
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsLeaveModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Envoyer pour validation →" })
                  ]
                })
              ]
            })
          ]
        })
      })
    ]
  });
}
