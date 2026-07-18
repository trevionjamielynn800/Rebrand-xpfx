function validateProductionEnvironment(env = process.env) {
  const errors = [];

  if (env.NODE_ENV === 'production') {
    if (!env.SESSION_SECRET || env.SESSION_SECRET.trim().length < 32) {
      errors.push('SESSION_SECRET must be set to a strong value in production.');
    }

    if (!env.JWT_SECRET || env.JWT_SECRET.trim().length < 32) {
      errors.push('JWT_SECRET must be set to a strong value in production.');
    }

    if (!env.WALLET_ENCRYPTION_KEY || env.WALLET_ENCRYPTION_KEY.trim().length !== 64) {
      errors.push('WALLET_ENCRYPTION_KEY must be set to a 64-character hex key in production.');
    }

    if (!env.DATABASE_URL || !env.DATABASE_URL.includes('postgres')) {
      errors.push('DATABASE_URL must be set to a PostgreSQL connection string in production.');
    }

    if (!env.ALLOWED_ORIGINS && !env.REPLIT_DOMAINS) {
      errors.push('ALLOWED_ORIGINS or REPLIT_DOMAINS must be set for production CORS.');
    }

    if (env.MOONPAY_API_KEY && !env.MOONPAY_SECRET_KEY) {
      errors.push('MOONPAY_SECRET_KEY must be set when MOONPAY_API_KEY is configured in production.');
    }

    if (env.COINBASE_API_KEY && !env.COINBASE_API_SECRET) {
      errors.push('COINBASE_API_SECRET must be set when COINBASE_API_KEY is configured in production.');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  return true;
}

export { validateProductionEnvironment };
