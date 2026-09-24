/**
 * Express middleware wrapper for Zod schemas.
 * Validates req.body, req.query, and req.params against the provided schema.
 */
export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined && req.query) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined && req.params) Object.assign(req.params, parsed.params);

      next();
    } catch (err) {
      next(err);
    }
  };
}
