import Link from 'next/link';
import Report from '@/components/Report';
import Pricing from '@/components/Pricing';
import { exampleFree, examplePro } from '@/lib/example';
import { getSession, freeLimit } from '@/lib/account';

export default async function Home() {
  const { user, pro } = await getSession();
  const free = exampleFree();
  const full = examplePro();
  return (
    <>
      <div className="wrap">
        <header className="hero">
          <div>
            <div className="eyebrow">TikTok engagement check</div>
            <h1>Are those followers <em>real?</em></h1>
            <p>
              Paste a TikTok username or video link and the numbers from the profile. CloutRadar compares followers, views, likes and
              comments and flags the patterns that bought followers and bot likes leave behind.
            </p>
            <div className="cta">
              <Link className="btn primary big" href={user ? '/scan' : '/login?next=/scan'}>Scan an account</Link>
              <Link className="btn" href="#sample">See a sample report</Link>
            </div>
            <p className="mono" style={{ fontSize: 12, color: 'var(--dim)' }}>{freeLimit()} free scans a month. No card needed.</p>
          </div>
          <div className="scope" aria-hidden="true"><div className="sweep" /><i className="blip b1" /><i className="blip b2" /><i className="blip b3" /></div>
        </header>

        <section className="section" id="sample">
          <div className="eyebrow">Sample reports</div>
          <h2>Free scan vs Pro report</h2>
          <p>Both reports below use the same made-up account. Pro runs three extra checks and compares the numbers with accounts of a similar size.</p>
          <div className="two">
            <section className="panel"><Report result={free} label="example" /></section>
            <section className="panel"><Report result={full} label="example" /></section>
          </div>
        </section>

        <section className="section" id="how">
          <div className="eyebrow">Method</div>
          <h2>How the score works</h2>
          <p>
            Bought followers rarely watch anything, and bought likes rarely comment. That leaves gaps between the numbers on a profile.
            CloutRadar checks each ratio against typical ranges for TikTok. Each warning sign adds points to the score: a strong sign counts double.
          </p>
          <div className="tablewrap">
            <table className="wide">
              <thead><tr><th>Signal</th><th>What it compares</th><th>Typical</th><th>Warning</th><th>Strong warning</th><th>Plan</th></tr></thead>
              <tbody>
                <tr><td>Views reach</td><td>Median views per video ÷ followers</td><td className="m">over 5%</td><td className="m warnc">2–5%</td><td className="m badc">under 2%</td><td className="m">Free</td></tr>
                <tr><td>Like rate</td><td>Likes ÷ views on recent videos</td><td className="m">2–15%</td><td className="m warnc">15–25%</td><td className="m badc">over 25%</td><td className="m">Free</td></tr>
                <tr><td>Comment depth</td><td>Comments per 1,000 likes</td><td className="m">5 or more</td><td className="m warnc">2–5</td><td className="m badc">under 2</td><td className="m">Free</td></tr>
                <tr><td>Likes vs followers</td><td>Profile likes ÷ followers</td><td className="m">over 3×</td><td className="m warnc">1–3×</td><td className="m badc">under 1×</td><td className="m">Free</td></tr>
                <tr><td>Follow-back pattern</td><td>Following ÷ followers, past 1,000 follows</td><td className="m">under 0.3</td><td className="m warnc">0.3–0.8</td><td className="m badc">over 0.8</td><td className="m">Free</td></tr>
                <tr><td>Uneven likes</td><td>Top video&apos;s like rate vs the rest</td><td className="m">under 3×</td><td className="m warnc">3–5×</td><td className="m badc">5× or more</td><td className="m">Free</td></tr>
                <tr><td>Share rate</td><td>Shares per 1,000 likes</td><td className="m">4 or more</td><td className="m warnc">1–4</td><td className="m badc">under 1</td><td className="m">Pro</td></tr>
                <tr><td>Follower growth</td><td>New followers a day ÷ average views</td><td className="m">under 15%</td><td className="m warnc">15–50%</td><td className="m badc">over 50%</td><td className="m">Pro</td></tr>
                <tr><td>Comment quality</td><td>Emoji-only, generic and repeated comments</td><td className="m">under 35%</td><td className="m warnc">35–60%</td><td className="m badc">over 60%</td><td className="m">Pro</td></tr>
              </tbody>
            </table>
          </div>
          <p>Pro also adjusts the views and like-rate thresholds to the account&apos;s size, since big accounts naturally reach a smaller share of their followers.</p>
        </section>

        <section className="section" id="pricing">
          <div className="eyebrow">Pricing</div>
          <h2>Start free, go Pro when you need more</h2>
          <Pricing signedIn={!!user} pro={pro} />
        </section>

        <section className="section">
          <h2>Questions</h2>
          <div className="faq">
            <details><summary>Does CloutRadar connect to TikTok?</summary><p>No. You type in the numbers shown on the profile and videos. CloutRadar never logs in to TikTok or collects data from it.</p></details>
            <details><summary>Does a high score prove an account bought followers?</summary><p>No. It means the numbers match patterns that bought engagement usually leaves. Viral videos, giveaways, deleted videos and niche audiences can look similar. Use the score as a reason to look closer, not as a verdict.</p></details>
            <details><summary>How do I cancel Pro?</summary><p>Go to Account and press Manage billing. You can cancel there and keep Pro until the end of the period you&apos;ve paid for.</p></details>
            <details><summary>When do free scans reset?</summary><p>On the 1st of every month.</p></details>
          </div>
        </section>
      </div>
    </>
  );
}
