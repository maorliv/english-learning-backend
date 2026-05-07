const { sendError } = require('../utils/response');

function authorize(allowedRoles, options = {}) {
  return function authorizeRequest(req, res, next) {
    const userRole = req.header('x-user-role');
    const userId = req.header('x-user-id');
    const routeId = req.params[options.idParam || 'id'];

    const isAllowedRole = userRole && allowedRoles.includes(userRole);
    const isSelfAllowed =
      options.allowSelf === true &&
      userId &&
      routeId &&
      String(userId) === String(routeId);

    if (!isAllowedRole && !isSelfAllowed) {
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
        }
      );
    }

    return next();
  };
}

module.exports = authorize;