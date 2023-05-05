const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const port = 3000;
const db_uri = "mongodb+srv://tony_stark:iamironman@cluster123.czsky.mongodb.net/studium?retryWrites=true&w=majority";
const cookieParser = require('cookie-parser')

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'b39xnn1mslagfn144n6knnxpa1q74756',
    rolling: true,
    maxAge: 1000*60*60*12
}));
app.use(cookieParser());

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(express.json());

const User = require('./src/models/user_model.js')
const Course = require('./src/models/course_model');
const Video = require('./src/models/video_model.js');

mongoose.connect(db_uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology : true,
        dbName: "studium"
    })
    .then(() => {
        console.log("Database connected at " + db_uri);
    })
    .catch((err)=> console.log(err));

app.listen(port, (err) => {
    if (err) {
        console.log("Error connecting at port " + port + ": ");
        console.log(err);
    }
    else {
        console.log("Server running on port " + port);
    }
})

app.post('/add_message_to_user_session', function(req, res) {
    console.log("/add_message");
    let message_html = req.body.message_html || undefined;
    let response = {
        errors: []
    }

    if (message_html === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Message not found"
        })
        res.send(response);
        return;
    }

    req.session.message_html = message_html;
    res.send(response);
    return;
})

app.post("/get_user_session_message", function(req, res) {
    let response = {
        errors: []
    }

    if (req.session.message_html === undefined) {
        response.errors.push({
            error_type: "session_error",
            error_message: "Message not found"
        })
        res.send(response);
        return;
    }

    response.message_html = req.session.message_html;
    res.send(response);
    return;
})

app.post('/remove_message_from_user_session', function(req, res) {
    let message_html = req.session.message_html;
    let response = {
        errors: []
    }

    if (message_html === undefined) {
        response.errors.push({
            error_type: "session_error",
            error_message: "Message not found"
        })
        res.send(response);
        return;
    }

    delete req.session.message_html;
    res.send(response);
    return;
})

app.get('/', function(req, res) {
    let current_user = req.session.user || undefined;
    res.render(__dirname + '/public/homepage', { current_user });
})

app.get('/register', function(req, res) {
    res.render(__dirname + "/public/register", { current_user: req.session.user });
})

app.post('/register', function(req, res) {
    let current_user = req.session.current_user || undefined;
    let email = req.body.email || undefined;
    let username = req.body.username || undefined;
    let forename = req.body.forename || undefined;
    let surname = req.body.surname || undefined;
    let password = req.body.password || undefined;
    let confirm_password = req.body.confirm_password || undefined;

    let input = {
        email: email,
        username: username,
        forename: forename,
        surname: surname,
        password: password,
        confirm_password: confirm_password
    }

    console.log("Input:");
    console.log(input);

    let validation = validateRegisterInput(input);
    let errors = validation.errors;

    if (errors.length > 0) {
        res.render(__dirname + "/public/register", 
        {
            current_user,
            errors,
            email,
            username,
            forename,
            surname,
            password,
            confirm_password
        });
        return;
    }

    email = validation.email;
    username = validation.username;
    forename = validation.forename;
    surname = validation.surname;
    password = validation.password;
    console.log("password: " + password);

    User.find({}, function(err, users) {
        if (err) {
            errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find existing users"
            })

            res.render(__dirname + "/public/register", {
                current_user,
                errors,
                email,
                username,
                forename,
                surname,
                password,
                confirm_password
            });
            return;
        }

        let register_account = true;

        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                register_account = false;
                errors.push({
                    error_type: "username_error",
                    error_message: "This username is being used by another account"
                })
            }

            if (users[i].email === email) {
                register_account = false;
                errors.push({
                    error_type: "email_error",
                    error_message: "This email is being used by another account"
                })
            }
        }

        if (!register_account) {
            res.render(__dirname + "/public/register", {
                current_user,
                errors,
                email,
                username,
                forename,
                surname,
                password,
                confirm_password
            });
            return;
        }

        let new_user = {
            username: username,
            email: email,
            forename: forename,
            surname: surname,
            password: password,
            avatar_path: "/images/default_avatar.jpg",
            created: Date.now(),
            enrolled_in: [],
            courses_in_charge_of: [],
            templates: [],
            notifications: {
                new_questions_notifications: [],
                new_feedback_notifications: [],
                new_replies: [],
                watched_comment_new_replies: [],
                highlighted_comment_notifications: []
            }
        }

        User.create(new_user, function(err, user) {
            if (err) {
                console.log(err);

                errors.push({
                    error_type: "register_error",
                    error_message: "Something went wrong while trying to register"
                })

                res.render(__dirname + "/public/register", {
                    current_user,
                    errors,
                    email,
                    username,
                    forename,
                    surname,
                    password,
                    confirm_password
                });
                return;
            }

            delete user.password;
            req.session.user = user;
            req.session.message_html =
            "<h3>Account Created</h3>" +
            "<p>Your account was succesfully created and you are now logged in as @" + username + "</p>";
            res.redirect("/account_created");
            return;
        })
    })
})

app.get('/account_created', function(req, res) {
    console.log("/account_created");
    if (req.session.message_html === undefined) {
        res.redirect("/");
        return;
    }

    let current_user = req.session.user || undefined;
    console.log("message_html: " + req.session.message_html);
    let message = req.session.message_html;
    let message_title = "Account Created | Studium";
    delete req.session.message_html;
    res.render(__dirname + "/public/message_page", { message, message_title, current_user });
})

app.get('/login', function(req, res) {
    let current_user = req.session.user || undefined;
    // If the user isn't logged in, show login page
    if (current_user === undefined) {
        res.render(__dirname + "/public/login", { current_user });
    }
    // If the user is logged in, display error message
    else {
        let message =
        "<h3>Already Logged In</h3>" +
        "<p>You are already logged in. If you wish to log out, click <a href='/logout'>here</a></p>";
        let message_title = "Already Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
    }
})

app.post('/login', function(req, res) {
    let current_user = req.session.user || undefined;
    let username = req.body.username || undefined;
    let password = req.body.password || undefined;

    let user_input = {
        username: username,
        password: password
    }

    let validation = validateLoginInput(user_input);
    let errors = validation.errors;

    if (errors.length > 0) {
        res.render(__dirname + "/public/login", { current_user, errors, username, password })
        return;
    }

    User.findOne(user_input, function(err, user) {
        if (err) {
            errors.push({
                error_type: "login_error",
                error_message: "Error occured when trying to login"
            })
        }

        if (user) {
            user._id = user._id.toString();
            delete user.password;
            req.session.user = user;
            req.session.login_timeout = 0;
            res.cookie('display_alert_message', true);
            res.cookie('alert_message_text', 'Logged in');
            res.cookie('alert_message_type', 'good');
            res.cookie('alert_message_length', 3000);
            res.redirect('/');
            return;
        }
        else {
            let failed_login_responses = [
                "Incorrect credentials", "Username and/or password is incorrect", "Login unsuccessful",
                "Login details incorrect", "Password and/or username is incorrect", 
                "Please check you have entered the correct login details", 
                "Please check you have entered the correct username and password",
                "Login was unsuccessful", "Login attempt unsuccessful", "Login attempt was unsuccessful",
                "Please ensure you have entered your details correctly",
                "Please ensure you have entered the correct username and password",
                "The credentials you entered are incorrect", "Sign in unsuccessful", "Sign in was unsuccessful",
                "Sign in attempt unsuccessful", "Sign-in unsuccessful", "Sign-in was unsuccessful",
                "Sign-in attempt unsuccessful",
                "Please ensure you have entered the correct login details",
                "Please ensure you have entered the correct sign-in details",
                "Please ensure you have entered the correct login information",
                "Please ensure you have entered the correct sign-in information",
                "Log in was unsuccessful", "Log in attempt unsuccessful", "Log in attempt was unsuccessful"
            ]

            let failed_login_response_index = Math.floor(Math.random() * failed_login_responses.length);
            let failed_login_response = failed_login_responses[failed_login_response_index];

            errors.push({
                error_type: "login_error",
                error_message: failed_login_response
            })

            if (req.session.login_timeout === undefined) {
                req.session.login_timeout = 100;
            }
            else {
                req.session.login_timeout += 100;
            }

            setTimeout(function() {
                res.render(__dirname + '/public/login', { current_user, errors, username, password });
                return;
            }, req.session.login_timeout)
        }
    })
})

app.get("/logout", function(req, res) {
    let current_user = req.session.user || undefined;
    
    if (current_user === undefined) {
        let message =
        "<h3>Not Logged In</h3>" +
        "<p>No account to log out from.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
        return;
    }

    res.cookie('display_alert_message', true);
    res.cookie('alert_message_text', 'Logged out');
    res.cookie('alert_message_type', 'good');
    res.cookie('alert_message_length', 3000);
    delete req.session.user;
    res.redirect("/");
    return;
})

app.get("/user/:user_id", function(req, res) {
    let current_user = req.session.user || undefined;
    let profile_user_id = req.params.user_id;
    
    if (profile_user_id === undefined || profile_user_id === "" || !mongoose.isValidObjectId(profile_user_id)) {
        let message = 
        '<h3>Account Not Found</h3>' +
        '<p>Account with ID <i>"' + profile_user_id + '"</i> not found.</p>';
        let message_title = "Account Not Found | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
    }

    let user_query = {
        _id: profile_user_id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            let message =
            '<h3>Error</h3>' +
            '<p>An error occured while trying to find account with ID <i>"' + profile_user_id + '"</i></p>';
            let message_title = "Error | Studium";
            res.render(__dirname + "/public/message_page", { message, message_title, current_user });
            return;
        }

        if (!user) {
            let message = 
            '<h3>Account Not Found</h3>' +
            '<p>Account with ID <i>"' + profile_user_id + '"</i> not found.</p>';
            let message_title = "Account Not Found | Studium";
            res.render(__dirname + "/public/message_page", { message, message_title, current_user });
            return;
        }

        let profile_user = {
            username: user.username,
            forename: user.forename,
            surname: user.surname,
            avatar_path: user.avatar_path,
            is_current_user: false
        }

        // If the current user is the profile user
        if (current_user !== undefined && mongoose.Types.ObjectId(user._id).equals(mongoose.Types.ObjectId(current_user._id))) {
            profile_user.is_current_user = true;
            profile_user.email = user.email;
        }

        res.render(__dirname + "/public/account", { current_user, profile_user });
        return;
    })
})

app.post("/update_account_details", function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let field_being_updated = req.body.field_being_updated || undefined;
    let input = req.body.input || undefined;

    console.log("Input:");
    console.log(input);

    let validation = validateAccountDetailsUpdate(field_being_updated, input);
    response.errors = validation.errors;

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find account"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Your account was not found"
            })
            res.send(response);
            return;
        }

        if (user.password !== input.confirmational_password_input) {
            response.errors.push({
                error_type: "confirmational_password_error",
                error_message: "Incorrect password"
            })
            res.send(response);
            return;
        }

        let user_update = validation.update;
        console.log(user_update);
        
        User.updateOne(user_query, user_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to update account"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Could not update your account"
                })
            }

            if (field_being_updated === "email") {
                response.validated_email = validation.validated_email;
            }
            else if (field_being_updated === "username") {
                response.validated_username = validation.validated_username;
            }
            else if (field_being_updated === "name") {
                response.validated_forename = validation.validated_forename;
                response.validated_surname = validation.validated_surname;
            }

            console.log(response);

            res.send(response);
            return;
        })
    })
})

app.post("/delete_account", function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let confirmational_password_input = req.body.confirmational_password_input || undefined;
    let confirmational_password_validation = validateConfirmationalPassword(confirmational_password_input);
    response.errors = confirmational_password_validation.errors;

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find account"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Account not found"
            })
            res.send(response);
            return;
        }

        if (user.password !== confirmational_password_input) {
            response.errors.push({
                error_type: "confirmational_password_error",
                error_message: "Incorrect password"
            })
            res.send(response);
            return;
        }

        User.deleteOne(user_query, function(err, result) {
            if (err) {
                response.errors.push({
                    error_type: "delete_error",
                    error_message: "Error occurred while trying to delete account"
                })
                res.send(response);
                return;
            }

            console.log(result);

            if (result.deletedCount === 0) {
                response.errors.push({
                    error_type: "delete_error",
                    error_message: "Account could not be deleted"
                })
                res.send(response);
                return;
            }

            delete req.session.user;
            res.send(response);
            return;
        })
    })
})

function validateUsername(username) {
    let validation = {
        errors: [],
        username: username
    }

    if (username === undefined || username.trim() === "") {
        validation.errors.push({
            error_type: "username_error",
            error_message: "Please enter a username"
        });
    }
    else if (username.length > 30) {
        validation.errors.push({
            error_type: "username_error",
            error_message: "Username must not be longer than 30 characters"
        })
    }
    else if (username.match(/\s/g)) {
        validation.errors.push({
            error_type: "username_error",
            error_message: "Username must not contain spaces"
        })
    }

    return validation;
}

function validateEmail(email) {
    let validation = {
        errors: [],
        email: email
    }

    if (email === undefined || email.trim() === "") {
        validation.errors.push({
            error_type: "email_error",
            error_message: "Please enter an email address"
        })
    }
    else if (!email.match(/^\S+@\S+\.\S+$/)) {
        validation.errors.push({
            error_type: "email_error",
            error_message: "Please enter a valid email address"
        })
    }
    else {
        validation.email = email.trim();
    }

    return validation;
}

function validateName(forename, surname) {
    let validation = {
        errors: [],
        forename: forename,
        surname: surname
    }

    if (forename === undefined || forename.trim() === "") {
        validation.errors.push({
            error_type: "forename_error",
            error_message: "Please enter your forename"
        })
    }
    else {
        validation.forename = forename.trim();
    }

    if (surname === undefined || surname.trim() === "") {
        validation.errors.push({
            error_type: "surname_error",
            error_message: "Please enter your surname"
        })
    }
    else {
        validation.surname = surname.trim();
    }

    return validation;
}

function validatePassword(password, confirm_password, password_being_updated) {
    let validation = {
        errors: [],
        password: password
    }

    if (password === undefined || password.trim() === "") {
        let error_message = "Please enter a password";

        if (password_being_updated) {
            error_message = "Please enter your new password";
        }

        validation.errors.push({
            error_type: "password_error",
            error_message: error_message
        })
    }
    else if (password.match(/\s/g)) {
        validation.errors.push({
            error_type: "password_error",
            error_message: "Password must not contain spaces"
        })
    }
    else if (password.length < 6) {
        validation.errors.push({
            error_type: "password_error",
            error_message: "Password must contain at least 6 characters"
        })
    }

    if (confirm_password === undefined || confirm_password.trim() === "") {
        let error_message = "Please confirm your password";

        if (password_being_updated) {
            error_message = "Please confirm your new password";
        }

        validation.errors.push({
            error_type: "confirm_password_error",
            error_message: error_message
        })
    }
    else if (password !== confirm_password) {
        validation.errors.push({
            error_type: "confirm_password_error",
            error_message: "Passwords must match"
        })
    }
    
    return validation;
}

function validateConfirmationalPassword(confirmational_password) {
    let validation = {
        errors: []
    }

    if (confirmational_password === undefined || confirmational_password.trim() === "") {
        validation.errors.push({
            error_type: "confirmational_password_error",
            error_message: "Please enter your current password"
        })
    }

    return validation;
}

