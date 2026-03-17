function notFound(req, res, next) {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(err);
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const payload = {
    message: err.message || 'Server error'
  };

  // Optional stack only in development
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };