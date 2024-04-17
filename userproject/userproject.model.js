const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const UserProject = sequelize.define('UserProject', {
        accessLevel: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['user', 'admin']]
            }
        }
    });

    // Drop existing constraint before altering column
    UserProject.beforeSync(async () => {
        try {
            await sequelize.query('ALTER TABLE [UserProjects] DROP CONSTRAINT [CK__UserProje__acces__4BAC3F29]');
        } catch (error) {
            console.error('Error dropping constraint:', error);
        }
    });

    UserProject.belongsTo(sequelize.models.Project);

    return UserProject;
}