function validateAccountDetailsUpdate(field_being_updated, input) {
    let validation = {
        errors: []
    }

    let confirmational_password_validation = validateConfirmationalPassword(input.confirmational_password_input);
    if (confirmational_password_validation.errors.length > 0) {
        confirmational_password_validation.errors.forEach(function(error) {
            validation.errors.push(error);
        })
    }

    if (field_being_updated === "email") {
        let email_validation = validateEmail(input.email_input);
        
        if (email_validation.errors.length === 0) {
            validation.validated_email = email_validation.email;
            validation.update = {
                $set: {
                    email: email_validation.email
                }
            }
        }
        else {
            email_validation.errors.forEach(function(error) {
                validation.errors.push(error);
            })
        }
    }
    else if (field_being_updated === "username") {
        let username_validation = validateUsername(input.username_input);
        
        if (username_validation.errors.length === 0) {
            validation.validated_username = username_validation.username;
            validation.update = {
                $set: {
                    username: username_validation.username
                }
            }
        }
        else {
            username_validation.errors.forEach(function(error) {
                validation.errors.push(error);
            })
        }
    }
    else if (field_being_updated === "name") {
        let name_validation = validateName(input.forename_input, input.surname_input);

        if (name_validation.errors.length === 0) {
            validation.validated_forename = name_validation.forename;
            validation.validated_surname = name_validation.surname;
            validation.update = {
                $set: {
                    forename: name_validation.forename,
                    surname: name_validation.surname
                }
            }
        }
        else {
            name_validation.errors.forEach(function(error) {
                validation.errors.push(error);
            })
        }
    }
    else if (field_being_updated === "password") {
        let password_validation = validatePassword(input.password_input, input.confirm_password_input, true);

        if (password_validation.errors.length === 0) {
            validation.update = {
                $set: {
                    password: input.password_input
                }
            }
        }
        else {
            password_validation.errors.forEach(function(error) {
                validation.errors.push(error);
            })
        }
    }
    else {
        validation.errors.push({
            error_type: "update_error",
            error_message: "Required information not found"
        })
    }

    return validation;
}

app.get("/create-course", function(req, res) {
    let current_user = req.session.user || undefined;

    if (current_user !== undefined) {
        res.render(__dirname + "/public/create_course", { current_user });
    }
    else {
        let message = 
        "<h3>Not Logged In</h3>" +
        "<p>You must be logged in to create a course</p>" +
        "<p>Login <a href='/login'>here</a> or register <a href='/register'>here</a>.</p>";
        let message_title = "Error | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
    }
})

app.post("/create_course", function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You must be logged in to create a course"
        })
        res.send(response);
        return;
    }

    let input = JSON.parse(req.body.input) || undefined;
    let title = input.title || undefined;
    let subject = input.subject || undefined;
    let description = input.description || undefined;
    let start_date = input.start_date || undefined;
    let staff = input.staff || undefined;
    let publicly_listed = input.publicly_listed;
    let templates_include_content = input.templates_include_content;

    let new_course = {
        title: title,
        subject: subject,
        description: description,
        start_date: start_date,
        staff: staff,
        start_date: start_date,
        publicly_listed: publicly_listed,
        templates_include_content: templates_include_content
    }

    let validation = validateCourseDetails(new_course);
    response.errors = validation.errors;
    new_course.title = validation.title;
    new_course.description = validation.description;

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    let staff_array = [];

    staff.forEach(function(staff_member) {
        staff_array.push({
            _id: staff_member._id,
            is_teacher: staff_member.is_teacher,
            is_admin: staff_member.is_admin
        })
    })

    let new_course_id = new mongoose.Types.ObjectId();
    response.new_course_id = new_course_id;
    new_course._id = new_course_id;
    new_course.start_date = new Date(start_date);
    new_course.staff = staff_array;
    new_course.students = [];
    new_course.pages = [];
    new_course.created = new Date();
    new_course.template = {
        set: false
    };

    console.log("new course:");
    console.log(new_course);

    Course.create(new_course, function(err) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Error while trying to create course"
            })
        }

        let staff_member_queries = [];
        new_course.staff.forEach(function(staff_member) {
            staff_member_queries.push({
                _id: staff_member._id
            })
        })

        let staff_member_query = {
            $or: staff_member_queries
        }

        let staff_member_update = {
            $push: {
                courses_in_charge_of: new_course_id
            }
        }

        User.updateMany(staff_member_query, staff_member_update, function(err, doc) {
            if (err) {
                console.log(err);
            }

            if (doc.matchedCount === 0) {
                console.log("Staff Members not updated");
            }

            res.send(response);
            return;
        })
    })
})

app.post("/delete_course", function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let confirmational_password_input = req.body.confirmational_password_input || "";
    console.log("course_id: " + course_id);
    console.log("confirmational: " + confirmational_password_input);

    if (course_id === undefined || confirmational_password_input === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }
    
    if (confirmational_password_input.trim() === "") {
        response.errors.push({
            error_type: "confirmational_password_error",
            error_message: "Please enter your password"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "User not found"
            })
            res.send(response);
        }

        if (confirmational_password_input !== user.password) {
            response.errors.push({
                error_type: "confirmational_password_error",
                error_message: "Incorrect password"
            })
            res.send(response);
            return;
        }

        let course_query = {
            _id: course_id
        }
    
        Course.findOne(course_query, function(err, course) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_messages: "Error occurred while trying to find course"
                })
            }
    
            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_messages: "Course not found"
                })
                res.send(response);
                return;
            }
    
            let authorised = false;
            for (let i = 0; i < course.staff.length; i++) {
                if (course.staff[i]._id === current_user._id && course.staff[i].is_admin) {
                    authorised = true;
                    break;
                }
            }
    
            if (!authorised) {
                response.errors.push({
                    error_type: "user_error",
                    error_message: "You must be an admin to delete a course"
                })
                res.send(response);
                return;
            }
    
            Course.deleteOne(course_query, function(err, doc) {
                if (err) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Error occurred while trying to delete course"
                    })
                }

                if (doc.deletedCount === 0) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Could not delete course"
                    })
                }
    
                res.send(response);
                return;
            })
        })
    })
})

app.post('/add_course_page', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let new_page_info = JSON.parse(req.body.new_page_info) || undefined;
    let course_id = new_page_info.course_id || undefined;
    let new_page = new_page_info.new_page || undefined;
    let previous_page_id = new_page_info.previous_page_id || undefined;
    console.log("new_page_info:");
    console.log(new_page_info);
    
    if (course_id === undefined || new_page === undefined || previous_page_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "New page information not found"
        })
        res.send(response);
        return;
    }

    let validate = validateNewPage(new_page);
    response.errors = validate.errors;
    new_page.title = validate.title;
    response.title = validate.title;

    console.log("new_page:");
    console.log(new_page);
    console.log("response.title:");
    console.log(response.title);

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred trying to add new page"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        new_page._id = new mongoose.Types.ObjectId();
        let update = {}

        let is_admin = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (current_user._id === course.staff[i]._id && course.staff[i].is_admin) {
                is_admin = true;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to add a new page"
            })
            res.send(response);
            return;
        }

        let previous_page_i = 0;
        let previous_page_found = false;

        // If the new page is being added as a new first page
        if (mongoose.Types.ObjectId(previous_page_id).equals(mongoose.Types.ObjectId(course._id))) {
            previous_page_found = true;
            previous_page_i = -1;
        }
        // If the new page is not being added as a new first page
        else {
            for (let i = 0; i < course.pages.length; i++) {
                if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(previous_page_id))) {
                    previous_page_found = true;
                    break;
                }
    
                previous_page_i++;
            }
        }

        // If DB course has no pages or the previous page is the last page in DB pages, new page will be the last page
        if (course.pages.length === 0 || !previous_page_found || (previous_page_i === course.pages.length - 1)) {
            update = {
                $push: {
                    pages: new_page
                }
            }
        }
        // Else if the page isn't to be the last page
        else {
            let new_page_index = previous_page_i + 1;
            course.pages.splice(new_page_index, 0, new_page);

            update = {
                pages: course.pages
            }
        }

        Course.updateOne(course_query, update, function(err, course) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred trying to add new page"
                })
            }

            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            response.new_page_id = new_page._id;
            response.new_page_title = new_page.title;
            res.send(response);
            return;
        })
    })
})

function validateNewPage(new_page) {
    let validation = {
        errors: [],
        title: ""
    }

    if (new_page.title === undefined) {
        validation.errors.push({
            error_type: "title_error",
            error_message: "Title not found"
        })
    }
    else if (new_page.title.trim() === "") {
        validation.errors.push({
            error_type: "title_error",
            error_message: "Title cannot be blank"
        })
    }
    else {
        validation.title = new_page.title.trim().split("\n").join("<br>");
    }

    if (new_page.visible_only_to_staff === undefined ||
        (new_page.visible_only_to_staff !== true && new_page.visible_only_to_staff !== false)) {
        validation.errors.push({
            error_type: "visible_error",
            error_message: "Page visibility selection not found"
        })
    }

    return validation;
}

app.post('/update_course_page_visibility', function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let info = JSON.parse(req.body.info) || undefined;
    let course_id = info.course_id || undefined;
    let page_id = info.page_id || undefined;
    let visible_only_to_staff = info.visible_only_to_staff;

    console.log("info: " + info);

    if (course_id === undefined || page_id === undefined || 
        (visible_only_to_staff !== true && visible_only_to_staff !== false)) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Page update information not found"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while updating page visibility"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        for (i = 0; i < course.staff.length; i++) {
            if (mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id)) &&
            course.staff[i].is_admin) {
                is_admin = true;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to update course settings"
            })
            res.send(response);
            return;
        }

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(page_id)) {
                course.pages[i].visible_only_to_staff = visible_only_to_staff;
                break;
            }
        }

        let update = {
            pages: course.pages
        }

        Course.updateOne(course_query, update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while updating page visibility"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/delete_course_page', function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let password_input = req.body.password_input || "";

    if (course_id === undefined || page_id === undefined || password_input === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information was not found"
        })
        res.send(response);
        return;
    }

    if (password_input === "") {
        response.errors.push({
            error_type: "password_error",
            error_message: "Please enter a password"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to delete page"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (course.staff[i]._id === current_user._id && course.staff[i].is_admin) {
                is_admin = true;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to delete pages"
            })
            res.send(response);
            return;
        }

        let user_query = {
            _id: current_user._id
        }

        User.findOne(user_query, function(err, user) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error while trying to find your account"
                })
            }

            if (!user) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Your account was not found"
                })
                res.send(response);
                return;
            }

            if (user.password !== password_input) {
                response.errors.push({
                    error_type: "password_error",
                    error_message: "Password incorrect"
                })
                res.send(response);
                return;
            }

            let page_i = 0;
            let page_found = false;
            for (page_i; page_i < course.pages.length; page_i++) {
                console.log();
                console.log(course.pages[page_i]._id);
                console.log(page_id);
                console.log();
                if (mongoose.Types.ObjectId(course.pages[page_i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                    page_found = true;
                    break;
                }
            }

            if (!page_found) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Page to be deleted was not found"
                })
                res.send(response);
                return;
            }

            course.pages.splice(page_i, 1);

            let course_update = {
                pages: course.pages
            }

            Course.updateOne(course_query, course_update, function(err, doc) {
                if (err) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Error while trying to delete page"
                    })
                }

                if (doc.matchedCount === 0) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Course not found"
                    })
                }

                res.send(response);
                return;
            })
        })
    })
})

app.post('/update_course_page_title', function(req, res) {
    let query = JSON.parse(req.body.query) || undefined;
    let update = JSON.parse(req.body.update) || undefined;
    let options = JSON.parse(req.body.options) || undefined;
    let response = {
        errors: []
    }

    if (query === undefined || update === undefined || options === undefined) {
        response.errors.push({
            error_type: "info_not_found",
            error_message: "Update information not found"
        })
        res.send(response);
        return;
    }

    let validation = validateCourseTitle(update);
    console.log("validation:");
    console.log(validation);
    response.errors = validation.errors;
    update = validation.update;

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    console.log();
    console.log("query:");
    console.log(query);
    console.log("update:");
    console.log(update);
    console.log("options:");
    console.log(options);
    console.log();

    Course.updateOne(query, update, options, function(err, course) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Database error occurred"
            })
        }
        
        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course was not found"
            })
        }
        
        res.send(response);
    })
})

app.post("/update_course_page_element", function(req, res) {
    let element = JSON.parse(req.body.element) || undefined;
    let parent_element_id = req.body.parent_element_id || undefined;
    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;

    let response = {
        errors: []
    }

    if (req.session.user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not currently logged in"
        })

        res.send(response);
        return;
    }
    if (element._id === undefined || course_id === undefined || page_id === undefined) {
        response.errors.push({
            error_type: "info_not_found",
            error_message: "Update info not found"
        })

        res.send(response);
        return;
    }

    let query = {
        _id: course_id,
        'page._id': page_id
    }

    let text_block_text = undefined;
    let image_src = undefined;
    let image_caption = undefined;
    let video_src = undefined;
    let video_title = undefined;
    let video_description = undefined;
    let video_thumbnail = undefined;

    console.log("element:");
    console.log(element);

    if (element._id.includes("text_block")) {
        // validate text block
        text_block_text = req.body.text_block_text || "";
        let validation = validateTextBlock(text_block_text);
        response.errors = validation.errors;
        text_block_text = validation.text_block_text;
    }
    else if (element._id.includes("image")) {
        // validate photo src and caption
        console.log("validating image");
        image_src = req.body.image_src || "";
        image_caption = req.body.image_caption || "";
        let validation = validateImage(image_src);
        response.errors = validation.errors;
    }
    else if (element._id.includes("video")) {
        // validate video
        video_src = req.body.video_src || undefined;
        video_title = req.body.video_title || undefined;
        video_description = req.body.video_description || undefined;
        video_thumbnail = req.body.video_thumbnail || undefined;
        let validation = validateVideo(video_src, video_thumbnail, video_title, video_description);
        response.errors = validation.errors;
        video_title = validation.video_title;
        video_description = validation.video_description;
    }

    if (response.errors.length > 0) {
        console.log("response.errors.length > 0");
        console.log(response);
        res.send(response);
        return;
    }

    console.log("video_src: " + video_src);
    console.log("video_title: " + video_title);
    console.log("video_description: " + video_description);
    console.log("video_thumbnail: " + video_thumbnail);

    Course.findOne(query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Database error occurred"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        course.staff.forEach(function(staff_member) {
            if (req.session.user._id === staff_member._id) {
                is_admin = true;
            }
        })

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin of this course to make edits"
            })
            res.send(response);
            return;
        }

        if (element._id.includes("text_block")) {
            response.text = text_block_text;
            element.text = text_block_text;
        }
        else if (element._id.includes("image")) {
            response.image_src = image_src;
            element.image_src = image_src;
            response.caption = image_caption.trim();
            element.caption = image_caption.trim();
        }
        else if (element._id.includes("video")) {
            response.video_src = video_src;
            element.video_src = video_src;
            response.video_thumbnail = video_thumbnail;
            element.thumbnail = video_thumbnail;
            response.video_title = video_title;
            element.title = video_title;
            response.video_description = video_description;
            element.description = video_description;
        }

        for (let i = 0; i < course.pages.length; i++) {
            // If on the current page
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                console.log("DB page found");

                // If the DB page doesn't have a top element, save the element as the top element
                if (course.pages[i].top_element === null) {
                    course.pages[i].top_element = element;
                    break;
                }
                // If the element being added is to be the top element and isn't currently the DB's top element
                else if (mongoose.Types.ObjectId.isValid(parent_element_id) &&
                mongoose.Types.ObjectId(parent_element_id).equals(mongoose.Types.ObjectId(course.pages[i]._id)) &&
                element._id !== course.pages[i].top_element._id) {
                    // Add new top element
                    element.child = course.pages[i].top_element;
                    course.pages[i].top_element = element;
                    break;
                }

                let current_element = course.pages[i].top_element || null;
                let parent_element = undefined;
                let element_found = false;
                let parent_element_found = false;

                // Search for the element being updated/added and its parent element
                while (current_element !== null) {
                    // If the element has been found
                    if (current_element._id === element._id) {
                        element_found = true;

                        // Update element
                        if (element._id.includes("text_block")) {
                            console.log("updating text block");
                            current_element.text = text_block_text;
                        }
                        else if (element._id.includes("image")) {
                            console.log("updating image");
                            current_element.image_src = image_src;
                            current_element.caption = image_caption.trim();
                        }
                        else if (element._id.includes("video")) {
                            console.log("updating video");
                            current_element.video_src = video_src;
                            current_element.title = video_title;
                            current_element.description = video_description;
                            current_element.thumbnail = video_thumbnail;
                        }
                    }
                    // Get parent element of element being added/updated
                    else if (current_element._id === parent_element_id) {
                        parent_element_found = true;
                        parent_element = current_element;
                    }

                    current_element = current_element.child;
                }

                // If the element being added/updated wasn't found in the database
                if (!element_found) {
                    console.log("element was not found in DB");
                    // If the element's parent wasn't found
                    if (!parent_element_found) {
                            console.log("Adding element as the page's last element");
                            // Get the last element on the page
                            while (current_element.child !== null) {
                                current_element = current_element.child;
                            }

                            // Save element as last element on page
                            element.child = null;
                            current_element.child = element;
                    }
                    // If the element's parent was found
                    else {
                        console.log("parent was found");
                        // Add the element as the child of the parent element
                        element.child = parent_element.child;
                        parent_element.child = element;
                    }
                }

                break;
            }
        }

        let update = {
            pages: course.pages
        }

        console.log();
        console.log("update:");
        console.log(update);

        Course.updateOne(query, update, function(err, course) {
            if (err) {
                console.log(err);
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Database error occurred"
                })
            }
    
            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post("/delete_page_element", function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let element_id = req.body.element_id || undefined;

    if (course_id === undefined || page_id === undefined || element_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Element deletion information not found"
        })
        res.send(response);
        return;
    }

    let query = {
        _id: course_id
    }

    Course.findOne(query, function(err, course) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while deleting element"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (course.staff[i]._id === current_user._id && course.staff[i].is_admin) {
                is_admin = true;
                break;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to delete page elements"
            })
            res.send(response);
            return;
        }

        let found = false;

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                if (course.pages[i].top_element !== null) {
                    if (course.pages[i].top_element._id === element_id) {
                        found = true;
                        course.pages[i].top_element = course.pages[i].top_element.child || null;
                    }
                    else {
                        let previous_element = course.pages[i].top_element;
                        let current_element = course.pages[i].top_element.child || null;

                        while (current_element !== null && !found) {
                            if (current_element._id === element_id) {
                                found = true;
                                previous_element.child = current_element.child || null;
                            }

                            previous_element = current_element;
                            current_element = current_element.child;
                        }
                    }
                }

                break;
            }
        }

        if (!found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Element to be deleted was not found"
            })
            res.send(response);
            return;
        }

        let update = {
            pages: course.pages
        }

        response.updated_pages = course.pages;

        Course.updateOne(query, update, function(err, course) {
            if (err) {
                console.log(err);
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while deleting element"
                })
            }
    
            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            res.send(response);
        })
    })
})

