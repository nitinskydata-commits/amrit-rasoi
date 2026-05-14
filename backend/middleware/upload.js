const multer = require('multer');
const { storage } = require('../config/cloudinary');

const path = require('path');

// File filter (optional redundancy, as CloudinaryStorage also handles formats)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log(`📂 Upload Attempt: ${file.originalname} | Mime: ${file.mimetype} | Ext: ${path.extname(file.originalname)}`);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    console.error(`❌ Upload Rejected: Mime: ${mimetype}, Ext: ${extname}`);
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB for high-res spices images
  fileFilter: fileFilter
});

module.exports = upload;
