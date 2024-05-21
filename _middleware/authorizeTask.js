const jwt = require("express-jwt");
const { secret } = require('config.json');
const db = require('_helpers/db');
const { getUserTasks } = require('projects/project.service');

module.exports = authorizeTask;

function authorizeTask() {
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

                if (!req.params.taskId) {
                    return next();
                }

                // Check if user has access to the requested project
                const taskId = req.params.taskId; // Assuming projectId is part of the request parameters
                const task = await db.Task.findByPk(taskId);

                if (!task) {
                    return res.status(404).json({ message: 'Task not found' });
                }                

                const isPIC = task.taskPIC === user.fullName;

                if (!isPIC) {
                    return res.status(403).json({ message: 'Forbidden - You do not have access to this task' });
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
