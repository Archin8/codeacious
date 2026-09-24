export class AppError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} code    Machine-readable error code (e.g. 'invalid_token')
   * @param {string} message Human-readable message
   */
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
