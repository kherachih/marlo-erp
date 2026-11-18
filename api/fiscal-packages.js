/**
 * Marlo ERP - International Fiscal Packages Catalog & Country Compliance Rules
 * Includes Algeria (DZ), Tunisia (TN), France (FR), Morocco (MA), USA (US), Germany (DE), Switzerland (CH), UAE/KSA.
 */

const FISCAL_PACKAGES = {
  DZ: {
    code: 'DZ',
    name: 'Algérie (الجمهورية الجزائرية)',
    flag: '🇩🇿',
    currency: 'DZD',
    currencySymbol: 'د.ج',
    currencyDecimals: 2,
    defaultLanguage: 'ar',
    accountingSystem: 'SCF (Système Comptable Financier - Normes IFRS)',
    vatRates: [
      { rate: 19, label: 'TVA Normale (19%)', code: 'TVA_19', isDefault: true },
      { rate: 9, label: 'TVA Réduite (9%)', code: 'TVA_09' },
      { rate: 0, label: 'Exonéré / Non assujetti (0%)', code: 'TVA_0' }
    ],
    mandatoryFields: [
      { key: 'nif', label: 'NIF (Numéro d\'Identification Fiscale)', required: true, pattern: '^[0-9]{15}$', placeholder: 'Ex: 099816001234567' },
      { key: 'nis', label: 'NIS (Numéro d\'Identification Statistique)', required: true, placeholder: 'Ex: 000116012345678' },
      { key: 'rc', label: 'Registre de Commerce (RC)', required: true, placeholder: 'Ex: 16/00-0123456B20' },
      { key: 'ai', label: 'Article d\'Imposition (AI)', required: true, placeholder: 'Ex: 16012345678' }
    ],
    stampDuty: {
      appliesTo: 'cash',
      rate: 0.01, // 1% droit de timbre sur espèces
      min: 5,
      max: 10000
    },
    legalNotice: 'Facture établie sous le régime du Système Comptable Financier (SCF) et du Code des Taxes sur le C.A. algérien.',
    chartOfAccountsType: 'scf_algeria'
  },
  TN: {
    code: 'TN',
    name: 'Tunisie (الجمهورية التونسية)',
    flag: '🇹🇳',
    currency: 'TND',
    currencySymbol: 'د.ت',
    currencyDecimals: 3, // 3 décimales (millimes)
    defaultLanguage: 'ar',
    accountingSystem: 'SCE (Système Comptable des Entreprises)',
    vatRates: [
      { rate: 19, label: 'TVA Taux Normal (19%)', code: 'TVA_19', isDefault: true },
      { rate: 13, label: 'TVA Taux Intermédiaire (13%)', code: 'TVA_13' },
      { rate: 7, label: 'TVA Taux Réduit (7%)', code: 'TVA_07' },
      { rate: 0, label: 'Exonéré (0%)', code: 'TVA_0' }
    ],
    mandatoryFields: [
      { key: 'matricule_fiscal', label: 'Matricule Fiscal (MF)', required: true, placeholder: 'Ex: 1234567/A/M/000' },
      { key: 'rne', label: 'Registre National des Entreprises (RNE)', required: false, placeholder: 'Ex: 1234567X' }
    ],
    stampDuty: {
      appliesTo: 'all_invoices',
      fixedAmount: 1.000 // 1 Dinar tunisien de droit de timbre obligatoire
    },
    withholdingTax: {
      standardRate: 1.5 // 1.5% retenue à la source
    },
    legalNotice: 'Facture soumise au droit de timbre fiscal tunisien (1.000 TND).',
    chartOfAccountsType: 'sce_tunisia'
  },
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyDecimals: 2,
    defaultLanguage: 'fr',
    accountingSystem: 'PCG (Plan Comptable Général)',
    vatRates: [
      { rate: 20, label: 'TVA Normale (20%)', code: 'TVA_20', isDefault: true },
      { rate: 10, label: 'TVA Intermédiaire (10%)', code: 'TVA_10' },
      { rate: 5.5, label: 'TVA Réduite (5.5%)', code: 'TVA_55' },
      { rate: 2.1, label: 'TVA Particulière (2.1%)', code: 'TVA_21' },
      { rate: 0, label: 'Exonéré / Export (0%)', code: 'TVA_0' }
    ],
    mandatoryFields: [
      { key: 'siret', label: 'Numéro SIRET', required: true, pattern: '^[0-9]{14}$', placeholder: 'Ex: 84920391200014' },
      { key: 'rcs', label: 'RCS / Greffe', required: true, placeholder: 'Ex: RCS Paris B 849 203 912' },
      { key: 'vat_intra', label: 'N° TVA Intracommunautaire', required: true, placeholder: 'Ex: FR 32 849203912' }
    ],
    legalNotice: 'Dispensé d\'immatriculation en application de l\'article L. 123-1-1 du code de commerce.',
    fecExportSupported: true,
    facturXSupported: true,
    chartOfAccountsType: 'pcg_france'
  },
  MA: {
    code: 'MA',
    name: 'Maroc (المملكة المغربية)',
    flag: '🇲🇦',
    currency: 'MAD',
    currencySymbol: 'د.م.',
    currencyDecimals: 2,
    defaultLanguage: 'fr',
    accountingSystem: 'PCGM (Plan Comptable Général Marocain)',
    vatRates: [
      { rate: 20, label: 'TVA Taux Normal (20%)', code: 'TVA_20', isDefault: true },
      { rate: 14, label: 'TVA Prestations / BTP (14%)', code: 'TVA_14' },
      { rate: 10, label: 'TVA Tourisme / Restauration (10%)', code: 'TVA_10' },
      { rate: 7, label: 'TVA Produits de base (7%)', code: 'TVA_07' },
      { rate: 0, label: 'Exonéré (0%)', code: 'TVA_0' }
    ],
    mandatoryFields: [
      { key: 'ice', label: 'ICE (Identifiant Commun de l\'Entreprise)', required: true, pattern: '^[0-9]{15}$', placeholder: 'Ex: 001234567000089' },
      { key: 'identifiant_fiscal', label: 'Identifiant Fiscal (IF)', required: true, placeholder: 'Ex: 12345678' },
      { key: 'rc', label: 'Registre de Commerce (RC)', required: true, placeholder: 'Ex: Casablanca 123456' },
      { key: 'patente', label: 'Taxe Professionnelle (Patente)', required: false, placeholder: 'Ex: 34567890' }
    ],
    legalNotice: 'Facture conforme à l\'article 145 du Code Général des Impôts marocain.',
    chartOfAccountsType: 'pcgm_morocco'
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    currencyDecimals: 2,
    defaultLanguage: 'en',
    accountingSystem: 'US GAAP',
    vatRates: [
      { rate: 0, label: 'Standard (Sales Tax Calculated by State)', code: 'SALES_TAX_0', isDefault: true },
      { rate: 8.875, label: 'New York City Sales Tax (8.875%)', code: 'NYC_TAX' },
      { rate: 7.25, label: 'California Base Sales Tax (7.25%)', code: 'CA_TAX' },
      { rate: 6.25, label: 'Texas Sales Tax (6.25%)', code: 'TX_TAX' }
    ],
    mandatoryFields: [
      { key: 'ein', label: 'Federal Tax ID (EIN)', required: true, pattern: '^[0-9]{2}-[0-9]{7}$', placeholder: 'Ex: 12-3456789' },
      { key: 'state_reg', label: 'State Registration / Entity ID', required: false, placeholder: 'Ex: DE-123456' }
    ],
    legalNotice: 'Invoiced in accordance with US Commercial Law and IRS reporting standards.',
    chartOfAccountsType: 'us_gaap'
  },
  DE: {
    code: 'DE',
    name: 'Deutschland',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyDecimals: 2,
    defaultLanguage: 'de',
    accountingSystem: 'GoBD / SKR03 / SKR04',
    vatRates: [
      { rate: 19, label: 'Regulärer Steuersatz (19% MwSt)', code: 'MWST_19', isDefault: true },
      { rate: 7, label: 'Ermäßigter Steuersatz (7% MwSt)', code: 'MWST_07' },
      { rate: 0, label: 'Steuerfrei (0%)', code: 'MWST_0' }
    ],
    mandatoryFields: [
      { key: 'ust_idnr', label: 'USt-IdNr. (Umsatzsteuer-ID)', required: true, placeholder: 'Ex: DE 123456789' },
      { key: 'steuernummer', label: 'Steuernummer', required: true, placeholder: 'Ex: 12/345/67890' },
      { key: 'handelsregister', label: 'Handelsregister (HRB)', required: true, placeholder: 'Ex: HRB 123456 Amtsgericht Berlin' }
    ],
    legalNotice: 'Rechnungserstellung gemäß § 14 UStG und GoBD-zertifizierte Unveränderbarkeit.',
    datevExportSupported: true,
    chartOfAccountsType: 'skr03_germany'
  },
  CH: {
    code: 'CH',
    name: 'Schweiz / Suisse / Svizzera',
    flag: '🇨🇭',
    currency: 'CHF',
    currencySymbol: 'CHF',
    currencyDecimals: 2,
    defaultLanguage: 'fr',
    accountingSystem: 'Swiss GAAP FER',
    vatRates: [
      { rate: 8.1, label: 'Taux normal (8.1%)', code: 'TVA_81', isDefault: true },
      { rate: 2.6, label: 'Taux réduit alimentation (2.6%)', code: 'TVA_26' },
      { rate: 3.8, label: 'Taux spécial hébergement (3.8%)', code: 'TVA_38' },
      { rate: 0, label: 'Exonéré (0%)', code: 'TVA_0' }
    ],
    mandatoryFields: [
      { key: 'ide_che', label: 'Numéro IDE/UID (CHE)', required: true, placeholder: 'Ex: CHE-123.456.789 TVA' },
      { key: 'qr_iban', label: 'QR-IBAN Suisse', required: true, placeholder: 'Ex: CH44 3199 9123 0008 8901 2' }
    ],
    qrBillSupported: true,
    legalNotice: 'Facture conforme aux normes de la QR-Facture suisse (Swiss QR-Bill).',
    chartOfAccountsType: 'swiss_sme'
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates (الإمارات)',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyDecimals: 2,
    defaultLanguage: 'ar',
    accountingSystem: 'FTA VAT Standard / IFRS',
    vatRates: [
      { rate: 5, label: 'Standard VAT (5%)', code: 'VAT_5', isDefault: true },
      { rate: 0, label: 'Zero-rated (0%)', code: 'VAT_0' }
    ],
    mandatoryFields: [
      { key: 'trn', label: 'Tax Registration Number (TRN)', required: true, pattern: '^[0-9]{15}$', placeholder: 'Ex: 100234567800003' },
      { key: 'trade_license', label: 'Commercial Trade License', required: true, placeholder: 'Ex: CN-1234567' }
    ],
    legalNotice: 'Tax Invoice issued pursuant to UAE Federal Decree-Law No. (8) on VAT.',
    zatcaPhase2Supported: false,
    chartOfAccountsType: 'uae_standard'
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia (المملكة العربية السعودية)',
    flag: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    currencyDecimals: 2,
    defaultLanguage: 'ar',
    accountingSystem: 'SOCPA / ZATCA FATOORA Phase 2',
    vatRates: [
      { rate: 15, label: 'Standard VAT (15%)', code: 'VAT_15', isDefault: true },
      { rate: 0, label: 'Zero-rated (0%)', code: 'VAT_0' }
    ],
    mandatoryFields: [
      { key: 'vat_number', label: 'ZATCA VAT Number', required: true, pattern: '^[0-9]{15}$', placeholder: 'Ex: 310123456700003' },
      { key: 'cr_number', label: 'Commercial Register (CR)', required: true, placeholder: 'Ex: 1010123456' }
    ],
    zatcaPhase2Supported: true,
    legalNotice: 'فاتورة ضريبية إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA - المرحلة الثانية).',
    chartOfAccountsType: 'saudi_socpa'
  }
};

// Taux de change indicatifs temps réel (Devise pivot: EUR)
const DEFAULT_EXCHANGE_RATES = {
  EUR: 1.0,
  DZD: 145.20, // Taux Dinar Algérien officiel
  TND: 3.38,   // Taux Dinar Tunisien
  USD: 1.085,  // Taux Dollar US
  GBP: 0.855,  // Taux Livre Sterling
  CHF: 0.955,  // Taux Franc Suisse
  CAD: 1.485,  // Taux Dollar Canadien
  MAD: 10.82,  // Taux Dirham Marocain
  AED: 3.985,  // Taux Dirham Émirati
  SAR: 4.070   // Taux Riyal Saoudien
};

module.exports = {
  FISCAL_PACKAGES,
  DEFAULT_EXCHANGE_RATES
};
