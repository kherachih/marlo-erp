import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useMemo, useRef)
var S = e(); // JSX runtime (jsx, jsxs)

const INVENTORY_CATEGORIES = [
  'Matériel & Serveurs',
  'Équipement Audiovisuel',
  'Consommables Studio',
  'Licences & Logiciels',
  'Câblage & Accessoires',
  'Matières Premières',
  'Produits Finis',
  'Fournitures Générales'
];

export default function InventoryPage({ sub = 'stock', params = [] }) {
  const [activeTab, setActiveTab] = x.useState(sub || 'stock');
  const [products, setProducts] = x.useState([]);
  const [movements, setMovements] = x.useState([]);
  const [stats, setStats] = x.useState({
    totalProducts: 0,
    totalUnits: 0,
    totalValuation: 0,
    totalPotentialRevenue: 0,
    potentialMargin: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [isLoading, setIsLoading] = x.useState(true);
  const [search, setSearch] = x.useState('');
  const [selectedCat, setSelectedCat] = x.useState('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = x.useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = x.useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = x.useState(null);

  // Form states
  const [newProductForm, setNewProductForm] = x.useState({
    sku: '',
    name: '',
    category: 'Matériel & Serveurs',
    unit: 'unité',
    quantity: 10,
    minQuantity: 3,
    costPrice: 100,
    sellingPrice: 160,
    location: 'Entrepôt Principal - Zone A'
  });

  const [movementForm, setMovementForm] = x.useState({
    productId: '',
    type: 'in', // 'in', 'out', 'adjustment'
    quantity: 1,
    reference: '',
    notes: ''
  });

  // Current active tenant
  const activeTenantId = x.useMemo(() => {
    try {
      return localStorage.getItem('marlo_active_tenant') || 'northbank-post';
    } catch (e) {
      return 'northbank-post';
    }
  }, []);

  const loadInventory = x.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/inventory`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setMovements(data.movements || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Erreur chargement inventaire:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId]);

  x.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  x.useEffect(() => {
    if (sub && ['stock', 'movements', 'valuation'].includes(sub)) {
      setActiveTab(sub);
    }
  }, [sub]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#/inventory/${tabId}`;
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/inventory/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsProductModalOpen(false);
        setNewProductForm({
          sku: '',
          name: '',
          category: 'Matériel & Serveurs',
          unit: 'unité',
          quantity: 10,
          minQuantity: 3,
          costPrice: 100,
          sellingPrice: 160,
          location: 'Entrepôt Principal - Zone A'
        });
        await loadInventory();
      } else {
        alert(data.error || 'Erreur lors de la création de l\'article');
      }
    } catch (err) {
      alert('Erreur réseau lors de la création du produit');
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    try {
      const pId = selectedProductForMovement ? selectedProductForMovement.id : movementForm.productId;
      const res = await fetch(`/api/tenants/${activeTenantId}/inventory/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: pId,
          type: movementForm.type,
          quantity: movementForm.quantity,
          reference: movementForm.reference,
          notes: movementForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsMovementModalOpen(false);
        setSelectedProductForMovement(null);
        setMovementForm({ productId: '', type: 'in', quantity: 1, reference: '', notes: '' });
        await loadInventory();
      } else {
        alert(data.error || 'Erreur lors du mouvement de stock');
      }
    } catch (err) {
      alert('Erreur réseau lors du mouvement');
    }
  };

  const openMovementForProduct = (p, defaultType = 'in') => {
    setSelectedProductForMovement(p);
    setMovementForm({
      productId: p.id,
      type: defaultType,
      quantity: 1,
      reference: defaultType === 'in' ? 'Réception réassort' : 'Sortie intervention',
      notes: ''
    });
    setIsMovementModalOpen(true);
  };

  // Filtered products
  const filteredProducts = x.useMemo(() => {
    return products.filter(p => {
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.location || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

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
              (0, S.jsx)("span", { className: "eyebrow", children: "LOGISTIQUE & STOCK ERP" }),
              (0, S.jsx)("h1", { children: "Inventaire, Stocks & Mouvements" }),
              (0, S.jsx)("p", {
                className: "phead__sub",
                children: "Gestion des stocks physiques, valorisation PMP, alertes de rupture et traçabilité des flux."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "phead__actions",
            children: [
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => {
                  setSelectedProductForMovement(null);
                  setMovementForm({ productId: products[0]?.id || '', type: 'in', quantity: 1, reference: 'Ajustement inventaire', notes: '' });
                  setIsMovementModalOpen(true);
                },
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "activity" }),
                  " Nouveau Mouvement"
                ]
              }),
              (0, S.jsxs)("button", {
                type: "button",
                onClick: () => setIsProductModalOpen(true),
                className: "btn btn--primary",
                children: [
                  (0, S.jsx)(i, { name: "plus" }),
                  " Ajouter un Article"
                ]
              })
            ]
          })
        ]
      }),

      // 2. SUB-TABS NAVIGATION
      (0, S.jsx)("nav", {
        className: "tabs",
        children: [
          { id: 'stock', label: 'État des Stocks & Articles', count: products.length },
          { id: 'movements', label: 'Historique des Mouvements', count: movements.length },
          { id: 'valuation', label: 'Valorisation & Marges', count: null }
        ].map(tab => (
          (0, S.jsxs)("button", {
            key: tab.id,
            type: "button",
            onClick: () => handleTabClick(tab.id),
            className: `tabs__btn ${activeTab === tab.id ? 'is-active' : ''}`,
            children: [
              tab.label,
              tab.count !== null && (0, S.jsx)("span", { className: "pill pill--ghost", style: { marginLeft: '8px', fontSize: '11px' }, children: tab.count })
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
              (0, S.jsx)("span", { className: "kpi__label", children: "VALORISATION TOTALE DU STOCK (PMP)" }),
              (0, S.jsxs)("div", { className: "kpi__val", children: [(stats.totalValuation || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsxs)("span", { className: "kpi__foot", style: { color: 'var(--c-sub)' }, children: [stats.totalUnits || 0, " unités physiques en stock"] })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "POTENTIEL DE VENTE (CATALOGUE)" }),
              (0, S.jsxs)("div", { className: "kpi__val", style: { color: 'var(--c-brand)' }, children: [(stats.totalPotentialRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
              (0, S.jsxs)("span", { className: "kpi__foot", children: ["Marge latente : ", (stats.potentialMargin || 0).toLocaleString('fr-FR'), " €"] })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "RÉFÉRENCES EN ALERTE" }),
              (0, S.jsx)("div", {
                className: "kpi__val",
                style: { color: (stats.lowStockCount || 0) > 0 ? '#f59e0b' : 'inherit' },
                children: stats.lowStockCount || 0
              }),
              (0, S.jsx)("span", { className: "kpi__foot", children: "Quantité ≤ seuil minimum" })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "card kpi",
            children: [
              (0, S.jsx)("span", { className: "kpi__label", children: "RUPTURES DE STOCK" }),
              (0, S.jsx)("div", {
                className: "kpi__val",
                style: { color: (stats.outOfStockCount || 0) > 0 ? '#ef4444' : '#10b981' },
                children: stats.outOfStockCount || 0
              }),
              (0, S.jsx)("span", { className: "kpi__foot", children: (stats.outOfStockCount || 0) > 0 ? "Réassort prioritaire requis" : "Aucune rupture critique" })
            ]
          })
        ]
      }),

      // 4. TAB 1: STOCK ET ARTICLES
      activeTab === 'stock' && (0, S.jsxs)("div", {
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
                    placeholder: "Rechercher par référence, désignation ou emplacement...",
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    className: "input",
                    style: { width: '320px' }
                  }),
                  (0, S.jsxs)("select", {
                    value: selectedCat,
                    onChange: (e) => setSelectedCat(e.target.value),
                    className: "input",
                    style: { width: '220px' },
                    children: [
                      (0, S.jsx)("option", { value: "all", children: "Toutes les catégories" }),
                      INVENTORY_CATEGORIES.map(cat => (
                        (0, S.jsx)("option", { value: cat, children: cat }, cat)
                      ))
                    ]
                  })
                ]
              }),
              (0, S.jsxs)("span", {
                className: "eyebrow",
                children: [filteredProducts.length, " article(s) affiché(s)"]
              })
            ]
          }),

          isLoading ? (
            (0, S.jsx)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Chargement de l'inventaire..." })
          ) : filteredProducts.length === 0 ? (
            (0, S.jsx)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Aucun article ne correspond à votre recherche." })
          ) : (
            (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Réf / SKU" }),
                        (0, S.jsx)("th", { children: "Désignation" }),
                        (0, S.jsx)("th", { children: "Catégorie" }),
                        (0, S.jsx)("th", { children: "Emplacement" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Stock Dispo" }),
                        (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Coût PMP (HT)" }),
                        (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Prix Vente (HT)" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Statut" }),
                        (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Actions" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: filteredProducts.map(p => {
                      const isLow = p.quantity <= p.minQuantity && p.quantity > 0;
                      const isOut = p.quantity <= 0;
                      return (0, S.jsxs)("tr", {
                        key: p.id,
                        children: [
                          (0, S.jsx)("td", {
                            children: (0, S.jsx)("span", {
                              className: "badge badge--outline",
                              style: { fontFamily: 'monospace', fontWeight: 600 },
                              children: p.sku
                            })
                          }),
                          (0, S.jsxs)("td", {
                            children: [
                              (0, S.jsx)("div", { style: { fontWeight: 500 }, children: p.name }),
                              (0, S.jsxs)("small", { style: { color: 'var(--c-sub)' }, children: ["Unité : ", p.unit, " · Seuil mini : ", p.minQuantity] })
                            ]
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsx)("span", { className: "pill pill--ghost", children: p.category })
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsxs)("div", {
                              style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
                              children: [
                                (0, S.jsx)(i, { name: "projects" }),
                                p.location || 'Non assigné'
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center' },
                            children: (0, S.jsxs)("div", {
                              style: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
                              children: [
                                (0, S.jsxs)("span", {
                                  style: {
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'inherit'
                                  },
                                  children: [p.quantity, " ", p.unit]
                                })
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'right', fontWeight: 500 },
                            children: `${(Number(p.costPrice) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'right', fontWeight: 600, color: 'var(--c-brand)' },
                            children: `${(Number(p.sellingPrice) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center' },
                            children: isOut ? (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }, children: "Rupture" })
                            ) : isLow ? (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }, children: "Stock faible" })
                            ) : (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }, children: "En stock" })
                            )
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'right' },
                            children: (0, S.jsxs)("div", {
                              style: { display: 'inline-flex', gap: '6px' },
                              children: [
                                (0, S.jsx)("button", {
                                  type: "button",
                                  title: "Entrée en stock (+)",
                                  onClick: () => openMovementForProduct(p, 'in'),
                                  className: "btn btn--ghost",
                                  style: { padding: '4px 8px', fontSize: '12px' },
                                  children: "+ Entrée"
                                }),
                                (0, S.jsx)("button", {
                                  type: "button",
                                  title: "Sortie de stock (-)",
                                  onClick: () => openMovementForProduct(p, 'out'),
                                  disabled: isOut,
                                  className: "btn btn--ghost",
                                  style: { padding: '4px 8px', fontSize: '12px' },
                                  children: "- Sortie"
                                })
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
        ]
      }),

      // 5. TAB 2: HISTORIQUE DES MOUVEMENTS
      activeTab === 'movements' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '20px' },
        children: [
          (0, S.jsxs)("div", {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
            children: [
              (0, S.jsxs)("div", {
                children: [
                  (0, S.jsx)("h3", { style: { margin: '0 0 4px 0' }, children: "Livre des Mouvements de Stock" }),
                  (0, S.jsx)("p", { className: "phead__sub", children: "Traçabilité intégrale de toutes les réceptions fournisseurs, sorties chantiers/projets et ajustements." })
                ]
              }),
              (0, S.jsx)("span", { className: "eyebrow", children: `${movements.length} flux enregistrés` })
            ]
          }),

          movements.length === 0 ? (
            (0, S.jsx)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Aucun mouvement de stock enregistré." })
          ) : (
            (0, S.jsx)("div", {
              className: "table-wrap",
              children: (0, S.jsxs)("table", {
                className: "table",
                children: [
                  (0, S.jsx)("thead", {
                    children: (0, S.jsxs)("tr", {
                      children: [
                        (0, S.jsx)("th", { children: "Date" }),
                        (0, S.jsx)("th", { children: "Article" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Type de Flux" }),
                        (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Quantité" }),
                        (0, S.jsx)("th", { children: "Réf / Pièce" }),
                        (0, S.jsx)("th", { children: "Opérateur" }),
                        (0, S.jsx)("th", { children: "Motif / Destination" })
                      ]
                    })
                  }),
                  (0, S.jsx)("tbody", {
                    children: movements.map(m => {
                      const isIn = m.type === 'in';
                      const isOut = m.type === 'out';
                      return (0, S.jsxs)("tr", {
                        key: m.id,
                        children: [
                          (0, S.jsx)("td", {
                            style: { fontFamily: 'monospace' },
                            children: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          }),
                          (0, S.jsx)("td", {
                            style: { fontWeight: 500 },
                            children: m.productName
                          }),
                          (0, S.jsx)("td", {
                            style: { textAlign: 'center' },
                            children: isIn ? (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }, children: "↓ Entrée / Achat" })
                            ) : isOut ? (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }, children: "↑ Sortie / Projet" })
                            ) : (
                              (0, S.jsx)("span", { className: "pill", style: { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }, children: "⟲ Ajustement" })
                            )
                          }),
                          (0, S.jsx)("td", {
                            style: {
                              textAlign: 'center',
                              fontWeight: 700,
                              color: isIn ? '#10b981' : isOut ? '#ef4444' : 'inherit'
                            },
                            children: `${isIn ? '+' : isOut ? '-' : ''}${m.quantity}`
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsx)("span", { className: "badge badge--outline", children: m.reference || 'Sans réf' })
                          }),
                          (0, S.jsx)("td", {
                            children: (0, S.jsxs)("div", {
                              style: { display: 'flex', alignItems: 'center', gap: '6px' },
                              children: [
                                (0, S.jsx)(i, { name: "team" }),
                                m.user || 'Admin'
                              ]
                            })
                          }),
                          (0, S.jsx)("td", {
                            style: { color: 'var(--c-sub)' },
                            children: m.notes || '-'
                          })
                        ]
                      });
                    })
                  })
                ]
              })
            })
          )
        ]
      }),

      // 6. TAB 3: VALORISATION DES STOCKS & MARGES
      activeTab === 'valuation' && (0, S.jsxs)("div", {
        className: "card",
        style: { padding: '24px' },
        children: [
          (0, S.jsx)("h3", { style: { margin: '0 0 6px 0' }, children: "Synthèse de Valorisation Comptable & Analyse des Actifs" }),
          (0, S.jsx)("p", { className: "phead__sub", style: { marginBottom: '24px' }, children: "Conformité avec le Plan Comptable Général (PCG) pour l'inventaire de clôture fiscale et la valorisation PMP." }),

          (0, S.jsxs)("div", {
            style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' },
            children: [
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "VALEUR DE L'ACTIF CIRCULANT (STOCKS)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0' }, children: [(stats.totalValuation || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Impacte le Compte 370000 (Stocks de marchandises) au bilan annuel" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "CHIFFRE D'AFFAIRES PROJETÉ (VENTES)" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--c-brand)' }, children: [(stats.totalPotentialRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsx)("small", { style: { color: 'var(--c-sub)' }, children: "Montant brut si tout le stock disponible est facturé au catalogue" })
                ]
              }),
              (0, S.jsxs)("div", {
                className: "card",
                style: { padding: '16px', background: 'var(--c-bg-sub)' },
                children: [
                  (0, S.jsx)("span", { className: "eyebrow", children: "MARGE COMMERCIALE THÉORIQUE" }),
                  (0, S.jsxs)("div", { style: { fontSize: '24px', fontWeight: 700, margin: '8px 0', color: '#10b981' }, children: [(stats.potentialMargin || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] }),
                  (0, S.jsxs)("small", { style: { color: 'var(--c-sub)' }, children: [
                    "Taux de marge estimé : ",
                    stats.totalPotentialRevenue > 0
                      ? Math.round((stats.potentialMargin / stats.totalPotentialRevenue) * 100) + ' %'
                      : '0 %'
                  ] })
                ]
              })
            ]
          }),

          // Catégories breakdown
          (0, S.jsx)("h4", { style: { margin: '20px 0 12px 0' }, children: "Répartition de la valeur du stock par catégorie" }),
          (0, S.jsx)("div", {
            className: "table-wrap",
            children: (0, S.jsxs)("table", {
              className: "table",
              children: [
                (0, S.jsx)("thead", {
                  children: (0, S.jsxs)("tr", {
                    children: [
                      (0, S.jsx)("th", { children: "Catégorie" }),
                      (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Nombre d'articles" }),
                      (0, S.jsx)("th", { style: { textAlign: 'center' }, children: "Quantité totale" }),
                      (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Valeur au Coût (HT)" }),
                      (0, S.jsx)("th", { style: { textAlign: 'right' }, children: "Valeur de Vente (HT)" })
                    ]
                  })
                }),
                (0, S.jsx)("tbody", {
                  children: INVENTORY_CATEGORIES.map(cat => {
                    const catProducts = products.filter(p => p.category === cat);
                    if (catProducts.length === 0) return null;
                    const catQty = catProducts.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
                    const catCost = catProducts.reduce((s, p) => s + ((Number(p.quantity) || 0) * (Number(p.costPrice) || 0)), 0);
                    const catSell = catProducts.reduce((s, p) => s + ((Number(p.quantity) || 0) * (Number(p.sellingPrice) || 0)), 0);
                    return (0, S.jsxs)("tr", {
                      key: cat,
                      children: [
                        (0, S.jsx)("td", { style: { fontWeight: 600 }, children: cat }),
                        (0, S.jsx)("td", { style: { textAlign: 'center' }, children: catProducts.length }),
                        (0, S.jsx)("td", { style: { textAlign: 'center', fontWeight: 500 }, children: catQty }),
                        (0, S.jsx)("td", { style: { textAlign: 'right', fontWeight: 600 }, children: `${catCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` }),
                        (0, S.jsx)("td", { style: { textAlign: 'right', color: 'var(--c-brand)', fontWeight: 600 }, children: `${catSell.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` })
                      ]
                    });
                  }).filter(Boolean)
                })
              ]
            })
          })
        ]
      }),

      // MODAL: NOUVEL ARTICLE
      isProductModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        children: (0, S.jsxs)("div", {
          className: "card modal",
          style: { width: '560px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' },
          children: [
            (0, S.jsxs)("div", {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0 }, children: "Créer une fiche article" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsProductModalOpen(false), className: "btn btn--ghost", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateProduct,
              style: { display: 'flex', flexDirection: 'column', gap: '14px' },
              children: [
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "RÉF / SKU" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          required: true,
                          value: newProductForm.sku,
                          placeholder: "ex: ART-001",
                          onChange: (e) => setNewProductForm({ ...newProductForm, sku: e.target.value }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "DÉSIGNATION DU PRODUIT" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          required: true,
                          value: newProductForm.name,
                          placeholder: "ex: Disque SSD 2To Pro",
                          onChange: (e) => setNewProductForm({ ...newProductForm, name: e.target.value }),
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
                        (0, S.jsx)("label", { className: "eyebrow", children: "CATÉGORIE" }),
                        (0, S.jsx)("select", {
                          value: newProductForm.category,
                          onChange: (e) => setNewProductForm({ ...newProductForm, category: e.target.value }),
                          className: "input",
                          children: INVENTORY_CATEGORIES.map(cat => (
                            (0, S.jsx)("option", { value: cat, children: cat }, cat)
                          ))
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "UNITÉ" }),
                        (0, S.jsx)("input", {
                          type: "text",
                          value: newProductForm.unit,
                          placeholder: "unité, pièce, mètre...",
                          onChange: (e) => setNewProductForm({ ...newProductForm, unit: e.target.value }),
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
                        (0, S.jsx)("label", { className: "eyebrow", children: "STOCK INITIAL" }),
                        (0, S.jsx)("input", {
                          type: "number",
                          min: 0,
                          value: newProductForm.quantity,
                          onChange: (e) => setNewProductForm({ ...newProductForm, quantity: Number(e.target.value) }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "SEUIL D'ALERTE MINIMUM" }),
                        (0, S.jsx)("input", {
                          type: "number",
                          min: 0,
                          value: newProductForm.minQuantity,
                          onChange: (e) => setNewProductForm({ ...newProductForm, minQuantity: Number(e.target.value) }),
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
                        (0, S.jsx)("label", { className: "eyebrow", children: "PRIX D'ACHAT HT (COÛT PMP)" }),
                        (0, S.jsx)("input", {
                          type: "number",
                          step: "0.01",
                          min: 0,
                          value: newProductForm.costPrice,
                          onChange: (e) => setNewProductForm({ ...newProductForm, costPrice: Number(e.target.value) }),
                          className: "input"
                        })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("label", { className: "eyebrow", children: "PRIX DE VENTE HT (CATALOGUE)" }),
                        (0, S.jsx)("input", {
                          type: "number",
                          step: "0.01",
                          min: 0,
                          value: newProductForm.sellingPrice,
                          onChange: (e) => setNewProductForm({ ...newProductForm, sellingPrice: Number(e.target.value) }),
                          className: "input"
                        })
                      ]
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "EMPLACEMENT / RAYON" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      value: newProductForm.location,
                      placeholder: "ex: Entrepôt A - Étagère 3",
                      onChange: (e) => setNewProductForm({ ...newProductForm, location: e.target.value }),
                      className: "input"
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsProductModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Enregistrer l'article →" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // MODAL: MOUVEMENT DE STOCK
      isMovementModalOpen && (0, S.jsx)("div", {
        className: "modal-backdrop",
        style: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        children: (0, S.jsxs)("div", {
          className: "card modal",
          style: { width: '500px', maxWidth: '90vw', padding: '24px' },
          children: [
            (0, S.jsxs)("div", {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
              children: [
                (0, S.jsx)("h3", { style: { margin: 0 }, children: "Enregistrer un mouvement de stock" }),
                (0, S.jsx)("button", { type: "button", onClick: () => setIsMovementModalOpen(false), className: "btn btn--ghost", children: "✕" })
              ]
            }),
            (0, S.jsxs)("form", {
              onSubmit: handleCreateMovement,
              style: { display: 'flex', flexDirection: 'column', gap: '14px' },
              children: [
                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "ARTICLE CONCERNÉ" }),
                    selectedProductForMovement ? (
                      (0, S.jsxs)("div", {
                        className: "card",
                        style: { padding: '10px', background: 'var(--c-bg-sub)', fontWeight: 600 },
                        children: [
                          selectedProductForMovement.sku,
                          " — ",
                          selectedProductForMovement.name,
                          (0, S.jsxs)("small", { style: { display: 'block', color: 'var(--c-sub)', fontWeight: 400 }, children: ["Stock actuel : ", selectedProductForMovement.quantity, " ", selectedProductForMovement.unit] })
                        ]
                      })
                    ) : (
                      (0, S.jsx)("select", {
                        value: movementForm.productId,
                        onChange: (e) => setMovementForm({ ...movementForm, productId: e.target.value }),
                        className: "input",
                        required: true,
                        children: products.map(p => (
                          (0, S.jsxs)("option", { value: p.id, children: [p.sku, " - ", p.name, " (", p.quantity, " dispo)"] }, p.id)
                        ))
                      })
                    )
                  ]
                }),

                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "SENS DU FLUX" }),
                    (0, S.jsxs)("div", {
                      style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
                      children: [
                        (0, S.jsxs)("button", {
                          type: "button",
                          onClick: () => setMovementForm({ ...movementForm, type: 'in' }),
                          className: `btn ${movementForm.type === 'in' ? 'btn--primary' : 'btn--ghost'}`,
                          style: { justifyContent: 'center' },
                          children: ["↓ Entrée"]
                        }),
                        (0, S.jsxs)("button", {
                          type: "button",
                          onClick: () => setMovementForm({ ...movementForm, type: 'out' }),
                          className: `btn ${movementForm.type === 'out' ? 'btn--primary' : 'btn--ghost'}`,
                          style: { justifyContent: 'center' },
                          children: ["↑ Sortie"]
                        }),
                        (0, S.jsxs)("button", {
                          type: "button",
                          onClick: () => setMovementForm({ ...movementForm, type: 'adjustment' }),
                          className: `btn ${movementForm.type === 'adjustment' ? 'btn--primary' : 'btn--ghost'}`,
                          style: { justifyContent: 'center' },
                          children: ["⟲ Ajuster"]
                        })
                      ]
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: movementForm.type === 'adjustment' ? "NOUVELLE QUANTITÉ EN STOCK" : "QUANTITÉ DU MOUVEMENT" }),
                    (0, S.jsx)("input", {
                      type: "number",
                      min: 1,
                      required: true,
                      value: movementForm.quantity,
                      onChange: (e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) }),
                      className: "input"
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "RÉFÉRENCE / BON DE COMMANDE" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      value: movementForm.reference,
                      placeholder: "ex: PO-2026-003, LIV-894...",
                      onChange: (e) => setMovementForm({ ...movementForm, reference: e.target.value }),
                      className: "input"
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  children: [
                    (0, S.jsx)("label", { className: "eyebrow", children: "COMMENTAIRE / DESTINATION" }),
                    (0, S.jsx)("input", {
                      type: "text",
                      value: movementForm.notes,
                      placeholder: "ex: Préparation tournage studio A",
                      onChange: (e) => setMovementForm({ ...movementForm, notes: e.target.value }),
                      className: "input"
                    })
                  ]
                }),

                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
                  children: [
                    (0, S.jsx)("button", { type: "button", onClick: () => setIsMovementModalOpen(false), className: "btn btn--ghost", children: "Annuler" }),
                    (0, S.jsx)("button", { type: "submit", className: "btn btn--primary", children: "Valider le mouvement →" })
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
