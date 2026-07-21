import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: "Privacy Policy - noryX",
  description: "How noryX handles information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title='Privacy Policy' description='How noryX handles information when you use our AI-powered knowledge service.' updated='21 July 2026'>
      <section>
        <h2>1. Who we are</h2>
        <p>noryX is an AI-powered knowledge service operated from Gujarat, India. In this policy, “noryX,” “we,” “us,” and “our” refer to the operator of the noryX website and service.</p>
      </section>
      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Google account information:</strong> when you sign in with Google, we receive your Google account identifier, name, email address, and profile image. We do not receive your Google password.</li>
          <li><strong>Content you provide:</strong> links you save, collection names and descriptions, profile details, connection activity, and content you choose to share with collaborators.</li>
          <li><strong>Generated knowledge data:</strong> webpage text and metadata obtained from saved public links, plus AI-generated titles, summaries, takeaways, tags, and search embeddings.</li>
          <li><strong>Technical data:</strong> authentication and session data, basic request and error logs, and device preferences such as theme or sidebar state stored in your browser.</li>
          <li><strong>Support communications:</strong> information you send when you contact us for help or make a privacy request.</li>
        </ul>
      </section>
      <section>
        <h2>3. How we use information</h2>
        <p>We use information to create and secure your account; save, organize, summarize, and search your content; enable collaboration; operate and protect the service; respond to requests; and comply with applicable law.</p>
      </section>
      <section>
        <h2>4. Google user data</h2>
        <p>noryX uses Google OAuth only to authenticate you and obtain the basic profile information described above. We do not request access to your Gmail, Google Drive files, contacts, calendar, or Google password. We use Google account data to create your account, display your profile, maintain your session, and handle account or support matters.</p>
        <p>We do not sell Google user data, use it for advertising, or allow humans to read it except when necessary for security, support with your permission, legal compliance, or operating the service.</p>
      </section>
      <section>
        <h2>5. How information is shared</h2>
        <ul>
          <li><strong>Service providers:</strong> Supabase provides authentication and database infrastructure; Google provides OAuth authentication and Gemini AI processing.</li>
          <li><strong>People you choose:</strong> profile and collection data may be visible to users you connect or collaborate with, based on actions you take in noryX.</li>
          <li><strong>Legal and safety reasons:</strong> we may disclose information when reasonably necessary to comply with law or protect users, the public, or the service.</li>
          <li><strong>Business changes:</strong> information may be transferred as part of a merger, acquisition, financing, or sale, subject to applicable law.</li>
        </ul>
        <p>We do not sell or rent your personal information.</p>
      </section>
      <section>
        <h2>6. AI processing</h2>
        <p>When you ask noryX to analyze a saved link, its extracted public content is sent to Google Gemini to create summaries, tags, takeaways, and embeddings. Do not submit confidential, sensitive, or unlawfully obtained information. AI output can be inaccurate, so you should review it before relying on it.</p>
      </section>
      <section>
        <h2>7. Cookies and local storage</h2>
        <p>We use essential cookies or similar storage to keep you signed in, protect your session, remember interface preferences, and operate the service. We do not currently use this information for targeted advertising.</p>
      </section>
      <section>
        <h2>8. Retention and deletion</h2>
        <p>We keep account information and saved content while your account is active or as needed to provide the service. You can delete individual saved items and collections through the product. To request account deletion or deletion of other personal information, email <a href='mailto:trushilpatel27123@gmail.com'>trushilpatel27123@gmail.com</a>. Some information may remain temporarily in backups or be retained for security, fraud prevention, dispute resolution, or legal compliance.</p>
      </section>
      <section>
        <h2>9. Your choices and rights</h2>
        <p>Subject to applicable law, you may ask to access, correct, update, or delete your personal information, withdraw consent, or raise a grievance. You may also revoke noryX’s Google access through your Google Account permissions. Email <a href='mailto:trushilpatel27123@gmail.com'>trushilpatel27123@gmail.com</a>. We may need to verify your identity before completing a request.</p>
      </section>
      <section>
        <h2>10. Security and international processing</h2>
        <p>We use reasonable technical and organizational safeguards designed to protect information. No online service can guarantee absolute security. Our providers may process information outside your state or country, subject to their safeguards and applicable law.</p>
      </section>
      <section>
        <h2>11. Children</h2>
        <p>noryX is not intended for anyone under 18, and we do not knowingly collect personal information from children. If you believe a child has provided information, contact us so we can review and delete it.</p>
      </section>
      <section>
        <h2>12. Changes and contact</h2>
        <p>We may update this policy as the service or law changes. We will post the revised policy here and update the date above. For questions, privacy requests, or grievances, contact <a href='mailto:trushilpatel27123@gmail.com'>trushilpatel27123@gmail.com</a>.</p>
      </section>
    </LegalPage>
  );
}
