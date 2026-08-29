const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function getProductionOrigins() {
  const origins = [];

  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL.trim());
  }

  if (process.env.CORS_ORIGIN) {
    const extra = process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    origins.push(...extra);
  }

  return [...new Set(origins)];
}

function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (process.env.NODE_ENV !== 'production' && LOCALHOST_ORIGIN.test(origin)) {
    callback(null, true);
    return;
  }

  if (getProductionOrigins().includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Not allowed by CORS'));
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions, corsOrigin, getProductionOrigins };
