const { cloudinary } = require('../config/cloudinary');

/**
 * Delete a single image from Cloudinary
 * @param {string} public_id - The Cloudinary public ID of the image to delete
 */
const deleteImage = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id);
    console.log(`🗑️ Deleted image from Cloudinary: ${public_id}`);
  } catch (error) {
    console.error(`❌ Error deleting image from Cloudinary (${public_id}):`, error.message);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} public_ids - Array of Cloudinary public IDs to delete
 */
const deleteMultipleImages = async (public_ids) => {
  if (!public_ids || !public_ids.length) return;
  try {
    // Cloudinary supports deleting up to 100 resources at once
    await cloudinary.api.delete_resources(public_ids);
    console.log(`🗑️ Deleted ${public_ids.length} images from Cloudinary`);
  } catch (error) {
    console.error(`❌ Error deleting multiple images from Cloudinary:`, error.message);
  }
};

module.exports = {
  deleteImage,
  deleteMultipleImages
};