app.post("/move_page_element", function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let element_moving_id = req.body.element_moving_id || undefined;
    let direction = req.body.direction || undefined;
    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;

    if (element_moving_id === undefined || direction === undefined || (direction !== "up" && direction !== "down") ||
        course_id === undefined || page_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Info missing"
        })
        res.send(response);
        return;
    }

    let query = {
        _id: course_id
    }

    Course.findOne(query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error while trying to move element"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (course.staff[i]._id === current_user._id && course.staff[i].is_admin) {
                is_admin = true;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to edit page elements"
            })
            res.send(response);
            return;
        }

        let found = false;

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(page_id)) {
                // If elements exist
                if (course.pages[i].top_element !== null) {
                    // If the user is trying to move the top element up, display error message
                    if (course.pages[i].top_element._id === element_moving_id && direction === "up") {
                        found = true;
                        response.errors.push({
                            error_type: "moving_error",
                            error_message: "Cannot move top element up"
                        })
                        res.send(response);
                        return;
                    }
                    // If the top element is not being moved up
                    else {
                        // If moving element up
                        if (direction === "up") {
                            console.log("direction is up");
                            let previous_element = null;
                            let current_element = course.pages[i].top_element;
                            let found = false;
                        
                            while (current_element !== null && !found) {
                                if (current_element.child !== null && current_element.child._id === element_moving_id) {
                                    console.log("element found");
                                    found = true;
                                    let element_moving_up = current_element.child;
                                    let element_moving_down = current_element;
                                    element_moving_down.child = element_moving_up.child || null;
                                    element_moving_up.child = element_moving_down;

                                    if (element_moving_down._id === course.pages[i].top_element._id) {
                                        console.log("element moving down is top element");
                                        course.pages[i].top_element = element_moving_up;
                                    }
                                    else {
                                        console.log("element moving down is not top element");
                                        previous_element.child = element_moving_up;
                                    }
                                }

                                previous_element = current_element;
                                current_element = current_element.child || null;
                            }
                        }
                        // If moving element down
                        else {
                            let previous_element = null;
                            let current_element = course.pages[i].top_element;
                            let found = false;

                            while (current_element !== null && !found) {
                                if (current_element._id === element_moving_id) {
                                    found = true;
                                    // If the element moving down is not the bottom element, move it down one place
                                    if (current_element.child !== null) {
                                        let element_moving_down = JSON.parse(JSON.stringify(current_element));
                                        let element_moving_up = JSON.parse(JSON.stringify(current_element.child));
                                        element_moving_down.child = element_moving_up.child || null;
                                        element_moving_up.child = element_moving_down;

                                        if (element_moving_down._id === course.pages[i].top_element._id) {
                                            course.pages[i].top_element = element_moving_up;
                                        }
                                        else {
                                            previous_element.child = element_moving_up;
                                        }
                                    }
                                    // If the element moving down is the bottom element, disable its move down button
                                    else {
                                        response.errors.push({
                                            error_type: "moving_error",
                                            error_message: "Cannot move the bottom element down"
                                        })
                                    }
                                }
                        
                                previous_element = current_element;
                                current_element = current_element.child;
                            }
                        }
                    }
                }

                break;
            }
        }

        let update = {
            pages: course.pages
        }

        response.updated_pages = course.pages;

        Course.updateOne(query, update, function(err, course) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while moving element"
                })
            }

            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

function validateTextBlock(text) {
    let validation = {
        errors: [],
        text_block_text: text
    }

    if (text === undefined) {
        validation.errors.push({
            error_type: "text_block_error",
            error_message: "Entered text not found"
        })
    }
    else if (text.trim() === "") {
        validation.errors.push({
            error_type: "text_block_error",
            error_message: "Text must not be blank"
        })
    }
    else {
        validation.text_block_text = text.trim().split("\n").join("<br>");
    }

    return validation;
}

function validateImage(src) {
    let validation = {
        errors: []
    }

    if (src === undefined) {
        validation.errors.push({
            error_type: "image_src_error",
            error_message: "Image source not found"
        })
    }
    else if (src.trim() === "" || src === "/images/image_not_found.jpg" ||
    src === "/images/default_image.jpg") {
        validation.errors.push({
            error_type: "image_src_error",
            error_message: "Please upload an image"
        })
    }

    return validation;
}

function validateVideo(video_src, video_thumbnail, video_title, video_description) {
    console.log("Validating video");
    let validation = {
        errors: [],
        video_title: video_title,
        video_description: video_description
    }

    if (video_src === "Select a Video File") {
        validation.errors.push({
            error_type: "video_src_error",
            error_message: "Please select a video"
        })
    }
    else if (video_src === undefined || video_src.trim() === "") {
        validation.errors.push({
            error_type: "video_src_error",
            error_message: "Video source not found"
        })
    }

    if (video_title === undefined) {
        validation.errors.push({
            error_type: "video_title_error",
            error_message: "Video title not found"
        })
    }
    else if (video_title.trim() === "") {
        validation.errors.push({
            error_type: "video_title_error",
            error_message: "Please enter a title"
        })
    }
    else {
        validation.video_title = video_title.trim().split("\n").join("<br>");
    }

    if (video_description === undefined) {
        validation.errors.push({
            error_type: "video_description_error",
            error_message: "Video title not found"
        })
    }
    else if (video_description.trim() === "") {
        validation.errors.push({
            error_type: "video_description_error",
            error_message: "Please enter a description"
        })
    }
    else {
        validation.video_description = video_description.trim().split("\n").join("<br>");
    }

    if (video_thumbnail === undefined || video_thumbnail.trim() === "") {
        validation.errors.push({
            error_type: "video_thumbnail_error",
            error_message: "Video thumbnail not found"
        })
    }

    return validation;
}

function validateCourseTitle(update) {
    let validation = {
        errors: [],
        update: update
    }

    if (update['pages.$[page].title'] === undefined) {
        validation.errors.push({
            error_type: "title_error",
            error_message: "Entered title not found"
        })
    }
    else if (update['pages.$[page].title'].trim() === "") {
        validation.errors.push({
            error_type: "title_error",
            error_message: "Title must not be blank"
        })
    }
    else {
        validation.update['pages.$[page].title'] = update['pages.$[page].title'].trim().split("\n").join("<br>");
    }

    return validation;
}

app.post('/save_template', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You must be logged in to save a template"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id;

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_student = false;
        for (let i = 0; i < course.students.length; i++) {
            if (course.students[i] === current_user._id) {
                is_student = true;
                break;
            }
        }

        if (is_student) {
            let course_pages = [];
            course.pages.forEach(function(page) {
                if (!page.visible_only_to_staff) {
                    course_pages.push(page);
                }
            })

            course.pages = course_pages;
        }

        if (course.pages.length === 0) {
            response.errors.push({
                error_type: "template_error",
                error_message: "Course has no available pages to create template from"
            })
            res.send(response);
            return;
        }

        let template = createTemplate(course);

        let user_query = {
            _id: current_user._id
        }

        User.findOne(user_query, function(err, user) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error while trying to find current user"
                })
                res.send(response);
                return;
            }

            if (!user) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Current user not found"
                })
                res.send(response);
                return;
            }

            let updating_existing_template = false;
            for (let i = 0; i < user.templates.length; i++) {
                if (mongoose.Types.ObjectId(user.templates[i].source_id).equals(mongoose.Types.ObjectId(course._id))) {
                    updating_existing_template = true;
                    response.updating_existing_template = true;
                    template._id = user.templates[i]._id;
                    user.templates[i] = template;
                    break;
                }
            }

            if (!updating_existing_template) {
                template._id = new mongoose.Types.ObjectId();
                user.templates.push(template);
                response.updating_existing_template = false;
            }

            response.template = template;

            let user_update = {
                templates: user.templates
            }

            User.updateOne(user_query, user_update, function(err, doc) {
                if (err) {
                    let error_message = "Error while adding template";
                    if (updating_existing_template) {
                        error_message = "Error while updating template";
                    }
                    response.errors.push({
                        error_type: "db_error",
                        error_message: error_message
                    })
                }

                if (doc.matchedCount === 0) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Current user not found"
                    })
                }

                if (updating_existing_template) {
                    for (let i = 0; i < current_user.templates.length; i++) {
                        if (current_user.templates[i]._id === template._id) {
                            current_user.templates[i] = template;
                        }
                    }
                }
                else {
                    current_user.templates.push(response.template);
                }

                res.send(response);
                return;
            })
        })
    })
})

app.post('/add_template_to_course', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let template_id = req.body.template_id || undefined;

    if (course_id === undefined || template_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Adding template information not found"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error while trying to find current user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Current user not found"
            })
            res.send(response);
            return;
        }

        let template = undefined;
        for (let i = 0; i < user.templates.length; i++) {
            if (mongoose.Types.ObjectId(user.templates[i]._id).equals(mongoose.Types.ObjectId(template_id))) {
                template = user.templates[i];
                template.set = true;
                break;
            }
        }

        if (template === undefined) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Template not found in your Saved Templates"
            })

            res.send(response);
            return;
        }

        let course_query = {
            _id: course_id
        }

        Course.findOne(course_query, function(err, course) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error while trying to find course"
                })
            }

            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            let is_admin = false;
            for (let i = 0; i < course.staff.length; i++) {
                if (mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id)) &&
                course.staff[i].is_admin) {
                    is_admin = true;
                }
            }

            if (!is_admin) {
                response.errors.push({
                    error_type: "user_error",
                    error_message: "You must be an admin to add a template to a course"
                })
                res.send(response);
                return;
            }

            let course_update = {
                template: template
            }

            Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error while updating course template"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            response.template = template;
            res.send(response);
            return;
        })
        })
    })
})

app.post('/remove_course_template', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }
    
    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;

    if (course_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Course information not found"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_admin = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (course.staff[i].is_admin &&
                mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id))) {
                is_admin = true;
            }
        }

        if (!is_admin) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be an admin to remove a template"
            })
            res.send(response);
            return;
        }

        let course_update = {
            template: {
                set: false
            }
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to remove template"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Template could not be removed"
                })
            }

            res.send(response);
            return;
        })
    })
})

function createTemplate(course) {
    convertLoremIpsumToArray();

    course = JSON.parse(JSON.stringify(course));
    delete course.template;
    delete course.created;
    delete course.publicly_listed;
    delete course.students;
    course.pages.forEach(function(page, i) {
        delete page.created;
        delete page.visible_only_to_staff;
    })

    let template = course;
    template.source_id = course._id;
    template.set = true;

    if (course.templates_include_content) {
        template.includes_content = true;
    }
    else {
        template.includes_content = false;
    }

    delete template._id;
    let course_title_array = convertTextToLoremIpsum(course.title);
    course_title_array[course_title_array.length - 1] = course_title_array[course_title_array.length - 1].substring(0, course_title_array[course_title_array.length - 1].length - 1);
    let course_title_lorem_ipsum = "";
    course_title_array.forEach(function(word, i) {
        if (i !== 0 && course_title_array[i] !== '<br>' && course_title_array[i - 1] !== '<br>') {
            course_title_lorem_ipsum += " ";
        }

        course_title_lorem_ipsum += word;
    })
    template.title_lorem_ipsum = course_title_lorem_ipsum;

    let course_description_array = convertTextToLoremIpsum(course.description);
    let course_description_lorem_ipsum = "";
    course_description_array.forEach(function(word, i) {
        if (i !== 0 && course_description_array[i] !== '<br>' && course_description_array[i - 1] !== '<br>') {
            course_description_lorem_ipsum += " ";
        }

        course_description_lorem_ipsum += word;
    })
    template.description_lorem_ipsum = course_description_lorem_ipsum;

    if (!course.templates_include_content) {
        delete template.description;
    }

    template.pages.forEach(function(page, i) {
        console.log("making template of page: " + page.title);
        let title_array = convertTextToLoremIpsum(page.title);

        // Remove full stop from title's last word
        title_array[title_array.length - 1] = title_array[title_array.length - 1].substring(0, title_array[title_array.length - 1].length - 1);
        let title_lorem_ipsum = "";

        title_array.forEach(function(word, i) {
            if (i !== 0 && title_array[i] !== '<br>' && title_array[i - 1] !== '<br>') {
                title_lorem_ipsum += " ";
            }

            title_lorem_ipsum += word;
        })

        page.title_lorem_ipsum = title_lorem_ipsum;

        if (!course.templates_include_content) {
            delete page.title;
        }

        let current_element = page.top_element;
        while (current_element !== null) {
            if (current_element._id.includes("text_block")) {
                let new_id = new mongoose.Types.ObjectId();
                current_element._id = "text_block_" + new_id;
                let text_array = convertTextToLoremIpsum(current_element.text);
                let text_lorem_ipsum = "";

                text_array.forEach(function(word, i) {
                    if (i !== 0 && text_array[i] !== '<br>' && text_array[i - 1] !== '<br>') {
                        text_lorem_ipsum += " ";
                    }

                    text_lorem_ipsum += word;
                })

                current_element.text_lorem_ipsum = text_lorem_ipsum;

                if (!course.templates_include_content) {
                    delete current_element.text;
                }
            }
            else if (current_element._id.includes("image")) {
                let new_id = new mongoose.Types.ObjectId();
                current_element._id = "image_" + new_id;
                if (current_element.caption !== "") {
                    let caption_text_array = convertTextToLoremIpsum(current_element.caption);
                    caption_text_array[caption_text_array.length - 1] = caption_text_array[caption_text_array.length - 1].substring(0, caption_text_array[caption_text_array.length - 1].length - 1);
                    let caption_lorem_ipsum = "";
            
                    caption_text_array.forEach(function(word, i) {
                        if (i !== 0) {
                            caption_lorem_ipsum += " ";
                        }
            
                        caption_lorem_ipsum += word;
                    })
                    
                    current_element.caption_lorem_ipsum = caption_lorem_ipsum;

                    if (!course.templates_include_content) {
                        delete current_element.caption;
                        delete current_element.image_src;
                    }
                }
            }
            else if (current_element._id.includes("video_link")) {
                let new_id = new mongoose.Types.ObjectId();
                current_element._id = "video_link_" + new_id;
                let title_array = convertTextToLoremIpsum(current_element.title);
                title_array[title_array.length - 1] = title_array[title_array.length - 1].substring(0, title_array[title_array.length - 1].length - 1);
                let title_lorem_ipsum = "";

                title_array.forEach(function(word, i) {
                    if (i !== 0) {
                        title_lorem_ipsum += " ";
                    }

                    title_lorem_ipsum += word;
                })

                let description_array = convertTextToLoremIpsum(current_element.description);
                //description_array[description_array.length - 1] = description_array[description_array.length - 1].substring(0, description_array[description_array.length - 1].length - 1);
                let description_lorem_ipsum = "";

                description_array.forEach(function(word, i) {
                    if (i !== 0) {
                        description_lorem_ipsum += " ";
                    }

                    description_lorem_ipsum += word;
                })

                current_element.title_lorem_ipsum = title_lorem_ipsum;
                current_element.description_lorem_ipsum = description_lorem_ipsum;

                if (!course.templates_include_content) {
                    delete current_element.title;
                    delete current_element.description;
                    delete current_element.video_src;
                    delete current_element.thumbnail;
                }

                delete current_element.questions;
                delete current_element.feedback;
                delete current_element.notify;
            }

            current_element = current_element.child;
        }
    })

    delete template.templates_include_content;
    return template;
}

