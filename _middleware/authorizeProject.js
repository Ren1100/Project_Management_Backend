const jwt = require("express-jwt");
const { secret } = require('config.json');
const db = require('_helpers/db');
const { getUserProjects } = require('projects/project.service');

module.exports = authorizeProject;

function authorizeProject() {
    return [
        // Authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // Attach project access check middleware
        async (req, res, next) => {
            try {
                const { sub, role } = req.user;
                const user = await db.User.findByPk(req.user.sub);


                if (!user) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                req.user = user.toJSON(); // Convert Sequelize model instance to JSON
                
                // Check if user is admin
                const isAdmin = role === 'admin';

                // If user is admin, grant access to all projects
                if (isAdmin) {
                    return next();
                }

                if (!req.params.projectId) {
                    return next();
                }

                // Check if user has access to the requested project
                const projectId = req.params.projectId; // Assuming projectId is part of the request parameters
                const userProjects = await getUserProjects(sub);

                const projectAccess = userProjects.find(userProject => userProject.projectId === parseInt(projectId));
                

                if (!projectAccess) {
                    return res.status(403).json({ message: 'Forbidden - You do not have access to this project' });
                }

                // Authorization successful, proceed to next middleware
                next();
            } catch (err) {
                // Handle any errors
                console.error(err);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}
