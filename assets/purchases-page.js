import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

// Catégories de dépenses standards
const EXPENSE_CATEGORIES = [
  'Repas & Réception Client',
  'Déplacement / Transport / Train',
  'Hébergement / Hôtel',
  'Logiciels & Outils Numériques',
  'Fournitures & Matériel',
  'Formation & Documentation'
];

export default function PurchasesPage({ sub = 'orders', params = [] }) {
  const [currentTab, setCurrentTab] = x.useState(sub || 'orders');
  const [tenant, setTenant] = x.useState(() => ({
    id: localStorage.getItem('marlo_erp_tenant_id') || 'northbank-post',
    name: localStorage.getItem('marlo_erp_tenant_name') || 'Northbank Post',
    currency: 'EUR'
  }));

  const [loading, setLoading] = x.useState(true);
  const [purchasesData, setPurchasesData] = x.useState({
    orders: [],
    expenses: [],
    vendors: [],
    kpis: { totalSpentHT: 0, pendingOrdersCount: 0, pendingExpensesCount: 0, vendorsCount: 0 }
  });

  // Filtres
  const [search, setSearch] = x.useState('');
  const [statusFilter, setStatusFilter] = x.useState('all');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = x.useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = x.useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = x.useState(false);

  // Formulaire Bon de Commande
  const [orderForm, setOrderForm] = x.useState({
    vendorId: '',
    vendorName: '',
    title: '',
    amountHT: '',
    vatRate: '20',
    account: '606000',
    accountName: 'Achats non stockés & Abonnements SaaS'
  });

  // Formulaire Note de Frais
  const [expenseForm, setExpenseForm] = x.useState({
    userName: 'Lucas Martin',
    category: 'Repas & Réception Client',
    amountTTC: '',
    description: ''
  });

  // Formulaire Fournisseur
  const [vendorForm, setVendorForm] = x.useState({
    name: '',
    category: 'Logiciels & Licences SaaS',
    contact: '',
    email: '',
    phone: '',
    siret: '',
    iban: ''
  });

  // Charger les données achats
  const fetchPurchasesData = async (tenantId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${tenantId}/purchases`).then(r => r.json());
      if (res && res.success) {
        setPurchasesData({
          orders: res.orders || [],
          expenses: res.expenses || [],
          vendors: res.vendors || [],
          kpis: res.kpis || { totalSpentHT: 0, pendingOrdersCount: 0, pendingExpensesCount: 0, vendorsCount: 0 }
        });
        if (res.currency) setTenant(prev => ({ ...prev, currency: res.currency }));
      }
    } catch (err) {
      console.warn('Erreur chargement achats:', err);
    } finally {
      setLoading(false);
    }
  };

  x.useEffect(() => {
    fetchPurchasesData(tenant.id);
  }, [tenant.id]);

  x.useEffect(() => {
    const handleTenantChange = (ev) => {
      if (ev.detail && ev.detail.tenant) {
        setTenant({
          id: ev.detail.tenant.id,
          name: ev.detail.tenant.name,
          currency: ev.detail.tenant.currency || 'EUR'
        });
        fetchPurchasesData(ev.detail.tenant.id);
      }
    };
    window.addEventListener('marlo:tenant-changed', handleTenantChange);
    return () => window.removeEventListener('marlo:tenant-changed', handleTenantChange);
  }, []);

  x.useEffect(() => {
    if (sub && sub !== currentTab) setCurrentTab(sub);
  }, [sub]);

  const switchTab = (t) => {
    setCurrentTab(t);
    location.hash = `#/purchases/${t}`;
  };

  const formatMoney = (val) => {
    const num = Number(val) || 0;
    const curr = tenant.currency === 'USD' ? '$' : tenant.currency === 'GBP' ? '£' : '€';
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  };

  const formatDate = (val) => {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Création Bon de Commande
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.amountHT || !orderForm.title) return;

    try {
      const v = purchasesData.vendors.find(ven => ven.id === orderForm.vendorId);
      const res = await fetch(`/api/tenants/${tenant.id}/purchases/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          vendorName: v ? v.name : (orderForm.vendorName || 'Fournisseur Externe')
        })
      }).then(r => r.json());

      if (res && res.success) {
        setIsOrderModalOpen(false);
        setOrderForm({ vendorId: '', vendorName: '', title: '', amountHT: '', vatRate: '20', account: '606000', accountName: 'Achats non stockés & Abonnements SaaS' });
        fetchPurchasesData(tenant.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Validation Facture Fournisseur
  const handleBillOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/purchases/orders/${orderId}/bill`, {
        method: 'POST'
      }).then(r => r.json());

      if (res && res.success) {
        fetchPurchasesData(tenant.id);
        if (typeof window.__app?.notify === 'function') {
          window.__app.notify('Facture fournisseur comptabilisée dans le Journal des Achats (AC) !', 'ok');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Création Note de Frais
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amountTTC || !expenseForm.description) return;

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/purchases/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      }).then(r => r.json());

      if (res && res.success) {
        setIsExpenseModalOpen(false);
        setExpenseForm({ userName: 'Lucas Martin', category: 'Repas & Réception Client', amountTTC: '', description: '' });
        fetchPurchasesData(tenant.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approbation Note de Frais
  const handleApproveExpense = async (expId) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/purchases/expenses/${expId}/approve`, {
        method: 'POST'
      }).then(r => r.json());

      if (res && res.success) {
        fetchPurchasesData(tenant.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Création Fournisseur
  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name) return;

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/purchases/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm)
      }).then(r => r.json());

      if (res && res.success) {
        setIsVendorModalOpen(false);
        setVendorForm({ name: '', category: 'Logiciels & Licences SaaS', contact: '', email: '', phone: '', siret: '', iban: '' });
        fetchPurchasesData(tenant.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrage des commandes
  const filteredOrders = x.useMemo(() => {
    return purchasesData.orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = (o.number || '').toLowerCase().includes(q);
        const matchTitle = (o.title || '').toLowerCase().includes(q);
        const matchVen = (o.vendorName || '').toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchVen) return false;
      }
      return true;
    });
  }, [purchasesData.orders, statusFilter, search]);

  return (0, S.jsxs)("div", {
    className: "page",
    style: { maxWidth: "1280px", margin: "0 auto", paddingBottom: "80px" },
    children: [
      // En-tête de page Marlo standard
      (0, S.jsxs)("div", {
        className: "phead",
        style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
        children: [
          (0, S.jsxs)("div", {
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" },
                children: [
                  (0, S.jsx)("span", { className: "pill pill--accent", children: "• Module Achats & Dépenses" }),
                  (0, S.jsx)("span", { className: "pill", children: "Fournisseurs & Notes de Frais" })
                ]
              }),
              (0, S.jsx)("h1", {
                style: { fontSize: "28px", fontWeight: "800", color: "var(--ink)", letterSpacing: "-0.5px", margin: "0 0 6px 0" },
                children: "Achats, Fournisseurs & Notes de Frais"
              }),
              (0, S.jsx)("p", {
                style: { color: "var(--muted)", fontSize: "14px", margin: 0 },
                children: "Gestion des bons de commande fournisseurs, approbation des notes de frais et comptabilisation automatique."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            style: { display: "flex", gap: "10px" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsExpenseModalOpen(true),
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "receipt" }),
                  " + Déclarer une Note de Frais"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsOrderModalOpen(true),
                className: "btn btn--primary",
                children: [
                  (0, S.jsx)(i, { name: "plus" }),
                  " + Nouveau Bon de Commande"
                ]
              })
            ]
          })
        ]
      }),

      // Onglets de navigation sous-pages
      (0, S.jsxs)("div", {
        className: "tabs",
        style: { display: "flex", gap: "4px", borderBottom: "1px solid var(--line)", marginBottom: "24px" },
        children: [
          (0, S.jsxs)("button", {
            type: "button",
            onClick: () => switchTab('orders'),
            className: "tab" + (currentTab === 'orders' ? " is-active" : ""),
            children: [
              (0, S.jsx)(i, { name: "receipt" }),
              " Bons de Commande (",
              purchasesData.orders.length,
              ")"
            ]
          }),
          (0, S.jsxs)("button", {
            type: "button",
            onClick: () => switchTab('expenses'),
            className: "tab" + (currentTab === 'expenses' ? " is-active" : ""),
            children: [
              (0, S.jsx)(i, { name: "wallet" }),
              " Notes de Frais (",
              purchasesData.expenses.length,
              ")"
            ]
          }),
          (0, S.jsxs)("button", {
            type: "button",
            onClick: () => switchTab('vendors'),
            className: "tab" + (currentTab === 'vendors' ? " is-active" : ""),
            children: [
              (0, S.jsx)(i, { name: "users" }),
              " Annuaire Fournisseurs (",
              purchasesData.vendors.length,
              ")"
            ]
          }),
          (0, S.jsxs)("button", {
            type: "button",
            onClick: () => switchTab('stats'),
            className: "tab" + (currentTab === 'stats' ? " is-active" : ""),
            children: [
              (0, S.jsx)(i, { name: "activity" }),
              " Synthèse des Dépenses"
            ]
          })
        ]
      }),

      // TAB 1: BONS DE COMMANDE FOURNISSEURS
      currentTab === 'orders' && (0, S.jsxs)("div", {
        children: [
          // Barre de recherche et filtres
          (0, S.jsxs)("div", {
            style: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" },
            children: [
              (0, S.jsx)("input", {
                type: "text",
                placeholder: "Rechercher commande, fournisseur...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "input",
                style: { width: "320px", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
              }),
              (0, S.jsxs)("select", {
                value: statusFilter,
                onChange: (e) => setStatusFilter(e.target.value),
                className: "select",
                style: { padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                children: [
                  (0, S.jsx)("option", { value: "all", children: "Tous les statuts" }),
                  (0, S.jsx)("option", { value: "sent", children: "Envoyé au fournisseur" }),
                  (0, S.jsx)("option", { value: "received", children: "Reçu / Livré" }),
                  (0, S.jsx)("option", { value: "billed", children: "Facturé & Comptabilisé" })
                ]
              }),
              (0, S.jsx)("span", { style: { flex: 1 } }),
              (0, S.jsxs)("span", { style: { color: "var(--muted)", fontSize: "13px" }, children: [filteredOrders.length, " commande(s)"] })
            ]
          }),

          // Table des bons de commande
          (0, S.jsx)("div", {
            className: "card",
            style: { overflow: "hidden", padding: 0 },
            children: (0, S.jsxs)("table", {
              className: "table",
              style: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
              children: [
                (0, S.jsx)("thead", {
                  children: (0, S.jsxs)("tr", {
                    style: { background: "var(--well)", borderBottom: "1px solid var(--line)", textAlign: "left" },
                    children: [
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "N° Commande" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Date" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Fournisseur" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Objet de la Commande" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "right", color: "var(--muted)" }, children: "Montant HT" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "right", color: "var(--muted)" }, children: "Total TTC" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "center", color: "var(--muted)" }, children: "Statut" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "right", color: "var(--muted)" }, children: "Action" })
                    ]
                  })
                }),
                (0, S.jsx)("tbody", {
                  children: filteredOrders.map(o => (0, S.jsxs)("tr", {
                    key: o.id,
                    style: { borderBottom: "1px solid var(--line)" },
                    children: [
                      (0, S.jsx)("td", { style: { padding: "12px 16px" }, children: (0, S.jsx)("span", { className: "badge", children: o.number }) }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", color: "var(--muted)" }, children: formatDate(o.date) }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", fontWeight: "700" }, children: o.vendorName }),
                      (0, S.jsxs)("td", {
                        style: { padding: "12px 16px" },
                        children: [
                          (0, S.jsx)("div", { children: o.title }),
                          (0, S.jsxs)("small", { style: { color: "var(--muted)" }, children: ["Imputation : ", o.account, " (", o.accountName, ")"] })
                        ]
                      }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }, children: formatMoney(o.amountHT) }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", textAlign: "right", fontWeight: "700", fontVariantNumeric: "tabular-nums" }, children: formatMoney(o.totalTTC) }),
                      (0, S.jsx)("td", {
                        style: { padding: "12px 16px", textAlign: "center" },
                        children: (0, S.jsx)("span", {
                          className: "pill " + (o.status === 'billed' ? 'pill--ok' : o.status === 'received' ? 'pill--accent' : 'pill--muted'),
                          children: o.status === 'billed' ? 'Facturé & Lettré' : o.status === 'received' ? 'Reçu / Livré' : 'Envoyé'
                        })
                      }),
                      (0, S.jsx)("td", {
                        style: { padding: "12px 16px", textAlign: "right" },
                        children: o.status !== 'billed' ? (0, S.jsx)("button", {
                          type: "button",
                          onClick: () => handleBillOrder(o.id),
                          className: "btn btn--sm btn--primary",
                          title: "Générer la facture d'achat et passer l'écriture dans le Journal des Achats (AC)",
                          children: "Comptabiliser AC →"
                        }) : (0, S.jsx)("span", { style: { fontSize: "12px", color: "var(--good)" }, children: "✓ Écriture AC OK" })
                      })
                    ]
                  }, o.id))
                })
              ]
            })
          })
        ]
      }),

      // TAB 2: NOTES DE FRAIS
      currentTab === 'expenses' && (0, S.jsxs)("div", {
        children: [
          (0, S.jsx)("div", {
            className: "card",
            style: { overflow: "hidden", padding: 0 },
            children: (0, S.jsxs)("table", {
              className: "table",
              style: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
              children: [
                (0, S.jsx)("thead", {
                  children: (0, S.jsxs)("tr", {
                    style: { background: "var(--well)", borderBottom: "1px solid var(--line)", textAlign: "left" },
                    children: [
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "N° Note" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Collaborateur" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Date" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Catégorie" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", color: "var(--muted)" }, children: "Description & Justificatif" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "right", color: "var(--muted)" }, children: "Montant TTC" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "center", color: "var(--muted)" }, children: "Approbation" }),
                      (0, S.jsx)("th", { style: { padding: "12px 16px", textAlign: "right", color: "var(--muted)" }, children: "Action" })
                    ]
                  })
                }),
                (0, S.jsx)("tbody", {
                  children: purchasesData.expenses.map(exp => (0, S.jsxs)("tr", {
                    key: exp.id,
                    style: { borderBottom: "1px solid var(--line)" },
                    children: [
                      (0, S.jsx)("td", { style: { padding: "12px 16px" }, children: (0, S.jsx)("span", { className: "badge", children: exp.number }) }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", fontWeight: "700" }, children: exp.userName }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", color: "var(--muted)" }, children: formatDate(exp.date) }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px" }, children: (0, S.jsx)("span", { className: "pill", children: exp.category }) }),
                      (0, S.jsxs)("td", {
                        style: { padding: "12px 16px" },
                        children: [
                          (0, S.jsx)("div", { children: exp.description }),
                          (0, S.jsxs)("small", { style: { color: "var(--primary)" }, children: ["📎 Justificatif : ", exp.receipt] })
                        ]
                      }),
                      (0, S.jsx)("td", { style: { padding: "12px 16px", textAlign: "right", fontWeight: "800", fontVariantNumeric: "tabular-nums" }, children: formatMoney(exp.amountTTC) }),
                      (0, S.jsx)("td", {
                        style: { padding: "12px 16px", textAlign: "center" },
                        children: (0, S.jsx)("span", {
                          className: "pill " + (exp.status === 'approved' || exp.status === 'reimbursed' ? 'pill--ok' : 'pill--warn'),
                          children: exp.status === 'reimbursed' ? 'Remboursé' : exp.status === 'approved' ? 'Validé' : 'En attente'
                        })
                      }),
                      (0, S.jsx)("td", {
                        style: { padding: "12px 16px", textAlign: "right" },
                        children: exp.status === 'pending' ? (0, S.jsx)("button", {
                          type: "button",
                          onClick: () => handleApproveExpense(exp.id),
                          className: "btn btn--sm btn--primary",
                          children: "Approuver ✓"
                        }) : (0, S.jsx)("span", { style: { fontSize: "12px", color: "var(--good)" }, children: "Validé" })
                      })
                    ]
                  }, exp.id))
                })
              ]
            })
          })
        ]
      }),

      // TAB 3: ANNUAIRE FOURNISSEURS
      currentTab === 'vendors' && (0, S.jsxs)("div", {
        children: [
          (0, S.jsxs)("div", {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
            children: [
              (0, S.jsx)("h3", { style: { margin: 0, fontSize: "16px", fontWeight: "700" }, children: "Fournisseurs & Partenaires Enregistrés" }),
              (0, S.jsx)("button", {
                type: "button",
                onClick: () => setIsVendorModalOpen(true),
                className: "btn btn--sm btn--primary",
                children: "+ Ajouter un Fournisseur"
              })
            ]
          }),
          (0, S.jsx)("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" },
            children: purchasesData.vendors.map(ven => (0, S.jsxs)("div", {
              key: ven.id,
              className: "card",
              style: { padding: "20px" },
              children: [
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("h4", { style: { margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--ink)" }, children: ven.name }),
                        (0, S.jsx)("span", { className: "pill pill--accent", style: { fontSize: "11px" }, children: ven.category })
                      ]
                    }),
                    (0, S.jsx)("div", {
                      style: { width: "36px", height: "36px", borderRadius: "10px", background: "var(--well)", display: "flex", alignItems: "center", justifyContent: "center" },
                      children: (0, S.jsx)(i, { name: "wallet" })
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { fontSize: "12px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "16px" },
                  children: [
                    (0, S.jsxs)("div", { children: ["👤 Contact : ", (0, S.jsx)("b", { style: { color: "var(--ink)" }, children: ven.contact })] }),
                    (0, S.jsxs)("div", { children: ["✉️ Email : ", (0, S.jsx)("a", { href: `mailto:${ven.email}`, style: { color: "var(--primary)" }, children: ven.email })] }),
                    (0, S.jsxs)("div", { children: ["📞 Tél : ", ven.phone] }),
                    ven.iban ? (0, S.jsxs)("div", { style: { fontFamily: "monospace", fontSize: "11px", marginTop: "4px" }, children: ["🏛️ IBAN : ", ven.iban] }) : null
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: "12px", fontSize: "12px" },
                  children: [
                    (0, S.jsxs)("span", { children: ["Total commandé : ", (0, S.jsx)("b", { style: { color: "var(--ink)" }, children: formatMoney(ven.totalSpent) })] }),
                    (0, S.jsxs)("span", { children: [(0, S.jsx)("b", { children: ven.activeOrders || 0 }), " en cours"] })
                  ]
                })
              ]
            }, ven.id))
          })
        ]
      }),

      // TAB 4: SYNTHÈSE & ANALYTICS
      currentTab === 'stats' && (0, S.jsxs)("div", {
        children: [
          // Ligne de KPIs
          (0, S.jsxs)("div", {
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" },
            children: [
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: "20px" },
                children: [
                  (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }, children: "Total Dépenses Engagées HT" }),
                  (0, S.jsx)("div", { style: { fontSize: "24px", fontWeight: "800", color: "var(--ink)", margin: "8px 0" }, children: formatMoney(purchasesData.kpis.totalSpentHT) }),
                  (0, S.jsx)("span", { style: { fontSize: "11px", color: "var(--warn)" }, children: "• Commandes & Frais comptabilisés" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: "20px" },
                children: [
                  (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }, children: "Commandes Fournisseurs en Cours" }),
                  (0, S.jsx)("div", { style: { fontSize: "24px", fontWeight: "800", color: "var(--ink)", margin: "8px 0" }, children: purchasesData.kpis.pendingOrdersCount }),
                  (0, S.jsx)("span", { style: { fontSize: "11px", color: "var(--primary)" }, children: "• En attente de livraison / facturation" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: "20px" },
                children: [
                  (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }, children: "Notes de Frais à Valider" }),
                  (0, S.jsx)("div", { style: { fontSize: "24px", fontWeight: "800", color: "var(--ink)", margin: "8px 0" }, children: purchasesData.kpis.pendingExpensesCount }),
                  (0, S.jsx)("span", { style: { fontSize: "11px", color: "var(--warn)" }, children: "• En attente d'approbation manager" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: "20px" },
                children: [
                  (0, S.jsx)("small", { style: { color: "var(--muted)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }, children: "Fournisseurs Partenaires" }),
                  (0, S.jsx)("div", { style: { fontSize: "24px", fontWeight: "800", color: "var(--ink)", margin: "8px 0" }, children: purchasesData.kpis.vendorsCount }),
                  (0, S.jsx)("span", { style: { fontSize: "11px", color: "var(--good)" }, children: "• Répertoire actif & conforme" })
                ]
              })
            ]
          }),

          // Carte d'impact sur la comptabilité
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "24px", background: "var(--well)", border: "1px solid var(--line-2)" },
            children: [
              (0, S.jsx)("h3", { style: { margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800" }, children: "🏛️ Liaison avec le Journal des Achats (AC) & TVA Déductible" }),
              (0, S.jsx)("p", { style: { color: "var(--muted)", fontSize: "13px", lineHeight: "1.6", margin: 0 }, children: "Chaque commande fournisseur validée génère automatiquement une écriture en partie double dans le Journal des Achats (Débit compte 60x, Débit TVA déductible 445660, Crédit Fournisseur 401000). Les montants alimentent directement la déclaration de TVA CA3 et le Grand Livre du module Comptabilité." })
            ]
          })
        ]
      }),

      // MODAL NOUVEAU BON DE COMMANDE
      isOrderModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
        children: (0, S.jsxs)("div", {
          className: "card modal-card",
          style: { width: "100%", maxWidth: "520px", padding: "28px", background: "var(--card)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow)" },
          children: [
            (0, S.jsxs)("div", {
              style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0, fontSize: "18px", fontWeight: "800" }, children: "Nouveau Bon de Commande Fournisseur" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsOrderModalOpen(false), className: "btn btn--ghost btn--sm", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateOrder,
              children: [
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Fournisseur *" }),
                    (0, S.jsxs)("select", {
                      value: orderForm.vendorId,
                      onChange: (e) => setOrderForm({ ...orderForm, vendorId: e.target.value }),
                      required: true,
                      className: "select",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                      children: [
                        (0, S.jsx)("option", { value: "", children: "-- Sélectionner un fournisseur --" }),
                        purchasesData.vendors.map(v => (0, S.jsx)("option", { key: v.id, value: v.id, children: `${v.name} (${v.category})` }, v.id))
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Objet de la Commande *" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      required: true,
                      placeholder: "Ex: Licences logicielles annuelles",
                      value: orderForm.title,
                      onChange: (e) => setOrderForm({ ...orderForm, title: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
                  children: [
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: `Montant HT (${tenant.currency}) *` }),
                        (0, S.jsx)("input", {
                          type: "number",
                          step: "0.01",
                          required: true,
                          placeholder: "0.00",
                          value: orderForm.amountHT,
                          onChange: (e) => setOrderForm({ ...orderForm, amountHT: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", fontWeight: "bold" }
                        })
                      ]
                    }),
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Taux TVA" }),
                        (0, S.jsxs)("select", {
                          value: orderForm.vatRate,
                          onChange: (e) => setOrderForm({ ...orderForm, vatRate: e.target.value }),
                          className: "select",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                          children: [
                            (0, S.jsx)("option", { value: "20", children: "20 % (Normal)" }),
                            (0, S.jsx)("option", { value: "10", children: "10 % (Intermédiaire)" }),
                            (0, S.jsx)("option", { value: "5.5", children: "5,5 % (Réduit)" }),
                            (0, S.jsx)("option", { value: "0", children: "0 % (Exonéré)" })
                          ]
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "20px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Compte Comptable d'Imputation" }),
                    (0, S.jsxs)("select", {
                      value: orderForm.account,
                      onChange: (e) => {
                        const accName = e.target.value === '606000' ? 'Achats non stockés & Abonnements SaaS' :
                          e.target.value === '604000' ? 'Prestations techniques & Sous-traitance' :
                          e.target.value === '613000' ? 'Locations immobilières & Bureaux' : 'Publicité & Marketing';
                        setOrderForm({ ...orderForm, account: e.target.value, accountName: accName });
                      },
                      className: "select",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                      children: [
                        (0, S.jsx)("option", { value: "606000", children: "606000 - Achats non stockés & Abonnements SaaS" }),
                        (0, S.jsx)("option", { value: "604000", children: "604000 - Prestations techniques & Sous-traitance" }),
                        (0, S.jsx)("option", { value: "613000", children: "613000 - Locations immobilières & Bureaux" }),
                        (0, S.jsx)("option", { value: "623000", children: "623000 - Publicité & Marketing" })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsOrderModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Créer le bon de commande →" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // MODAL NOUVELLE NOTE DE FRAIS
      isExpenseModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
        children: (0, S.jsxs)("div", {
          className: "card modal-card",
          style: { width: "100%", maxWidth: "480px", padding: "28px", background: "var(--card)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow)" },
          children: [
            (0, S.jsxs)("div", {
              style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0, fontSize: "18px", fontWeight: "800" }, children: "Déclarer une Note de Frais" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsExpenseModalOpen(false), className: "btn btn--ghost btn--sm", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateExpense,
              children: [
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Collaborateur *" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      required: true,
                      value: expenseForm.userName,
                      onChange: (e) => setExpenseForm({ ...expenseForm, userName: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Catégorie de dépense *" }),
                    (0, S.jsxs)("select", {
                      value: expenseForm.category,
                      onChange: (e) => setExpenseForm({ ...expenseForm, category: e.target.value }),
                      className: "select",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                      children: EXPENSE_CATEGORIES.map(c => (0, S.jsx)("option", { key: c, value: c, children: c }, c))
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: `Montant TTC (${tenant.currency}) *` }),
                    (0, S.jsx)("input", {
                      type: "number",
                      step: "0.01",
                      required: true,
                      placeholder: "0.00",
                      value: expenseForm.amountTTC,
                      onChange: (e) => setExpenseForm({ ...expenseForm, amountTTC: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", fontWeight: "bold" }
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "20px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Description du frais *" }),
                    (0, S.jsx)("textarea", {
                      required: true,
                      rows: 3,
                      placeholder: "Ex: Repas de cadrage avec le client, billets de train...",
                      value: expenseForm.description,
                      onChange: (e) => setExpenseForm({ ...expenseForm, description: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", resize: "vertical" }
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsExpenseModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Enregistrer la note →" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // MODAL NOUVEAU FOURNISSEUR
      isVendorModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
        children: (0, S.jsxs)("div", {
          className: "card modal-card",
          style: { width: "100%", maxWidth: "480px", padding: "28px", background: "var(--card)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow)" },
          children: [
            (0, S.jsxs)("div", {
              style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0, fontSize: "18px", fontWeight: "800" }, children: "Ajouter un Fournisseur" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsVendorModalOpen(false), className: "btn btn--ghost btn--sm", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateVendor,
              children: [
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Raison Sociale Fournisseur *" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      required: true,
                      placeholder: "Ex: Amazon Web Services France",
                      value: vendorForm.name,
                      onChange: (e) => setVendorForm({ ...vendorForm, name: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "12px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Catégorie d'activité" }),
                    (0, S.jsxs)("select", {
                      value: vendorForm.category,
                      onChange: (e) => setVendorForm({ ...vendorForm, category: e.target.value }),
                      className: "select",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                      children: [
                        (0, S.jsx)("option", { value: "Logiciels & Licences SaaS", children: "Logiciels & Licences SaaS" }),
                        (0, S.jsx)("option", { value: "Hébergement & Serveurs", children: "Hébergement & Serveurs" }),
                        (0, S.jsx)("option", { value: "Sous-traitance 3D & Audio", children: "Sous-traitance 3D & Audio" }),
                        (0, S.jsx)("option", { value: "Fournitures & Équipements", children: "Fournitures & Équipements" }),
                        (0, S.jsx)("option", { value: "Conseil & Avocats", children: "Conseil & Avocats" })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
                  children: [
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Email contact" }),
                        (0, S.jsx)("input", {
                          type: "email",
                          placeholder: "contact@fournisseur.com",
                          value: vendorForm.email,
                          onChange: (e) => setVendorForm({ ...vendorForm, email: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
                        })
                      ]
                    }),
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "Téléphone" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          placeholder: "+33 (0)1...",
                          value: vendorForm.phone,
                          onChange: (e) => setVendorForm({ ...vendorForm, phone: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" }
                        })
                      ]
                    })
                  ]
                }),
                (0, S.jsxs)("label", {
                  className: "field",
                  style: { display: "block", marginBottom: "20px" },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }, children: "IBAN de Règlement" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      placeholder: "FR76 ...",
                      value: vendorForm.iban,
                      onChange: (e) => setVendorForm({ ...vendorForm, iban: e.target.value }),
                      className: "input",
                      style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", fontFamily: "monospace" }
                    })
                  ]
                }),
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsVendorModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Enregistrer le fournisseur →" })
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