app.post('/get_course', function(req, res) {
    let current_user = req.session.user || undefined;
    let course_id = req.body.course_id || undefined;

    let response = {
        errors: []
    }

    let query = {
        _id: course_id
    }

    Course.findOne(query, function(err, course) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let remove_pages_visible_only_to_staff = false;
        let is_staff = false;

        if (current_user !== undefined) {
            for (i = 0; i < course.staff.length; i++) {
                if (mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id))) {
                    is_staff = true;
                    break;
                }
            }
        }

        if (is_staff) {
            response.pages_which_can_be_included_in_template_count = course.pages.length;
        }
        else {
            let pages_which_can_be_included_in_template_count = 0;
            for (let i = 0; i < course.pages.length; i++) {
                if (!course.pages[i].visible_only_to_staff) {
                    pages_which_can_be_included_in_template_count++;
                }
            }

            response.pages_which_can_be_included_in_template_count = pages_which_can_be_included_in_template_count;
        }

        // If the course is not publicly listed
        if (!course.publicly_listed) {
            // If the current user is not logged in, or they are logged in but are neither student nor staff,
            // set the course as having not been found
            if (current_user === undefined || (!course.students.includes(current_user._id) && !is_staff)) {
                response.course_found = false;
            }
            // If the current user is a student, remove pages visible only to staff
            else if (!is_staff) {
                remove_pages_visible_only_to_staff = true;
            }
        }
        // If the course is publicly listed
        else {
            // If the current user is not logged in or is logged in but is not staff, remove pages visible only to staff
            if (current_user === undefined || (!is_staff && !course.students.includes(current_user._id))) {
                course.pages = [];
            }
            else if (!is_staff) {
                remove_pages_visible_only_to_staff = true;
            }
        }

        if (remove_pages_visible_only_to_staff) {
            let course_pages = [];

            course.pages.forEach(function(page) {
                if (!page.visible_only_to_staff) {
                    course_pages.push(page);
                }
            })

            course.pages = course_pages;
        }

        response.course = course;
        res.send(response);
        return;
    })
})

app.get('/course/:course_id', function(req, res) {
    let current_user = req.session.user || undefined;
    res.render(__dirname + "/public/course_page", { current_user });
})

app.get('/course_not_found', function(req, res) {
    if (req.session.message_html === undefined) {
        res.redirect("/");
        return;
    }

    let current_user = req.session.user || undefined;
    let message = req.session.message_html;
    let message_title = "Course Not Found | Studium";
    delete req.session.message_html;
    res.render(__dirname + "/public/message_page", { message, message_title, current_user });
    return;
})

app.post("/get_current_user", function(req, res) {
    let user = undefined;

    if (req.session.user !== undefined) {
        user = {
            _id: req.session.user._id,
            forename: req.session.user.forename,
            surname: req.session.user.surname,
            username: req.session.user.username,
            avatar_path: req.session.user.avatar_path,
            templates: req.session.user.templates
        }
    }

    res.send(user);
})

app.post("/get_all_users", function(req, res) {
    let response = {
        error: false
    }

    let fields = "username surname forename avatar_path";

    User.find({}, fields, function(err, users) {
        if (err) {
            response.error = true;
        }

        if (users) {
            response.users = users;
        }

        res.send(response);
    })
})

app.post("/update_course_details", function(req, res) {
    let course_details = JSON.parse(req.body.course_details);
    let course_id = course_details.course_id;
    let title = course_details.title;
    let subject = course_details.subject;
    let staff = course_details.staff;
    let start_date = course_details.start_date;
    let description = course_details.description;
    let publicly_listed = course_details.publicly_listed;
    let templates_include_content = course_details.templates_include_content;

    let response = {
        errors: []
    }

    let update = {
        title: title,
        subject: subject,
        staff: staff,
        start_date: start_date,
        description: description,
        publicly_listed: publicly_listed,
        templates_include_content: templates_include_content
    }

    let validation = validateCourseDetails(update);
    response.errors = validation.errors;
    response.title = validation.title;
    title = validation.title;
    response.description = validation.description;
    description = validation.description;

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }

    let query = {
        _id: course_id
    }

    let staff_array = [];
    staff.forEach(function(staff_member) {
        staff_array.push({
            _id: staff_member._id,
            is_teacher: staff_member.is_teacher,
            is_admin: staff_member.is_admin
        })
    })

    update.staff = staff_array;

    Course.findOne(query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Could not find course"
            })
            res.send(response);
            return;
        }

        let db_course_staff_ids = [];
        course.staff.forEach(function(staff_member) {
            db_course_staff_ids.push(staff_member._id);
        })

        let staff_members_being_saved = [];
        let new_staff_member_queries = [];
        update.staff.forEach(function(staff_member) {
            staff_members_being_saved.push(staff_member._id);
            if (!db_course_staff_ids.includes(staff_member._id)) {
                new_staff_member_queries.push({
                    _id: staff_member._id
                })
            }
        })

        let remove_staff_member_queries = [];
        db_course_staff_ids.forEach(function(staff_member_id) {
            if (!staff_members_being_saved.includes(staff_member_id)) {
                remove_staff_member_queries.push({
                    _id: staff_member_id
                })
            }
        })

        if (new_staff_member_queries.length > 0) {
            let new_staff_member_query = {
                $or: new_staff_member_queries
            }

            let new_staff_member_update = {
                $push: {
                    courses_in_charge_of: course_id
                }
            }

            console.log(new_staff_member_query);
    
            User.updateMany(new_staff_member_query, new_staff_member_update, function(err, doc) {
                if (err) {
                    console.log(err);
                }
                
                if (doc.matchedCount === 0) {
                    console.log("Could not update new staff member account(s)");
                }
                else {
                    console.log("Staff member account(s) updated");
                }
            })
        }

        if (remove_staff_member_queries.length > 0) {
            let remove_staff_member_query = {
                $or: remove_staff_member_queries
            }

            let remove_staff_member_update = {
                $pull: {
                    courses_in_charge_of: course_id
                }
            }

            User.updateMany(remove_staff_member_query, remove_staff_member_update, function(err, doc) {
                if (err) {
                    console.log(err);
                }

                if (doc.matchedCount === 0) {
                    console.log("Could not update new staff member account(s)");
                }
                else {
                    console.log("Staff member account(s) updated");
                }
            })
        }

        Course.updateOne(query, update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to update course details"
                })
            }
    
            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Could not update course details"
                })
            }
    
            res.send(response);
            return;
        })
    })
})

app.post("/update_course_enrollment", function(req, res) {
    let current_user = req.session.user;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let info = JSON.parse(req.body.info) || undefined;
    let course_id = info.course_id || undefined;
    let enrolling = info.enrolling;

    if (course_id === undefined || enrolling === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Enrollment information not found"
        })
        res.send(response);
        return;
    }

    console.log("enrolling: ");
    console.log(enrolling);

    let user_query = {
        _id: current_user._id
    }

    let course_query = {
        _id: course_id
    }

    let user_update = {}
    let course_update = {}

    if (enrolling) {
        user_update = {
            $addToSet: {
                enrolled_in: course_id 
            }
        }

        course_update = {
            $addToSet: {
                students: current_user._id
            }
        }
    }
    else {
        user_update = {
            $pull: {
                enrolled_in: course_id
            }
        }

        course_update = {
            $pull: {
                students: current_user._id
            }
        }
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }
        
        if (enrolling && course.students.includes(current_user._id)) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You are already enrolled in this course"
            })
            res.send(response);
            return;
        }
        else if (!enrolling && !course.students.includes(current_user._id)) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You are not a student of this course"
            })
            res.send(response);
            return;
        }

        let is_staff = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (course.staff[i]._id === current_user._id) {
                is_staff = true;
                break;
            }
        }

        if (is_staff) {
            response.errors.push({
                error_type: "user_error",
                error_message: "A staff member cannot enrol in their own course"
            })
            res.send(response);
            return;
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error while trying to update course enrollment"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
                res.send(response);
                return;
            }

            User.updateOne(user_query, user_update, function(err, doc) {
                if (err) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Error while trying to update user enrollment"
                    })
                }
    
                if (doc.matchedCount === 0) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Current user not found"
                    })
                }

                if (enrolling) {
                    req.session.user.enrolled_in.push(course_id);
                }
                else {
                    let found = false;
                    let i = 0;
                    for (i; i < req.session.user.enrolled_in.length; i++) {
                        if (req.session.user.enrolled_in[i] === course_id) {
                            found = true;
                        }
                    }

                    if (found) {
                        req.session.user.enrolled_in.splice(i, 1);
                    }
                }

                res.send(response);
                return;
            })
        })
    })
})

app.post('/delete_course_page', function(req, res) {
    let user_id = undefined;

    if (req.session.user) {
        user_id = req.session.user._id;
    }

    let user_query = {
        _id: user_id,
        password: req.body.password_input || undefined
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            console.log(err);
            res.send({ success: false });
            return;
        }
        
        if (!user) {
            res.send({ passwords_match: false });
        }
        else {
            let course_query = {
                _id: req.body.course_id || undefined
            }

            let course_update = {
                $pull: {
                    pages: {
                        _id: req.body.page_id
                    }
                }
            }

            Course.updateOne(course_query, course_update, function(err, course) {
                if (err) {
                    res.send({ success: false });
                }

                if (!course) {
                    res.send({ success: false });
                }
                else {
                    res.send({ success: true });
                }
            })
        }
    })
})

app.get('/get_random_id', function(req, res) {
    res.send(uuidv4());
})

app.get('/all-courses', function(req, res) {
    let current_user = req.session.user;

    let data = {
        current_user: current_user,
        page_title: "All Available Courses",
        header: "All Available Courses",
        header_helper_icon_text: "Displayed below are links to Studium courses. When you click a course link, you " +
        "will be taken to that course's page."
    }

    res.render(__dirname + "/public/course_list", data)
})

app.post('/get_all_courses', function(req, res) {
    let query = {
        publicly_listed: true
    }

    let response = {
        errors: []
    }

    Course.find(query, '_id title subject start_date', function(err, courses) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find courses"
            })
        }

        if (courses) {
            response.courses = courses;
        }
        
        console.log(response);

        res.send(response);
        return;
    })
})

app.get('/my-courses/enrolled-in', function(req, res) {
    let current_user = req.session.user;

    if (current_user === undefined) {
        let message =
        "<h3>Not Logged In</h3>" +
        "<p>You must be logged in to view courses you are enrolled in.</p>" +
        "<p>Login <a href='/login'>here</a> or register a new account <a href='/register'>here</a>.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
        return;
    }
    else {
        let data = {
            current_user: current_user,
            page_title: "Courses You're Enrolled In",
            header: "Courses You're Enrolled In",
            header_helper_icon_text: "Displayed below are links to Studium courses you are enrolled in. " +
                "When you click a course link, you will be taken to that course's page."
        }

        res.render(__dirname + "/public/course_list", data);
        return;
    }
})

app.get('/my-courses/in-charge-of', function(req, res) {
    let current_user = req.session.user || undefined;

    if (current_user === undefined) {
        let message = 
        "<h3>Not Logged In</h3>" +
        "<p>You must be logged in to view courses you are in charge of.</p>" +
        "<p>Login <a href='/login'>here</a> or register a new account <a href='/register'>here</a>.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
        return;
    }
    else {
        let data = {
            current_user: current_user,
            page_title: "Courses You Are In Charge Of",
            header: "Courses You Are In Charge Of",
            header_helper_icon_text: "Displayed below are links to Studium courses you are in charge of. " +
                "When you click a course link, you will be taken to that course's page."
        }
        res.render(__dirname + "/public/course_list", data);
        return;
    }
})

app.post('/get_user_courses', function(req, res) {
    let current_user = req.session.user;

    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_type = req.body.course_type || undefined;
    
    if (course_type === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Your account was not found"
            })
            res.send(response);
            return;
        }

        if (user[course_type].length === 0) {
            console.log("user[course_type].length === 0");
            response.courses = [];
            res.send(response);
            return;
        }

        let course_queries = [];
        user[course_type].forEach(function(course_id) {

            course_queries.push({
                _id: course_id
            })
        })

        let course_query = {
            $or: course_queries
        }

        Course.find(course_query, '_id title subject start_date', function(err, courses) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to find courses"
                })
            }

            if (!courses) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Could not find courses"
                })
            }
            else {
                response.courses = courses;
            }

            res.send(response);
            return;
        })
    })
})

app.get('/my-templates', function(req, res) {
    let current_user = req.session.user || undefined;

    if (current_user === undefined) {
        let message = 
        "<h3>Not Logged In</h3>" +
        "<p>You must be logged in to view your templates.</p>" +
        "<p>Login <a href='/login'>here</a> or register a new account <a href='/register'>here</a>.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, current_user });
        return;
    }

    res.render(__dirname + "/public/templates_list", { current_user });
    return;
})

app.post("/get_templates", function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "User not found"
            })
            res.send(response);
            return;
        }

        response.templates = user.templates;
        res.send(response);
        return;
    })
})

app.post("/delete_template", function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let template_id = req.body.template_id || undefined;
    console.log(template_id);

    if (template_id === undefined) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    User.findOne(user_query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "User not found"
            })
            res.send(response);
            return;
        }

        let user_update = {
            $pull: {
                templates: {
                    _id: mongoose.Types.ObjectId(template_id)
                }
            }
        }

        console.log(user_update);

        User.updateOne(user_query, user_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to delete template"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Could not delete template"
                })
            }

            console.log(doc);

            res.send(response);
            return;
        })
    })
})

app.get('/generate_id', function(req, res) {
    res.send(new mongoose.Types.ObjectId());
})

app.post('/update_current_user', function(req, res) {
    let user = req.session.user;
    let response = {
        error: false,
        logged_in: true,
        user_not_found: false
    }

    if (!user) {
        response.logged_in = false;
        res.send(response);
    }
    else {
        let query = {
            _id: user._id
        }

        let update = JSON.parse(req.body.update);
        let options = JSON.parse(req.body.options);

        User.findOneAndUpdate(query, update, options, function(err, user) {
            if (err) {
                response.error = true;
            }

            if (!user) {
                response.user_not_found = true;
            }
            else {
                req.session.user = user;
            }

            res.send(response);
        })
    }
})

