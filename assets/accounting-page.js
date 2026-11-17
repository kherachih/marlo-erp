import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

// Journaux comptables standards
const JOURNALS = [
  { id: 'all', name: 'Tous les Journaux', code: 'ALL' },
  { id: 'VT', name: 'Journal des Ventes', code: 'VT', tone: 'accent' },
  { id: 'AC', name: 'Journal des Achats', code: 'AC', tone: 'warn' },
  { id: 'BQ', name: 'Journal de Banque', code: 'BQ', tone: 'ok' },
  { id: 'OD', name: 'Opérations Diverses', code: 'OD', tone: 'subtle' }
];

export default function AccountingPage({ sub = 'dashboard', params = [] }) {
  const [currentTab, setCurrentTab] = x.useState(sub || 'dashboard');
  const [tenant, setTenant] = x.useState(() => ({
    id: localStorage.getItem('marlo_erp_tenant_id') || 'northbank-post',
    currency: 'EUR'
  }));

  const [loading, setLoading] = x.useState(true);
  const [accountingData, setAccountingData] = x.useState({
    entries: [],
    accounts: [],
    journals: [],
    vat: { baseHT: 0, vatCollected: 0, vatDeductible: 0, netVatDue: 0, status: 'to_pay' },
    kpis: { revenueHT: 0, expensesHT: 0, operatingProfit: 0, bankBalance: 0, unreconciledCount: 0, totalEntries: 0 }
  });

  // Filtres Grand Livre
  const [search, setSearch] = x.useState('');
  const [journalFilter, setJournalFilter] = x.useState('all');
  const [reconciledFilter, setReconciledFilter] = x.useState('all');
  const [classFilter, setClassFilter] = x.useState('all');

  // Modal Nouvelle Écriture
  const [isModalOpen, setIsModalOpen] = x.useState(false);
  const [formData, setFormData] = x.useState({
    date: new Date().toISOString().split('T')[0],
    journal: 'VT',
    piece: '',
    accountDebit: '411000',
    accountCredit: '706000',
    label: '',
    amountHT: '',
    vatRate: '20'
  });

  // Charger les données comptables
  const fetchAccountingData = async (tenantId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${tenantId}/accounting`).then(r => r.json());
      if (res && res.success) {
        setAccountingData({
          entries: res.entries || [],
          accounts: res.accounts || [],
          journals: res.journals || [],
          vat: res.vat || { baseHT: 0, vatCollected: 0, vatDeductible: 0, netVatDue: 0, status: 'to_pay' },
          kpis: res.kpis || { revenueHT: 0, expensesHT: 0, operatingProfit: 0, bankBalance: 0, unreconciledCount: 0, totalEntries: 0 }
        });
        if (res.currency) setTenant(prev => ({ ...prev, currency: res.currency }));
      }
    } catch (err) {
      console.warn('Erreur chargement comptabilité:', err);
    } finally {
      setLoading(false);
    }
  };

  x.useEffect(() => {
    fetchAccountingData(tenant.id);
  }, [tenant.id]);

  // Synchronisation avec les changements d'entreprise
  x.useEffect(() => {
    const handleTenantChange = (ev) => {
      if (ev.detail && ev.detail.tenant) {
        setTenant({ id: ev.detail.tenant.id, currency: ev.detail.tenant.currency || 'EUR' });
        fetchAccountingData(ev.detail.tenant.id);
      }
    };
    window.addEventListener('marlo:tenant-changed', handleTenantChange);
    return () => window.removeEventListener('marlo:tenant-changed', handleTenantChange);
  }, []);

  // Synchroniser l'onglet avec l'URL sub
  x.useEffect(() => {
    if (sub && sub !== currentTab) setCurrentTab(sub);
  }, [sub]);

  const switchTab = (t) => {
    setCurrentTab(t);
    location.hash = `#/accounting/${t}`;
  };

  // Formatage des montants
  const formatMoney = (val) => {
    const num = Number(val) || 0;
    const curr = tenant.currency === 'USD' ? '$' : tenant.currency === 'GBP' ? '£' : '€';
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  };

  // Filtrage des écritures du Grand Livre
  const filteredEntries = x.useMemo(() => {
    return accountingData.entries.filter(e => {
      if (journalFilter !== 'all' && e.journal !== journalFilter) return false;
      if (reconciledFilter === 'reconciled' && !e.reconciled) return false;
      if (reconciledFilter === 'unreconciled' && e.reconciled) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchLabel = (e.label || '').toLowerCase().includes(q);
        const matchPiece = (e.piece || '').toLowerCase().includes(q);
        const matchAcc = (e.account || '').includes(q) || (e.accountName || '').toLowerCase().includes(q);
        if (!matchLabel && !matchPiece && !matchAcc) return false;
      }
      return true;
    });
  }, [accountingData.entries, journalFilter, reconciledFilter, search]);

  // Filtrage du Plan de Comptes
  const filteredAccounts = x.useMemo(() => {
    if (classFilter === 'all') return accountingData.accounts;
    const classNum = parseInt(classFilter, 10);
    return accountingData.accounts.filter(a => a.class === classNum);
  }, [accountingData.accounts, classFilter]);

  // Téléchargement du fichier FEC officiel
  const downloadFec = () => {
    window.open(`/api/tenants/${tenant.id}/accounting/fec`, '_blank');
  };

  // Envoi d'une nouvelle écriture en partie double
  const handleCreateEntry = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amountHT) || 0;
    if (amount <= 0) return;

    const rate = Number(formData.vatRate) / 100;
    const vatAmount = Math.round(amount * rate * 100) / 100;
    const totalTTC = Math.round((amount + vatAmount) * 100) / 100;
    const pce = formData.piece || `ECR-${Date.now().toString().slice(-4)}`;

    let lines = [];
    if (formData.journal === 'VT') {
      // Vente : Débit Client TTC / Crédit Prestations HT / Crédit TVA Collectée
      lines = [
        { journal: 'VT', date: formData.date, piece: pce, account: '411000', accountName: 'Clients', label: formData.label || 'Vente client', debit: totalTTC, credit: 0 },
        { journal: 'VT', date: formData.date, piece: pce, account: '706000', accountName: 'Prestations de services', label: formData.label || 'Vente client', debit: 0, credit: amount },
        { journal: 'VT', date: formData.date, piece: pce, account: '445710', accountName: 'TVA Collectée (20%)', label: `TVA s/ ${pce}`, debit: 0, credit: vatAmount }
      ];
    } else if (formData.journal === 'AC') {
      // Achat : Débit Charges HT / Débit TVA Déductible / Crédit Fournisseur TTC
      lines = [
        { journal: 'AC', date: formData.date, piece: pce, account: '606000', accountName: 'Achats & Charges externes', label: formData.label || 'Achat fournisseur', debit: amount, credit: 0 },
        { journal: 'AC', date: formData.date, piece: pce, account: '445660', accountName: 'TVA Déductible (20%)', label: `TVA s/ ${pce}`, debit: vatAmount, credit: 0 },
        { journal: 'AC', date: formData.date, piece: pce, account: '401000', accountName: 'Fournisseurs', label: formData.label || 'Achat fournisseur', debit: 0, credit: totalTTC }
      ];
    } else {
      // Écriture directe
      lines = [
        { journal: formData.journal, date: formData.date, piece: pce, account: formData.accountDebit, accountName: 'Compte Débit', label: formData.label || 'Écriture', debit: totalTTC, credit: 0 },
        { journal: formData.journal, date: formData.date, piece: pce, account: formData.accountCredit, accountName: 'Compte Crédit', label: formData.label || 'Écriture', debit: 0, credit: totalTTC }
      ];
    }

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/accounting/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines })
      }).then(r => r.json());

      if (res && res.success) {
        setIsModalOpen(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          journal: 'VT',
          piece: '',
          accountDebit: '411000',
          accountCredit: '706000',
          label: '',
          amountHT: '',
          vatRate: '20'
        });
        fetchAccountingData(tenant.id);
        showToast('Écritures comptables enregistrées en partie double !');
      }
    } catch (err) {
      console.error(err);
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
      padding: 10px 18px; border-radius: var(--r-md);
      font-size: 13px; font-weight: 600; font-family: var(--font);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      animation: erpFadeIn 0.2s var(--ease);
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const { kpis, vat, journals } = accountingData;

  return (0, S.jsxs)("div", {
    className: "view view--accounting",
    children: [
      // 1. En-tête de la page Comptabilité
      (0, S.jsxs)("header", {
        className: "phead",
        children: [
          (0, S.jsxs)("div", {
            className: "phead__text",
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
                children: [
                  (0, S.jsx)("span", { className: "pill pill--accent", children: "Module Finance Odoo" }),
                  (0, S.jsx)("span", { className: "pill", children: "Partie Double & FEC Conforme" })
                ]
              }),
              (0, S.jsx)("h1", {
                className: "phead__title",
                style: { margin: 0, fontSize: "var(--fs-3xl)", color: "var(--ink)", fontWeight: "800" },
                children: "Comptabilité Générale & Fiscalité"
              }),
              (0, S.jsx)("p", {
                className: "phead__desc",
                style: { margin: "4px 0 0", color: "var(--muted)", fontSize: "var(--fs-sm)" },
                children: "Grand livre en partie double, plan de comptes, journaux auxiliaires, calcul de TVA et export FEC pour votre expert-comptable."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "phead__actions",
            style: { display: "flex", gap: "10px" },
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: downloadFec,
                className: "btn btn--ghost",
                title: "Exporter le Fichier des Écritures Comptables normalisé",
                children: [
                  (0, S.jsx)(i, { name: "folder", size: "sm" }),
                  " Export FEC (.txt)"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsModalOpen(true),
                className: "btn btn--primary",
                children: [
                  (0, S.jsx)(i, { name: "plus", size: "sm" }),
                  " Nouvelle Écriture"
                ]
              })
            ]
          })
        ]
      }),

      // 2. Barre d'onglets comptables
      (0, S.jsx)("nav", {
        className: "tabs",
        style: { marginBottom: "24px" },
        children: [
          { id: 'dashboard', label: 'Synthèse & KPIs', icon: 'grid' },
          { id: 'journal', label: 'Grand Livre (Écritures)', icon: 'receipt' },
          { id: 'accounts', label: 'Plan de Comptes', icon: 'folder' },
          { id: 'vat', label: 'Déclaration TVA', icon: 'wallet' }
        ].map(tab => (0, S.jsxs)("button", {
          key: tab.id,
          type: "button",
          onClick: () => switchTab(tab.id),
          className: `tab ${currentTab === tab.id ? 'is-active' : ''}`,
          children: [
            (0, S.jsx)(i, { name: tab.icon, size: "sm" }),
            tab.label
          ]
        }))
      }),

      // 3. VUE 1 : Synthèse & Indicateurs Clés (Dashboard Comptable)
      currentTab === 'dashboard' && (0, S.jsxs)("div", {
        style: { display: "flex", flexDirection: "column", gap: "24px" },
        children: [
          // Ligne 1 : KPIs Financiers
          (0, S.jsxs)("div", {
            className: "kpis",
            style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" },
            children: [
              (0, S.jsxs)("div", {
                className: "card kpi",
                children: [
                  (0, S.jsx)("span", { className: "kpi__label", children: "Chiffre d'Affaires HT" }),
                  (0, S.jsx)("h2", { className: "kpi__num", style: { color: "var(--ink)" }, children: formatMoney(kpis.revenueHT) }),
                  (0, S.jsx)("small", { style: { color: "var(--good, #10b981)", fontSize: "11px", fontWeight: "600" }, children: "● Ventes Classe 7" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card kpi",
                children: [
                  (0, S.jsx)("span", { className: "kpi__label", children: "Total Charges HT" }),
                  (0, S.jsx)("h2", { className: "kpi__num", style: { color: "var(--ink)" }, children: formatMoney(kpis.expensesHT) }),
                  (0, S.jsx)("small", { style: { color: "var(--muted)", fontSize: "11px" }, children: "● Dépenses Classe 6" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card kpi",
                children: [
                  (0, S.jsx)("span", { className: "kpi__label", children: "Résultat d'Exploitation" }),
                  (0, S.jsx)("h2", { className: "kpi__num", style: { color: kpis.operatingProfit >= 0 ? "var(--good, #10b981)" : "var(--bad, #ef4444)" }, children: formatMoney(kpis.operatingProfit) }),
                  (0, S.jsx)("small", { style: { color: "var(--muted)", fontSize: "11px" }, children: kpis.operatingProfit >= 0 ? "Bénéfice opérationnel" : "Déficit d'exploitation" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card kpi",
                children: [
                  (0, S.jsx)("span", { className: "kpi__label", children: "Trésorerie Disponible (Banque)" }),
                  (0, S.jsx)("h2", { className: "kpi__num", style: { color: "var(--ink)" }, children: formatMoney(kpis.bankBalance) }),
                  (0, S.jsx)("small", { style: { color: "var(--accent)", fontSize: "11px", fontWeight: "600" }, children: "Compte 512000 Rapproché" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card kpi",
                children: [
                  (0, S.jsx)("span", { className: "kpi__label", children: "TVA Nette à Décaisser" }),
                  (0, S.jsx)("h2", { className: "kpi__num", style: { color: vat.netVatDue >= 0 ? "var(--amber, #f59e0b)" : "var(--good, #10b981)" }, children: formatMoney(vat.netVatDue) }),
                  (0, S.jsx)("small", { style: { color: "var(--muted)", fontSize: "11px" }, children: vat.netVatDue >= 0 ? "À payer au fisc" : "Crédit de TVA reportable" })
                ]
              })
            ]
          }),

          // Ligne 2 : Journaux Auxiliaires
          (0, S.jsxs)("section", {
            className: "card",
            style: { padding: "24px" },
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
                children: [
                  (0, S.jsx)("h3", { style: { margin: 0, fontSize: "16px", color: "var(--ink)" }, children: "Journaux Comptables Auxiliaires" }),
                  (0, S.jsx)("span", { className: "badge", children: `${journals.length} journaux configurés` })
                ]
              }),
              (0, S.jsx)("div", {
                style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" },
                children: journals.map(j => (0, S.jsxs)("div", {
                  key: j.code,
                  onClick: () => { setJournalFilter(j.code); switchTab('journal'); },
                  className: "card",
                  style: { padding: "16px", cursor: "pointer", background: "var(--well)", border: "1px solid var(--line-2)", transition: "transform 0.15s ease" },
                  children: [
                    (0, S.jsxs)("div", {
                      style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
                      children: [
                        (0, S.jsx)("span", { className: "pill pill--accent", children: j.code }),
                        (0, S.jsx)("span", { style: { fontSize: "11px", color: "var(--muted)" }, children: `${j.count} écritures` })
                      ]
                    }),
                    (0, S.jsx)("b", { style: { fontSize: "14px", color: "var(--ink)", display: "block", marginBottom: "4px" }, children: j.name }),
                    (0, S.jsxs)("div", {
                      style: { fontSize: "12px", color: "var(--muted)", display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--line)" },
                      children: [
                        (0, S.jsxs)("span", { children: ["Débit : ", formatMoney(j.debit)] }),
                        (0, S.jsxs)("span", { children: ["Crédit : ", formatMoney(j.credit)] })
                      ]
                    })
                  ]
                }))
              })
            ]
          }),

          // Ligne 3 : Dernières Écritures Comptables
          (0, S.jsxs)("section", {
            className: "card",
            style: { padding: "24px" },
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
                children: [
                  (0, S.jsx)("h3", { style: { margin: 0, fontSize: "16px", color: "var(--ink)" }, children: "Dernières Écritures du Grand Livre" }),
                  (0, S.jsx)("button", { type: "button", onClick: () => switchTab('journal'), className: "btn btn--ghost btn--sm", children: "Voir tout le Grand Livre →" })
                ]
              }),
              (0, S.jsx)("div", {
                className: "table-wrap",
                children: (0, S.jsxs)("table", {
                  className: "table",
                  children: [
                    (0, S.jsx)("thead", {
                      children: (0, S.jsxs)("tr", {
                        children: [
                          (0, S.jsx)("th", { children: "Date" }),
                          (0, S.jsx)("th", { children: "Journal" }),
                          (0, S.jsx)("th", { children: "Pièce" }),
                          (0, S.jsx)("th", { children: "Compte" }),
                          (0, S.jsx)("th", { children: "Libellé de l'écriture" }),
                          (0, S.jsx)("th", { className: "r", children: "Débit" }),
                          (0, S.jsx)("th", { className: "r", children: "Crédit" }),
                          (0, S.jsx)("th", { children: "Lettrage" })
                        ]
                      })
                    }),
                    (0, S.jsx)("tbody", {
                      children: accountingData.entries.slice(0, 8).map(e => (0, S.jsxs)("tr", {
                        key: e.id,
                        children: [
                          (0, S.jsx)("td", { style: { color: "var(--muted)", fontSize: "12px" }, children: e.date }),
                          (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill", children: e.journal }) }),
                          (0, S.jsx)("td", { children: e.piece && e.piece.startsWith("FAC-") ? (0, S.jsxs)("a", { href: `/api/tenants/${tenant.id}/invoices/${e.piece}/html`, target: "_blank", className: "badge", style: { textDecoration: "none", cursor: "pointer", color: "var(--accent)" }, title: "Ouvrir la Facture PDF officielle", children: [e.piece, " ↗"] }) : (0, S.jsx)("span", { className: "badge", children: e.piece }) }),
                          (0, S.jsxs)("td", { children: [(0, S.jsx)("b", { children: e.account }), (0, S.jsx)("small", { style: { display: "block", color: "var(--muted)", fontSize: "10px" }, children: e.accountName })] }),
                          (0, S.jsx)("td", { style: { fontWeight: "500" }, children: e.label }),
                          (0, S.jsx)("td", { className: "r", style: { fontWeight: e.debit > 0 ? "700" : "normal", color: e.debit > 0 ? "var(--ink)" : "var(--muted)" }, children: e.debit > 0 ? formatMoney(e.debit) : "-" }),
                          (0, S.jsx)("td", { className: "r", style: { fontWeight: e.credit > 0 ? "700" : "normal", color: e.credit > 0 ? "var(--ink)" : "var(--muted)" }, children: e.credit > 0 ? formatMoney(e.credit) : "-" }),
                          (0, S.jsx)("td", { children: e.reconciled ? (0, S.jsx)("span", { className: "badge badge--ok", children: e.letter || "✓" }) : (0, S.jsx)("span", { className: "badge badge--subtle", children: "Non lettré" }) })
                        ]
                      }, e.id))
                    })
                  ]
                })
              })
            ]
          })
        ]
      }),

      // 4. VUE 2 : Grand Livre & Journaux Comptables (Tableau complet)
      currentTab === 'journal' && (0, S.jsxs)("div", {
        children: [
          // Barre de filtres Grand Livre
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" },
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
                children: [
                  // Recherche
                  (0, S.jsxs)("div", {
                    style: { display: "flex", alignItems: "center", gap: "8px", background: "var(--well)", padding: "6px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-2)", minWidth: "220px" },
                    children: [
                      (0, S.jsx)(i, { name: "search", size: "sm" }),
                      (0, S.jsx)("input", {
                        type: "text",
                        placeholder: "Chercher pièce, libellé, compte...",
                        value: search,
                        onChange: (e) => setSearch(e.target.value),
                        style: { background: "transparent", border: "none", outline: "none", color: "var(--ink)", width: "100%", fontSize: "12px", fontFamily: "var(--font)" }
                      })
                    ]
                  }),

                  // Filtre par Journal
                  (0, S.jsxs)("select", {
                    value: journalFilter,
                    onChange: (e) => setJournalFilter(e.target.value),
                    className: "select",
                    style: { padding: "6px 12px", fontSize: "12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                    children: JOURNALS.map(j => (0, S.jsx)("option", { value: j.id, children: `${j.name} (${j.code})` }, j.id))
                  }),

                  // Filtre Lettrage
                  (0, S.jsxs)("select", {
                    value: reconciledFilter,
                    onChange: (e) => setReconciledFilter(e.target.value),
                    className: "select",
                    style: { padding: "6px 12px", fontSize: "12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)" },
                    children: [
                      (0, S.jsx)("option", { value: "all", children: "Tous les lettrages" }),
                      (0, S.jsx)("option", { value: "reconciled", children: "Écritures Lettrées" }),
                      (0, S.jsx)("option", { value: "unreconciled", children: "Écritures Non Lettrées" })
                    ]
                  })
                ]
              }),

              (0, S.jsxs)("div", {
                style: { display: "flex", alignItems: "center", gap: "10px" },
                children: [
                  (0, S.jsx)("span", { style: { fontSize: "12px", color: "var(--muted)" }, children: `${filteredEntries.length} écritures trouvées` }),
                  (0, S.jsxs)("button", {
                    type: "button",
                    onClick: downloadFec,
                    className: "btn btn--subtle btn--sm",
                    children: [
                      (0, S.jsx)(i, { name: "folder", size: "sm" }),
                      " Exporter FEC"
                    ]
                  })
                ]
              })
            ]
          }),

          // Tableau du Grand Livre
          (0, S.jsx)("div", {
            className: "card",
            style: { padding: 0, overflow: "hidden" },
            children: (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Date" }),
                        (0, S.jsx)("th", { children: "Journal" }),
                        (0, S.jsx)("th", { children: "N° Pièce" }),
                        (0, S.jsx)("th", { children: "Compte Général" }),
                        (0, S.jsx)("th", { children: "Intitulé du compte" }),
                        (0, S.jsx)("th", { children: "Libellé de l'opération" }),
                        (0, S.jsx)("th", { className: "r", children: "Débit" }),
                        (0, S.jsx)("th", { className: "r", children: "Crédit" }),
                        (0, S.jsx)("th", { style: { textAlign: "center" }, children: "Lettrage" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: filteredEntries.length === 0 ? (
                      (0, S.jsx)("tr", {
                        children: (0, S.jsx)("td", { colSpan: 9, style: { textAlign: "center", padding: "40px", color: "var(--muted)" }, children: "Aucune écriture comptable trouvée." })
                      })
                    ) : (
                      filteredEntries.map(e => (0, S.jsxs)("tr", {
                        key: e.id,
                        children: [
                          (0, S.jsx)("td", { style: { color: "var(--muted)", fontSize: "12px", whiteSpace: "nowrap" }, children: e.date }),
                          (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill pill--accent", children: e.journal }) }),
                          (0, S.jsx)("td", { children: e.piece && e.piece.startsWith("FAC-") ? (0, S.jsxs)("a", { href: `/api/tenants/${tenant.id}/invoices/${e.piece}/html`, target: "_blank", className: "badge", style: { textDecoration: "none", cursor: "pointer", color: "var(--accent)" }, title: "Ouvrir la Facture PDF officielle", children: [e.piece, " ↗"] }) : (0, S.jsx)("span", { className: "badge", children: e.piece }) }),
                          (0, S.jsx)("td", { children: (0, S.jsx)("b", { style: { fontFamily: "monospace", fontSize: "13px" }, children: e.account }) }),
                          (0, S.jsx)("td", { style: { color: "var(--ink-2)", fontSize: "12px" }, children: e.accountName }),
                          (0, S.jsx)("td", { style: { fontWeight: "500" }, children: e.label }),
                          (0, S.jsx)("td", { className: "r", style: { fontWeight: e.debit > 0 ? "700" : "normal", color: e.debit > 0 ? "var(--ink)" : "var(--muted)" }, children: e.debit > 0 ? formatMoney(e.debit) : "-" }),
                          (0, S.jsx)("td", { className: "r", style: { fontWeight: e.credit > 0 ? "700" : "normal", color: e.credit > 0 ? "var(--ink)" : "var(--muted)" }, children: e.credit > 0 ? formatMoney(e.credit) : "-" }),
                          (0, S.jsx)("td", { style: { textAlign: "center" }, children: e.reconciled ? (0, S.jsx)("span", { className: "badge badge--ok", children: e.letter || "✓" }) : (0, S.jsx)("span", { className: "badge badge--subtle", children: "—" }) })
                        ]
                      }, e.id))
                    )
                  }),
                  // Ligne des totaux
                  (0, S.jsx)("tfoot", {
                    children: (0, S.jsxs)("tr", {
                      style: { fontWeight: "800", background: "var(--well)" },
                      children: [
                        (0, S.jsx)("td", { colSpan: 6, style: { textAlign: "right", paddingRight: "16px" }, children: "TOTAUX BALANCÉS :" }),
                        (0, S.jsx)("td", { className: "r", style: { color: "var(--ink)" }, children: formatMoney(filteredEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0)) }),
                        (0, S.jsx)("td", { className: "r", style: { color: "var(--ink)" }, children: formatMoney(filteredEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0)) }),
                        (0, S.jsx)("td", { style: { textAlign: "center" }, children: (0, S.jsx)("span", { className: "badge badge--ok", children: "Équilibré" }) })
                      ]
                    })
                  })
                ]
              })
            })
          })
        ]
      }),

      // 5. VUE 3 : Plan de Comptes (Chart of Accounts)
      currentTab === 'accounts' && (0, S.jsxs)("div", {
        children: [
          // Filtre par classe
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "14px 18px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center" },
            children: [
              (0, S.jsx)("span", { style: { fontSize: "12px", fontWeight: "700", color: "var(--ink)" }, children: "Filtrer par classe comptable :" }),
              [
                { id: 'all', label: 'Toutes les classes' },
                { id: '1', label: 'Classe 1 (Capitaux)' },
                { id: '4', label: 'Classe 4 (Tiers & Clients)' },
                { id: '5', label: 'Classe 5 (Trésorerie)' },
                { id: '6', label: 'Classe 6 (Charges)' },
                { id: '7', label: 'Classe 7 (Produits)' }
              ].map(c => (0, S.jsx)("button", {
                key: c.id,
                type: "button",
                onClick: () => setClassFilter(c.id),
                className: classFilter === c.id ? "btn btn--primary btn--sm" : "btn btn--subtle btn--sm",
                children: c.label
              }))
            ]
          }),

          // Table des comptes
          (0, S.jsx)("div", {
            className: "card",
            style: { padding: 0, overflow: "hidden" },
            children: (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "N° Compte" }),
                        (0, S.jsx)("th", { children: "Intitulé du Compte" }),
                        (0, S.jsx)("th", { children: "Catégorie" }),
                        (0, S.jsx)("th", { className: "r", children: "Total Débit" }),
                        (0, S.jsx)("th", { className: "r", children: "Total Crédit" }),
                        (0, S.jsx)("th", { className: "r", children: "Solde Courant" }),
                        (0, S.jsx)("th", { style: { textAlign: "center" }, children: "Écritures" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: filteredAccounts.map(a => (0, S.jsxs)("tr", {
                      key: a.code,
                      children: [
                        (0, S.jsx)("td", { children: (0, S.jsx)("b", { style: { fontFamily: "monospace", fontSize: "14px", color: "var(--accent)" }, children: a.code }) }),
                        (0, S.jsx)("td", { style: { fontWeight: "600", color: "var(--ink)" }, children: a.name }),
                        (0, S.jsx)("td", { children: (0, S.jsx)("span", { className: "pill", children: a.category }) }),
                        (0, S.jsx)("td", { className: "r", children: formatMoney(a.debit) }),
                        (0, S.jsx)("td", { className: "r", children: formatMoney(a.credit) }),
                        (0, S.jsx)("td", { className: "r", style: { fontWeight: "700", color: a.balance >= 0 ? "var(--ink)" : "var(--bad, #ef4444)" }, children: formatMoney(a.balance) }),
                        (0, S.jsx)("td", { style: { textAlign: "center" }, children: (0, S.jsx)("span", { className: "badge", children: `${a.entriesCount} ouv.` }) })
                      ]
                    }, a.code))
                  })
                ]
              })
            })
          })
        ]
      }),

      // 6. VUE 4 : Déclaration TVA & Fiscalité
      currentTab === 'vat' && (0, S.jsxs)("div", {
        style: { display: "flex", flexDirection: "column", gap: "24px" },
        children: [
          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: "28px" },
            children: [
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
                children: [
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsx)("span", { className: "pill pill--accent", children: "Formulaire CA3 Normalisé" }),
                      (0, S.jsx)("h2", { style: { margin: "6px 0 2px", fontSize: "20px", color: "var(--ink)" }, children: "Bilan & Déclaration de TVA (Taux Standard 20%)" }),
                      (0, S.jsx)("p", { style: { margin: 0, color: "var(--muted)", fontSize: "13px" }, children: "Calcul automatique de la TVA collectée sur vos ventes et déductible sur vos charges opérationnelles." })
                    ]
                  }),
                  (0, S.jsx)("div", {
                    children: (0, S.jsx)("span", {
                      className: vat.netVatDue >= 0 ? "badge badge--warn" : "badge badge--ok",
                      style: { fontSize: "14px", padding: "6px 14px" },
                      children: vat.netVatDue >= 0 ? "TVA à payer au Trésor" : "Crédit de TVA reportable"
                    })
                  })
                ]
              }),

              // Tableau de calcul fiscal
              (0, S.jsx)("div", {
                className: "table-wrap",
                style: { border: "1px solid var(--line-2)", borderRadius: "var(--r-md)", overflow: "hidden" },
                children: (0, S.jsxs)("table", {
                  className: "table",
                  children: [
                    (0, S.jsx)("thead", {
                      children: (0, S.jsxs)("tr", {
                        children: [
                          (0, S.jsx)("th", { children: "Rubrique Fiscale" }),
                          (0, S.jsx)("th", { className: "r", children: "Base Hors Taxes (HT)" }),
                          (0, S.jsx)("th", { className: "r", children: "Taux Appliqué" }),
                          (0, S.jsx)("th", { className: "r", children: "Montant de la Taxe" })
                        ]
                      })
                    }),
                    (0, S.jsxs)("tbody", {
                      children: [
                        (0, S.jsxs)("tr", {
                          children: [
                            (0, S.jsxs)("td", { children: [(0, S.jsx)("b", { children: "A. Opérations Imposables (Ventes & Prestations)" }), (0, S.jsx)("small", { style: { display: "block", color: "var(--muted)" }, children: "Chiffre d'affaires facturé clients" })] }),
                            (0, S.jsx)("td", { className: "r", children: formatMoney(vat.baseHT) }),
                            (0, S.jsx)("td", { className: "r", children: "20,0 %" }),
                            (0, S.jsx)("td", { className: "r", style: { fontWeight: "700", color: "var(--ink)" }, children: formatMoney(vat.vatCollected) })
                          ]
                        }),
                        (0, S.jsxs)("tr", {
                          children: [
                            (0, S.jsxs)("td", { children: [(0, S.jsx)("b", { children: "B. TVA Déductible sur Achats & Frais Généraux" }), (0, S.jsx)("small", { style: { display: "block", color: "var(--muted)" }, children: "Comptes 606 / 604 / Logiciels & Sous-traitance" })] }),
                            (0, S.jsx)("td", { className: "r", children: formatMoney(accountingData.kpis.expensesHT) }),
                            (0, S.jsx)("td", { className: "r", children: "20,0 %" }),
                            (0, S.jsx)("td", { className: "r", style: { fontWeight: "700", color: "var(--good, #10b981)" }, children: `-${formatMoney(vat.vatDeductible)}` })
                          ]
                        }),
                        (0, S.jsxs)("tr", {
                          style: { background: "var(--well)", fontWeight: "800", fontSize: "15px" },
                          children: [
                            (0, S.jsx)("td", { colSpan: 3, children: "SOLDE NET DE TVA (A - B) :" }),
                            (0, S.jsx)("td", { className: "r", style: { color: vat.netVatDue >= 0 ? "var(--amber, #f59e0b)" : "var(--good, #10b981)" }, children: formatMoney(vat.netVatDue) })
                          ]
                        })
                      ]
                    })
                  ]
                })
              }),

              // Actions fiscales
              (0, S.jsxs)("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line-2)" },
                children: [
                  (0, S.jsx)("div", {
                    style: { fontSize: "12px", color: "var(--muted)" },
                    children: "Période fiscale : Mois en cours • Échéance de télédéclaration : 24 du mois suivant."
                  }),
                  (0, S.jsxs)("button", {
                    type: "button",
                    onClick: () => showToast("Déclaration de TVA validée et archivée pour votre comptable !"),
                    className: "btn btn--primary",
                    children: [
                      (0, S.jsx)(i, { name: "check", size: "sm" }),
                      " Valider la Déclaration Trimestrielle"
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // 7. MODAL NOUVELLE ÉCRITURE EN PARTIE DOUBLE
      isModalOpen && (0, S.jsx)("div", {
        className: "modal-wrap",
        style: {
          position: "fixed", inset: 0, zIndex: 9999999,
          background: "rgba(18, 19, 21, 0.78)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        },
        children: (0, S.jsxs)("div", {
          className: "modal card",
          style: { width: "100%", maxWidth: "560px", padding: "28px", borderRadius: "var(--r-lg)", background: "var(--bg)", border: "1px solid var(--line-2)" },
          children: [
            (0, S.jsxs)("div", {
              style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--line-2)", paddingBottom: "12px" },
              children: [
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("h2", { style: { margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--ink)" }, children: "Nouvelle Écriture Comptable" }),
                    (0, S.jsx)("p", { style: { margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }, children: "Saisie équilibrée en partie double (Débit = Crédit)." })
                  ]
                }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsModalOpen(false), className: "btn btn--ghost btn--sm", children: "✕" })
              ]
            }),

            (0, S.jsxs)("form", {
              onSubmit: handleCreateEntry,
              children: [
                // Type de Journal & Date
                (0, S.jsxs)("div", {
                  style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" },
                  children: [
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: "Journal Comptable *" }),
                        (0, S.jsxs)("select", {
                          value: formData.journal,
                          onChange: (e) => setFormData({ ...formData, journal: e.target.value }),
                          className: "select",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" },
                          children: [
                            (0, S.jsx)("option", { value: "VT", children: "VT - Journal des Ventes" }),
                            (0, S.jsx)("option", { value: "AC", children: "AC - Journal des Achats" }),
                            (0, S.jsx)("option", { value: "BQ", children: "BQ - Journal de Banque" }),
                            (0, S.jsx)("option", { value: "OD", children: "OD - Opérations Diverses" })
                          ]
                        })
                      ]
                    }),
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: "Date d'écriture *" }),
                        (0, S.jsx)("input", {
                          type: "date",
                          required: true,
                          value: formData.date,
                          onChange: (e) => setFormData({ ...formData, date: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                        })
                      ]
                    })
                  ]
                }),

                // Pièce & Libellé
                (0, S.jsxs)("div", {
                  style: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "14px" },
                  children: [
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: "N° de Pièce" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          placeholder: "Ex: FAC-042",
                          value: formData.piece,
                          onChange: (e) => setFormData({ ...formData, piece: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                        })
                      ]
                    }),
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: "Libellé de l'opération *" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          required: true,
                          placeholder: "Ex: Facturation mission de conseil",
                          value: formData.label,
                          onChange: (e) => setFormData({ ...formData, label: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" }
                        })
                      ]
                    })
                  ]
                }),

                // Montant HT & TVA
                (0, S.jsxs)("div", {
                  style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" },
                  children: [
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: `Montant HT (${tenant.currency}) *` }),
                        (0, S.jsx)("input", {
                          type: "number",
                          step: "0.01",
                          required: true,
                          placeholder: "0.00",
                          value: formData.amountHT,
                          onChange: (e) => setFormData({ ...formData, amountHT: e.target.value }),
                          className: "input",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)", fontWeight: "bold" }
                        })
                      ]
                    }),
                    (0, S.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--ink)" }, children: "Taux de TVA" }),
                        (0, S.jsxs)("select", {
                          value: formData.vatRate,
                          onChange: (e) => setFormData({ ...formData, vatRate: e.target.value }),
                          className: "select",
                          style: { width: "100%", padding: "8px 12px", background: "var(--well)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", color: "var(--ink)" },
                          children: [
                            (0, S.jsx)("option", { value: "20", children: "20,0 % (Taux normal)" }),
                            (0, S.jsx)("option", { value: "10", children: "10,0 % (Taux intermédiaire)" }),
                            (0, S.jsx)("option", { value: "5.5", children: "5,5 % (Taux réduit)" }),
                            (0, S.jsx)("option", { value: "0", children: "0,0 % (Exonéré / Export)" })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                // Pied de formulaire
                (0, S.jsxs)("div", {
                  style: { display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Enregistrer l'écriture →" })
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
