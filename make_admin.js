const mongoose = require('mongoose');
const User = require('./User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rpg_core';

console.log('Connecting to database...');

mongoose.connect(MONGO_URI)
    .then(async () => {
        const username = process.argv[2];
        if (!username) {
            console.log('Please provide a username: node make_admin.js <username>');
            process.exit(1);
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User ${username} not found.`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();
        console.log(`User ${username} is now an admin.`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });