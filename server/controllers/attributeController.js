const ProductAttribute = require('../models/ProductAttribute');

// Get all attributes (optionally filter by category)
exports.getAttributes = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    
    if (category) {
      query.$or = [
        { isGlobal: true },
        { categories: category }
      ];
    }
    
    const attributes = await ProductAttribute.find(query).sort({ displayOrder: 1 });
    res.json({ success: true, attributes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create attribute
exports.createAttribute = async (req, res) => {
  try {
    const attribute = await ProductAttribute.create(req.body);
    res.status(201).json({ success: true, attribute });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update attribute
exports.updateAttribute = async (req, res) => {
  try {
    const attribute = await ProductAttribute.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    res.json({ success: true, attribute });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete attribute
exports.deleteAttribute = async (req, res) => {
  try {
    const attribute = await ProductAttribute.findByIdAndDelete(req.params.id);
    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