app.post('/add_or_update_chat_comment', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You must be logged in to post a comment"
        })
        res.send(response);
        return;
    }

    let comment_data = JSON.parse(req.body.comment_data) || undefined;
    let editing_comment = comment_data.editing_comment;
    let course_id = comment_data.course_id || undefined;
    let page_id = comment_data.page_id || undefined;
    let video_link_id = comment_data.video_link_id || undefined;
    let message_tab = comment_data.message_tab || undefined;
    let comment_text = comment_data.comment_text || "";
    let comment_timestamp = undefined;
    let comment_id = undefined;
    let is_reply = undefined;

    if (!editing_comment) {
        comment_timestamp = comment_data.comment_timestamp || undefined;
    }
    else {
        comment_id = comment_data.comment_id || undefined;
        is_reply = comment_data.is_reply || undefined;
    }

    if (course_id === undefined || page_id === undefined || comment_text === undefined || message_tab === undefined ||
        video_link_id === undefined || editing_comment === undefined ||
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback") ||
        (editing_comment && comment_id === undefined && is_reply === undefined) ||
        (!editing_comment && comment_timestamp === undefined)) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }

    if (comment_text.trim() === "") {
        response.errors.push({
            error_type: "comment_error",
            error_message: "Please enter a comment"
        })
        res.send(response);
        return;
    }

    comment_text = comment_text.trim();
    message_tab = message_tab.toLowerCase();
    if (!editing_comment) {
        comment_timestamp = Math.floor(comment_timestamp);
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let video_link_found = false;
        let comment_found = false;
        let comment = {};

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;

                while (current_element !== null && !video_link_found) {
                    if (current_element._id === video_link_id) {
                        video_link_found = true;
                        let staff_array = [];
                        course.staff.forEach(function(staff_member) {
                            staff_array.push(staff_member._id);
                        })

                        if (!editing_comment) {
                            comment = {
                                _id: new mongoose.Types.ObjectId(),
                                author_id: current_user._id,
                                text: comment_text,
                                timestamp: comment_timestamp,
                                posting_time: Date.now(),
                                highlighted_by_staff: false,
                                upvotes: [],
                                downvotes: [],
                                replies: [],
                                users_watching_this_comment: staff_array
                            }

                            current_element[message_tab].push(comment);
                        }
                        else {
                            let comments_array = current_element[message_tab];
                            for (let comment_i = 0; comment_i < comments_array.length; comment_i++) {
                                if (!is_reply) {
                                    if (mongoose.Types.ObjectId(comments_array[comment_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                        comment_found = true;
                                        comment = comments_array[comment_i];
                                        comments_array[comment_i].text = comment_text;
                                        break;
                                    }
                                }
                                else {
                                    for (let reply_i = 0; reply_i < comments_array[comment_i].replies.length; reply_i++) {
                                        if (mongoose.Types.ObjectId(comments_array[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                            comment_found = true;
                                            comment = comments_array[comment_i].replies[reply_i];
                                            comments_array[comment_i].replies[reply_i].text = comment_text;
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        response.comment = comment;
                    }

                    current_element = current_element.child;
                }
                break;
            }
        }

        if (!video_link_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Video was not found"
            })
            res.send(response);
            return;
        }

        if (editing_comment && !comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment was not found"
            })
            res.send(response);
            return;
        }

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while adding comment"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Video not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/delete_chat_comment', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }
    
    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let video_link_id = req.body.video_link_id || undefined;
    let message_tab = req.body.message_tab || undefined;
    let comment_id = req.body.comment_id || undefined;

    if (course_id === undefined || page_id === undefined || video_link_id === undefined || comment_id === undefined ||
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback")) {
        response.errors.push({
            error_type: "db_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }

    message_tab = message_tab.toLowerCase();

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to delete comment"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let video_found = false;
        let comment_found = false;

        for (let page_i = 0; page_i < course.pages.length; page_i++) {
            if (mongoose.Types.ObjectId(course.pages[page_i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[page_i].top_element;

                while (current_element !== null && !video_found) {
                    if (current_element._id === video_link_id) {
                        video_found = true;
                        let comments = current_element[message_tab];
                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            if (mongoose.Types.ObjectId(comments[comment_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                comment_found = true;
                                comments.splice(comment_i, 1);
                                break;
                            }
                            else {
                                for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                    if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                        comment_found = true;
                                        comments[comment_i].replies.splice(reply_i, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }
                break;
            }
        }

        if (!comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment not found"
            })
            res.send(response);
            return;
        }

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to delete comment"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Comment not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/update_comment_vote', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let video_link_id = req.body.video_link_id || undefined;
    let message_tab = req.body.message_tab || undefined;
    let comment_id = req.body.comment_id || undefined;
    let local_comment = JSON.parse(req.body.local_comment) || undefined;
    let vote_type = req.body.vote_type || undefined;

    console.log(local_comment);

    if (course_id === undefined || page_id === undefined || video_link_id === undefined || comment_id === undefined ||
        local_comment === undefined ||
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback") ||
        (vote_type.toLowerCase() !== "upvote" && vote_type.toLowerCase() !== "downvote")) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information for adding notifications not found"
        })
        res.send(response);
        return;
    }

    vote_type = vote_type.toLowerCase();

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to update comment vote"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let video_found = false;
        let comment_found = false;
        let comment = undefined;

        for (let page_i = 0; page_i < course.pages.length; page_i++) {
            if (mongoose.Types.ObjectId(course.pages[page_i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[page_i].top_element;

                while (current_element !== null && !video_found) {
                    if (current_element._id === video_link_id) {
                        video_found = true;
                        let comments = current_element[message_tab];
                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            if (mongoose.Types.ObjectId(comments[comment_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                comment_found = true;
                                comment = comments[comment_i];
                                break;
                            }
                            else {
                                for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                    if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                        comment_found = true;
                                        comment = comments[comment_i].replies[reply_i];
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }
                break;
            }
        }

        if (!comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment not found"
            })
            res.send(response);
            return;
        }

        let comment_updated = false;

        // If the user has clicked the upvote button
        if (vote_type === "upvote") {
            // If the local comment has already been upvoted
            if (local_comment.upvotes.includes(current_user._id)) {
                // remove current user id from upvotes
                if (comment.upvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.upvotes.length; i++) {
                        if (comment.upvotes[i] === current_user._id) {
                            comment.upvotes.splice(i, 1);
                            break;
                        }
                    }
                }
                
                // remove current user id from downvotes
                if (comment.downvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.downvotes.length; i++) {
                        if (comment.downvotes[i] === current_user._id) {
                            comment.downvotes.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            // If the local comment has not already been upvoted
            else {
                // add current user id to upvotes
                if (!comment.upvotes.includes(current_user._id)) {
                    comment_updated = true;
                    comment.upvotes.push(current_user._id);
                }

                // remove current user id from downvotes
                if (comment.downvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.downvotes.length; i++) {
                        if (comment.downvotes[i] === current_user._id) {
                            comment.downvotes.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
        // If the user has clicked the downvote button
        else if (vote_type === "downvote") {
            // If the local comment has already been downvoted
            if (local_comment.downvotes.includes(current_user._id)) {
                // remove current user id from downvotes
                // remove current user id from downvotes
                if (comment.downvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.downvotes.length; i++) {
                        if (comment.downvotes[i] === current_user._id) {
                            comment.downvotes.splice(i, 1);
                            break;
                        }
                    }
                }

                // remove current user id from upvotes
                if (comment.upvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.upvotes.length; i++) {
                        if (comment.upvotes[i] === current_user._id) {
                            comment.upvotes.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            // If the local comment has not already been downvoted
            else {
                // add current user id to downvotes
                if (!comment.downvotes.includes(current_user._id)) {
                    comment_updated = true;
                    comment.downvotes.push(current_user._id);
                }

                // remove current user id from upvotes
                if (comment.upvotes.includes(current_user._id)) {
                    comment_updated = true;
                    for (let i = 0; i < comment.upvotes.length; i++) {
                        if (comment.upvotes[i] === current_user._id) {
                            comment.upvotes.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }

        if (!comment_updated) {
            res.send(response);
            return;
        }

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to update comment vote"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Comment not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/add_notifications_for_new_chat_comment', function(req, res) {
    let response = {
        errors: []
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let video_link_id = req.body.video_link_id || undefined;
    let comment_id = req.body.comment_id || undefined;
    let message_tab = req.body.message_tab || undefined;

    if (course_id === undefined || page_id === undefined || video_link_id === undefined || comment_id === undefined ||
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback")) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information for adding notifications not found"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let page_found = false;
        let video_found = false;
        let comment_author_id = "";

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                console.log("page found");
                page_found = true;

                let current_element = course.pages[i].top_element;
                while (current_element !== null && !video_found) {
                    if (current_element._id === video_link_id) {
                        console.log("video found");
                        video_found = true;
                        let comments_array = current_element[message_tab];
                        for (let i = 0; i < comments_array.length; i++) {
                            console.log(comments_array[i]._id + " !== " + comment_id);
                            if (mongoose.Types.ObjectId(comments_array[i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                console.log("Found comment");
                                comment_author_id = comments_array[i].author_id;
                                console.log("comment author: " + comment_author_id);
                                break;
                            }
                        }
                    }

                    current_element = current_element.child;
                }

                break;
            }
        }

        if (!page_found || !video_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Video not found"
            })
            res.send(response);
            return;
        }

        let users_to_be_notified = [];

        if (message_tab === "questions") {
            course.students.forEach(function(student_id) {
                if (student_id !== comment_author_id) {
                    users_to_be_notified.push(student_id);
                }
            })
        }

        course.staff.forEach(function(staff_member) {
            if (staff_member._id !== comment_author_id) {
                users_to_be_notified.push(staff_member._id);
            }
        })

        if (users_to_be_notified.length === 0) {
            res.send(response);
            return;
        }

        let user_queries = [];

        users_to_be_notified.forEach(function(user) {
            user_queries.push({
                _id: user
            })
        })

        let user_query = {
            $or: user_queries
        }

        User.find(user_query, function(err, users) {
            if (err) {
                console.log(err);
            }

            if (!users) {
                console.log("no users found");
                res.send(response);
                return;
            }

            let users_getting_notification_update = [];
            let users_getting_new_notification = [];
            let notification_id = "";

            users.forEach(function(user) {
                let notification_found = false;
                let notifications_object = user.notifications.new_question_notifications;
                
                if (message_tab === "feedback") {
                    notifications_object = user.notifications.new_feedback_notifications;
                }

                notifications_object.forEach(function(notification) {
                    if (notification.video_link_id === video_link_id && !notification.read) {
                        notification_found = true;
                        notification_id = notification._id;
                        users_getting_notification_update.push({
                            _id: user._id
                        });
                    }
                })

                if (!notification_found) {
                    users_getting_new_notification.push({
                        _id: user._id
                    });
                }
            })

            let users_getting_notification_update_query = {
                $or: users_getting_notification_update
            }

            let users_getting_new_notification_query = {
                $or: users_getting_new_notification
            }

            let notification_field = "new_question_notifications";
            if (message_tab === "feedback") {
                notification_field = "new_feedback_notifications";
            }

            let new_notification_update = {
                $push: {}
            }

            new_notification_update.$push["notifications." + notification_field] = {
                _id: new mongoose.Types.ObjectId(),
                course_id: course_id,
                page_id: page_id,
                video_link_id: video_link_id,
                message_tab: message_tab,
                new_comments: [
                    comment_id
                ],
                read: false
            }

            let update_notification_update = {
                $push: {}
            }

            update_notification_update.$push["notifications." + notification_field + ".$[notification].new_comments"] = comment_id;

            let update_notification_options = {
                arrayFilters: [
                    {
                        "notification._id": notification_id
                    }
                ]
            }

            let new_notification_db_call = User.updateMany(users_getting_new_notification_query, new_notification_update);
            let notification_update_db_call = User.updateMany(users_getting_notification_update_query, update_notification_update,
                update_notification_options);

            let db_call_array = [];
            if (users_getting_new_notification.length > 0) {
                db_call_array.push(new_notification_db_call);
            }

            if (users_getting_notification_update.length > 0) {
                db_call_array.push(notification_update_db_call);
            }

            if (db_call_array.length === 1) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        console.log("Error:");
                        console.log(err);
                    }

                    if (doc.matchedCount === 0) {
                        console.log("Users not found");
                    }

                    res.send(response);
                    return;
                })
            }
            else if (db_call_array.length === 2) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        console.log("Error:");
                        console.log(err);
                    }
                    
                    if (doc.matchedCount === 0) {
                        console.log("Users not found");
                    }

                    db_call_array[1].exec(function(err, doc) {
                        if (err) {
                            console.log("Error:");
                            console.log(err);
                        }

                        if (doc.matchedCount === 0) {
                            console.log("Users not found");
                        }

                        res.send(response);
                        return;
                    })
                })
            }
            else {
                res.send(response);
                return;
            }
        })
    })
})

app.post('/add_new_chat_reply', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You must be logged in to reply to a comment"
        })
        res.send(response);
        return;
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let video_link_id = req.body.video_link_id || undefined;
    let new_reply_text = req.body.new_reply_text || "";
    let comment_being_replied_to = req.body.comment_being_replied_to || undefined;
    let message_tab = req.body.message_tab || undefined;

    console.log("course_id: " + course_id);
    console.log("page_id: " + page_id);
    console.log("video_link_id: " + video_link_id);
    console.log("new_reply_text: " + new_reply_text);
    console.log("comment_being_replied_to: " + comment_being_replied_to);
    console.log("message_tab: " + message_tab);

    if (course_id === undefined || page_id === undefined || video_link_id === undefined || new_reply_text === undefined ||
        comment_being_replied_to === undefined || message_tab === undefined || 
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback")) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information not found"
        })
        res.send(response);
        return;
    }

    if (new_reply_text.trim() === "") {
        response.errors.push({
            error_type: "reply_error",
            error_message: "Please enter some text"
        })
        res.send(response);
        return;
    }

    new_reply_text = new_reply_text.trim();

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let video_link_found = false;
        let comment_being_replied_to_found = false;

        let new_reply = {
            _id: new mongoose.Types.ObjectId(),
            author_id: current_user._id,
            text: new_reply_text,
            posting_time: Date.now(),
            upvotes: [],
            downvotes: [],
            highlighted_by_staff: false
        }

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;

                while (current_element !== null && !video_link_found) {
                    if (current_element._id === video_link_id) {
                        video_link_found = true;

                        let comments = current_element[message_tab];
                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            // If this is the comment being replied to
                            if (mongoose.Types.ObjectId(comments[comment_i]._id).equals(mongoose.Types.ObjectId(comment_being_replied_to))) {
                                console.log("comment found, is top comment");
                                comment_being_replied_to_found = true;
                                new_reply.author_being_replied_to = comments[comment_i].author_id;
                                original_comment_id = comments[comment_i]._id;
                                comments[comment_i].replies.push(new_reply);
                                break;
                            }
                            // If this is not the comment being replied to
                            else {
                                // Look at the comment's replies
                                for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                    // If this is the comment being replied to
                                    if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_being_replied_to))) {
                                        console.log("comment found, is reply");
                                        comment_being_replied_to_found = true;
                                        new_reply.author_being_replied_to = comments[comment_i].replies[reply_i].author_id;
                                        original_comment_id = comments[comment_i]._id;
                                        comments[comment_i].replies.push(new_reply);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }
                break;
            }
        }

        if (!video_link_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Video not found"
            })
            res.send(response);
            return;
        }

        if (!comment_being_replied_to_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment being replied to not found"
            })
            res.send(response);
            return;
        }

        response.new_reply = new_reply;

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                res.errors.push({
                    error_type: "db_error",
                    error_message: "Error while adding reply"
                })
            }

            if (doc.matchedCount === 0) {
                res.errors.push({
                    error_type: "db_error",
                    error_message: "Reply could not be posted"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/add_notifications_for_new_reply', function(req, res) {
    let response = {
        errors: []
    }

    let course_id = req.body.course_id || undefined;
    let page_id = req.body.page_id || undefined;
    let video_link_id = req.body.video_link_id || undefined;
    let reply_id = req.body.reply_id || undefined;
    let message_tab = req.body.message_tab || undefined;
    let comment_being_replied_to = req.body.comment_being_replied_to || undefined;

    console.log("");
    console.log("notification info")
    console.log("course_id: " + course_id);
    console.log("page_id: " + page_id);
    console.log("video_link_id: " + video_link_id);
    console.log("reply_id: " + reply_id);
    console.log("message_tab: " + message_tab);

    if (course_id === undefined || page_id === undefined || video_link_id === undefined || reply_id === undefined ||
        comment_being_replied_to === undefined ||
        (message_tab.toLowerCase() !== "questions" && message_tab.toLowerCase() !== "feedback")) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required information for adding notifications not found"
        })
        res.send(response);
        return;
    }

    message_tab = message_tab.toLowerCase();

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let video_found = false;
        let reply_found = false;
        let users_watching_comment = [];
        let users_receiving_notification = [];
        let original_comment_id = "";
        let author_being_replied_to_id = "";
        let reply_author_id = "";

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;

                while (current_element !== null && !video_found) {
                    if (current_element._id === video_link_id) {
                        video_found = true;
                        let comments = current_element[message_tab];
                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(reply_id))) {
                                    reply_found = true;
                                    original_comment_id = comments[comment_i]._id;
                                    author_being_replied_to_id = comments[comment_i].replies[reply_i].author_being_replied_to;
                                    reply_author_id = comments[comment_i].replies[reply_i].author_id;

                                    // If the user who has posted the reply is not replying to themselves
                                    if (comments[comment_i].replies[reply_i].author_being_replied_to !== comments[comment_i].replies[reply_i].author_id) {
                                        // Notify the user being replied to
                                        users_receiving_notification.push(comments[comment_i].replies[reply_i].author_being_replied_to);
                                    }

                                    // For every user who is watching the original comment
                                    comments[comment_i].users_watching_this_comment.forEach(function(user_id) {
                                        // Get every user watching the original comment
                                        users_watching_comment.push(user_id);
    
                                        // Notify users who are watching the original comment and who aren't the user who has
                                        // posted the reply
                                        if (!users_receiving_notification.includes(user_id) &&
                                            user_id !== comments[comment_i].replies[reply_i].author_id) {
                                            users_receiving_notification.push(user_id);
                                        }
                                    })
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }
                break;
            }
        }

        if (!video_found || !reply_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Reply not found"
            })
            res.send(response);
            return;
        }

        let users_receiving_notification_queries = [];
        users_receiving_notification.forEach(function(user_id) {
            users_receiving_notification_queries.push({
                _id: user_id
            })
        })

        let users_receiving_notification_query = {
            $or: users_receiving_notification_queries
        }

        User.find(users_receiving_notification_query, function(err, users) {
            if (err) {
                console.log(err);
            }

            if (!users) {
                res.send(response);
                return;
            }

            let user_getting_new_notification_for_new_reply = "";
            let user_getting_notification_update_for_new_reply = "";
            let existing_new_reply_notification_id = "";
            let users_getting_new_notification_for_watched_comment_reply = [];
            let users_getting_notification_update_for_watched_comment_reply = [];
            let existing_watched_comment_reply_notification_id = "";

            users.forEach(function(user) {
                // If this user is the author being replied to and is not the current user
                if (mongoose.Types.ObjectId(author_being_replied_to_id).equals(mongoose.Types.ObjectId(user._id))
                    && !mongoose.Types.ObjectId(reply_author_id).equals(mongoose.Types.ObjectId(user._id))) {
                    let new_replies_notifications = user.notifications.new_replies;
                    let update_existing_notification = false;

                    for (let i = 0; i < new_replies_notifications.length; i++) {
                        // If an unread notification exists for a reply to the comment being replied to
                        console.log("comment being replied to: ");
                        console.log(comment_being_replied_to);
                        if (mongoose.Types.ObjectId(new_replies_notifications[i].comment_being_replied_to).equals(mongoose.Types.ObjectId(comment_being_replied_to)) && 
                            !new_replies_notifications[i].read) {
                                console.log("New reply for " + user.username);
                            // Update existing notification
                            update_existing_notification = true;
                            existing_new_reply_notification_id = new_replies_notifications[i]._id;
                            user_getting_notification_update_for_new_reply = user._id;
                        }
                    }

                    // If an unread notification does not exist for a reply to the comment being replied to
                    if (!update_existing_notification) {
                        // A new notification will be created
                        user_getting_new_notification_for_new_reply = user._id;
                    }
                }
                // If this user is watching the comment and is not the reply author
                else if (users_watching_comment.includes(user._id.toString()) &&
                    !mongoose.Types.ObjectId(reply_author_id).equals(mongoose.Types.ObjectId(user._id))) {
                        let watched_comment_notifications = user.notifications.watched_comment_new_replies;
                        let update_existing_notification = false;

                        for (let i = 0; i < watched_comment_notifications.length; i++) {
                            // If an unread watched comment notification exists for the original comment,
                            // update the existing notification
                            if (mongoose.Types.ObjectId(watched_comment_notifications[i].comment_being_replied_to).equals(mongoose.Types.ObjectId(comment_being_replied_to)) &&
                                !watched_comment_notifications[i].read) {
                                console.log("Update existing Watched Comment notification");
                                update_existing_notification = true;
                                existing_watched_comment_reply_notification_id = watched_comment_notifications[i]._id;
                                users_getting_notification_update_for_watched_comment_reply.push({
                                    _id: user._id
                                })
                                break;
                            }
                        }

                        // If an unread watched comment notification does not exist for the original comment
                        if (!update_existing_notification) {
                            // A new notification will be created
                            users_getting_new_notification_for_watched_comment_reply.push({
                                _id: user._id
                            })
                        }
                    }
            })

            // If there are no users to notify, send response
            if (user_getting_new_notification_for_new_reply === "" &&
                user_getting_notification_update_for_new_reply === "" &&
                users_getting_new_notification_for_watched_comment_reply.length === 0 &&
                users_getting_notification_update_for_watched_comment_reply.length === 0) {
                res.send(response);
                return;
            }

            // Users getting new notification for new reply query and update
            let user_getting_new_notification_for_new_reply_query = {
                _id: user_getting_new_notification_for_new_reply
            }

            let user_getting_new_notification_for_new_reply_update = {
                $push: {
                    'notifications.new_replies': {
                        _id: new mongoose.Types.ObjectId(),
                        course_id: course_id,
                        page_id: page_id,
                        video_link_id: video_link_id,
                        comment_being_replied_to: comment_being_replied_to,
                        message_tab: message_tab,
                        new_replies: [reply_id],
                        read: false
                    }
                }
            }

            // Users getting notification update for new reply query, update, and options
            let user_getting_notification_update_for_new_reply_query = {
                _id: user_getting_notification_update_for_new_reply
            }

            let user_getting_notification_update_for_new_reply_update = {
                $push: {
                    'notifications.new_replies.$[notification].new_replies': reply_id
                }
            }

            let user_getting_notification_update_for_new_reply_options = {
                arrayFilters: [
                    {
                        'notification._id': existing_new_reply_notification_id
                    }
                ]
            }

            // Users getting new notification for watched comment reply query and update
            let users_getting_new_notification_for_watched_comment_reply_query = {
                $or: users_getting_new_notification_for_watched_comment_reply
            }

            let users_getting_new_notification_for_watched_comment_reply_update = {
                $push: {
                    'notifications.watched_comment_new_replies': {
                        _id: new mongoose.Types.ObjectId(),
                        course_id: course_id,
                        page_id: page_id,
                        video_link_id: video_link_id,
                        comment_being_replied_to: comment_being_replied_to,
                        new_replies: [reply_id],
                        message_tab: message_tab,
                        read: false
                    }
                }
            }

            // Users getting notification update for watched comment reply query, update, and options
            let users_getting_notification_update_for_watched_comment_reply_query = {
                $or: users_getting_notification_update_for_watched_comment_reply
            }

            let users_getting_notification_update_for_watched_comment_reply_update = {
                $push: {
                    'notifications.watched_comment_new_replies.$[notification].new_replies': reply_id
                }
            }

            let users_getting_notification_update_for_watched_comment_reply_options = {
                arrayFilters: [
                    {
                        'notification._id': existing_watched_comment_reply_notification_id
                    }
                ]
            }

            let new_notification_for_new_reply_db_call = User.updateMany(user_getting_new_notification_for_new_reply_query,
                user_getting_new_notification_for_new_reply_update);

            let notification_update_for_new_reply_db_call = User.updateMany(user_getting_notification_update_for_new_reply_query,
                user_getting_notification_update_for_new_reply_update, user_getting_notification_update_for_new_reply_options);

            let new_notification_for_watched_comment_reply_db_call = User.updateMany(users_getting_new_notification_for_watched_comment_reply_query,
                users_getting_new_notification_for_watched_comment_reply_update);

            let notification_update_for_watched_comment_reply_db_call = User.updateMany(users_getting_notification_update_for_watched_comment_reply_query,
                users_getting_notification_update_for_watched_comment_reply_update,
                users_getting_notification_update_for_watched_comment_reply_options);

            let db_call_array = [];
            if (user_getting_new_notification_for_new_reply !== "") {
                db_call_array.push(new_notification_for_new_reply_db_call);
            }

            if (user_getting_notification_update_for_new_reply !== "") {
                db_call_array.push(notification_update_for_new_reply_db_call);
            }

            if (users_getting_new_notification_for_watched_comment_reply.length > 0) {
                db_call_array.push(new_notification_for_watched_comment_reply_db_call);
            }

            if (users_getting_notification_update_for_watched_comment_reply.length > 0) {
                db_call_array.push(notification_update_for_watched_comment_reply_db_call);
            }

            let error_occurred = false;
            let matched_count_0 = false;

            if (db_call_array.length === 1) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        response.errors.push({
                            error_type: "db_error",
                            error_message: "Error occurred while adding notifications"
                        })
                    }

                    if (doc.matchedCount === 0) {
                        response.errors.push({
                            error_type: "db_error",
                            error_message: "Could not add some notifications"
                        })
                    }

                    res.send(response);
                    return;
                })
            }
            else if (db_call_array.length === 2) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        error_occurred = true;
                    }

                    if (doc.matchedCount === 0) {
                        matched_count_0 = true;
                    }

                    db_call_array[1].exec(function(err, doc) {
                        if (err || error_occurred) {
                            response.errors.push({
                                error_type: "db_error",
                                error_message: "Error occurred while adding notifications"
                            })
                        }
    
                        if (doc.matchedCount === 0 || matched_count_0) {
                            response.errors.push({
                                error_type: "db_error",
                                error_message: "Could not add some notifications"
                            })
                        }

                        res.send(response);
                        return;
                    })
                })
            }
            else if (db_call_array.length === 3) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        error_occurred = true;
                    }

                    if (doc.matchedCount === 0) {
                        matched_count_0 = true;
                    }

                    db_call_array[1].exec(function(err, doc) {
                        if (err) {
                            error_occurred = true;
                        }
    
                        if (doc.matchedCount === 0) {
                            matched_count_0 = true;
                        }

                        db_call_array[2].exec(function(err, doc) {
                            if (err || error_occurred) {
                                response.errors.push({
                                    error_type: "db_error",
                                    error_message: "Error occurred while adding notifications"
                                })
                            }
        
                            if (doc.matchedCount === 0 || matched_count_0) {
                                response.errors.push({
                                    error_type: "db_error",
                                    error_message: "Could not add some notifications"
                                })
                            }

                            res.send(response);
                            return;
                        })
                    })
                })
            }
            else if (db_call_array.length === 4) {
                db_call_array[0].exec(function(err, doc) {
                    if (err) {
                        error_occurred = true;
                    }

                    if (doc.matchedCount === 0) {
                        matched_count_0 = true;
                    }

                    db_call_array[1].exec(function(err, doc) {
                        if (err) {
                            error_occurred = true;
                        }
    
                        if (doc.matchedCount === 0) {
                            matched_count_0 = true;
                        }

                        db_call_array[2].exec(function(err, doc) {
                            if (err) {
                                error_occurred = true;
                            }
        
                            if (doc.matchedCount === 0) {
                                matched_count_0 = true;
                            }

                            db_call_array[3].exec(function(err, doc) {
                                if (err || error_occurred) {
                                    response.errors.push({
                                        error_type: "db_error",
                                        error_message: "Error occurred while adding notifications"
                                    })
                                }
            
                                if (doc.matchedCount === 0 || matched_count_0) {
                                    response.errors.push({
                                        error_type: "db_error",
                                        error_message: "Could not add some notifications"
                                    })
                                }

                                res.send(response);
                                return;
                            })
                        })
                    })
                })
            }
            else {
                res.send(response);
                return;
            }
        })
    })
})

