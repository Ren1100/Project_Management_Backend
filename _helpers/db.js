const tedious = require('tedious');
const { Sequelize } = require('sequelize');

const { dbName, dbConfig } = require('config.json');
const { userModel, emailOTPModel } = require('../users/user.model');


module.exports = db = {};

initialize();

async function initialize() {
    const dialect = 'mssql';
    const host = dbConfig.server;
    const { userName, password } = dbConfig.authentication.options;

    // create db if it doesn't already exist
    await ensureDbExists(dbName);

    // connect to db
    const sequelize = new Sequelize(dbName, userName, password, { host, dialect });

    // init models and add them to the exported db object
    db.User = userModel(sequelize);
    db.EmailOTP = emailOTPModel(sequelize); // Include EmailOTP model


    const { Project, Task, Subtask, History } = require('../projects/project.model').initializeModels(sequelize);

    db.Project = Project;
    db.Task = Task;
    db.Subtask = Subtask;
    db.History = History;

    db.UserProject = require('../userproject/userproject.model')(sequelize);

    // Define relationships
    db.User.belongsToMany(db.Project, { through: db.UserProject, foreignKey: 'userId' });
    db.Project.belongsToMany(db.User, { through: db.UserProject, foreignKey: 'projectId' });  

    // sync all models with database
    await sequelize.sync({ alter: true });
}

async function ensureDbExists(dbName) {
    return new Promise((resolve, reject) => {
        const connection = new tedious.Connection(dbConfig);
        connection.connect((err) => {
            if (err) {
                console.error(err);
                reject(`Connection Failed: ${err.message}`);
            }

            const createDbQuery = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = '${dbName}') CREATE DATABASE [${dbName}];`;
            const request = new tedious.Request(createDbQuery, (err) => {
                if (err) {
                    console.error(err);
                    reject(`Create DB Query Failed: ${err.message}`);
                }

                // query executed successfully
                resolve();
            });
            connection.execSql(request);
        });
    });
}
