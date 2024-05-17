const { DataTypes } = require('sequelize');

module.exports = {
    initializeModels
};

function initializeModels(sequelize) {
    const Project = defineProjectModel(sequelize);
    const Task = defineTaskModel(sequelize);
    const Subtask = defineSubtaskModel(sequelize);
    const History = defineHistoryModel(sequelize);
    const File = defineFileModel(sequelize);


    // Define association between Project and Task
    Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });
    Task.hasMany(Subtask, { as: 'subtasks' });

    // Define associations between Project, Task, Subtask, and History
    Project.hasMany(History, { as: 'history', foreignKey: 'projectId' });
    Task.hasMany(History, { as: 'history', foreignKey: 'taskId' });
    Subtask.hasMany(History, { as: 'history', foreignKey: 'subtaskId' });

    Task.hasMany(File, { as: 'files', foreignKey: 'taskId' });

    return { Project, Task, Subtask, History, File }; // Return all models
}

function defineProjectModel(sequelize) {
    return sequelize.define('Project', {
        projectName: { type: DataTypes.STRING, allowNull: false },
        PIC: { type: DataTypes.STRING, allowNull: false },
        budget: { type: DataTypes.DECIMAL, allowNull: false },
        startDate: { type: DataTypes.DATEONLY, allowNull: false },
        endDate: { type: DataTypes.DATEONLY, allowNull: false }
    });
}

function defineTaskModel(sequelize) {
    return sequelize.define('Task', {
        taskName: { type: DataTypes.STRING, allowNull: false },
        taskPIC: { type: DataTypes.STRING, allowNull: false },
        taskBudget: { type: DataTypes.DECIMAL, allowNull: false },
        taskStartDate: { type: DataTypes.DATEONLY, allowNull: false },
        taskEndDate: { type: DataTypes.DATEONLY, allowNull: false }
    });
}

function defineSubtaskModel(sequelize) {
    return sequelize.define('Subtask', {
        subtaskName: { type: DataTypes.STRING, allowNull: false },
        subtaskManPower: { type: DataTypes.DECIMAL, allowNull: false},
        subtaskStartDate: { type: DataTypes.DATEONLY, allowNull: false },
        subtaskEndDate: { type: DataTypes.DATEONLY, allowNull: false },
        completed: { type: DataTypes.BOOLEAN, allowNull: false} // New completion status field
    });
}

// Define history model
function defineHistoryModel(sequelize) {
    return sequelize.define('History', {
        // Common columns for all history entries
        model: { type: DataTypes.STRING, allowNull: false }, // Model name (e.g., 'Project', 'Task', 'Subtask')
        action: { type: DataTypes.STRING, allowNull: false }, // Action performed (e.g., 'create', 'update', 'delete')
        data: { type: DataTypes.TEXT, allowNull: false }, // Use TEXT data type instead of JSON
        userId: { type: DataTypes.INTEGER, allowNull: false }, // User who made the change
        timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW } // Timestamp of the change
    });
}

function defineFileModel(sequelize) {
    return sequelize.define('File', {
        name: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        taskId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Tasks', key: 'id' } }
    });
}