    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const nodemailer = require('nodejs-nodemailer-outlook')

    const { secret } = require('config.json');
    const db = require('_helpers/db');

    module.exports = {
        authenticate,
        getAll,
        getById,
        getByEmail,
        create,
        verifyOTP,
        update,
        delete: _delete,
        updateUserProjects
    };

    let registrationData = {};

    async function authenticate({ email, password }) {
        const user = await db.User.scope('withHash').findOne({ where: { email } });
    
        if (!user || !(await bcrypt.compare(password, user.hash)))
            throw 'Email or password is incorrect';
    
        // Authentication successful
        const tokenPayload = {
            sub: user.id, // User ID
            role: user.role // User role
            // Add more properties as needed
        };
    
        const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });
        return { ...omitHash(user.get()), token };
    }
    

    async function getAll() {
        return await db.User.findAll();
    }

    async function getByEmail(email) {
        const user = await db.User.findOne({ where: { email } });
        if (!user) throw 'User not found';
        return user;
    }
    

    async function getById(id) {
        return await getUser(id);
    }

    async function create(params) {


        let role = 'user'; // Default role is 'user'

        // Check if the full name indicates an admin user
        if (params.email.toLowerCase().includes('darrenchsugiri@gmail.com')) {
            role = 'admin'; // Assign the role 'admin' if the full name contains 'admin'
        }

        // validate
        if (await db.User.findOne({ where: { email: params.email } })) {
            throw 'Email "' + params.email + '" is already taken';
        }

        // hash password
        if (params.password) {
            params.hash = await bcrypt.hash(params.password, 10);
        }



        const otp = generateOTP();
        params.role = role;
        registrationData = { ...params, otp }


        await sendOTP(params.email, otp);
    }

    async function verifyOTP(inputOTP) {
        const userData = registrationData;

        if (!userData) {
            throw 'Registration information not found';
        }
        const { otp, ...params } = userData;

        const sentOTP = String(otp); // Convert sentOTP to string

        const receivedOTP = inputOTP.otp

        // Compare the sent OTP with the input OTP
        const isOTPVerified = await compareOTP(sentOTP, receivedOTP);

        if (isOTPVerified) {
            // Register user
            await db.User.create(params);

            // Clear registration data
            delete registrationData;

        } else {
            throw 'OTP verification failed';
        }
    }

    async function update(id, params) {
        const user = await getUser(id);

        // validate
        const emailChanged = params.email && user.email !== params.email;
        if (emailChanged && await db.User.findOne({ where: { email: params.email } })) {
            throw 'Email "' + params.email + '" is already taken';
        }

        // hash password if it was entered
        if (params.password) {
            params.hash = await bcrypt.hash(params.password, 10);
        }

        // copy params to user and save
        Object.assign(user, params);
        await user.save();

        return omitHash(user.get());
    }

    async function _delete(id) {
        const user = await getUser(id);
        await user.destroy();
    }

    async function updateUserProjects(userId, projectId) {
        const user = await getUser(userId);
        if (!user.projects) {
            user.projects = [];
        }
        user.projects.push(projectId);
        await user.save();
    }

    // helper functions

    async function getUser(id) {
        const user = await db.User.findByPk(id);
        if (!user) throw 'User not found';
        return user;
    }

    function omitHash(user) {
        const { hash, ...userWithoutHash } = user;
        return userWithoutHash;
    }
    

    function generateOTP() {
        // Generate a random 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000);
    }

    async function sendOTP(email, otp) {
        try {
            // Send mail with defined transport object
            let info = await nodemailer.sendEmail({
                auth: {
                    user: 'pmmusashi@outlook.com', // Your Outlook email address
                    pass: '@1hsasum' // Your Outlook email password
                },
                from: 'pmmusashi@outlook.com', // Sender address (Outlook email)
                to: email, // Recipient email address
                subject: 'One-Time Password (OTP) for Registration', // Subject line
                html: `<p>Your One-Time Password (OTP) for registration is: <strong>${otp}</strong></p>` // HTML body with OTP
            });
    
            console.log('Message sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async function compareOTP(sentOTP, inputOTP) {
        // Perform comparison (replace with your own OTP verification logic)
        return sentOTP === inputOTP;
    }