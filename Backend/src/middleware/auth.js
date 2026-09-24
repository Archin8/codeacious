import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'missing_token', 'Authorization header required'));
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return next(new AppError(401, 'invalid_token', 'Invalid or expired token'));
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
