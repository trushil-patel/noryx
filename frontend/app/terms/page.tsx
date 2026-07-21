import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Terms of Service - noryX' };

export default function TermsPage() {
  return (
    <LegalPage title='Terms of Service' description='These terms govern your access to and use of the noryX website and service.' updated='21 July 2026'>
      <section>
        <h2>1. Acceptance</h2>
        <p>By creating an account or using noryX, you agree to these Terms and our <a href='/privacy'>Privacy Policy</a>. If you do not agree, do not use the service. You must be at least 18 years old and legally capable of entering into this agreement.</p>
      </section>
      <section>
        <h2>2. The service</h2>
        <p>noryX helps you save links, extract public webpage information, generate AI summaries and tags, search saved knowledge, organize collections, and collaborate with other users. Features may change as the product develops.</p>
      </section>
      <section>
        <h2>3. Your account</h2>
        <p>You are responsible for activity under your account and for keeping access to your Google account secure. Provide accurate information and notify us promptly if you suspect unauthorized access.</p>
      </section>
      <section>
        <h2>4. Your content and permissions</h2>
        <p>You retain ownership of content you submit. You give noryX a limited, non-exclusive permission to host, copy, process, transform, and display that content only as needed to operate, secure, and improve the service and provide features you request.</p>
        <p>You confirm that you have the rights and lawful basis needed to submit content and ask us to process it. Saving a public link does not give you ownership of the linked material.</p>
      </section>
      <section>
        <h2>5. Acceptable use</h2>
        <p>You must not use noryX to:</p>
        <ul>
          <li>break any law or infringe another person’s rights;</li>
          <li>upload malware, probe vulnerabilities, bypass access controls, or disrupt the service;</li>
          <li>scrape private or restricted content, impersonate others, or access accounts without authorization;</li>
          <li>submit illegal, abusive, deceptive, or privacy-invasive content;</li>
          <li>reverse engineer or misuse the service except where applicable law expressly allows it; or</li>
          <li>use automation that places an unreasonable load on noryX or circumvents service limits.</li>
        </ul>
      </section>
      <section>
        <h2>6. AI-generated results</h2>
        <p>AI summaries, tags, search results, and other generated output may be incomplete, inaccurate, or outdated. They are provided for general informational and organizational purposes, not as legal, medical, financial, or other professional advice. You are responsible for reviewing output before relying on or sharing it.</p>
      </section>
      <section>
        <h2>7. Third-party services and content</h2>
        <p>noryX relies on services including Google and Supabase and may link to third-party websites. Their terms and privacy practices apply to their services. We do not control third-party content, availability, or conduct and are not responsible for them.</p>
      </section>
      <section>
        <h2>8. noryX intellectual property</h2>
        <p>The service, software, branding, design, and other noryX materials are owned by us or our licensors. These Terms give you a limited, revocable, non-transferable right to use the service for its intended purpose; they do not transfer ownership of noryX intellectual property.</p>
      </section>
      <section>
        <h2>9. Plans and payment</h2>
        <p>Some features may be free, limited, or paid. If paid plans are offered, pricing, billing period, taxes, renewal, and cancellation terms shown at purchase will apply. We will not charge you unless you expressly authorize a purchase.</p>
      </section>
      <section>
        <h2>10. Availability and termination</h2>
        <p>We may modify, suspend, or discontinue features and may impose reasonable usage limits. You may stop using noryX at any time. We may restrict access if you materially violate these Terms, create security or legal risk, or misuse the service. To request account deletion, email <a href='mailto:trushilpatel27123@gmail.com'>trushilpatel27123@gmail.com</a>.</p>
      </section>
      <section>
        <h2>11. Disclaimers</h2>
        <p>To the maximum extent permitted by law, noryX is provided “as is” and “as available.” We do not guarantee uninterrupted operation, that all content can be extracted, that AI output will be accurate, or that saved third-party content will remain available. Nothing in these Terms excludes rights that cannot lawfully be excluded.</p>
      </section>
      <section>
        <h2>12. Limitation of liability</h2>
        <p>To the maximum extent permitted by law, noryX and its operator will not be liable for indirect, incidental, special, consequential, or punitive loss, or for loss of data, profits, revenue, goodwill, or business opportunity. Our aggregate liability for a claim will not exceed the greater of the amount you paid to noryX in the six months before the event or INR 1,000. This does not limit liability that cannot legally be limited.</p>
      </section>
      <section>
        <h2>13. Governing law</h2>
        <p>These Terms are governed by the laws of India. Subject to mandatory consumer rights or a dispute forum required by law, courts with jurisdiction in Gujarat, India will have exclusive jurisdiction over disputes relating to these Terms or the service.</p>
      </section>
      <section>
        <h2>14. Changes and contact</h2>
        <p>We may update these Terms as noryX changes. We will post the revised version here and update the date above. Continued use after an update means you accept the revised Terms to the extent permitted by law. Questions can be sent to <a href='mailto:trushilpatel27123@gmail.com'>trushilpatel27123@gmail.com</a>.</p>
      </section>
    </LegalPage>
  );
}
