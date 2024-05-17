const db = require('_helpers/db');
const userService = require('../users/user.service');
const fs = require('fs');


module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    createTask,
    getAllTasks,
    getTaskById,
    deleteTask: _deleteTask,
    updateTask,
    createSubtask,
    getAllSubtasks,
    updateSubtask,
    deleteSubtask: _deleteSubtask,
    inviteUser,
    getUserProjects,
    uploadFile,
    getAllFile,
    downloadFile,

};

async function getAll(userId) {
    if (!userId) {
        throw new Error('User ID is required to fetch projects');
    }

    // Fetch the user's role from the database
    const user = await db.User.findByPk(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // If the user is an admin, return all projects
    if (user.role === 'admin') {
        return await db.Project.findAll();
    }

    // If the user is not an admin, return only the projects they have access to
    const userProjects = await getUserProjects(userId);
    const projectIds = userProjects.map(userProject => userProject.projectId);
    return await db.Project.findAll({ where: { id: projectIds } });
}

async function getById(projectId) {
    return await getProject(projectId);
}

async function create(params, userId) {
    // save project
    const project = await db.Project.create(params);
    await createHistoryEntry('Project', 'create', project, userId);

    return { project };
}

async function update(projectId, params, userId) {
    const project = await getProject(projectId);

    // update project
    Object.assign(project, params);
    await project.save();
    await createHistoryEntry('Project', 'update', project, userId);


    return project;
}

async function _delete(projectId, userId) {
    const project = await getProject(projectId);
    await project.destroy();
    await createHistoryEntry('Project', 'delete', 'deleted', userId);

}

async function createTask(projectId, taskParams, userId) {
    const project = await getProject(projectId);
    const task = await project.createTask(taskParams);
    await project.addTask(task); // Associate the task with the project
    await createHistoryEntry('Task', 'create', task, userId);


    return task;
}

async function getAllTasks(projectId) {
    const project = await getProject(projectId);
    return await project.getTasks(); // Fetch tasks associated with the project
}

async function getTaskById(taskId) {
    return await getTask(taskId);
}

async function _deleteTask(taskId, userId) {
    const task = await getTask(taskId);
    await task.destroy();
    await createHistoryEntry('Task', 'delete', 'deleted', userId);
}

async function updateTask(taskId, params, userId){
    const task = await getTask(taskId);

    // update project
    Object.assign(task, params);
    await task.save();
    await createHistoryEntry('Task', 'update', task, userId);


    return task;
}

async function createSubtask(projectId, taskId, subtaskParams, userId) {
    const project = await getProject(projectId);
    const task = await getTask(taskId); // Use getTask function to fetch the task
    const subtask = await task.createSubtask(subtaskParams); // Create subtask associated with the task
    await task.addSubtask(subtask);
    await createHistoryEntry('Subtask', 'create', subtask, userId);

    return subtask;
}


async function getAllSubtasks(taskId) {
    const task = await getTask(taskId);
    return await task.getSubtasks(); // Fetch subtasks associated with the project
}

async function updateSubtask(subtaskId, params, userId){
    const subtask = await getSubtask(subtaskId);

    // update project
    Object.assign(subtask, params);
    await subtask.save();
    await createHistoryEntry('Subtask', 'update', subtask, userId);


    return subtask;
}

async function _deleteSubtask(subtaskId, userId) {
    const subtask = await getSubtask(subtaskId);
    await subtask.destroy();
    await createHistoryEntry('Subtask', 'delete', 'deleted', userId);

}

async function inviteUser(projectId, invitedUserEmail) {
    const user = await userService.getByEmail(invitedUserEmail);

    // Check if the user exists
    if (!user) {
        throw new Error('User not found');
    }

    // Check if user id is available
    if (!user.id) {
        console.log('User id not available:', user); // Log user information for debugging
        throw new Error('User id not available');
    }

    // Create a new entry in the UserProject table with accessLevel set to 'user'
    const userProject = await db.UserProject.create({ userId: user.id, projectId, accessLevel: 'user' });

    return { userProject};
}

async function uploadFile(taskId, fileData) {

    const normalizedPath = fileData.path.replace(/\\/g, '/');

    const file = await db.File.create({
        name: fileData.originalname,
        path: normalizedPath,
        taskId: taskId
    });
    return file;
}

async function getAllFile(taskId) {
    const task = await getTask(taskId);
    return await task.getFiles(); // Fetch subtasks associated with the project
}

async function downloadFile(fileId, res) {
    try {
        const file = await getFile(fileId);
        const filePath = file.path;

        // Check if the file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File does not exist
                return res.status(404).json({ message: 'File not found' });
            }

            // Set response headers
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            res.setHeader('Content-Type', 'application/octet-stream'); // Adjust Content-Type based on file type if needed

            // Send the file as a downloadable attachment
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        });
    } catch (error) {
        throw error; // Propagate error to be caught by the controller
    }
}



// helper function
async function getProject(projectId) {
    const project = await db.Project.findByPk(projectId);
    if (!project) throw 'Project not found';
    return project;
}

async function getUserProjects(userId) {
    return await db.UserProject.findAll({ where: { userId }, include: db.Project });
}


async function getTask(taskId) {
    const task = await db.Task.findByPk(taskId);
    if (!task) throw 'Task not found';
    return task;
}

async function getSubtask(subtaskId) {
    const subtask = await db.Subtask.findByPk(subtaskId);
    if (!subtask) throw 'Subtask not found';
    return subtask;
}

async function getFile(fileId) {
    const file = await db.File.findByPk(fileId);
    if (!file) throw 'Subtask not found';
    return file;
}

async function createHistoryEntry(model, action, data, userId) {
    try {
        const historyData = {
            model: model,
            action: action,
            data: JSON.stringify(data), // Convert data to JSON string
            userId: userId,
            timestamp: new Date() // Add timestamp of the change
        };
        await db.History.create(historyData); // Create history entry
    } catch (error) {
        throw error;
    }
}