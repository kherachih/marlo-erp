import { G as e, dn as l, W as i } from "./kit-7DviM06k.js";

var x = l(); // React runtime (useState, useEffect, useRef, useMemo)
var S = e(); // JSX runtime (jsx, jsxs)

export default function PortalPage({ sub = 'quote', params = [] }) {
  const [quoteId, setQuoteId] = x.useState('dev-3');
  const [quoteData, setQuoteData] = x.useState(null);
  const [companyData, setCompanyData] = x.useState(null);
  const [isLoading, setIsLoading] = x.useState(true);
  const [signerName, setSignerName] = x.useState('');
  const [signerRole, setSignerRole] = x.useState('Directeur Général');
  const [agreedTerms, setAgreedTerms] = x.useState(false);
  const [isSigning, setIsSigning] = x.useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = x.useState(false);

  // Canvas drawing ref
  const canvasRef = x.useRef(null);
  const isDrawingRef = x.useRef(false);

  // Extract ID from hash: #/portal/quote/dev-1
  x.useEffect(() => {
    const hash = window.location.hash || '';
    const parts = hash.split('/');
    if (parts.length >= 4 && parts[2] === 'quote') {
      setQuoteId(parts[3]);
    } else {
      setQuoteId('dev-3');
    }
  }, [sub, params]);

  const fetchQuote = x.useCallback(async (targetId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/portal/quote/${targetId}`);
      const data = await res.json();
      if (data.success) {
        setQuoteData(data.quote);
        setCompanyData(data.company);
        if (data.quote.status === 'won' || data.quote.status === 'accepted') {
          setIsSignedSuccess(true);
        }
      }
    } catch (err) {
      console.error('Erreur chargement devis portail:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  x.useEffect(() => {
    if (quoteId) {
      fetchQuote(quoteId);
    }
  }, [quoteId, fetchQuote]);

  // Canvas signature handlers
  x.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    };

    const draw = (e) => {
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      e.preventDefault();
    };

    const stopDraw = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      window.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      window.removeEventListener('touchend', stopDraw);
    };
  }, [isLoading, isSignedSuccess]);

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSignSubmit = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Veuillez renseigner votre nom et prénom.');
      return;
    }
    if (!agreedTerms) {
      alert('Veuillez accepter les conditions générales de vente.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : null;

    setIsSigning(true);
    try {
      const res = await fetch(`/api/portal/quote/${quoteId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          signerRole,
          signatureDataUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSignedSuccess(true);
        setQuoteData(data.quote);
      } else {
        alert(data.error || 'Erreur lors de la signature');
      }
    } catch (err) {
      alert('Erreur réseau lors de la validation');
    } finally {
      setIsSigning(false);
    }
  };

  const totalHT = quoteData?.amount || 0;
  const vatRate = 20;
  const vatAmount = totalHT * (vatRate / 100);
  const totalTTC = totalHT + vatAmount;

  return (0, S.jsxs)("div", {
    className: "p-shell",
    children: [
      // 1. HEADER
      (0, S.jsxs)("header", {
        className: "phead",
        children: [
          (0, S.jsxs)("div", {
            className: "phead__titles",
            children: [
              (0, S.jsx)("span", { className: "eyebrow", children: "PORTAIL CLIENT SÉCURISÉ B2B" }),
              (0, S.jsx)("h1", { children: "Consultation & Signature Électronique" }),
              (0, S.jsx)("p", {
                className: "phead__sub",
                children: "Espace certifié pour l'acceptation contractuelle des devis et le téléchargement des pièces légales."
              })
            ]
          }),
          (0, S.jsxs)("div", {
            className: "phead__actions",
            children: [
              (0, S.jsxs)("a", {
                href: `/api/tenants/${companyData?.id || 'northbank-post'}/quotes/${quoteData?.id || 'dev-1'}/pdf`,
                target: "_blank",
                className: "btn btn--ghost",
                children: [
                  (0, S.jsx)(i, { name: "arrow-down" }),
                  " Télécharger PDF Vectoriel"
                ]
              })
            ]
          })
        ]
      }),

      isLoading ? (
        (0, S.jsx)("div", { className: "card", style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Chargement du document sécurisé..." })
      ) : !quoteData ? (
        (0, S.jsx)("div", { className: "card", style: { padding: '40px', textAlign: 'center', color: 'var(--c-sub)' }, children: "Devis introuvable ou lien non valide." })
      ) : (
        (0, S.jsxs)("div", {
          style: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' },
          children: [
            // GAUCHE : VISUALISATION DU DEVIS OFFICIEL
            (0, S.jsxs)("div", {
              className: "card",
              style: { padding: '32px', background: '#fff', color: '#1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
              children: [
                // Top document header
                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("div", { style: { fontSize: '20px', fontWeight: 800, color: '#0f172a' }, children: companyData?.name || 'Studio Pro' }),
                        (0, S.jsx)("div", { style: { fontSize: '12px', color: '#64748b', marginTop: '4px' }, children: companyData?.sector || 'Agence Créative & Post-Production' }),
                        (0, S.jsx)("div", { style: { fontSize: '12px', color: '#64748b' }, children: "SIRET : 839 210 923 00012 · TVA : FR 94 839210923" })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      style: { textAlign: 'right' },
                      children: [
                        (0, S.jsxs)("span", {
                          className: "badge",
                          style: {
                            backgroundColor: isSignedSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isSignedSuccess ? '#10b981' : '#f59e0b',
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: '999px',
                            display: 'inline-block',
                            marginBottom: '6px'
                          },
                          children: isSignedSuccess ? "✓ DEVIS VALIDÉ & ACCEPTÉ" : "⏳ EN ATTENTE DE SIGNATURE"
                        }),
                        (0, S.jsxs)("div", { style: { fontSize: '18px', fontWeight: 800, color: '#0f172a' }, children: ["DEVIS ", quoteData.number] }),
                        (0, S.jsxs)("div", { style: { fontSize: '12px', color: '#64748b' }, children: ["Date d'émission : ", new Date(quoteData.issued || Date.now()).toLocaleDateString('fr-FR')] })
                      ]
                    })
                  ]
                }),

                // Client address block
                (0, S.jsxs)("div", {
                  style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' },
                  children: [
                    (0, S.jsxs)("div", {
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }, children: "ÉMETTEUR DU DEVIS" }),
                        (0, S.jsx)("div", { style: { fontWeight: 600, fontSize: '14px', marginTop: '4px' }, children: companyData?.name }),
                        (0, S.jsx)("div", { style: { fontSize: '13px', color: '#64748b' }, children: "contact@northbank-post.com" }),
                        (0, S.jsx)("div", { style: { fontSize: '13px', color: '#64748b' }, children: "+33 (0)1 42 68 55 00" })
                      ]
                    }),
                    (0, S.jsxs)("div", {
                      style: { background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' },
                      children: [
                        (0, S.jsx)("span", { style: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }, children: "DESTINATAIRE CLIENT" }),
                        (0, S.jsx)("div", { style: { fontWeight: 700, fontSize: '15px', color: '#0f172a', marginTop: '4px' }, children: quoteData.client }),
                        (0, S.jsx)("div", { style: { fontSize: '13px', color: '#475569' }, children: quoteData.clientContact || 'Direction des Achats' }),
                        (0, S.jsx)("div", { style: { fontSize: '13px', color: '#475569' }, children: quoteData.clientAddress || 'Paris, France' })
                      ]
                    })
                  ]
                }),

                // Title
                (0, S.jsxs)("div", {
                  style: { marginBottom: '20px' },
                  children: [
                    (0, S.jsx)("span", { style: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }, children: "OBJET DE LA MISSION" }),
                    (0, S.jsx)("div", { style: { fontSize: '16px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }, children: quoteData.title })
                  ]
                }),

                // Table of items
                (0, S.jsx)("div", {
                  style: { marginBottom: '24px' },
                  children: (0, S.jsxs)("table", {
                    style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
                    children: [
                      (0, S.jsx)("thead", {
                        style: { background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' },
                        children: (0, S.jsxs)("tr", {
                          children: [
                            (0, S.jsx)("th", { style: { padding: '10px 12px', textAlign: 'left', fontWeight: 600 }, children: "Prestation / Description" }),
                            (0, S.jsx)("th", { style: { padding: '10px 12px', textAlign: 'center', fontWeight: 600 }, children: "Qté" }),
                            (0, S.jsx)("th", { style: { padding: '10px 12px', textAlign: 'right', fontWeight: 600 }, children: "Prix Unit. HT" }),
                            (0, S.jsx)("th", { style: { padding: '10px 12px', textAlign: 'right', fontWeight: 600 }, children: "Total HT" })
                          ]
                        })
                      }),
                      (0, S.jsx)("tbody", {
                        children: (quoteData.items && quoteData.items.length > 0 ? quoteData.items : [
                          { description: quoteData.title, quantity: 1, unitPriceHT: quoteData.amount, totalHT: quoteData.amount }
                        ]).map((it, idx) => (
                          (0, S.jsxs)("tr", {
                            key: idx,
                            style: { borderBottom: '1px solid #f1f5f9' },
                            children: [
                              (0, S.jsx)("td", { style: { padding: '12px' }, children: it.description }),
                              (0, S.jsx)("td", { style: { padding: '12px', textAlign: 'center' }, children: it.quantity || 1 }),
                              (0, S.jsx)("td", { style: { padding: '12px', textAlign: 'right' }, children: `${(it.unitPriceHT || it.totalHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` }),
                              (0, S.jsx)("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 600 }, children: `${(it.totalHT || (it.quantity * it.unitPriceHT) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` })
                            ]
                          }, idx)
                        ))
                      })
                    ]
                  })
                }),

                // Totals summary
                (0, S.jsxs)("div", {
                  style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' },
                  children: [
                    (0, S.jsxs)("div", {
                      style: { width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' },
                      children: [
                        (0, S.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [(0, S.jsx)("span", { children: "Total Net Hors Taxes :" }), (0, S.jsxs)("strong", { children: [totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] })] }),
                        (0, S.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', color: '#64748b' }, children: [(0, S.jsx)("span", { children: "TVA collectée (20%) :" }), (0, S.jsxs)("span", { children: [vatAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] })] }),
                        (0, S.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', paddingTop: '8px' }, children: [(0, S.jsx)("span", { children: "Net à Payer (TTC) :" }), (0, S.jsxs)("span", { style: { color: 'var(--c-brand)' }, children: [totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), " €"] })] })
                      ]
                    })
                  ]
                }),

                // Signature Seal if already signed
                isSignedSuccess && (
                  (0, S.jsxs)("div", {
                    style: { background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px', marginTop: '20px' },
                    children: [
                      (0, S.jsx)("div", { style: { color: '#166534', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }, children: "✓ SIGNATURE ÉLECTRONIQUE CONFORME CERTIFIÉE" }),
                      (0, S.jsxs)("div", { style: { fontSize: '12px', color: '#15803d' }, children: ["Signataire : ", quoteData.signerName || signerName, " (", quoteData.signerRole || signerRole, ")"] }),
                      (0, S.jsxs)("div", { style: { fontSize: '11px', color: '#16a34a', marginTop: '2px' }, children: ["Horodatage certifié : ", new Date(quoteData.signedAt || Date.now()).toLocaleString('fr-FR')] }),
                      quoteData.signatureDataUrl && (
                        (0, S.jsx)("img", {
                          src: quoteData.signatureDataUrl,
                          alt: "Signature électronique",
                          style: { maxHeight: '60px', marginTop: '8px', filter: 'contrast(1.2)' }
                        })
                      )
                    ]
                  })
                )
              ]
            }),

            // DROITE : FORMULAIRE DE SIGNATURE EN DIRECT
            (0, S.jsxs)("div", {
              className: "card",
              style: { padding: '24px' },
              children: [
                (0, S.jsx)("span", { className: "eyebrow", children: "VALIDATION CLIENT EN LIGNE" }),
                (0, S.jsx)("h3", { style: { margin: '6px 0 12px 0' }, children: isSignedSuccess ? "Devis Validé !" : "Signer et Accepter" }),

                isSignedSuccess ? (
                  (0, S.jsxs)("div", {
                    children: [
                      (0, S.jsx)("p", {
                        style: { color: '#10b981', fontWeight: 500, lineHeight: 1.5 },
                        children: "Merci ! Ce devis a été validé électroniquement. Une copie certifiée a été archivée et votre chargé de compte chez Northbank Post a été notifié."
                      }),
                      (0, S.jsxs)("div", {
                        style: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
                        children: [
                          (0, S.jsxs)("a", {
                            href: `/api/tenants/${companyData?.id || 'northbank-post'}/quotes/${quoteData?.id || 'dev-1'}/pdf`,
                            target: "_blank",
                            className: "btn btn--primary",
                            children: [
                              (0, S.jsx)(i, { name: "arrow-down" }),
                              " Télécharger mon exemplaire signé"
                            ]
                          }),
                          (0, S.jsx)("button", {
                            type: "button",
                            onClick: () => alert('Simulation de paiement par Carte Bancaire / Stripe : Transaction sécurisée 3D-Secure validée !'),
                            className: "btn btn--ghost",
                            children: "Régler un acompte de 30% par Carte (Stripe)"
                          })
                        ]
                      })
                    ]
                  })
                ) : (
                  (0, S.jsxs)("form", {
                    onSubmit: handleSignSubmit,
                    style: { display: 'flex', flexDirection: 'column', gap: '14px' },
                    children: [
                      (0, S.jsxs)("div", {
                        children: [
                          (0, S.jsx)("label", { className: "eyebrow", children: "NOM ET PRÉNOM DU SIGNATAIRE" }),
                          (0, S.jsx)("input", {
                            type: "text",
                            required: true,
                            value: signerName,
                            placeholder: "ex: Sophie Laurent",
                            onChange: (e) => setSignerName(e.target.value),
                            className: "input"
                          })
                        ]
                      }),

                      (0, S.jsxs)("div", {
                        children: [
                          (0, S.jsx)("label", { className: "eyebrow", children: "FONCTION / QUALITÉ" }),
                          (0, S.jsx)("input", {
                            type: "text",
                            value: signerRole,
                            placeholder: "ex: Directrice des Achats",
                            onChange: (e) => setSignerRole(e.target.value),
                            className: "input"
                          })
                        ]
                      }),

                      (0, S.jsxs)("div", {
                        children: [
                          (0, S.jsxs)("div", {
                            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
                            children: [
                              (0, S.jsx)("label", { className: "eyebrow", style: { margin: 0 }, children: "SIGNATURE MANUSCRITE (SOURIS OU DOIGT)" }),
                              (0, S.jsx)("button", {
                                type: "button",
                                onClick: handleClearSignature,
                                className: "btn btn--ghost",
                                style: { padding: '2px 8px', fontSize: '11px' },
                                children: "Effacer"
                              })
                            ]
                          }),
                          (0, S.jsx)("div", {
                            style: { border: '2px dashed var(--c-sub)', borderRadius: '8px', background: '#ffffff', cursor: 'crosshair', overflow: 'hidden' },
                            children: (0, S.jsx)("canvas", {
                              ref: canvasRef,
                              width: 380,
                              height: 140,
                              style: { width: '100%', height: '140px', display: 'block' }
                            })
                          })
                        ]
                      }),

                      (0, S.jsxs)("label", {
                        style: { display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '12px', marginTop: '6px' },
                        children: [
                          (0, S.jsx)("input", {
                            type: "checkbox",
                            required: true,
                            checked: agreedTerms,
                            onChange: (e) => setAgreedTerms(e.target.checked),
                            style: { marginTop: '2px' }
                          }),
                          (0, S.jsx)("span", {
                            style: { color: 'var(--c-sub)', lineHeight: 1.4 },
                            children: "Je reconnais avoir pris connaissance des Conditions Générales de Vente (CGV) et confirme mon accord ferme pour la réalisation des prestations décrites."
                          })
                        ]
                      }),

                      (0, S.jsx)("button", {
                        type: "submit",
                        disabled: isSigning,
                        className: "btn btn--primary",
                        style: { marginTop: '10px', justifyContent: 'center', fontSize: '14px', padding: '12px' },
                        children: isSigning ? "Validation en cours..." : `Signer électroniquement (${totalTTC.toLocaleString('fr-FR')} € TTC) →`
                      })
                    ]
                  })
                )
              ]
            })
          ]
        })
      )
    ]
  });
}
