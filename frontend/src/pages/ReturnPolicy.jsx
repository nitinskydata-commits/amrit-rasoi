import React from 'react';
import { useSelector } from 'react-redux';
import './PolicyPages.css';

const LAST_UPDATED = 'May 14, 2026';

const ReturnPolicy = () => {
  const { settings } = useSelector((state) => state.settings);
  return (
    <main className="policy-page">
      <div className="container policy-wrap">
        <article className="policy-article" aria-labelledby="policy-returns-title">
          <header className="policy-article-header">
            <h1 id="policy-returns-title">Return &amp; Refund Policy</h1>
            <p className="policy-effective">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="policy-prose">
            <section>
              <h2>1. Return eligibility</h2>
              <p>
                We want you to be satisfied with your purchase. You may return most items within{' '}
                <strong>7 days</strong> of delivery for a refund or exchange, subject to the rules below.
              </p>
              <p><strong>Items typically eligible for return:</strong></p>
              <ul>
                <li>Unopened and unused products in original packaging</li>
                <li>Products with manufacturing defects</li>
                <li>Damaged products received</li>
                <li>Wrong products delivered</li>
              </ul>
            </section>

            <section>
              <h2>2. Non-returnable items</h2>
              <p>The following items cannot be returned:</p>
              <ul>
                <li>Opened food products (for safety and hygiene reasons)</li>
                <li>Products without original packaging</li>
                <li>Products damaged due to misuse</li>
                <li>Custom or personalized orders</li>
              </ul>
            </section>

            <section>
              <h2>3. How to return</h2>
              <p><strong>Step 1:</strong> Contact customer support within 7 days of delivery</p>
              <ul>
                <li>Email: {settings?.supportEmail || '—'}</li>
                <li>Phone: {settings?.supportPhone || '—'}</li>
              </ul>
              <p><strong>Step 2:</strong> Provide your order number and reason for return</p>
              <p><strong>Step 3:</strong> Our team will verify and approve your return request</p>
              <p><strong>Step 4:</strong> Pack the product securely in original packaging</p>
              <p><strong>Step 5:</strong> Our courier partner will pick up the product where applicable</p>
            </section>

            <section>
              <h2>4. Refund process</h2>
              <ul>
                <li>Refunds are typically processed within 5–7 business days after we receive the returned item</li>
                <li>Refunds are credited to the original payment method when possible</li>
                <li>Shipping charges may be non-refundable except for damaged or incorrect items</li>
                <li>You will receive an email confirmation when the refund is processed</li>
              </ul>
            </section>

            <section>
              <h2>5. Exchanges</h2>
              <p>If you would like to exchange a product for a different variant or product:</p>
              <ul>
                <li>Follow the same return process and mention &quot;Exchange&quot; in your request</li>
                <li>The replacement will be shipped once we receive the original item, subject to availability</li>
              </ul>
            </section>

            <section>
              <h2>6. Damaged or defective products</h2>
              <p>If you receive a damaged or defective product:</p>
              <ul>
                <li>Contact us promptly with photos of the product and packaging</li>
                <li>We will arrange pickup and replacement or refund as appropriate</li>
              </ul>
            </section>

            <section>
              <h2>7. Cancellations</h2>
              <p>You can cancel your order before it is shipped:</p>
              <ul>
                <li>Use <strong>My Orders</strong> in your account when cancellation is available</li>
                <li>Refunds for eligible cancellations are processed within a few business days</li>
                <li>Orders generally cannot be cancelled once shipped</li>
              </ul>
            </section>

            <section>
              <h2>8. Contact</h2>
              <p>For questions about returns or refunds:</p>
              <p>
                <strong>Email:</strong> {settings?.supportEmail || '—'}<br />
                <strong>Phone:</strong> {settings?.supportPhone || '—'}<br />
                <strong>Hours:</strong> Monday–Saturday, 9 AM – 6 PM IST
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default ReturnPolicy;
