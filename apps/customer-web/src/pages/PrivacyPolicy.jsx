import React from 'react';
import { useSelector } from 'react-redux';
import './PolicyPages.css';

const LAST_UPDATED = 'May 14, 2026';

const PrivacyPolicy = () => {
  const { settings } = useSelector((state) => state.settings);
  return (
    <main className="policy-page">
      <div className="container policy-wrap">
        <article className="policy-article" aria-labelledby="policy-privacy-title">
          <header className="policy-article-header">
            <h1 id="policy-privacy-title">Privacy Policy</h1>
            <p className="policy-effective">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="policy-prose">
            <section>
              <h2>1. Information we collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Name, email address, phone number, and delivery address</li>
                <li>Payment information (processed securely through our payment partners)</li>
                <li>Order history and preferences</li>
                <li>Communication preferences and feedback</li>
              </ul>
            </section>

            <section>
              <h2>2. How we use your information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and account</li>
                <li>Improve our products and services</li>
                <li>Send you promotional offers (with your consent)</li>
                <li>Protect against fraud and unauthorized transactions</li>
              </ul>
            </section>

            <section>
              <h2>3. Information sharing</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your
                information with:
              </p>
              <ul>
                <li>Delivery partners to fulfill your orders</li>
                <li>Payment processors to handle transactions securely</li>
                <li>Service providers who help us operate our business</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section>
              <h2>4. Data security</h2>
              <p>
                We implement appropriate security measures to protect your personal information.
                However, no method of transmission over the internet is completely secure, and we cannot
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2>5. Your rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and associated data, where applicable</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2>6. Cookies</h2>
              <p>
                We use cookies to enhance your browsing experience, analyze site traffic, and
                personalize content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2>7. Children&apos;s privacy</h2>
              <p>
                Our services are not directed to children under 18. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2>8. Contact</h2>
              <p>If you have questions about this Privacy Policy:</p>
              <p>
                <strong>Email:</strong> {settings?.supportEmail || '—'}<br />
                <strong>Phone:</strong> {settings?.supportPhone || '—'}<br />
                <strong>Address:</strong> {settings?.companyAddress || '—'}
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
