const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;
var userSchema = new Schema({
    "username": {
        "type": String,
        "unique": true
    },
    "password": String,
    "password2": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User;

module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://zchoudhury:myseneca@webapp.rt191.mongodb.net/app?retryWrites=true&w=majority");

        db.on('error', (err) => {
            return reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            var adminObj = { "username": "zchoudhury", "password": "admin", "password2": "admin", "email": "zchoudhury@myseneca.ca" };
            bcrypt.hash(adminObj.password, 10).then((hash) => {
                adminObj.password = hash;
                let admin = new User(adminObj);
                admin.save((err) => {
                    if (err) {
                        reject(err + ", failed to save user");
                    } else {
                        return resolve("Successfully registered");
                    }
                });
            }).catch();
            return resolve();
        });
    });
};

module.exports.registerUser = function(userData) {
    return new Promise(function(resolve, reject) {
        User.findOne({ username: userData.username }, (err, user) => {
            if (err) console.log("error occurred");
            if (user) return reject("Username taken");
            else console.log("Username valid");
        });
        if (!userData.password) reject("Enter a password");
        else if (!userData.password2) reject("Confirm password");
        else if (!userData.email) reject("Enter an email");
        else if (userData.password == userData.password2) {
            bcrypt.hash(userData.password, 10).then((hash) => {
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save((err) => {
                    if (err) {
                        reject(err + ", failed to save user");
                    } else {
                        return resolve("Successfully registered");
                    }
                });
            }).catch();
        } else {
            reject("Password conformation does not match");
        }
    });
}

module.exports.checkUser = function(userData) {
    return new Promise(function(resolve, reject) {
        User.find({ username: userData.username }).exec()
            .then((users) => {
                if (users) {
                    bcrypt.compare(userData.password, users[0].password).then((found) => {
                        if (found === true) {
                            users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                            User.updateOne({ username: users[0].username }, { $set: { loginHistory: users[0].loginHistory } }).exec()
                                .then(() => {
                                    resolve(users[0]);
                                })
                                .catch((err) => {
                                    reject("There was an error verifying the username: " + err);
                                });
                        } else {
                            reject("Incorrect password entered");
                        }
                    }).catch(err => {
                        reject("Error occurred, unable to find a user");
                    });
                }
            })
            .catch((err) => {
                console.log(err);
                reject("Unable to find user: " + userData.username);
            });
    });
}