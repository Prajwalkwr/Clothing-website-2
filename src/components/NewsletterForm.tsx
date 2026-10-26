import { useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!consent) { setStatus({ message: 'Please confirm that you would like to receive email updates.', kind: 'error' }); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || 'We could not complete your subscription. Please try again.');
      setStatus({ message: result.message || 'You’re on the list. Look out for a note from us.', kind: 'success' });
      setEmail('');
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : 'Please try again later.', kind: 'error' });
    } finally { setBusy(false); }
  };

  return <form className={`newsletter-form ${compact ? 'newsletter-compact' : ''}`} onSubmit={submit}>
    <label className="sr-only" htmlFor={compact ? 'newsletter-email-footer' : 'newsletter-email'}>Email address</label>
    <div className="newsletter-field"><input id={compact ? 'newsletter-email-footer' : 'newsletter-email'} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required autoComplete="email" /><button type="submit" disabled={busy}>{busy ? 'Joining…' : compact ? <ArrowRight size={18} /> : 'Subscribe'}</button></div>
    {!compact && <label className="consent-label"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to receive occasional updates from AAVARAN. I can unsubscribe at any time.</span></label>}
    {compact && <label className="consent-label"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Send me collection notes and early access updates.</span></label>}
    {status && <p className={`newsletter-status ${status.kind}`} role="status">{status.kind === 'success' && <Check size={15} />}{status.message}</p>}
  </form>;
}
