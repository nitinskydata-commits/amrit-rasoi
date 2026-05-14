import React from 'react';
import { useSelector } from 'react-redux';
import './PolicyPages.css';

const LAST_UPDATED = 'May 14, 2026';

const ShippingPolicy = () => {
  const { settings } = useSelector((state) => state.settings);
  return (
    <main className="policy-page">
      <div className="container policy-wrap">
        <article className="policy-article" aria-labelledby="policy-shipping-title">
          <header className="policy-article-header">
            <h1 id="policy-shipping-title">Shipping Policy</h1>
            <p className="policy-effective">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="policy-prose">
            <section>
              <h2>1. Shipping coverage</h2>
              <p>
                We ship to locations across India as shown at checkout. Coverage may change; the
                checkout page is the source of truth for your address.
              </p>
            </section>

            <section>
              <h2>2. Shipping charges</h2>
              <p>
                Shipping charges depend on order value, weight, and destination. Typical rules:
              </p>
              <ul>
                <li><strong>Orders above ₹999:</strong> free standard shipping where offered</li>
                <li><strong>Orders below ₹999:</strong> a flat shipping fee may apply</li>
                <li>Express or priority options, if available, are shown at checkout</li>
              </ul>
            </section>

            <section>
              <h2>3. Delivery timeline</h2>
              <ul>
                <li><strong>Order processing:</strong> usually 1–2 business days</li>
                <li><strong>Transit:</strong> typically 3–7 business days depending on location</li>
                <li>Deliveries are often made between 9 AM and 7 PM, Monday through Saturday</li>
              </ul>
            </section>

            <section>
              <h2>4. Order tracking</h2>
              <p>
                When your order ships, you should receive tracking details by email or SMS when
                provided. You can also check status in <strong>My Orders</strong> when logged in.
              </p>
            </section>

            <section>
              <h2>5. Packaging</h2>
              <p>
                Products are packed to reduce damage in transit. We use food-safe packaging where
                applicable.
              </p>
            </section>

            <section>
              <h2>6. Carriers</h2>
              <p>
                We may use established courier partners. The carrier for your shipment is identified
                in your tracking communication.
              </p>
            </section>

            <section>
              <h2>7. Delivery issues</h2>
              <p>If your package arrives damaged or you have a delivery problem, contact us:</p>
              <p>
                <strong>Email:</strong> {settings?.supportEmail || '—'}<br />
                <strong>Phone:</strong> {settings?.supportPhone || '—'}
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default ShippingPolicy;
