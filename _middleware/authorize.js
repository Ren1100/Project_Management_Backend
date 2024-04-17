const jwt = require("express-jwt");
const { secret } = require('config.json');
const db = require('_helpers/db');

module.exports = authorize;

function authorize() {
    return [
        // Authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),
        

        // Attach full user record to request object
        async (req, res, next) => {
            try {
                // Get user with id from token 'sub' (subject) property
                const user = await db.User.findByPk(req.user.sub);

                // Check if user exists
                if (!user)
                    return res.status(401).json({ message: 'Unauthorized' });

                // Authorization successful, attach user object to request
                req.user = user.toJSON(); // Convert Sequelize model instance to JSON
                
                // Check user role and grant access accordingly
                if (req.user.role === 'admin') {
                    // Admin role: Grant access to all routes
                    next();
                } else if (req.user.role === 'user') {
                    // User role: Grant access to getById and update routes
                    if (req.path === `/${req.params.id}`) {
                        next();
                    }else {
                        // For any other routes, return a Forbidden response
                        return res.status(403).json({ message: 'Forbidden' });
                    } 
                }
            } catch (err) {
                // Handle any errors
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}
