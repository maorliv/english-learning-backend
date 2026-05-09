const { sendError } = require('../utils/response');

/**
 * Factory function that creates an Express authorization middleware.
 *
 * Usage: authorize(['admin', 'teacher'])  — only users with those roles can access the route.
 *
 * Options:
 *   allowSelf  — if true, the user is also allowed if their x-user-id matches the resource owner's ID.
 *   idParam    — the name of the route param that holds the resource ID (defaults to 'id').
 *   getOwnerId — a function that receives req and returns the owner's user ID (useful when the
 *                resource ID is not the same as the user ID, e.g. a teacher profile has teacherId
 *                but ownership is checked via userId).
 *
 * The caller must set these request headers:
 *   x-user-role — the role of the logged-in user (e.g. 'student', 'teacher', 'admin')
 *   x-user-id   — the numeric ID of the logged-in user
 */
function authorize(allowedRoles, options = {}) {
  // Returns the actual middleware function that Express will call for each request
  return function authorizeRequest(req, res, next) {
    // Read identity from custom request headers (simulated auth — no real JWT in this project)
    const userRole = req.header('x-user-role');
    const userId = req.header('x-user-id');

    // Determine which route param contains the resource ID
    const routeId = req.params[options.idParam || 'id'];

    // Use getOwnerId if provided; otherwise fall back to the route param
    const ownerId = options.getOwnerId ? options.getOwnerId(req) : routeId;

    // Check 1: does the user's role appear in the allowed list?
    const isAllowedRole = userRole && allowedRoles.includes(userRole);

    // Check 2: is self-access enabled AND is the logged-in user the resource owner?
    const isSelfAllowed =
      options.allowSelf === true &&
      userId &&
      ownerId &&
      String(userId) === String(ownerId);

    if (!isAllowedRole && !isSelfAllowed) {
      // 403 Forbidden — the user is authenticated but not authorized for this action
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'You do not have permission to perform this action.',
        {
          allowedRoles,
          receivedRole: userRole || null,
          receivedUserId: userId || null,
          routeId: routeId || null,
          ownerId: ownerId || null,
        }
      );
    }

    // Authorization passed — hand control to the next middleware or route handler
    return next();
  };
}

// Export so route files can use authorize([...]) as middleware
module.exports = authorize;