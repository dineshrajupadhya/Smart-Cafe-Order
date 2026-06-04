const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err.stack);

  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json({ success: false, message: error.message });
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    return res.status(400).json({ success: false, message: error.message });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: message.join(', ') });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
