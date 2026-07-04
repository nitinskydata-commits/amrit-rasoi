import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProducts } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import './Home.css';
import './NewArrivals.css';

const NewArrivals = () => {
  const dispatch = useDispatch();
  const { products, loading, totalProducts } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(
      getProducts({
        keyword: '',
        category: '',
        page: 1,
        sort: '',
        minPrice: '',
        maxPrice: '',
        newArrivals: true,
        limit: 48
      })
    );
  }, [dispatch]);

  return (
    <div className="home">
      <section className="products-section" style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="section-title">New Arrivals</h1>
              <p className="results-count">
                {loading ? 'Loading…' : `${totalProducts} product${totalProducts === 1 ? '' : 's'} — curated in admin`}
              </p>
              <p style={{ fontSize: '14px', color: '#565959', marginTop: '8px' }}>
                Products appear here when an admin enables <strong>New Arrivals</strong> on them.
              </p>
            </div>
            <Link to="/" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              ← Back to home
            </Link>
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="spinner" />
              <p className="loading-text">Loading new arrivals…</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🆕</div>
              <h3>No new arrivals yet</h3>
              <p>Ask your admin to mark products under New Arrivals in the product editor.</p>
              <Link to="/" className="btn btn-primary">
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NewArrivals;
