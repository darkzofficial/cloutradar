export const metadata = { title: 'Privacy' };

// DRAFT: have a solicitor or privacy specialist review before launch.
export default function Privacy() {
  return (
    <div className="wrap">
      <article className="prose">
        <div className="eyebrow">Last updated: November 2026</div>
        <h1>Privacy policy</h1>
        <p>This policy explains what CloutRadar collects and why, under UK GDPR.</p>
        <h2>What we collect</h2>
        <ul>
          <li><b>Your email address</b>, to sign you in and send account emails.</li>
          <li><b>Your scans</b>: the TikTok username and numbers you enter, and the resulting report, so you can see your history.</li>
          <li><b>Billing details</b> for Pro, handled by Stripe. We never see or store your full card number.</li>
        </ul>
        <h2>What we don&apos;t do</h2>
        <p>We don&apos;t connect to TikTok, collect data from it, or sell your data. Scans are private to your account.</p>
        <h2>Who processes data for us</h2>
        <p>Supabase (database and sign-in), Stripe (payments) and our hosting provider. Each processes data only to provide its service to us.</p>
        <h2>How long we keep it</h2>
        <p>We keep your account and scans until you delete them or close your account. Billing records are kept as long as UK tax law requires.</p>
        <h2>Your rights</h2>
        <p>You can ask for a copy of your data, ask us to correct or delete it, or complain to the Information Commissioner&apos;s Office (ico.org.uk).</p>
      </article>
    </div>
  );
}