app.post('/watch_or_unwatch_comment', function(req, res) {
    let response = {
        errors: []
    }

    let current_user = req.session.user || undefined;

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let info = JSON.parse(req.body.info) || undefined;
    let course_id = info.course_id || undefined;
    let page_id = info.page_id || undefined;
    let video_link_id = info.video_link_id || undefined;
    let message_tab = info.message_tab || undefined;
    let comment_id = info.comment_id || undefined;
    let watch = info.watch;

    if (info === undefined || course_id === undefined || page_id === undefined || video_link_id === undefined ||
        (message_tab !== "questions" && message_tab !== "feedback") || comment_id === undefined || 
        (watch !== true && watch !== false)) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Required info for setting watch status not found"
        })
        res.send(response);
        return;
    }

    console.log("course_id: " + course_id);
    console.log("page_id: " + page_id);
    console.log("video_link_id: " + video_link_id);
    console.log("message_tab: " + message_tab);
    console.log("comment_id: " + comment_id);
    console.log("watch: " + watch);

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let can_watch_comment = false;

        for (let i = 0; i < course.staff.length; i++) {
            if (mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id))) {
                can_watch_comment = true;
            }
        }

        if (course.students.includes(current_user._id)) {
            can_watch_comment = true;
        }

        if (!can_watch_comment) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be a student of this course or a staff member to watch comments"
            })
            res.send(response);
            return;
        }

        let comment_found = false;
        let video_link_found = false;

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;
                while (current_element !== null && !video_link_found) {
                    if (current_element._id === video_link_id) {
                        console.log("found video");
                        video_link_found = true;
                        let comments = current_element[message_tab];

                        for (let i = 0; i < comments.length; i++) {
                            if (mongoose.Types.ObjectId(comments[i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                console.log("found comment");
                                comment_found = true;
                                if (watch) {
                                    if (!comments[i].users_watching_this_comment.includes(current_user._id)) {
                                        comments[i].users_watching_this_comment.push(current_user._id);
                                    }
                                }
                                else {
                                    let user_i = 0;
                                    let user_watching = false;
                                    for (user_i = 0; user_i < comments[i].users_watching_this_comment.length; user_i++) {
                                        if (comments[i].users_watching_this_comment[user_i] === current_user._id) {
                                            console.log("user is watching comment");
                                            user_watching = true;
                                            break;
                                        }
                                    }

                                    if (user_watching) {
                                        comments[i].users_watching_this_comment.splice(user_i, 1);
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }

                break;
            }
        }

        if (!video_link_found || !comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment not found"
            })
            res.send(response);
            return;
        }

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, course) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to update watch status"
                })
            }

            if (!course) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Course not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/highlight_or_unhighlight_comment', function(req, res) {
    let response = {
        errors: []
    }

    let current_user = req.session.user || undefined;

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in"
        })
        res.send(response);
        return;
    }

    let info = JSON.parse(req.body.info) || undefined;
    let course_id = info.course_id || undefined;
    let page_id = info.page_id || undefined;
    let video_link_id = info.video_link_id || undefined;
    let message_tab = info.message_tab || undefined;
    let comment_id = info.comment_id || undefined;
    let highlight = info.highlight;

    console.log("course_id: " + course_id);
    console.log("page_id: " + page_id);
    console.log("video_link_id: " + video_link_id);
    console.log("message_tab: " + message_tab);
    console.log("comment_id: " + comment_id);
    console.log("highlight: " + highlight);

    if (info === undefined || course_id === undefined || page_id === undefined || video_link_id === undefined ||
        (message_tab !== "questions" && message_tab !== "feedback") || comment_id === undefined ||
        (highlight !== true && highlight !== false)) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Information required for highlighting/unhighlighting comment not found"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while finding course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let is_staff = false;
        for (let i = 0; i < course.staff.length; i++) {
            if (mongoose.Types.ObjectId(course.staff[i]._id).equals(mongoose.Types.ObjectId(current_user._id))) {
                is_staff = true;
            }
        }

        if (!is_staff) {
            response.errors.push({
                error_type: "user_error",
                error_message: "You must be a member of staff to highlight/unhighlight comments"
            })
            res.send(response);
            return;
        }

        let comment_found = false;
        let commenter_is_staff = false;

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;
                while (current_element !== null && !comment_found) {
                    if (current_element._id === video_link_id) {
                        console.log("video found");
                        let comments = current_element[message_tab];

                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            if (mongoose.Types.ObjectId(comments[comment_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                console.log("comment found");
                                comment_found = true;

                                course.staff.forEach(function(staff_member) {
                                    if (mongoose.Types.ObjectId(comments[comment_i].author_id).equals(mongoose.Types.ObjectId(staff_member._id))) {
                                        commenter_is_staff = true;
                                    }
                                })

                                if (highlight && !comments[comment_i].highlighted_by_staff) {
                                    comments[comment_i].highlighted_by_staff = true;
                                }
                                else if (!highlight && comments[comment_i].highlighted_by_staff) {
                                    comments[comment_i].highlighted_by_staff = false;
                                }

                                break;
                            }
                            else {
                                for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                    if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                        comment_found = true;

                                        course.staff.forEach(function(staff_member) {
                                            if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i].author_id).equals(mongoose.Types.ObjectId(staff_member._id))) {
                                                commenter_is_staff = true;
                                            }
                                        })
                                        
                                        if (highlight && !comments[comment_i].replies[reply_i].highlighted_by_staff) {
                                            comments[comment_i].replies[reply_i].highlighted_by_staff = true;
                                        }
                                        else if (!highlight && comments[comment_i].replies[reply_i].highlighted_by_staff) {
                                            comments[comment_i].replies[reply_i].highlighted_by_staff = false;
                                        }

                                        break;
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }

                break;
            }
        }

        if (!comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment not found"
            })
            res.send(response);
            return;
        }

        if (commenter_is_staff) {
            response.errors.push({
                error_type: "user_error",
                error_message: "Cannot highlight comments made by staff members"
            })
            res.send(response);
            return;
        }

        let course_update = {
            pages: course.pages
        }

        Course.updateOne(course_query, course_update, function(err, doc) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while updating comment"
                })
            }

            if (doc.matchedCount === 0) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Comment not found"
                })
            }

            res.send(response);
            return;
        })
    })
})

