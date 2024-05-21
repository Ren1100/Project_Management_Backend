    const express = require('express');
    const router = express.Router();
    const Joi = require('joi');
    const multer = require('multer');
    const path = require('path');


    const validateRequest = require('_middleware/validate-request');
    const authorize = require('_middleware/authorize');
    const projectService = require('./project.service');
    const authorizeProject = require('_middleware/authorizeProject');
    const authorizeTask = require('_middleware/authorizeTask');


    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage });



    // routes
    router.post('/create', authorize(), createProjectSchema, createProject);
    router.get('/', authorizeProject(), getAllProjects);
    router.get('/:projectId', authorizeProject(), getProjectById);
    router.get('/:projectId/getUser', getProjectUsers);
    router.put('/:projectId', authorizeProject(), updateProjectSchema, updateProject);
    router.delete('/:projectId', authorizeProject(), deleteProject);
    router.post('/:projectId/tasks/create',authorizeProject(), createTaskSchema, createTask);
    router.get('/:projectId/tasks', authorizeProject(), getAllTasks);
    router.get('/:projectId/tasks/:taskId', getTaskById);
    router.put('/:projectId/tasks/:taskId', authorizeTask(), updateTaskSchema, updateTask);
    router.delete('/:projectId/tasks/:taskId', authorizeTask(), deleteTask);
    router.post('/:projectId/tasks/:taskId/subtasks/create', authorizeTask(), createSubtaskSchema, createSubtask);
    router.get('/:projectId/tasks/:taskId/subtasks', getAllSubtasks);
    router.put('/:projectId/tasks/:taskId/subtasks/:subtaskId', authorizeTask(), updateSubtaskSchema, updateSubtask);
    router.delete('/:projectId/tasks/:taskId/subtasks/:subtaskId', authorizeTask(), deleteSubtask);
    router.post('/:projectId/invite', authorizeTask(), inviteUserSchema, inviteUser);
    router.post('/:projectId/tasks/:taskId/upload', authorizeTask(), upload.single('file'), uploadFile);
    router.get('/:projectId/tasks/:taskId/files/:fileId/download', authorizeTask(), downloadFile);
    router.get('/:projectId/tasks/:taskId/files', getAllFile);




    module.exports = router;

    function createProjectSchema(req, res, next) {
        const schema = Joi.object({
            projectName: Joi.string().required(),
            PIC: Joi.string().required(),
            budget: Joi.number().positive().required(),
            startDate: Joi.date().iso().required(),
        });
        validateRequest(req, next, schema);
    }

    function createProject(req, res, next) {
        projectService.create(req.body, req.user.id)
            .then(project => res.json(project))
            .catch(next);
    }

    function getAllProjects(req, res, next) {
        projectService.getAll(req.user.id)
            .then(projects => res.json(projects))
            .catch(next);
    }

    function getProjectUsers(req, res, next) {
        projectService.getProjectUsers(req.params.projectId)
            .then(users => res.json(users))
            .catch(next);
    }

    function getProjectById(req, res, next) {
        projectService.getById(req.params.projectId)
            .then(project => res.json(project))
            .catch(next);
    }

    function updateProjectSchema(req, res, next) {
        const schema = Joi.object({
            projectName: Joi.string().empty(''),
            PIC: Joi.string().empty(''),
            budget: Joi.number().positive().empty(''),
            startDate: Joi.date().iso().empty(''),
            endDate: Joi.date().iso().empty('')
        });
        validateRequest(req, next, schema);
    }

    function updateProject(req, res, next) {
        projectService.update(req.params.projectId, req.body, req.user.id)
            .then(project => res.json(project))
            .catch(next);
    }

    function deleteProject(req, res, next) {
        projectService.delete(req.params.projectId, req.user.id)
            .then(() => res.json({ message: 'Project deleted successfully' }))
            .catch(next);
    }

    function createTaskSchema(req, res, next) {
        const schema = Joi.object({
            taskName: Joi.string().required(),
            taskPIC: Joi.string().required(),
            taskBudget: Joi.number().positive().required(),
            taskStartDate: Joi.date().iso().required(),
            taskEndDate: Joi.date().iso().required(),
        });
        validateRequest(req, next, schema);
    }

    function createTask(req, res, next) {
        projectService.createTask(req.params.projectId, req.body, req.user.id)
            .then(task => res.json(task))
            .catch(next);
    }

    function getAllTasks(req, res, next) {
        projectService.getAllTasks(req.params.projectId)
            .then(tasks => res.json(tasks))
            .catch(next);
    }

    function getTaskById(req, res, next) {
        projectService.getTaskById(req.params.taskId)
            .then(task => res.json(task))
            .catch(next);
    }

    function updateTaskSchema(req, res, next) {
        const schema = Joi.object({
            taskName: Joi.string().empty(''),
            taskPIC: Joi.string().empty(''),
            taskBudget: Joi.number().positive().empty(''),
            taskStartDate: Joi.date().iso().empty(''),
            taskEndDate: Joi.date().iso().empty(''),
            comment: Joi.string().empty('')
        });
        validateRequest(req, next, schema);
    }

    function updateTask(req, res, next) {
        projectService.updateTask(req.params.taskId, req.body, req.user.id)
            .then(task => res.json(task))
            .catch(next);
    }

    function deleteTask(req, res, next) {
        projectService.deleteTask(req.params.taskId, req.user.id)
            .then(() => res.json({ message: 'Task deleted successfully' }))
            .catch(next);
    }

    function createSubtaskSchema(req, res, next) {
        const schema = Joi.object({
            subtaskName: Joi.string().required(),
            subtaskManPower: Joi.number().positive().required(),
            subtaskStartDate: Joi.date().iso().required(),
            subtaskEndDate: Joi.date().iso().required(),
            completed: Joi.boolean().empty('')
        });
        validateRequest(req, next, schema);
    }

    function createSubtask(req, res, next) {
        projectService.createSubtask(req.params.projectId, req.params.taskId, req.body, req.user.id)
            .then(subtask => res.json(subtask))
            .catch(next);
    }

    function getAllSubtasks(req, res, next) {
        projectService.getAllSubtasks(req.params.taskId)
            .then(subtasks => res.json(subtasks))
            .catch(next);
    }

    function updateSubtaskSchema(req, res, next) {
        const schema = Joi.object({
            subtaskName: Joi.string().empty(''),
            subtaskManPower: Joi.number().positive().empty(''),
            subtaskStartDate: Joi.date().iso().empty(''),
            subtaskEndDate: Joi.date().iso().empty(''),
            completed: Joi.boolean().empty('')
        });
        validateRequest(req, next, schema);
    }

    function updateSubtask(req, res, next) {
        projectService.updateSubtask(req.params.subtaskId, req.body, req.user.id)
            .then(subtask => res.json(subtask))
            .catch(next);
    }

    function deleteSubtask(req, res, next) {
        projectService.deleteSubtask(req.params.subtaskId, req.user.id)
            .then(() => res.json({ message: 'Subtask deleted successfully' }))
            .catch(next);
    }

    function inviteUserSchema(req, res, next){
        const schema = Joi.object({
            email: Joi.string().email().required()
        });
        validateRequest(req, next, schema);
    }

    function inviteUser(req, res, next){
        projectService.inviteUser(req.params.projectId, req.body.email)
            .then(userProject => res.json({ userProject }))
            .catch(next);
    }

    function uploadFile(req, res, next) {
        const { taskId } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }
        projectService.uploadFile(taskId, req.file)
            .then(file => res.json(file))
            .catch(next);
    }
    function getAllFile(req, res, next) {
        projectService.getAllFile(req.params.taskId)
            .then(files => res.json(files))
            .catch(next);
    }
    function downloadFile(req, res, next) {
        const fileId = req.params.fileId; // Assuming fileId is passed as a parameter
        projectService.downloadFile(fileId, res)
            .catch(next);
    }
    