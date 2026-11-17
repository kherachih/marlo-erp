# 🚀 Marlo ERP & SaaS Platform — Modular Multi-Tenant Odoo Alternative

> Plateforme ERP SaaS moderne, modulaire et multi-tenant, inspirée de l'architecture modulaire d'Odoo et propulsée par le design system épuré et ultra-réactif de Marlo.

---

## ✨ Points Clés & Fonctionnalités

### 🏢 1. Architecture Multi-Tenant avec Isolation Totale (Option 2)
- **Cloisonnement étanche des données** : Chaque entreprise dispose de son propre espace indépendant (`marlo:data:<tenant-id>`, `db.tenantsData[tenantId]`).
- **Sélecteur d'entreprise réactif** : Basculez entre vos entreprises en 1 clic depuis la barre latérale sans aucun rechargement de page. L'état global React se synchronise instantanément (`useSyncExternalStore`).
- **Persistance hybride** : Stockage local ultra-rapide doublé d'une persistance sur serveur Node.js / REST API (`GET /api/tenants/:id/data`, `PUT /api/tenants/:id/data`).

### 📋 2. Questionnaire d'Onboarding Intelligent (`#/onboarding`)
- **Diagnostic en 4 étapes** :
  1. *Identité & Profil* : Nom de l'entreprise, administrateur, devise (EUR, USD, GBP, CHF, CAD), taille de l'équipe.
  2. *Secteur d'activité* : Studio Créatif, Cabinet de Conseil, Commerce B2B, BTP & Chantier, Généraliste.
  3. *Diagnostic des besoins* : Qualification des priorités opérationnelles quotidiennes (Ventes, Projets, Factures, RH, Salles, Compta).
  4. *Déblocage & Recommandation Dynamique des Plugins* : Suggère et pré-active automatiquement les modules Odoo pertinents avec le badge **`✨ Suggéré selon votre profil`**.
- **Amorçage sur mesure (Starter Data)** : Chaque nouvel espace est immédiatement initialisé avec des projets, tâches, factures, membres et leads CRM adaptés à son secteur d'activité.

### 🛍️ 3. App Store & Catalogue de Plugins à la Carte (`#/apps`)
- Activez ou désactivez n'importe quel module ERP selon l'évolution de votre activité.
- La barre latérale et la navigation s'adaptent dynamiquement en direct selon les modules activés.
- Modules disponibles : *Overview*, *CRM & Ventes*, *Tâches (Kanban)*, *Projets & Gantt*, *Planning & Suites*, *Équipe & Timesheets*, *Facturation & Devis*, *Comptabilité Générale*, *Fil d'Activité*, *Inbox*.

### 💼 4. Module CRM & Pipeline Commercial Odoo (`#/crm`)
- Pipeline visuel par étapes : *Nouveau*, *Qualifié*, *Proposition*, *Négociation*, *Gagné*.
- Glisser-déposer des opportunités, calcul automatique de la valeur pondérée et métriques en temps réel.
- **Conversion Odoo en 1 clic** : Transforme instantanément une affaire gagnée en Projet de production et émet l'acompte de facturation associé.

---

## ⚡ Démarrage Rapide

Aucune dépendance externe ni compilation lourde requise. Le projet utilise le runtime standard Node.js :

```bash
# 1. Cloner le dépôt
git clone https://github.com/kherachih/marlo-erp.git
cd marlo-erp

# 2. Lancer le serveur local
node server.js
```

Ouvrez votre navigateur :
- 👉 **Tableau de bord : [http://localhost:3333/#/overview](http://localhost:3333/#/overview)**
- 👉 **App Store des Plugins : [http://localhost:3333/#/apps](http://localhost:3333/#/apps)**
- 👉 **Module CRM Ventes : [http://localhost:3333/#/crm](http://localhost:3333/#/crm)**
- 👉 **Questionnaire d'Onboarding : [http://localhost:3333/#/onboarding](http://localhost:3333/#/onboarding)**

---

## 📁 Architecture du Codebase

```
marlo-erp/
├── api/
│   ├── db.js                 # Base de données, catalogue modules & générateur de starter data
│   └── routes.js             # API REST Multi-tenant, CRM, Onboarding & Plugins
├── assets/
│   ├── apps-page.js          # Page React du Store de Plugins Odoo (#/apps)
│   ├── crm-page.js           # Page React du Pipeline Commercial CRM (#/crm)
│   ├── onboarding-page.js    # Page React du Questionnaire d'Onboarding (#/onboarding)
│   ├── marlo-erp-runtime.js  # Runtime SaaS, sélecteur d'entreprise & wizard modal
│   ├── kit-7DviM06k.js       # Core runtime, Store réactif, Icons & Router
│   ├── index-zR5idEgD.js     # React App bundle & route registry
│   └── index-DPV1UCmh.css    # Design system complet Marlo
├── data/
│   └── erp_store.json        # Base de données serveur persistée (tenants, leads, data)
├── index.html                # Page d'accueil SPA
├── server.js                 # Serveur HTTP natif Node.js
└── package.json
```

---

## 📄 Licence
Licence MIT.
