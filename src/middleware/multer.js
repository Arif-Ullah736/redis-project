const multer = require('multer');

// Use memory storage so uploaded files are available as `file.buffer`.
// The controllers use a cloudinary upload stream which expects a Buffer.
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = {
  upload,
  single: (fieldName = 'image') => upload.single(fieldName),
  array: (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount),
  fields: (fields = []) => upload.fields(fields),
};