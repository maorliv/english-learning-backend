const { createHttpError } = require('../utils/httpError');

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
  return async function authorizeRequest(req, res, next) {
    try {
      const userRole = req.header('x-user-role');
      const userId = req.header('x-user-id');

      const routeId = req.params[options.idParam || 'id'];

      // getOwnerId may be async (returns a Promise) since services use Prisma
      const ownerId = options.getOwnerId ? await options.getOwnerId(req) : routeId;

      const isAllowedRole = userRole && allowedRoles.includes(userRole);

      const isSelfAllowed =
        options.allowSelf === true &&
        userId &&
        ownerId &&
        String(userId) === String(ownerId);

      if (!isAllowedRole && !isSelfAllowed) {
        return next(
          createHttpError(
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
          )
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Export so route files can use authorize([...]) as middleware
module.exports = authorize;