app.post('/add_highlighted_comment_notification', function(req, res) {
    let response = {
        errors: []
    }

    let info = JSON.parse(req.body.info) || undefined;
    let course_id = info.course_id || undefined;
    let page_id = info.page_id || undefined;
    let video_link_id = info.video_link_id || undefined;
    let message_tab = info.message_tab || undefined;
    let comment_id = info.comment_id || undefined;
    let highlight = info.highlight;

    console.log("course_id: " + course_id);
    console.log("page_id: " + page_id);
    console.log("video_link_id: " + video_link_id);
    console.log("message_tab: " + message_tab);
    console.log("comment_id: " + comment_id);
    console.log("highlight: " + highlight);

    if (info === undefined || course_id === undefined || page_id === undefined || video_link_id === undefined ||
        (message_tab !== "questions" && message_tab !== "feedback") || comment_id === undefined ||
        (highlight !== true && highlight !== false)) {
        response.errors.push({
            error_type: "info_error",
            error_message: "Information required for highlighting/unhighlighting comment not found"
        })
        res.send(response);
        return;
    }

    let course_query = {
        _id: course_id
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while finding course"
            })
        }

        if (!course) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Course not found"
            })
            res.send(response);
            return;
        }

        let comment_found = false;
        let highlighted_comment_author = "";

        for (let i = 0; i < course.pages.length; i++) {
            if (mongoose.Types.ObjectId(course.pages[i]._id).equals(mongoose.Types.ObjectId(page_id))) {
                let current_element = course.pages[i].top_element;

                while (current_element !== null && !comment_found) {
                    if (current_element._id === video_link_id) {
                        console.log("video found");
                        let comments = current_element[message_tab];

                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                            if (mongoose.Types.ObjectId(comments[comment_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                console.log("comment found");
                                comment_found = true;
                                highlighted_comment_author = comments[comment_i].author_id;
                                break;
                            }
                            else {
                                for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                    if (mongoose.Types.ObjectId(comments[comment_i].replies[reply_i]._id).equals(mongoose.Types.ObjectId(comment_id))) {
                                        console.log("comment found");
                                        comment_found = true;
                                        highlighted_comment_author = comments[comment_i].replies[reply_i].author_id;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    current_element = current_element.child;
                }

                break;
            }
        }

        if (!comment_found) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment not found"
            })
            res.send(response);
            return;
        }

        if (highlighted_comment_author === "" || highlighted_comment_author === undefined) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Comment author not found"
            })
            res.send(response);
            return;
        }

        let user_query = {
            _id: highlighted_comment_author
        }

        User.findOne(user_query, function(err, user) {
            if (err) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while finding user"
                })
            }

            if (!user) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "User not found"
                })
                res.send(response);
                return;
            }

            let notification_exists = false;
            let notification_id = "";
            let highlighted_comment_notifications = user.notifications.highlighted_comment_notifications;
            for (let i = 0; i < highlighted_comment_notifications.length; i++) {
                if (highlighted_comment_notifications[i].highlighted_comment === comment_id) {
                    notification_exists = true;
                    notification_id = highlighted_comment_notifications[i]._id;
                }
            }

            if ((!notification_exists && !highlight) || (notification_exists && highlight)) {
                res.send(response);
                return;
            }

            let user_query = {
                _id: highlighted_comment_author
            }

            let user_update = {}

            if (highlight) {
                user_update.$push = {
                    'notifications.highlighted_comment_notifications': {
                        _id: new mongoose.Types.ObjectId(),
                        course_id: course_id,
                        page_id: page_id,
                        video_link_id: video_link_id,
                        message_tab: message_tab,
                        highlighted_comment: comment_id,
                        date: Date.now(),
                        read: false
                    }
                }
            }
            else {
                user_update = {
                    $pull: {
                        'notifications.highlighted_comment_notifications': {
                            _id: notification_id
                        }
                    }
                }
            }

            User.updateOne(user_query, user_update, function(err, doc) {
                if (err) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Error occurred while adding notification"
                    })
                }

                if (doc.matchedCount === 0) {
                    response.errors.push({
                        error_type: "db_error",
                        error_message: "Notification not added"
                    })
                }

                res.send(response);
                return;
            })
        })
    })
})

app.post('/set_all_notifications_as_read', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        res.errors.push({
            error_type: "user_error",
            error_message: "Cannot set notifications as read, user is not logged in"
        })
        res.send(response);
        return;
    }

    let user_query = {
        _id: current_user._id
    }

    let user_update = {
        $set: {
            'notifications.new_question_notifications.$[notification].read': true,
            'notifications.new_feedback_notifications.$[notification].read': true,
            'notifications.new_replies.$[notification].read': true,
            'notifications.watched_comment_new_replies.$[notification].read': true,
            'notifications.highlighted_comment_notifications.$[notification].read': true
        }
    }

    let user_options = {
        arrayFilters: [
            {
                'notification.read': false
            }
        ]
    }

    User.updateOne(user_query, user_update, user_options, function(err, doc) {
        if (err) {
            console.log(err);
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to set all notifications as read"
            })
        }

        if (doc.matchedCount === 0) {
            response.errors.push({
                error_type: "db_error",
                error_message: "User not found while trying to set all notifications as read"
            })
        }

        res.send(response);
        return;
    })
})

app.post('/delete_notification', function(req, res) {
    let current_user = req.session.user || undefined;
    let response = {
        errors: []
    }

    if (current_user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "You are not logged in, cannot remove notification"
        })
        res.send(response);
        return;
    }

    let notification_id = req.body.notification_id || undefined;
    let notification_type = req.body.notification_type || undefined;

    if (notification_id === undefined || (notification_type !== "new_questions_notification" &&
    notification_type !== "new_feedback_notification") && notification_type !== "new_replies" &&
    notification_type !== "watched_comment_new_replies" && notification_type !== "highlighted_comment_notification") {
        response.errors.push({
            error_type: "info_error",
            error_message: "Notification information not found"
        })
        res.send(response);
        return;
    }

    let notification_types = {
        "new_questions_notification": "new_question_notifications",
        "new_feedback_notification": "new_feedback_notifications",
        "new_replies": "new_replies",
        "watched_comment_new_replies": "watched_comment_new_replies",
        "highlighted_comment_notification": "highlighted_comment_notifications"
    }

    let user_query = {
        _id: current_user._id
    }

    let user_update = {
        $pull: {}
    }

    user_update.$pull['notifications.' + notification_types[notification_type]] = {
        _id: notification_id
    }

    User.updateOne(user_query, user_update, function(err, doc) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to remove notification"
            })
        }

        if (doc.matchedCount === 0) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Notification not found"
            })
        }

        res.send(response);
        return;
    })
})

