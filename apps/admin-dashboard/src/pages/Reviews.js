import React, { useState, useEffect } from 'react';
import { getAllReviews, deleteReview, createTestimonial } from '../utils/api';
import { FaTrash, FaStar } from 'react-icons/fa';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await getAllReviews();
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTestimonial = async (review) => {
    try {
      const submitData = new FormData();
      submitData.append('customerName', review.user?.name || 'Verified Customer');
      submitData.append('rating', review.rating);
      submitData.append('review', review.comment);
      submitData.append('productName', review.product?.name || '');
      submitData.append('isApproved', true);
      submitData.append('isVisible', true);
      
      await createTestimonial(submitData);
      alert('Review successfully published as a Testimonial!');
    } catch (error) {
      console.error('Error publishing testimonial:', error);
      alert(error.response?.data?.message || 'Failed to publish testimonial');
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(reviewId);
        alert('Review deleted successfully');
        fetchReviews();
      } catch (error) {
        alert('Error deleting review');
      }
    }
  };

  if (loading) return <div className="loading">Loading reviews...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Reviews Management</h1>
        <p>Manage product reviews and ratings</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td><strong>{review.product?.name || 'N/A'}</strong></td>
                  <td>{review.user?.name || 'Anonymous'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaStar color="#FFC107" />
                      <span>{review.rating}</span>
                    </div>
                  </td>
                  <td>{review.comment}</td>
                  <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handlePublishTestimonial(review)}
                        title="Publish as Testimonial"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaStar />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(review._id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reviews.length === 0 && (
          <p className="no-data">No reviews found</p>
        )}
      </div>
    </div>
  );
};

export default Reviews;
