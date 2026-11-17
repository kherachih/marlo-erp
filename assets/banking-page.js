import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

export default function BankingPage({ sub = 'runway', params = [] }) {
  const [activeTab, setActiveTab] = x.useState(sub || 'runway');
  const [bankingData, setBankingData] = x.useState(null);
  const [transactions, setTransactions] = x.useState([]);
  const [isLoading, setIsLoading] = x.useState(true);

  // AI Chat state
  const [chatMessages, setChatMessages] = x.useState([
    {
      sender: 'ai',
      text: "Bonjour Alexandre. Je suis votre Copilote Financier Marlo. Comment puis-je vous aider aujourd'hui ? (Prévisions de trésorerie, TVA, relances d'impayés...)"
    }
  ]);
  const [chatInput, setChatInput] = x.useState('');
  const [isAiThinking, setIsAiThinking] = x.useState(false);

  const activeTenantId = x.useMemo(() => {
    try {
      return localStorage.getItem('marlo_active_tenant') || 'northbank-post';
    } catch (e) {
      return 'northbank-post';
    }
  }, []);

  const loadBanking = x.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/banking`);
      const data = await res.json();
      if (data.success) {
        setBankingData(data);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Erreur chargement trésorerie:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId]);

  x.useEffect(() => {
    loadBanking();
  }, [loadBanking]);

  x.useEffect(() => {
    if (sub && ['runway', 'reconcile', 'copilot', 'accounts'].includes(sub)) {
      setActiveTab(sub);
    }
  }, [sub]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#/banking/${tabId}`;
  };

  const handleReconcile = async (txId) => {
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/banking/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      if (data.success) {
        await loadBanking();
      } else {
        alert(data.error || 'Erreur lors du rapprochement');
      }
    } catch (err) {
      alert('Erreur réseau');
    }
  };

  const handleReconcileAll = async () => {
    const unreconciled = transactions.filter(t => !t.reconciled);
    for (const t of unreconciled) {
      await fetch(`/api/tenants/${activeTenantId}/banking/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: t.id })
      });
    }
    await loadBanking();
  };

  const handleSendPrompt = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsAiThinking(true);

    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/banking/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages([...newMsgs, { sender: 'ai', text: data.answer }]);
      }
    } catch (err) {
      setChatMessages([...newMsgs, { sender: 'ai', text: "Erreur de connexion au copilote IA." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const unreconciledCount = transactions.filter(t => !t.reconciled).length;

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
              (0, S.jsx)("span", { className: "eyebrow", children: "FINANCES INTELLIGENTES & COPILOTE IA" }),
              (0, S.jsx)("h1", { children: "Trésorerie Prévisionnelle & IA Bancaire" }),
              (0, S.jsx)("p", {
                className: "phead__sub",
                children: "Simulation du cashflow à 90 jours, rapprochement bancaire automatique par IA et copilote de gestion."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "phead__actions",
            children: [
              unreconciledCount > 0 && (
                (0, S.jsxs)("button", {
                  type: "button",
                  onClick: handleReconcileAll,
                  className: "btn btn--primary",
                  children: [
                    (0, S.jsx)(i, { name: "check" }),
                    ` Rapprocher ${unreconciledCount} flux par IA`
                  ]
                })
              )
            ]
          })
        ]
      }),

      // 2. SUB-TABS
      (0, S.jsx)("nav", {
        className: "tabs",
        children: [
          { id: 'runway', label: 'Trésorerie Prévisionnelle (Runway)', count: null },
          { id: 'reconcile', label: 'Rapprochement Bancaire IA', count: unreconciledCount > 0 ? unreconciledCount : null },
          { id: 'copilot', label: 'Copilote IA Financier', count: 'IA' },
          { id: 'accounts', label: 'Comptes Bancaires & IBAN', count: null }
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
                  backgroundColor: tab.id === 'copilot' ? '#8b5cf6' : tab.id === 'reconcile' ? '#f59e0b' : 'var(--c-brand)',
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
              (0, S.jsx)("span", { className: "kpi__label", children: "SOLDE BANCAIRE ACTUEL EN DIRECT" }),
              (0, S.jsxs)("div", { className: "kpi__val", style: { color: 'var(--c-brand)' }, children: [(bankingData?.currentBalance || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Compte Pro Principal BNP Paribas" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "RUNWAY & VISIBILITÉ SÉCURISÉE" }),
              (0, S.jsxs)("div", { className: "kpi__val", style: { color: '#10b981' }, children: [bankingData?.runwayMonths || 4.2, " mois"] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Sans aucune nouvelle entrée de cash" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "CASH ENCAISSABLE À 30 JOURS" }),
              (0, S.jsxs)("div", { className: "kpi__val", children: [(bankingData?.stats?.totalExpectedInflows || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Factures émises + devis acceptés" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "PRÉVISION SOLDE À J+90" }),
              (0, S.jsxs)("div", { className: "kpi__val", children: [(bankingData?.forecast?.d90 || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Hypothèse charges & honoraires" })
            ]
          })
        ]
      }),

      // 4. TAB 1: TRÉSORERIE PRÉVISIONNELLE (RUNWAY)
      activeTab === 'runway' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Courbe Prévisionnelle du Cashflow (J+30, J+60, J+90)" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '24px' }, children: "Projection dynamique intégrant les dates d'échéance des factures clients, les salaires et les charges d'exploitation." }),

          // Visual Timeline Cards
          (0, S.jsxs)("div", {
            style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
            children: [
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', borderLeft: '4px solid var(--c-brand)', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "AUJOURD'HUI (RÉEL)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '22px', fontWeight: 700, margin: '8px 0' }, children: [(bankingData?.forecast?.now || 0).toLocaleString('fr-FR'), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Solde certifié bancaire" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', borderLeft: '4px solid #10b981', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "DANS 30 JOURS (J+30)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '22px', fontWeight: 700, margin: '8px 0', color: '#10b981' }, children: [(bankingData?.forecast?.d30 || 0).toLocaleString('fr-FR'), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "+ Encaissements factures dues" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', borderLeft: '4px solid #3b82f6', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "DANS 60 JOURS (J+60)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '22px', fontWeight: 700, margin: '8px 0', color: '#3b82f6' }, children: [(bankingData?.forecast?.d60 || 0).toLocaleString('fr-FR'), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Acomptes devis signés récents" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', borderLeft: '4px solid #8b5cf6', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "DANS 90 JOURS (J+90)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '22px', fontWeight: 700, margin: '8px 0', color: '#8b5cf6' }, children: [(bankingData?.forecast?.d90 || 0).toLocaleString('fr-FR'), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Solde consolidé fin de trimestre" })
                ]
              })
            ]
          }),

          // Cashflow rules explanation
          (0, S.jsxs)("div", {
            style: { background: 'var(--c-bg-sub)', padding: '16px 20px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'center' },
            children: [
              (0, S.jsx)(i, { name: "activity" }),
              (0, S.jsx)("div", {
                style: { fontSize: '13px', color: 'var(--c-sub)' },
                children: "Le moteur prédictif calcule chaque nuit les flux certains et pondère les devis gagnés à 70% de probabilité d'encaissement moyen à 45 jours. Les dépenses récurrentes (charges salariales 12 500 €) sont déduites automatiquement."
              })
            ]
          })
        ]
      }),

      // 5. TAB 2: RAPPROCHEMENT BANCAIRE IA
      activeTab === 'reconcile' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '20px' },
        children: [
          (0, S.jsxs)("div", {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
            children: [
              (0, S.jsxs)("div", {
                children: [
                  (0, S.jsx)("h3", { style: { margin: '0 0 4px 0' }, children: "Rapprochement Automatisé par Intelligence Artificielle" }),
                  (0, S.jsx)("p", { className: "phead__sub", children: "L'IA associe automatiquement les lignes de votre compte bancaire avec vos factures clients et achats fournisseurs." })
                ]
              }),
              (0, S.jsx)("span", { className: "eyebrow", children: `${transactions.length} flux bancaires analysés` })
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
                      (0, S.jsx)("th", { children: "Libellé de l'Opération Bancaire" }),
                      (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Montant" }),
                      (0, S.jsx)("th", { children: "Correspondance IA Détectée" }),
                      (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Confiance IA" }),
                      (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Action" })
                    ]
                  })
                }),
                (0, S.jsx)("tbody", {
                  children: transactions.map(t => {
                    const isCredit = t.amount > 0;
                    return (0, S.jsxs)("tr", {
                      key: t.id,
                      children: [
                        (0, S.jsx)("td", { style: { fontFamily: 'monospace' }, children: new Date(t.date).toLocaleDateString('fr-FR') }),
                        (0, S.jsx)("td", { style: { fontWeight: 500 }, children: t.label }),
                        (0, S.jsx)("td", {
                          style: {
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isCredit ? '#10b981' : 'inherit'
                          },
                          children: `${isCredit ? '+' : ''}${t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                        }),
                        (0, S.jsx)("td", {
                          children: (0, S.jsxs)("div", {
                            style: { fontSize: '13px' },
                            children: [
                              (0, S.jsx)("span", { className: "badge badge--outline", children: t.matchedEntityId }),
                              t.aiReason && (0, S.jsx)("small", { style: { display: 'block', color: 'var(--c-sub)', marginTop: '2px' }, children: t.aiReason })
                            ]
                          })
                        }),
                        (0, S.jsx)("td", {
                          style: { textAlign: 'center' },
                          children: (0, S.jsxs)("span", {
                            className: "pill",
                            style: {
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontWeight: 700
                            },
                            children: [`${t.aiConfidence || 95} %`]
                          })
                        }),
                        (0, S.jsx)("td", {
                          style: { textAlign: 'right' },
                          children: t.reconciled ? (
                            (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }, children: "✓ Rapproché" })
                          ) : (
                            (0, S.jsx)("button", {
                              type: "button",
                              onClick: () => handleReconcile(t.id),
                              className: "btn btn--primary",
                              style: { padding: '4px 10px', fontSize: '12px' },
                              children: "Rapprocher →"
                            })
                          )
                        })
                      ]
                    }, t.id);
                  })
                })
              ]
            })
          })
        ]
      }),

      // 6. TAB 3: COPILOTE IA FINANCIER
      activeTab === 'copilot' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Copilote IA Financier & Décisionnel" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '20px' }, children: "Posez vos questions de gestion en langage naturel. Le copilote analyse vos factures, comptes et contrats en temps réel." }),

          // Quick prompts pills
          (0, S.jsxs)("div", {
            style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
            children: [
              (0, S.jsx)("button", {
                type: "button",
                onClick: () => handleSendPrompt("Quel est mon prévisionnel de trésorerie et mon runway ?"),
                className: "btn btn--ghost",
                style: { fontSize: '12px', padding: '6px 12px' },
                children: "📊 Prévision de trésorerie"
              }),
              (0, S.jsx)("button", {
                type: "button",
                onClick: () => handleSendPrompt("Quel est le montant de ma TVA nette à payer ce mois-ci ?"),
                className: "btn btn--ghost",
                style: { fontSize: '12px', padding: '6px 12px' },
                children: "🏛️ Déclaration TVA à payer"
              }),
              (0, S.jsx)("button", {
                type: "button",
                onClick: () => handleSendPrompt("Rédige un email de relance pour la facture client échue"),
                className: "btn btn--ghost",
                style: { fontSize: '12px', padding: '6px 12px' },
                children: "✉️ Rédiger une relance client"
              })
            ]
          }),

          // Messages list
          (0, S.jsx)("div", {
            style: {
              border: '1px solid var(--c-sub)',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '260px',
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px',
              background: 'var(--c-bg-sub)'
            },
            children: chatMessages.map((m, idx) => (
              (0, S.jsxs)("div", {
                key: idx,
                style: {
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: m.sender === 'user' ? 'var(--c-brand)' : '#fff',
                  color: m.sender === 'user' ? '#fff' : '#0f172a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  whiteSpace: 'pre-wrap',
                  fontSize: '13px',
                  lineHeight: 1.5
                },
                children: [
                  (0, S.jsx)("strong", { style: { display: 'block', fontSize: '11px', marginBottom: '4px', opacity: 0.8 }, children: m.sender === 'user' ? 'Alexandre Martin (Vous)' : '🤖 Copilote Marlo IA' }),
                  m.text
                ]
              }, idx)
            ))
          }),

          // Input form
          (0, S.jsxs)("form", {
            onSubmit: (e) => { e.preventDefault(); handleSendPrompt(); },
            style: { display: 'flex', gap: '10px' },
            children: [
              (0, S.jsx)("input", {
                type: "text",
                value: chatInput,
                onChange: (e) => setChatInput(e.target.value),
                placeholder: "Posez votre question financière à l'IA...",
                className: "input",
                style: { flex: 1 }
              }),
              (0, S.jsx)("button", {
                type: "submit",
                disabled: isAiThinking,
                className: "btn btn--primary",
                children: isAiThinking ? "Analyse..." : "Envoyer →"
              })
            ]
          })
        ]
      }),

      // 7. TAB 4: COMPTES BANCAIRES
      activeTab === 'accounts' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Comptes Bancaires & Synchronisation Open Banking" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '24px' }, children: "Connexion sécurisée DSP2 avec vos établissements bancaires professionnels." }),

          (0, S.jsxs)("div", {
            className: "card",
            style: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--c-bg-sub)' },
            children: [
              (0, S.jsxs)("div", {
                children: [
                  (0, S.jsxs)("div", { style: { fontWeight: 700, fontSize: '16px' }, children: ["BNP Paribas — Compte Courant Entreprise (EUR)"] }),
                  (0, S.jsx)("div", { style: { fontFamily: 'monospace', fontSize: '13px', color: 'var(--c-sub)', margin: '4px 0' }, children: "IBAN : FR76 3000 4001 2345 6789 0123 456 · BIC : BNPAFRPP" }),
                  (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px' }, children: "✓ Synchronisation DSP2 Active" })
                ]
              }),
              (0, S.jsxs)("div", {
                style: { textAlign: 'right' },
                children: [
                  (0, S.jsx)("div", { style: { fontSize: '24px', fontWeight: 800, color: 'var(--c-brand)' }, children: "48 520,00 €" }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Solde comptable Compte 512000" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