app.post('/get_notifications', function(req, res) {
    let response = {
        errors: [],
        notifications: {}
    }

    if (req.session.user === undefined) {
        response.errors.push({
            error_type: "user_error",
            error_message: "User not logged in"
        })
        res.send(response);
        return;
    }

    let query = {
        _id: req.session.user._id
    }

    User.findOne(query, function(err, user) {
        if (err) {
            response.errors.push({
                error_type: "db_error",
                error_message: "Error occurred while trying to find user"
            })
        }

        if (!user) {
            response.errors.push({
                error_type: "db_error",
                error_message: "User not found"
            })
            res.send(response);
            return;
        }

        let user_being_notified = JSON.parse(JSON.stringify(user));
        req.session.user = user_being_notified;

        if (user_being_notified.notifications.new_question_notifications.length === 0 &&
            user_being_notified.notifications.new_feedback_notifications.length === 0 &&
            user_being_notified.notifications.new_replies.length === 0 &&
            user_being_notified.notifications.watched_comment_new_replies.length === 0 &&
            user_being_notified.notifications.highlighted_comment_notifications.length === 0) {
            response.notifications = [];
            res.send(response);
            return;
        }

        let course_ids = [];
        let notifications = [];

        user_being_notified.notifications.new_question_notifications.forEach(function(notification) {
            notification.notification_type = "new_questions_notification";
            notifications.push(notification);
            if (!course_ids.includes(notification.course_id)) {
                course_ids.push(notification.course_id);
            }
        })

        user_being_notified.notifications.new_feedback_notifications.forEach(function(notification) {
            notification.notification_type = "new_feedback_notification";
            notifications.push(notification);
            if (!course_ids.includes(notification.course_id)) {
                course_ids.push(notification.course_id);
            }
        })

        user_being_notified.notifications.new_replies.forEach(function(notification) {
            notification.notification_type = "new_replies";
            notifications.push(notification);
            if (!course_ids.includes(notification.course_id)) {
                course_ids.push(notification.course_id);
            }
        })

        user_being_notified.notifications.watched_comment_new_replies.forEach(function(notification) {
            notification.notification_type = "watched_comment_new_replies";
            notifications.push(notification);
            if (!course_ids.includes(notification.course_id)) {
                course_ids.push(notification.course_id);
            }
        })

        user_being_notified.notifications.highlighted_comment_notifications.forEach(function(notification) {
            notification.notification_type = "highlighted_comment_notification";
            notifications.push(notification);
            if (!course_ids.includes(notification.course_id)) {
                course_ids.push(notification.course_id);
            }
        })

        if (course_ids.length === 0) {
            res.send(response);
            return;
        }

        let course_queries = [];

        course_ids.forEach(function(course_id) {
            course_queries.push({
                _id: course_id
            })
        })

        let course_query = {
            $or: course_queries
        }

        Course.find(course_query, function(err, courses) {
            if (err) {
                console.log(err);
                response.errors.push({
                    error_type: "db_error",
                    error_message: "Error occurred while trying to find course"
                })
            }

            if (!courses) {
                response.errors.push({
                    error_type: "db_error",
                    error_message: "No courses found"
                })
                res.send(response);
                return;
            }

            notifications.forEach(function(notification) {
                let comment_ids = [];
                let comment_being_replied_to = "";
                let highlighted_comment = "";
                
                if (notification.notification_type === "new_questions_notification" ||
                    notification.notification_type === "new_feedback_notification") {
                    comment_ids = notification.new_comments;
                    notification.new_comments = [];
                }
                else if (notification.notification_type === "new_replies" ||
                    notification.notification_type === "watched_comment_new_replies") {
                    comment_ids = notification.new_replies;
                    comment_being_replied_to = notification.comment_being_replied_to;
                    comment_ids.push(notification.comment_being_replied_to);
                    notification.new_replies = [];
                    notification.comment_being_replied_to = [];
                }
                else if (notification.notification_type === "highlighted_comment_notification") {
                    comment_ids.push(notification.highlighted_comment);
                    highlighted_comment = notification.highlighted_comment;
                    notification.highlighted_comment = [];
                }

                // Get the course title
                for (let course_i = 0; course_i < courses.length; course_i++) {
                    if (mongoose.Types.ObjectId(notification.course_id).equals(mongoose.Types.ObjectId(courses[course_i]._id))) {
                        notification.course_title = courses[course_i].title;

                        // Get the page title
                        for (let page_i = 0; page_i < courses[course_i].pages.length; page_i++) {
                            if (notification.notification_type === "highlighted_comment_notification") {
                                console.log(mongoose.Types.ObjectId(courses[course_i].pages[page_i]._id) + " !== " + (mongoose.Types.ObjectId(notification.page_id)))
                            }
                            if (mongoose.Types.ObjectId(courses[course_i].pages[page_i]._id).equals(mongoose.Types.ObjectId(notification.page_id))) {
                                notification.page_title = courses[course_i].pages[page_i].title;

                                // Get video title
                                let video_found = false;
                                let current_element = courses[course_i].pages[page_i].top_element;
                                while (current_element !== null && !video_found) {
                                    if (current_element._id === notification.video_link_id) {
                                        video_found = true;
                                        notification.video_title = current_element.title;
                                        
                                        let comments = current_element[notification.message_tab];
                                        for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                                            if (comment_ids.includes(comments[comment_i]._id.toString())) {
                                                if (notification.notification_type === "new_questions_notification" ||
                                                    notification.notification_type === "new_feedback_notification") {
                                                    notification.new_comments.push({
                                                        _id: comments[comment_i]._id,
                                                        text: comments[comment_i].text,
                                                        posting_time: comments[comment_i].posting_time,
                                                        author_id: comments[comment_i].author_id
                                                    })
                                                }
                                                else if (notification.notification_type === "new_replies" ||
                                                    notification.notification_type === "watched_comment_new_replies") {
                                                    if (comments[comment_i]._id.toString() === comment_being_replied_to) {
                                                        notification.comment_being_replied_to = {
                                                            _id: comments[comment_i]._id,
                                                            text: comments[comment_i].text,
                                                            author_id: comments[comment_i].author_id
                                                        }
                                                    }
                                                }
                                                else if (notification.notification_type === "highlighted_comment_notification") {
                                                    if (comments[comment_i]._id.toString() === highlighted_comment) {
                                                        notification.highlighted_comment = {
                                                            _id: comments[comment_i]._id,
                                                            text: comments[comment_i].text
                                                        }
                                                    }
                                                }
                                            }

                                            for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                                                if (comment_ids.includes(comments[comment_i].replies[reply_i]._id.toString())) {
                                                    if (notification.notification_type === "new_replies" ||
                                                        notification.notification_type === "watched_comment_new_replies") {

                                                        if (comments[comment_i].replies[reply_i]._id.toString() === comment_being_replied_to) {
                                                            notification.comment_being_replied_to = {
                                                                _id: comments[comment_i].replies[reply_i]._id,
                                                                text: comments[comment_i].replies[reply_i].text,
                                                                author_id: comments[comment_i].replies[reply_i].author_id
                                                            }
                                                        }
                                                        else {
                                                            notification.new_replies.push({
                                                                _id: comments[comment_i].replies[reply_i]._id,
                                                                text: comments[comment_i].replies[reply_i].text,
                                                                posting_time: comments[comment_i].replies[reply_i].posting_time,
                                                                author_id: comments[comment_i].replies[reply_i].author_id
                                                            })
                                                        }
                                                    }
                                                    else if (notification.notification_type === "highlighted_comment_notification") {
                                                        if (comments[comment_i].replies[reply_i]._id.toString() === highlighted_comment) {
                                                            notification.highlighted_comment = {
                                                                _id: comments[comment_i].replies[reply_i]._id,
                                                                text: comments[comment_i].replies[reply_i].text
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    current_element = current_element.child;
                                }

                                break;
                            }
                        }

                        break;
                    }
                }
            })

            response.notifications = notifications;
            res.send(response);
            return;
        })
    })
})

app.post('/get_basic_user_details', function(req, res) {
    let user_ids = req.body.user_ids || undefined;

    let response = {
        error: false,
        users: []
    }

    if (user_ids === undefined || user_ids.length === 0) {
        res.send(response);
        return;
    }

    let user_id_queries = [];

    user_ids.forEach(function(user_id) {
        user_id_queries.push({
            _id: user_id
        })
    })

    let query = {
        $or: user_id_queries
    }

    let properties = "username forename surname avatar_path";

    User.find(query, properties, function(err, users) {
        if (err) {
            console.log(err);
            response.error = true;
        }

        if (!users) {
            console.log("No users found");
            response.error = true;
        }
        else {
            response.users = users;
        }

        res.send(response);
    })
})

app.post('/message_page', function(req, res) {
    let current_user = req.session.user || undefined;
    let message = req.body.error_message;
    let message_title = req.body.error_title;
    res.render(__dirname + "/public/message_page", { message, message_title, current_user });
})

app.use(function(req, res, next) {
    let current_user = req.session.user || undefined;
    let message = 
    "<h3>Page Not Found</h3>" +
    "<p>Sorry, the page you requested was not found.</p>";
    let message_title = "Page Not Found | Studium";
    res.render(__dirname + "/public/message_page", { message, message_title, current_user });
})

function validateRegisterInput(input) {
    let validation = {
        errors: [],
        email: input.email,
        username: input.username,
        forename: input.forename,
        surname: input.surname,
        password: input.password,
        confirm_password: input.confirm_password
    }

    let email_validation = validateEmail(input.email);
    let username_validation = validateUsername(input.username);
    let name_validation = validateName(input.forename, input.surname);
    let password_validation = validatePassword(input.password, input.confirm_password, false);

    if (email_validation.errors.length > 0) {
        email_validation.errors.forEach(function(error) {
            validation.errors.push(error);
        })
    }
    else {
        validation.email = email_validation.email;
    }

    if (username_validation.errors.length > 0) {
        username_validation.errors.forEach(function(error) {
            validation.errors.push(error);
        })
    }
    else {
        validation.username = username_validation.username;
    }

    if (name_validation.errors.length > 0) {
        name_validation.errors.forEach(function(error) {
            validation.errors.push(error);
        })
    }
    else {
        validation.forename = name_validation.forename;
        validation.surname = name_validation.surname;
    }

    if (password_validation.errors.length > 0) {
        password_validation.errors.forEach(function(error) {
            validation.errors.push(error);
        })
    }
    else {
        validation.password = password_validation.password;
    }

    return validation;
}

function validateLoginInput(input) {
    let validation = {
        errors: []
    }

    if (input.username === undefined || input.username.trim() === "") {
        validation.errors.push({
            error_type: "username_error",
            error_message: "Please enter a username"
        })
    }

    if (input.password === undefined || input.password.trim() === "") {
        validation.errors.push({
            error_type: "password_error",
            error_message: "Please enter a password"
        })
    }

    return validation;
}

function validateCourseStartDateInput(start_date) {
    if (start_date === undefined || start_date === "" || !checkIfDateIsValid(start_date)) {
        return {
            error_type: "start_date_error",
            error_message: "Please select a valid date"
        }
    }

    let current_date = new Date();
    current_date.setHours(6, 0, 0, 0);
    let current_day = current_date.getUTCDate();
    let current_month = current_date.getUTCMonth() + 1;
    let current_year = current_date.getUTCFullYear();

    let converted_start_date = new Date(start_date);
    converted_start_date.setHours(6, 0, 0, 0);

    let max_day = current_day;
    let max_month = current_month;
    let max_year = current_year + 5;

    if (max_day < 10) {
        max_day = "0" + max_day;
    }

    if (max_month < 10) {
        max_month = "0" + max_month;
    }

    if (max_month === "02" && max_day === 29 && !getIsLeapYear(max_year)) {
        max_day = 28;
    }

    let converted_max_start_date = new Date(max_year + "-" + max_month + "-" + max_day);
    converted_max_start_date.setHours(6, 0, 0, 0);

    if (converted_start_date < current_date) {
        return {
            error_type: "start_date_error",
            error_message: "The start date cannot be before the current date"
        }
    }
    else if (converted_start_date > converted_max_start_date) {
        return {
            error_type: "start_date_error",
            error_message: "The start date cannot be more than 5 years after the current date"
        }
    }
    
    return null;
}

function checkIfTextIsAllNumbers(text) {
    console.log("check if text is all numbers: " + text);
    let regex=/^[0-9]+$/;
    return regex.test(text);
}

function checkIfDateIsValid(text) {
    if (text.length === 10 && checkIfTextIsAllNumbers(text.split("-").join("")) &&
        text.split("-").join("").length === 8 && text[4] === "-" && text[7] === "-") {
        let months_with_30_days = [4, 6, 9, 11];
        
        try {
            let converted_start_date = new Date(text);
            let start_day = converted_start_date.getUTCDate();
            let start_month = converted_start_date.getUTCMonth() + 1;
            let start_year = converted_start_date.getUTCFullYear();
            let start_year_is_leap_year = getIsLeapYear(start_year);

            if ((months_with_30_days.includes(start_month) && start_day > 30) ||
            (start_month === 2 && start_day === 29 && !start_year_is_leap_year) ||
            start_day < 1 || start_day > 31 || isNaN(start_day) || isNaN(start_month) || isNaN(start_year)) {
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            return false;
        }
    }
    else {
        return false;
    }
}

function getIsLeapYear(year) {
    if (year % 4 === 0) {
        if (year % 100 === 0) {
            if (year % 400 === 0) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }

    return false
}

function validateCourseDetails(input) {
    let validation = {
        errors: [],
        title: "",
        description: ""
    }

    if (input.title === undefined || input.title.trim() === "") {
        validation.errors.push({
            error_type: "title_error",
            error_message: "Please enter a course title"
        })
    }
    else {
        validation.title = input.title.trim().split("\n").join("<br>");
    }

    if (input.subject === undefined || input.subject === "" || !course_subjects.includes(input.subject)) {
        validation.errors.push({
            error_type: "subject_error",
            error_message: "Please select a subject"
        })
    }

    if (input.description === undefined || input.description.trim() === "") {
        validation.errors.push({
            error_type: "description_error",
            error_message: "Please enter a course description"
        })
    }
    else {
        validation.description = input.description.trim().split("\n").join("<br>");
    }

    if (input.staff === undefined || input.staff.length === 0) {
        validation.errors.push({
            error_type: "staff_error",
            error_message: "Please select at least one admin user"
        })
    }
    else {
        let admin_count = 0;
        let unassigned_staff = false;
        let staff_ids = [];
        let repeated_staff = false;

        for (let i = 0; i < input.staff.length; i++) {
            if (!staff_ids.includes(input.staff[i]._id)) {
                staff_ids.push(input.staff[i]._id);
            }
            else {
                repeated_staff = true;
                break;
            }

            if (input.staff[i].is_admin) {
                admin_count++;
            }
            else if (!input.staff[i].is_teacher) {
                unassigned_staff = true;
                break;
            }
        }

        if (unassigned_staff) {
            validation.errors.push({
                error_type: "staff_error",
                error_message: "Please assign at least one role to each staff member"
            })
        }
        else if (repeated_staff) {
            validation.errors.push({
                error_type: "staff_error",
                error_message: "Please do not add a staff member more than once"
            })
        }
        else if (admin_count === 0) {
            validation.errors.push({
                error_type: "staff_error",
                error_message: "Please select at least one admin user"
            })
        }
    }

    let course_start_date_input_error = validateCourseStartDateInput(input.start_date);

    if (course_start_date_input_error !== null) {
        validation.errors.push(course_start_date_input_error);
    }

    if (input.publicly_listed === undefined || (input.publicly_listed !== true && input.publicly_listed !== false)) {
        validation.errors.push({
            error_type: "publicly_listed_error",
            error_message: "Error getting chosen option"
        })
    }

    if (input.templates_include_content === undefined ||
        (input.templates_include_content !== true && input.templates_include_content !== false)) {
            validation.errors.push({
                error_type: "templates_include_content_error",
                error_message: "Error getting chosen option"
            })
    }

    return validation;
}

let lorem_ipsum_array = [];

let lorem_ipsum = "lorem ipsum dolor sit amet consectetur adipiscing elit nulla purus odio aliquet at sagittis et pellentesque " +
"eget dui nullam non felis volutpat posuere eros nec tristique erat donec posuere imperdiet placerat etiam vitae dolor in metus " +
"auctor gravida id eget justo lorem ipsum dolor sit amet consectetur adipiscing elit aliquam mattis augue in tempor vulputate " +
"purus enim cursus nisl eget iaculis tortor neque vel quam fusce feugiat varius libero vitae elementum lorem cursus eu praesent " +
"leo augue cursus auctor tristique nec ultricies vitae elit etiam eleifend efficitur erat ut viverra nibh feugiat vel donec " +
"porttitor neque a bibendum facilisis morbi scelerisque diam nec ipsum eleifend euismod praesent ullamcorper magna at aliquam " +
"vestibulum nisl diam mattis mi cursus feugiat leo enim a libero cras porta egestas felis ac ullamcorper libero tincidunt " +
"congue aliquam egestas sapien a neque lobortis finibus duis ultricies mi vitae tempus tincidunt est ante varius sapien nec " +
"pharetra urna felis vel dolor pellentesque scelerisque elit non urna viverra varius ultrices elit pellentesque aliquam orci " +
"urna tincidunt quis odio sed vestibulum commodo nunc cras id dictum nunc non maximus purus aenean scelerisque nisi metus quis " +
"gravida purus suscipit eu duis id mi risus pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis " +
"egestas sed at congue velit aliquam tellus enim auctor ut vehicula quis tincidunt id mi in aliquam volutpat urna vel lacinia " +
"phasellus semper massa sit amet lobortis cursus nam sed dui molestie tempus urna at sodales justo aenean ullamcorper tempus " +
"tristique nulla tellus orci malesuada eu tempus sit amet placerat at mi praesent pulvinar vitae magna nec venenatis ut risus " +
"arcu accumsan non mauris eget gravida consequat leo donec fermentum nibh leo quis finibus neque ullamcorper eu phasellus neque " +
"purus venenatis id quam et dictum lacinia quam suspendisse mattis magna sed justo elementum quis ullamcorper ligula faucibus " +
"etiam congue volutpat turpis ut consectetur pellentesque eu sem sem sed nec libero vitae lacus commodo lobortis phasellus ex " +
"diam tempus et ex pulvinar volutpat ultricies leo morbi leo neque varius vel nisl non efficitur dictum leo etiam nec mattis " +
"magna ut lobortis leo sit amet elit dictum ac bibendum neque tristique donec orci risus rhoncus ac metus ut porta convallis " +
"sem vivamus diam odio ultricies vitae ultricies in tristique quis libero donec mollis turpis sit amet orci fringilla aliquet " +
"nec ut elit donec semper nibh quis nunc feugiat euismod in facilisis imperdiet lacus nec euismod massa convallis id mauris " +
"vel rutrum mauris mauris risus lectus pretium at sem at iaculis viverra nulla suspendisse non luctus tortor quisque egestas " +
"purus sapien et porttitor turpis varius sed donec sed turpis et libero tincidunt hendrerit curabitur efficitur metus vel " +
"neque euismod iaculis mauris placerat efficitur venenatis quisque quis magna laoreet vestibulum sapien at vulputate ipsum " +
"pellentesque ut dignissim nunc et tincidunt ipsum";

function convertLoremIpsumToArray() {
    lorem_ipsum_array = lorem_ipsum.split(/\s+/).filter(noSpaces);
}

function convertTextToLoremIpsum(text) {
    let lorem_ipsum_i = Math.floor(Math.random() * lorem_ipsum_array.length);
    text = text.split("<br>").join(" <br> ");
    let text_array = text.split(/\s+/).filter(noSpaces);

    text_array.forEach(function(word, i) {
        if (text_array[i] !== '&' && text_array[i] !== '.') {
            text_array[i] = lorem_ipsum_array[lorem_ipsum_i];

            if (word === "<br>") {
                text_array[i] = "<br>";
                return;
            }

            let last_character = word.charAt(word.length - 1);

            if (last_character === "." || last_character === "!" || last_character === "?" || last_character === ",") {
                text_array[i] = text_array[i] + last_character;
            }
            else if (i === text_array.length - 1) {
                text_array[i] = text_array[i] + ".";
            }

            if (i !== 0) {
                let last_word = text_array[i - 1];
                let last_character_of_last_word = last_word.charAt(last_word.length - 1);

                if (last_character_of_last_word === "." || last_character_of_last_word === "?" ||
                    last_character_of_last_word === "!" || last_word === "<br>") {
                        text_array[i] = text_array[i].charAt(0).toUpperCase() + text_array[i].slice(1);
                }
            }
            else {
                text_array[i] = text_array[i].charAt(0).toUpperCase() + text_array[i].slice(1);
            }

            if (lorem_ipsum_i === lorem_ipsum_array.length - 1) {
                lorem_ipsum_i = 0;
            }
            else {
                lorem_ipsum_i++;
            }
        }
    })

    return text_array;
}


/**
 * Method for filtering out spaces from an array of strings
 * @param {*} word Word being checked
 * @returns True if word is not a space
 */
function noSpaces(word) {
    return word !== "";
}

var course_subjects = [
    "Art and Design",
    "History",
    "Mathematics",
    "Literature",
    "Language",
    "Physics",
    "Biology",
    "Chemistry",
    "Media",
    "Dance",
    "Food",
    "Religion",
    "Economics",
    "Administration",
    "Engineering",
    "Geography",
    "Graphic Design",
    "Music",
    "Philosophy",
    "Art History",
    "Criminology",
    "Anthropology",
    "Optometry",
    "Geology",
    "Game Design",
    "Zoology",
    "Software",
    "Journalism",
    "IT",
    "Law",
    "Computing",
    "Education",
    "Nursing",
    "Social Studies",
    "Veterinary Science",
    "Architecture",
    "Theology",
    "Psychology",
    "Computer Science",
    "Finance",
    "Social Work",
    "Dentistry",
    "Archeology",
    "Politics",
    "Marketing",
    "Agriculture",
    "Accounting",
    "Fashion",
    "Hairdressing",
    "Business",
    "Medicine",
    "Astronomy"
]