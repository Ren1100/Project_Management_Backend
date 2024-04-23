const { DataTypes } = require('sequelize');

module.exports = {
    userModel,
    emailOTPModel
};

function userModel(sequelize) {
    const attributes = {
        fullName: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        hash: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, allowNull: false }
    };

    const options = {
        defaultScope: {
            // Exclude hash by default
            attributes: { exclude: ['hash'] }
        },
        scopes: {
            // Include hash with this scope
            withHash: { attributes: {} }
        }
    };

    // Define the User model
    const User = sequelize.define('User', attributes, options);

    return User;
}

function emailOTPModel(sequelize) {
    const attributes = {
        email: { type: DataTypes.STRING, allowNull: false },
        otp: { type: DataTypes.STRING, allowNull: false }
    };

    // Define the EmailOTP model
    const EmailOTP = sequelize.define('EmailOTP', attributes);

    return EmailOTP;
}
