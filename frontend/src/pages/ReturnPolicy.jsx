import React from 'react';
import './PolicyPages.css';

const ReturnPolicy = () => {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <h1>Return & Refund Policy</h1>
        <p>Last updated: February 8, 2026</p>
      </div>

      <div className="container">
        <div className="policy-content">
          <section>
            <h2>1. Return Eligibility</h2>
            <p>
              We want you to be completely satisfied with your purchase. You may return most items
              within <strong>7 days</strong> of delivery for a full refund or exchange.
            </p>
            <p><strong>Items eligible for return:</strong></p>
            <ul>
              <li>Unopened and unused products in original packaging</li>
              <li>Products with manufacturing defects</li>
              <li>Damaged products received</li>
              <li>Wrong products delivered</li>
            </ul>
          </section>

          <section>
            <h2>2. Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul>
              <li>Opened food products (for safety and hygiene reasons)</li>
              <li>Products without original packaging</li>
              <li>Products damaged due to misuse</li>
              <li>Custom or personalized orders</li>
            </ul>
          </section>

          <section>
            <h2>3. How to Return</h2>
            <p><strong>Step 1:</strong> Contact our customer support within 7 days of delivery</p>
            <ul>
              <li>Email: returns@sbmi.com</li>
              <li>Phone: +91 98765 43210</li>
              <li>WhatsApp: +91 98765 43210</li>
            </ul>
            <p><strong>Step 2:</strong> Provide your order number and reason for return</p>
            <p><strong>Step 3:</strong> Our team will verify and approve your return request</p>
            <p><strong>Step 4:</strong> Pack the product securely in original packaging</p>
            <p><strong>Step 5:</strong> Our courier partner will pick up the product</p>
          </section>

          <section>
            <h2>4. Refund Process</h2>
            <ul>
              <li>Refunds will be processed within 5-7 business days after receiving the returned item</li>
              <li>Refunds will be credited to the original payment method</li>
              <li>Shipping charges are non-refundable (except for damaged/wrong items)</li>
              <li>You will receive an email confirmation when the refund is processed</li>
            </ul>
          </section>

          <section>
            <h2>5. Exchanges</h2>
            <p>
              If you'd like to exchange a product for a different size, variant, or product:
            </p>
            <ul>
              <li>Follow the same return process mentioned above</li>
              <li>Mention "Exchange" in your request</li>
              <li>The replacement will be shipped once we receive the original item</li>
              <li>No additional shipping charges for exchanges (valid reasons only)</li>
            </ul>
          </section>

          <section>
            <h2>6. Damaged or Defective Products</h2>
            <p>
              If you receive a damaged or defective product:
            </p>
            <ul>
              <li>Contact us immediately with photos of the product</li>
              <li>We will arrange a free pickup and replacement</li>
              <li>No questions asked - customer satisfaction is our priority</li>
            </ul>
          </section>

          <section>
            <h2>7. Cancellations</h2>
            <p>
              You can cancel your order before it's shipped:
            </p>
            <ul>
              <li>Go to "My Orders" in your account</li>
              <li>Click "Cancel Order"</li>
              <li>Full refund will be processed within 3-5 business days</li>
              <li>Orders cannot be cancelled once shipped</li>
            </ul>
          </section>

          <section>
            <h2>8. Contact Us</h2>
            <p>
              For any questions about returns or refunds:
            </p>
            <p>
              <strong>Email:</strong> returns@sbmi.com<br />
              <strong>Phone:</strong> +91 98765 43210<br />
              <strong>WhatsApp:</strong> +91 98765 43210<br />
              <strong>Hours:</strong> Monday-Saturday, 9 AM - 6 PM IST
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
