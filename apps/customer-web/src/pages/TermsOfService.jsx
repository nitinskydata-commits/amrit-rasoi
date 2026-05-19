import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './PolicyPages.css';

const LAST_UPDATED = 'May 14, 2026';

const TermsOfService = () => {
  const { settings } = useSelector((state) => state.settings);
  return (
    <main className="policy-page">
      <div className="container policy-wrap">
        <article className="policy-article" aria-labelledby="policy-terms-title">
          <header className="policy-article-header">
            <h1 id="policy-terms-title">Terms of Service</h1>
            <p className="policy-effective">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="policy-prose">
            <section>
              <h2>1. Acceptance of terms</h2>
              <p>
                By accessing and using SBMI - Amrit Rasoi&apos;s website and services, you accept and
                agree to be bound by these Terms of Service. If you do not agree, please do not use our
                services.
              </p>
            </section>

            <section>
              <h2>2. Use of services</h2>
              <p>You agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not engage in fraudulent activities</li>
                <li>Not interfere with the proper functioning of our website</li>
              </ul>
            </section>

            <section>
              <h2>3. Product information</h2>
              <p>
                We strive to provide accurate product descriptions and images. However, we do not
                warrant that product descriptions, images, or other content are accurate, complete, or
                error-free.
              </p>
            </section>

            <section>
              <h2>4. Pricing and payment</h2>
              <ul>
                <li>All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise</li>
                <li>We reserve the right to change prices without prior notice</li>
                <li>Payment must be made at the time of order placement</li>
                <li>We accept payment methods as displayed at checkout</li>
              </ul>
            </section>

            <section>
              <h2>5. Orders and delivery</h2>
              <ul>
                <li>Order confirmation does not guarantee availability</li>
                <li>We reserve the right to cancel orders due to unavailability or errors</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Risk of loss passes to you upon delivery</li>
              </ul>
            </section>

            <section>
              <h2>6. Returns and refunds</h2>
              <p>
                Please refer to our{' '}
                <Link to="/returns">Return Policy</Link> for detailed information about returns,
                exchanges, and refunds.
              </p>
            </section>

            <section>
              <h2>7. Intellectual property</h2>
              <p>
                All content on this website, including text, graphics, logos, and images, is the
                property of SBMI - Amrit Rasoi and protected by applicable laws. You may not reproduce,
                distribute, or use any content without our written permission.
              </p>
            </section>

            <section>
              <h2>8. Limitation of liability</h2>
              <p>
                SBMI - Amrit Rasoi shall not be liable for any indirect, incidental, or consequential
                damages arising from the use of our products or services. Our total liability shall not
                exceed the amount paid for the specific product or service in question.
              </p>
            </section>

            <section>
              <h2>9. Governing law</h2>
              <p>
                These Terms of Service are governed by the laws of India. Any disputes shall be subject
                to the exclusive jurisdiction of courts in Punjab, India.
              </p>
            </section>

            <section>
              <h2>10. Contact</h2>
              <p>For questions about these Terms of Service:</p>
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

export default TermsOfService;
