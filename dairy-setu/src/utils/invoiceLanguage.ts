export type InvoiceLanguage = 'hinglish' | 'english' | 'hindi';

const KEY = 'invoice-language';

export function getInvoiceLanguage(): InvoiceLanguage {
  const val = localStorage.getItem(KEY);
  if (val === 'english' || val === 'hindi' || val === 'hinglish') return val;
  return 'hinglish';
}

export function setInvoiceLanguage(language: InvoiceLanguage) {
  localStorage.setItem(KEY, language);
}
