const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const port = 3000;
const db_uri = "mongodb+srv://tony_stark:iamironman@cluster123.czsky.mongodb.net/studium?retryWrites=true&w=majority";

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'b39xnn1mslagfn144n6knnxpa1q74756',
    rolling: true,
    maxAge: 1000*60*60*12
}));

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(express.json());

const User = require('./src/models/user_model.js')
const Course = require('./src/models/course_model');
const FlashCardSchema = require('./src/models/flashcard_model.js');
const Video = require('./src/models/video_model.js');
const { rawListeners } = require('./src/models/flashcard_model.js');
const { response } = require('express');

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

app.get('/', function(req, res) {
    let logged_in = false;
    let user = undefined;

    if (req.session.user) {
        logged_in = true;
        user = req.session.user;
    }
    res.render(__dirname + '/public/homepage', {
        logged_in,
        user
    });
});

app.get('/other_page', function(req, res) {
    if (req.session.user) {
        console.log("Page: " + "other_page");
        console.log("User: " + req.session.user.username);
    }
    res.render(__dirname + "/public/other_page");
})

app.get('/register', function(req, res) {
    if (req.session.user) {
        console.log("Page: " + "register");
        console.log("User: " + req.session.user.username);
    }
    res.render(__dirname + "/public/register");
})

app.post('/register', function(req, res) {
    let email = req.body.email.trim() || undefined;
    let username = req.body.username.trim() || undefined;
    let forename = req.body.forename.trim() || undefined;
    let surname = req.body.surname.trim() || undefined;
    let password = req.body.password || undefined;
    let password_confirm = req.body.password_confirm || undefined;

    let input = {
        "email": email,
        "username": username,
        "forename": forename,
        "surname": surname,
        "password": password,
        "password_confirm": password_confirm
    }

    let errors = validateRegisterInput(input);

    if (errors.length > 0) {
        res.render(__dirname + "/public/register",
        {
            email,
            username,
            forename,
            surname,
            errors
        })
    }
    else {
        delete input.password_confirm;
        const new_user = new User(input);

        new_user.save()
            .then((value) => {
                let user = req.session.user;
                let message = "<p>Account successfully created</p>";
                let message_title = "Account Created | Studium";
                res.render(__dirname + "/public/message_page", { message, message_title, user });
            })
            .catch((err) => {
                errors.push(getDBErrorMessage(err));

                res.render(__dirname + "/public/register", {
                    username,
                    forename,
                    surname,
                    email,
                    errors
                });
            })
    }
})

app.get('/login', function(req, res) {
    // If the user isn't logged in, show login page
    if (!req.session.user) {
        let user = undefined;
        res.render(__dirname + "/public/login", { user });
    }
    // If the user is logged in, redirect to homepage
    else {
        res.redirect('/');
    }
})

app.post('/login', function(req, res) {
    let username = req.body.username.trim() || undefined;
    let password = req.body.password.trim() || undefined;

    let user_input = {
        "username": username,
        "password": password
    }

    let response = {
        errors: validateLoginInput(user_input)
    };

    if (response.errors.length > 0) {
        res.send(response);
        return;
    }
    else {
        User.findOne(user_input, function(err, user) {
            if (err) {
                response.errors.push("Error occured when trying to login");
                console.log(err);
                res.send(response);
            }
            else {
                if (user) {
                    user._id = user._id.toString();
                    req.session.user = user;
                    res.send(response);
                }
                else {
                    response.errors.push("Incorrect credentials");
                    res.send(response);
                }
            }
        })
    }
})

app.get("/logout", function(req, res) {
    let logout_message = "You have successfully logged out";
    if (req.session.user) {
        delete req.session.user;
    }
    else {
        logout_message = "No account to logout from";
    }

    let user = req.session.user;

    res.render(__dirname + "/public/logout", { logout_message, user });
})

app.get("/user/:user_id", function(req, res) {
    let user_id = req.params.user_id;
    if (mongoose.Types.ObjectId.isValid(user_id)) {
        User.findOne({"_id": user_id}, function(err, user) {
            if (err) {
                let user = req.session.user;
                let message = "<p>Apologies, error occured when trying to retrieve account details</p>";
                let message_title = "Error | Studium";
                res.render(__dirname + "/public/message_page", { message, message_title, user });
            }
            else {
                let user_exists = false;
                
                if (user) {
                    user_exists = true;
                }
        
                res.render(__dirname + "/public/account", { user, user_exists });
            }
        })
    }
    else {
        let user = req.session.user;
        let message = "<p>Account not found</p>";
        let message_title = "Account Not Found | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
})

app.get("/create-course", function(req, res) {
    if (req.session.user) {
        res.render(__dirname + "/public/create_course");
    }
    else {
        let user = req.session.user;
        let message = "<p>You must be logged in to create a course</p>" +
            "<p>Login <a href='/login'>here</a> or register <a href='/register'>here</a>.</p>";
        let message_title = "Error | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
})

app.post("/create-course", function(req, res) {
    if (req.session.user) {
        let name = req.body.name.trim() || undefined;
        let type = req.body.type || undefined;
        let description = req.body.description.trim() || undefined;

        let input = {
            "name": name,
            "type": type,
            "description": description
        }

        let errors = validateCreateCourseInput(input);

        if (errors.length > 0) {
            res.render(__dirname + "/public/create_course", {
                name,
                type,
                description,
                errors
            })
        }
        else {
            input.teachers = [req.session.user._id];
            let new_course = new Course(input);
            new_course.save()
                .then((value) => {
                    let course_name = name;
                    let course_description = description;
                    let course_subject = type;
                    let teacher_authorised = true;
                    let course_teachers = input.teachers;
                    res.render(__dirname + "/public/course", {
                        course_name,
                        course_description,
                        course_subject,
                        teacher_authorised,
                        course_teachers
                    });
                })
                .catch((err) => {
                    errors.push(getDBErrorMessage(err));

                    res.render(__dirname + "/public/create_course", {
                        username,
                        forename,
                        surname,
                        email,
                        errors
                    });
                })
        }
    }
    else {
        let message = "<p>You must be logged in to create a course</p>" +
            "<p>Login <a href='/login'>here</a> or register <a href='/register'>here</a>.</p>";
        let message_title = "Error | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title });
    }
})

app.get('/template-testing', function(req, res) {
    res.render(__dirname + "/public/template_testing");
})

app.get('/course/:course_id', function(req, res) {
    Course.findOne({ "_id": req.params.course_id}, function(err, course) {
        if (err) {
            let user = req.session.user;
            console.log(err);
            let message = "<p>Sorry, an error occurred while retrieving the course</p>";
            let message_title = "Error | Studium";
            res.render(__dirname + "/public/message_page", { message, message_title, user });
            return;
        }

        if (course) {
            let course_id = course._id;
            let course_name = course.name;
            let course_description = course.description;
            let course_subject = course.type;
            let course_visible_to_public = course.course_visible_to_public;
            let course_visible_to_user = course.course_visible_to_public;
            let pages = course.pages;
            let user = req.session.user;
            let display_enrol = false;
            let display_unenrol = false;
            let display_class_links = false;
            let teacher_authorised = false;

            let teachers_array = [];

            if (course.teachers) {
                course.teachers.forEach(function(teacher_id) {
                    if (req.session.user) {
                        if (teacher_id == req.session.user._id) {
                            teacher_authorised = true;
                            display_class_links = true;
                            course_visible_to_user = true;
                        }
                    }
                    teachers_array.push({ _id: teacher_id });
                })
            }

            if (course.classes_visible_to_public) {
                display_class_links = true;
            }

            if (req.session.user) {
                if (req.session.user.enrolled_in.includes(course_id.toString())) {
                    display_class_links = true;
                    display_unenrol = true;
                }
                else if (!teacher_authorised) {
                    display_enrol = true;
                }
            }
            else {
                display_enrol = true;
            }

            User.find({ $or: teachers_array }, function(err, teachers) {
                if (err) {
                    console.log(err);
                }

                res.render(__dirname + "/public/course", {
                    course_id,
                    course_name,
                    course_description,
                    course_subject,
                    course_visible_to_user,
                    course_visible_to_public,
                    teachers,
                    teacher_authorised,
                    display_class_links,
                    display_enrol,
                    display_unenrol,
                    pages,
                    user
                })
            });
        } else {
            let user = req.session.user;
            let message = "<p>Sorry, course not found</p>";
            let message_title = "Course Not Found | Studium";
            res.render(__dirname + "/public/message_page", { message, message_title, user });
        }
    });
})

app.post("/get_current_user", function(req, res) {
    res.send(req.session.user);
})

app.post("/update_course", function(req, res) {
    let update = {
        description: req.body.new_description,
        name: req.body.new_title,
        course_visible_to_public: req.body.visible,
        type: req.body.new_subject
    }

    Course.updateOne({ _id: req.body.course_id}, update, function(err, result) {
        if (err) {
            res.send({ success: false });
        }
        else {
            res.send({ success: true });
        }
    })
})

app.post("/update_course_page", function(req, res) {
    console.log(req.body);
    req.body.content.forEach(function(content) {
        if (content._id) {
            content._id = mongoose.Types.ObjectId(content._id);
        }
    })
    let update = {
        'pages.$.name': req.body.page_info.new_name,
        'pages.$.description': req.body.page_info.new_description,
        'pages.$.content': req.body.content
    }

    console.log(update);

    Course.updateOne({ _id: req.body.page_info.course_id, 'pages._id': req.body.page_info.page_id }, { $set: update }, function(err, result) {
        if (err) {
            console.log(err);
            res.send({ success: false });
        }
        else {
            res.send({ success: true });
        }
    })
})

app.post("/update_student_enrollment", function(req, res) {
    let course_id = req.body.course_id;
    let enrolling = req.body.enrolling === 'true';

    console.log("enrolling: ");
    console.log(enrolling);

    let response = {
        user_not_found: false,
        course_not_found: false,
        user_logged_in: false,
        success: false,
        db_error: false
    }

    if (!req.session.user) {
        res.send(response);
    }
    else {
        response.user_logged_in = true;

        let user_query = {
            _id: req.session.user._id
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
                    students: req.session.user._id
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
                    students: req.session.user._id
                }
            }
        }

        console.log(user_update);
        console.log(course_update);

        User.updateOne(user_query, user_update, function(err, result) {
            if (err) {
                response.db_error = true;
                res.send(response);
            }

            console.log(result);

            if (result.matchedCount === 0) {
                console.log("User not found");
                response.user_not_found = true;
                res.send(response);
            }
            else {
                if (enrolling) {
                    req.session.user.enrolled_in.push(course_id);
                }
                else {
                    req.session.user.enrolled_in.pull(course_id);
                }

                Course.updateOne(course_query, course_update, function(err, result) {
                    if (err) {
                        response.db_error = true;
                    }

                    console.log(result);

                    if (result.matchedCount === 0) {
                        response.course_not_found = true;
                    }
                    else {
                        response.success = true;
                        res.send(response);
                    }
                })
            }
        })
    }
})

app.post("/unenrol_student", function(req, res) {
    if (req.session.user) {
        let query = { "_id": req.session.user._id };
        let update = { $pull: { "enrolled_in": req.body.course_id }};
        User.updateOne(query, update, function(err, result) {
            if (err) {
                res.send({
                    "user_not_found": false,
                    "user_logged_in": false,
                    "success": false,
                    "db_error": true
                })
            }

            if (result.matchedCount == 0) {
                console.log("User not found");
                res.send({
                    "user_not_found": true,
                    "user_logged_in": true,
                    "success": false,
                    "db_error": false
                })
            }
            else {
                User.findOne(query, function(err, user) {
                    user._id = user._id.toString();
                    req.session.user = user;
                    res.send({
                        "user_not_found": false,
                        "user_logged_in": true,
                        "success": true,
                        "db_error": false
                    })
                })
            }
        })
    }
    else {
        res.send({
            "user_not_found": false,
            "user_logged_in": false,
            "success": false,
            "db_error": false
        });
    }
})

app.get('/navbar', function(req, res) {
    res.render(__dirname + "/public/navbar");
})

app.post('/create_new_course_page', function(req, res) {
    console.log(req.body);
    let course_id = req.body.course_id || undefined;
    let new_page_name = req.body.new_page_name || "";
    let new_page_description = req.body.new_page_description || "";
    let new_page = {
        name: new_page_name,
        description: new_page_description
    }

    Course.findOne({ _id: course_id }, function(err, course) {
        if (err || !course) {
            res.send({ success: false });
        }
        else if (course) {
            Course.updateOne({ _id: course_id }, { $push: { pages: new_page } }, function(err, response) {
                if (err || !response) {
                    res.send({success: false});
                }
                else {
                    Course.findOne({ _id: course_id }, function(err, course) {
                        if (err || !course) {
                            res.send({success: false});
                        }
                        else {
                            console.log("Success");
                            res.send({success: true, page_id: course.pages[course.pages.length -1]._id});
                        }
                    })
                }
            })
        }
    })
})

app.get('/course/:course_id/video/:video_id', function(req, res) {
    res.render(__dirname + "/public/video_lecture", { user : req.session.user });
})

app.get('/course/:course_id/page/:page_id', function(req, res) {
    let course_id = req.params.course_id;
    let page_id = req.params.page_id;
    let course_query = { _id: course_id };
    let user = req.session.user;

    Course.findOne(course_query, function(err, course) {
        if (err) {
            console.log(err);
        }

        if (!course) {
            let message = "<p>Sorry, course not found</p>";
            let message_title = "Course Not Found | Studium";
            res.render(__dirname + "/public/message_page", {
                message,
                message_title,
                user
            })
        }
        else {
            let course_name = course.name;
            let teacher_authorised = false;

            course.teachers.forEach(function(teacher_id) {
                if (user) {
                    if (teacher_id == user._id) {
                        teacher_authorised = true;
                    }
                }
            })

            let page;
            for (let i = 0; i < course.pages.length; i++) {
                if (course.pages[i]._id == page_id) {
                    page = course.pages[i];
                    let page_id = page._id;
                    let page_name = page.name;
                    let page_description = page.description;
                    let page_content_count = course.pages[i].content.length;
                    let message = "";
                    let message_title = "";
                    let display_page = false;

                    // If the user is logged in
                    if (user) {
                        // If the user is a teacher on the course
                        if (teacher_authorised) {
                            display_page = true;
                        }
                        // If the user is not a teacher on the course and the page is visible only to teachers
                        else if (!page.visible) {
                            message = "<p>Sorry, course page not found</p>";
                            message_title = "Course Page Not Found";
                        }
                        // If the user is not a teacher on the course and the page is visible only to enrolled students
                        else if (!course.classes_visible_to_public) {
                            // If the user is not an enrolled student
                            if (!user.enrolled_in.includes(course_id.toString())) {
                                message = "<p>You need to be enrolled to view this page</p>";
                                message_title = "Page Unavailable | Studium";
                            }
                            // If the user is an enrolled student
                            else {
                                display_page = true;
                            }
                        }
                    }
                    // If the user is not logged in
                    else {
                        // If the page is publicly visible
                        if (course.classes_visible_to_public && page.visible) {
                            display_page = true;
                        }
                        // If the page is available only to enrolled students
                        else if (!course.classes_visible_to_public && page.visible) {
                            message = "<p>You need to be enrolled to view this page</p>";
                            message_title = "Page Unavailable | Studium";
                        }
                        // If the page is available only to teachers
                        else {
                            message = "<p>Sorry, course page not found</p>";
                            message_title = "Course Page Not Found | Studium";
                        }
                    }

                    if (!display_page) {
                        res.render(__dirname + "/public/message_page", {
                            message,
                            message_title,
                            user
                        })
                        break;
                    }
                    else {
                        res.render(__dirname + "/public/course_page", {
                            course_id,
                            course_name,
                            page_id,
                            page_description,
                            page_name,
                            page_content_count,
                            user,
                            teacher_authorised
                        })
                        break;
                    }
                }

                if (i == course.pages.length - 1) {
                    let message = "<p>Sorry, course page not found</p>";
                    let message_title = "Course Page Not Found | Studium";
                    res.render(__dirname + "/public/message_page", {
                        message,
                        message_title,
                        user
                    })
                }
            }
        }
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

app.post('/get_page_content', function(req, res) {
    Course.findOne({ _id: req.body.course_id}, function(err, course) {
        if (err) {
            res.send({ error: true });
        }

        if (!course) {
            res.send({ course_not_found: true });
        }
        else {
            let page = undefined;
            for (let i = 0; i < course.pages.length; i++) {
                if (course.pages[i]._id == req.body.page_id) {
                    page = course.pages[i];
                }
            }

            res.send({ page });
        }
    })
})

app.get('/flashcards', function(req, res) {
    let user = req.session.user;
    res.render(__dirname + "/public/flashcard", { user })
})

app.get('/all-courses', function(req, res) {
    let user = req.session.user;

    let data = {
        user: user,
        page_title: "All Available Courses",
        header: "All Available Courses"
    }

    res.render(__dirname + "/public/course_list", data)
})

app.get('/get-all-courses', function(req, res) {
    let query = {
        course_visible_to_public: true
    }

    let response = {
        error: false
    }

    Course.find(query, '_id name description type created', function(err, courses) {
        if (err) {
            response.error = true;
        }

        if (courses) {
            response.courses = courses;
        }

        res.send(response);
    })
})

app.get('/get-courses-enrolled-in', function(req, res) {
    let user = req.session.user;
    let response = {
        error: false
    }

    if (!user) {
        response.error = true;
        response.error_message = "You are not logged in."
        res.send(response);
    }
    else {
        let user_query = {
            _id: user._id
        }

        User.findOne(user_query, 'enrolled_in', function(err, found_user) {
            if (found_user !== null && !err) {
                let course_ids = [];

                found_user.enrolled_in.forEach(function(course) {
                    course_ids.push({
                        _id: course
                    })
                })

                if (course_ids.length > 0) {
                    let courses_query = {
                        $or: course_ids
                    }
    
                    Course.find(courses_query, '_id name description type created', function(err, courses) {
                        if (!err && courses) {
                            response.courses = courses;
                            res.send(response);
                        }
                        else {
                            response.error = true;
                            response.error_message = "Error finding courses.";
                            res.send(response);
                        }
                    })
                }
                else {
                    response.courses = [];
                    res.send(response);
                }
            }
            else {
                response.error = true;
                response.error_message = "Error finding user account.";
                res.send(response);
            }
        })
    }
})

app.get('/my-courses/enrolled-in', function(req, res) {
    let user = req.session.user;

    let data = {
        user: user,
        page_title: "Courses You're Enrolled In",
        header: "Courses You're Enrolled In"
    }

    if (!user) {
        let message = "<p>You must be logged in to view courses you are enrolled in.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
    else {
        res.render(__dirname + "/public/course_list", data);
    }
})

app.get('/my-courses/teaching', function(req, res) {
    let user = req.session.user;

    let data = {
        user: user,
        page_title: "Courses You Teach",
        header: "Courses You Teach"
    }

    if (!user) {
        let message = "<p>You must be logged in to view courses you teach.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
    else {
        res.render(__dirname + "/public/course_list", data);
    }
})

app.get('/get-courses-teaching', function(req, res) {
    let user = req.session.user;

    let response = {
        error: false
    }

    if (!user) {
        response.error = true;
        response.error_message = "Not logged in.";
        res.send(response);
    }
    else {
        let course_query = {
            teachers: user._id
        }

        Course.find(course_query, '_id name description type created', function(err, courses) {
            if (!err && courses) {
                response.courses = courses;
                res.send(response);
            }
            else {
                response.error = true;
                response.error_message = "Error finding courses.";
                res.send(response);
            }
        })
    }
})

app.get('/my-courses/moderating', function(req, res) {
    let user = req.session.user;

    let data = {
        user: user,
        page_title: "Courses You Moderate",
        header: "Courses You Moderate"
    }

    if (!user) {
        let message = "<p>You must be logged in to view courses you moderate.</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
    else {
        res.render(__dirname + "/public/course_list", data);
    }
})

app.get('/get-courses-moderating', function(req, res) {
    let user = req.session.user;

    let response = {
        error: false
    }

    if (!user) {
        response.error = true;
        response.error_message = "Not logged in.";
        res.send(response);
    }
    else {
        let course_query = {
            moderators: user._id
        }

        Course.find(course_query, '_id name description type created', function(err, courses) {
            if (!err && courses) {
                response.courses = courses;
                res.send(response);
            }
            else {
                response.error = true;
                response.error_message = "Error finding courses.";
                res.send(response);
            }
        })
    }
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

app.post('/update_video_chat', function(req, res) {
    let query = JSON.parse(req.body.query);
    let update = JSON.parse(req.body.update);
    let options = JSON.parse(req.body.options);
    let response = {
        error: false
    }

    console.log("query:");
    console.log(query);
    console.log("");
    console.log("update:");
    console.log(update);
    console.log("");
    console.log("options:");
    console.log(options);
    console.log("");

    if (mongoose.Types.ObjectId.isValid(query._id)) {
        Video.findOneAndUpdate(query, update, options, function(err, video) {
            if (err || !video) {
                console.log(err);
                response.error = true;
                res.send(response);
            }
            else {
                res.send(response);
            }
        })
    }
    else {
        response.error = true;
        res.send(response);
    }
})

app.post('/get_notifications', function(req, res) {
    let response = {
        error: false,
        user_logged_in: true,
        notifications: {}
    }

    if (req.session.user === undefined) {
        response.user_logged_in = false;
        res.send(response);
        return;
    }

    let query = {
        _id: req.session.user._id
    }

    User.findOne(query, function(err, user) {
        if (err) {
            console.log(err);
            response.error = true;
        }

        if (!user) {
            console.log("User not found");
            response.error = true;
        }
        else {
            req.session.user = user;
            response.notifications = user.notifications;
        }

        res.send(response);
    })
})

app.get('/notifications', function(req, res) {
    let user = req.session.user;

    if (req.session.user !== undefined) {
        res.render(__dirname + "/public/notifications", { user });
    }
    else {
        let user = req.session.user;
        let message = "<p>You must be logged in to view your notifications</p>";
        let message_title = "Not Logged In | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    }
})

app.post('/add_new_question_notification', function(req, res) {
    let video_id = req.body.video_id;
    let question_asker_id = req.body.question_asker_id;
    let course_id = req.body.course_id;

    let course_query = {
        _id: course_id
    }

    let response = {
        error: false
    }

    Course.findOne(course_query, function(err, course) {
        if (err) {
            response.error = true;
        }

        if (!course) {
            response.error = true;
            res.send(response);
        }
        else {
            let video_query = {
                _id: video_id
            }

            Video.findOne(video_query, function(err, video) {
                if (err) {
                    response.error = true;
                }

                if (!video) {
                    response.error = true;
                    res.send(response);
                }
                else {
                    let student_queries = [];

                    course.students.forEach(function(student_id) {
                        if (video.students_not_receiving_question_notifications.includes(student_id)) {
                            return;
                        }

                        student_queries.push({
                            _id: student_id
                        })
                    })

                    if (student_queries.length === 0) {
                        res.send(response);
                    }

                    let students_query = {
                        $or: student_queries
                    }

                    console.log("students_query:");
                    console.log(students_query);
                    console.log("");

                    User.find(students_query, function(err, all_students) {
                        if (err) {
                            response.error = true;
                        }

                        if (!all_students) {
                            response.error = true;
                            res.send(response);
                        }
                        else {
                            console.log(all_students);
                            let students_without_notification = [];
                            let students_with_notification = [];

                            all_students.forEach(function(student) {
                                let has_notification = false;

                                student.notifications.new_question_notifications.forEach(function(notification) {
                                    if (notification._id === "new_question_notification_" + video_id) {
                                        has_notification = true;
                                    }
                                })

                                if (has_notification) {
                                    students_with_notification.push(student._id);
                                }
                                else {
                                    students_without_notification.push(student._id);
                                }
                            })

                            console.log("Students with notification:");
                            console.log(students_with_notification);
                            console.log("");
                            console.log("Students without notification:");
                            console.log(students_without_notification);

                            let students_with_notification_queries = [];
                            let students_without_notification_queries = [];

                            students_with_notification.forEach(function(student_id) {
                                students_with_notification_queries.push({
                                    _id: student_id
                                })
                            })

                            students_without_notification.forEach(function(student_id) {
                                students_without_notification_queries.push({
                                    _id: student_id
                                })
                            })

                            let students_without_notification_query = {
                                $or: students_without_notification_queries
                            }

                            let students_with_notification_query = {
                                $or: students_with_notification_queries
                            }

                            console.log("Students with notification query:");
                            console.log(students_with_notification_query);
                            console.log("");
                            console.log("Students without notification query:");
                            console.log(students_without_notification_query);

                            let students_without_notification_update = {
                                $push: {
                                    "notifications.new_question_notifications": {
                                        _id: "new_question_notification_" + video_id,
                                        video_id: video_id,
                                        question_askers: [question_asker_id],
                                        read: false,
                                        date: Date.now()
                                    }
                                }
                            }

                            let students_with_notification_update = {
                                $addToSet: {
                                    "notifications.new_question_notifications.$[notification].question_askers": question_asker_id
                                },
                                $set: {
                                    "notifications.new_question_notifications.$[notification].read": false,
                                    "notifications.new_question_notifications.$[notification].date": Date.now(),
                                }
                            }

                            let students_with_notification_options = {
                                arrayFilters: [
                                    {
                                        "notification._id": "new_question_notification_" + video_id
                                    }
                                ],
                                new: true
                            }

                            let students_without_notification_options = {
                                new: true
                            }

                            if (students_with_notification.length > 0 && students_without_notification.length > 0) {
                                User.updateMany(students_with_notification_query, students_with_notification_update,
                                    students_with_notification_options, function(err, students) {
                                    if (err) {
                                        response.error = true;
                                        console.log(err);
                                    }

                                    User.updateMany(students_without_notification_query, students_without_notification_update,
                                        students_without_notification_options, function(err, students) {
                                        if (err) {
                                            response.error = true;
                                            console.log(err);
                                        }

                                        res.send(response);
                                    })
                                })
                            }
                            else if (students_with_notification.length > 0) {
                                User.updateMany(students_with_notification_query, students_with_notification_update,
                                    students_with_notification_options, function(err, students) {
                                    if (err) {
                                        response.error = true;
                                        console.log(err);
                                    }

                                    res.send(response);
                                })
                            }
                            else if (students_without_notification.length > 0) {
                                User.updateMany(students_without_notification_query, students_without_notification_update,
                                    students_without_notification_options, function(err, students) {
                                    if (err) {
                                        response.error = true;
                                        console.log(err);
                                    }

                                    res.send(response);
                                })
                            }
                            else {
                                res.send(response);
                            }
                        }
                    })
                }
            })
        }
    })
})

app.post('/add_chat_reply_notification', function(req, res) {
    let current_user = req.session.user;    // Get current user

    // Initiate response object
    let response = {
        error: false
    }

    // If current user isn't logged in, send back error
    if (current_user === undefined) {
        response.error = true;
        console.log("Not logged in");
        res.send(response);
        return;
    }

    let video_id = req.body.video_id;
    let recipient_id = req.body.recipient_id;
    let current_tab = req.body.current_tab;

    // Query for getting video
    let vid_query = {
        _id: video_id
    }

    // Get the video in which a reply has been made
    Video.findOne(vid_query, function(err, video) {
        // If a video hasn't been found, respond with error
        if (!video) {
            console.log("Video not found");
            response.error = true;
            res.send(response);
            return;
        }

        // If an error occurred, respond with error
        if (err) {
            console.log(err);
            response.error = true;
            res.send(response);
            return;
        }

        let notify_ids = []
        let original_author_id = "";
        // Get the original comment in the comment thread, get the IDs of users to be notified
        video[current_tab].forEach(function(comment) {
            if (comment._id.equals(mongoose.Types.ObjectId(recipient_id))) {
                notify_ids = comment.notify;
                original_author_id = comment.author_id;
            }
        })

        console.log("To be notified:");
        console.log(notify_ids);

        // If no users to be notified have been found, return
        if (notify_ids.length === 0) {
            console.log("No users to notify");
            res.send(response);
            return;
        }

        let user_queries = [];  // Will hold query objects for finding each user to be notified
        //let notification_id = "new_chat_reply_" + recipient_id; // ID of notification that user might already have

        // Set user query objects
        notify_ids.forEach(function(user_id) {
            user_queries.push({
                _id: user_id/*,
                "notifications.reply_notifications.$[notification]._id": notification_id */
            })
        })

        // Set user query
        let query = {
            $or: user_queries
        }

        // Find users to be notified
        User.find(query, function(err, users) {
            // If error, respond with error
            if (err) {
                response.error = true;
                console.log(err);
            }

            // If no users found
            if (users.length === 0) {
                response.error = true;
                console.log("no users found");
                res.send(response);
                return;
            }

            let users_with_notification_queries = [];   // Will hold query objects for finding users with the notification
            let users_without_notification_queries = [];    // Will hold query objects for finding users without the notification

            // For each user who already has the notification, create a query object
            users.forEach(function(user) {
                let has_notification = false;

                user.notifications.chat_reply_notifications.forEach(function(notification, i) {
                    if (notification._id === "chat_reply_notification_" + recipient_id) {
                        has_notification = true;
                        let user_id = user._id.toString();
                        users_with_notification_queries.push({
                            _id: user_id
                        });
                    }
                })

                if (!has_notification) {
                    users_without_notification_queries.push({
                        _id: user._id.toString()
                    });
                }
            })

            if (users_with_notification_queries.length === 0 && users_without_notification_queries.length === 0) {
                console.log("No user queries created");
                res.send(response);
                return;
            }

            // Set query for users with the notification
            let users_with_notification_query = {
                $or: users_with_notification_queries
            }

            // Set query for users without the notification
            let users_without_notification_query = {
                $or: users_without_notification_queries
            }

            // Set update for users with the notification
            let users_with_notification_update = {
                $set: {
                    "notifications.chat_reply_notifications.$[notification].date": Date.now(),
                    "notifications.chat_reply_notifications.$[notification].read": false
                },
                $addToSet: {
                    "notifications.chat_reply_notifications.$[notification].new_replies": current_user._id
                }
            }

            // Set update for users without the notification
            let users_without_notification_update = {
                $push: {
                    "notifications.chat_reply_notifications": {
                        _id: "chat_reply_notification_" + recipient_id,
                        video_id: video_id,
                        original_author_id: original_author_id, // notf_edit, used to be recipient_id: recipient_id
                        read: false,
                        date: Date.now(),
                        new_replies: [
                            current_user._id
                        ]
                    }
                }
            }

            // Set options
            let users_with_notification_options = {
                new: true,
                arrayFilters: [
                    {
                        "notification._id": "chat_reply_notification_" + recipient_id
                    }
                ]
            }

            let users_without_notification_options = {
                new: true
            }

            if (users_with_notification_queries.length !== 0 && users_without_notification_queries.length !== 0) {
                // Update users with the notification
                User.updateMany(users_with_notification_query, users_with_notification_update, users_with_notification_options, function(err, users) {
                    // If error, respond with error
                    if (err) {
                        response.error = true;
                        console.log(err);
                    }
                    
                    // Update users without the notification
                    User.updateMany(users_without_notification_query, users_without_notification_update, users_without_notification_options, function(err, users) {
                        // If error, respond with error
                        if (err) {
                            response.error = true;
                            console.log(err);
                        }

                        // Send response
                        res.send(response);
                    })
                })
            }
            else if (users_with_notification_queries.length !== 0) {
                User.updateMany(users_with_notification_query, users_with_notification_update, users_with_notification_options, function(err, users) {
                    // If error, respond with error
                    if (err) {
                        response.error = true;
                        console.log(err);
                    }

                    res.send(response);
                })
            }
            else if (users_without_notification_queries.length !== 0) {
                // Update users without the notification
                User.updateMany(users_without_notification_query, users_without_notification_update, users_without_notification_options, function(err, users) {
                    // If error, respond with error
                    if (err) {
                        response.error = true;
                        console.log(err);
                    }

                    // Send response
                    res.send(response);
                })
            }
        })
    })
})

app.post('/update_user_question_notification_preferences', function(req, res) {
    let user = req.session.user;
    let video_id = req.body.video_id;
    let opting_out = req.body.opting_out === 'true';

    let response = {
        error: false,
        logged_in: true,
        video_found: true
    }

    if (!user) {
        response.logged_in = false;
        res.send(response);
    }
    else {
        let query = {
            _id: video_id
        }

        let update = {}

        if (opting_out) {
            update = {
                $addToSet: {
                    students_not_receiving_question_notifications: user._id
                }
            }
        }
        else {
            update = {
                $pull: {
                    students_not_receiving_question_notifications: user._id
                }
            }
        }

        console.log(update);

        Video.updateOne(query, update, function(err, video) {
            if (err) {
                response.error = true;
            }

            if (!video) {
                response.video_found = false;
            }

            res.send(response);
        })
    }
})

app.post('/update_comment_vote', function(req, res) {
    if (req.session.user !== undefined) {
        let video_id = req.body.video_id;
        let is_reply = (req.body.message_obj.is_reply === 'true' || req.body.message_obj.is_reply === true);
        let local_comment = req.body.message_obj.comment;
        let vote_type = req.body.vote_type;
        let current_tab = req.body.current_tab;

        let response = {
            error: false
        }

        let find_one_query = {
            _id: video_id
        }

        if (current_tab !== "questions" && current_tab !== "feedback") {
            console.log("Comment array unknown");
            response.error = true;
            res.send(response);
            return;
        }

        Video.findOne(find_one_query, function(err, video) {
            if (err || !video) {
                console.log(err);
                response.error = true;
                res.send(response);
                return;
            }
            else {
                let db_comment = {}
                let recipient = {}
                let comment_array = []

                if (current_tab === "questions") {
                    comment_array = video.questions;
                }
                else if (current_tab === "feedback") {
                    comment_array = video.feedback;
                }

                for (let comment_i = 0; comment_i < comment_array.length; comment_i++) {
                    if (is_reply !== true) {
                        if (comment_array[comment_i]._id.equals(mongoose.Types.ObjectId(local_comment._id))) {
                            db_comment = comment_array[comment_i];
                            break;
                        }
                    }
                    else {
                        for (let reply_i = 0; reply_i < comment_array[comment_i].replies.length; reply_i++) {
                            if (comment_array[comment_i].replies[reply_i]._id.equals(mongoose.Types.ObjectId(local_comment._id))) {
                                db_comment = comment_array[comment_i].replies[reply_i];
                                recipient = comment_array[comment_i];
                                break;
                            }
                        }
                    }
                }

                if (db_comment._id !== undefined) {
                    let query = {}
                    let update = {}
                    let options = {}
                    let db_vote_change = 0;
                    let local_vote_change = 0;
                    let update_db = true;
                    let upvoted = false;
                    let downvoted = false;

                    // If user has pressed the upvote button
                    if (vote_type === "upvote") {
                        // If comment is marked as upvoted in DB but not in current tab
                        if (db_comment.upvotes.includes(req.session.user._id) && !local_comment.upvotes.includes(req.session.user._id))
                        {
                            // Do not update DB, update local display / video object
                            upvoted = true;
                            update_db = false;
                            local_vote_change = 1;
                        }
                        // If comment is marked as upvoted in current tab but not in DB
                        else if (!db_comment.upvotes.includes(req.session.user._id) && local_comment.upvotes.includes(req.session.user._id)) {
                            // Do not update DB, update local display / video object
                            update_db = false;
                            local_vote_change = -1;

                            // If comment is marked as downvoted in DB
                            if (db_comment.downvotes.includes(req.session.user._id)) {
                                update_db = true;
                                db_vote_change = 1;

                                update = {
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].downvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$pull[current_tab + ".$.downvotes"] = req.session.user._id;
                                }
                            }
                        }
                        // If no discrepency in DB upvotes and current tab upvotes
                        else {
                            // If comment has not been marked as upvoted or downvoted in DB
                            if (!db_comment.upvotes.includes(req.session.user._id) && !db_comment.downvotes.includes(req.session.user._id)) {
                                // Set update to push user ID to upvotes, increment DB vote_count
                                db_vote_change = 1;
                                local_vote_change = 1;
                                upvoted = true;

                                update = {
                                    $addToSet: {}
                                }

                                if (is_reply) {
                                    update.$addToSet[current_tab + ".$[comment].replies.$[reply].upvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$addToSet[current_tab + ".$.upvotes"] = req.session.user._id;
                                }
                            }
                            // Else if comment is marked as downvoted in DB
                            else if (db_comment.downvotes.includes(req.session.user._id)) {
                                local_vote_change = 2;

                                // If current tab comment is not marked as downvoted
                                if (!local_comment.downvotes.includes(req.session.user._id)) {
                                    local_vote_change = 1;
                                }

                                // Set update to pull user ID from downvotes and push it to upvotes, increment DB vote_count by 2
                                db_vote_change = 2;
                                upvoted = true;

                                update = {
                                    $addToSet: {},
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$addToSet[current_tab + ".$[comment].replies.$[reply].upvotes"] = req.session.user._id;
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].downvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$addToSet[current_tab + ".$.upvotes"] = req.session.user._id;
                                    update.$pull[current_tab + ".$.downvotes"] = req.session.user._id;
                                }
                            }
                            // Else if comment is marked as upvoted in DB
                            else {
                                // Set update to pull user ID from upvotes, decrement DB vote_count
                                db_vote_change = -1;
                                local_vote_change = -1;

                                update = {
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].upvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$pull[current_tab + ".$.upvotes"] = req.session.user._id;
                                }
                            }
                        }
                    }
                    else if (vote_type === "downvote") {
                        // If comment is marked as downvoted in DB but not in current tab
                        if (db_comment.downvotes.includes(req.session.user._id) && !local_comment.downvotes.includes(req.session.user._id))
                        {
                            // Do not update DB, update local display / video object
                            downvoted = true;
                            update_db = false;
                            local_vote_change = -1;
                        }
                        // Else if comment is marked as downvoted in current tab but not in DB
                        else if (!db_comment.downvotes.includes(req.session.user._id) && local_comment.downvotes.includes(req.session.user._id)) {
                            // Do not update DB, update local display / video object
                            update_db = false;
                            local_vote_change = 1;

                            // If comment is marked as upvoted in DB
                            if (db_comment.upvotes.includes(req.session.user._id)) {
                                update_db = true;
                                db_vote_change = -1;

                                update = {
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].upvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$pull[current_tab + ".$.upvotes"] = req.session.user._id;
                                }
                            }
                        }
                        // Else if no discrepency between DB downvote and current tab downvote
                        else {
                            // If comment is marked as neither upvoted nor downvoted in DB
                            if (!db_comment.upvotes.includes(req.session.user._id) && !db_comment.downvotes.includes(req.session.user._id)) {
                                // Set update to push user ID to downvotes, decrement DB vote_count
                                db_vote_change = -1;
                                local_vote_change = -1;
                                downvoted = true;

                                update = {
                                    $addToSet: {}
                                }

                                if (is_reply) {
                                    update.$addToSet[current_tab + ".$[comment].replies.$[reply].downvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$addToSet[current_tab + ".$.downvotes"] = req.session.user._id;
                                }
                            }
                            // Else if comment is marked as upvoted in DB
                            else if (db_comment.upvotes.includes(req.session.user._id)) {
                                local_vote_change = -2;

                                // If current tab comment is not marked as downvoted
                                if (!local_comment.upvotes.includes(req.session.user._id)) {
                                    local_vote_change = -1;
                                }

                                // Set update to pull user ID from upvotes and push it to downvotes, decrement DB vote_count by 2
                                db_vote_change = -2;
                                downvoted = true;

                                update = {
                                    $addToSet: {},
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$addToSet[current_tab + ".$[comment].replies.$[reply].downvotes"] = req.session.user._id;
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].upvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$addToSet[current_tab + ".$.downvotes"] = req.session.user._id;
                                    update.$pull[current_tab + ".$.upvotes"] = req.session.user._id;
                                }
                            }
                            // Else if comment is marked as downvoted in DB
                            else {
                                // Set update to pull user ID from downvotes, increment DB vote_count
                                db_vote_change = 1;
                                local_vote_change = 1;

                                update = {
                                    $pull: {}
                                }

                                if (is_reply) {
                                    update.$pull[current_tab + ".$[comment].replies.$[reply].downvotes"] = req.session.user._id;
                                }
                                else {
                                    update.$pull[current_tab + ".$.downvotes"] = req.session.user._id;
                                }
                            }
                        }
                    }
                    else {
                        response.error = true;
                        res.send(response);
                        return;
                    }

                    if (update_db) {
                        query = {
                            _id: video_id
                        }

                        if (is_reply) {
                            query[current_tab + "._id"] = recipient._id;
                            update.$inc = {};
                            update.$inc[current_tab + ".$[comment].replies.$[reply].vote_count"] = db_vote_change;

                            options = {
                                arrayFilters: [
                                    {
                                        "comment._id": recipient._id
                                    },
                                    {
                                        "reply._id": db_comment._id
                                    }
                                ]
                            }
                        } else {
                            query[current_tab + "._id"] = db_comment._id;
                            update.$inc = {}
                            update.$inc[current_tab + ".$.vote_count"] = db_vote_change;
                        }

                        options.new = true;

                        Video.updateOne(query, update, options, function(err, video) {
                            if (err || !video) {
                                console.log(err);
                                console.log(video);
                                response.error = true;
                                res.send(response);
                            }
                            else {
                                response.vote_change = local_vote_change;
                                response.upvoted = upvoted;
                                response.downvoted = downvoted;
                                res.send(response);
                            }
                        })
                    }
                    else {
                        response.vote_change = local_vote_change;
                        response.upvoted = upvoted;
                        response.downvoted = downvoted;
                        res.send(response);
                    }
                }
                else {
                    response.error = true;
                    res.send(response);
                }
            }
        })
    }
    else {
        response.error = true;
        res.send(response);
    }
})

app.post('/get_usernames', function(req, res) {
    let user_ids = req.body.user_ids;
    let query = {
        $or: user_ids
    }
    let response = {
        error: false,
        users: []
    }

    User.find(query, '_id username', function(err, users) {
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

app.post('/get_moderators', function(req, res) {
    let result = {
        course_found: false,
        error: false,
        moderators: [],
        teachers: []
    }

    let course_id = req.body.course_id;

    if (mongoose.Types.ObjectId.isValid(course_id)) {
        let query = {
            _id: course_id
        }

        Course.findOne(query, function(err, course) {
            if (err) {
                console.log(err);
                result.error = true;
                res.send(result);
                return;
            }

            if (!course) {
                res.send(result);
            }
            else {
                result.course_found = true;
                let moderators = []
                let teachers = []

                course.moderators.forEach(function(moderator) {
                    moderators.push(moderator);
                })

                course.teachers.forEach(function(teacher) {
                    teachers.push(teacher);
                })

                result.moderators = moderators;
                result.teachers = teachers;
                res.send(result);
            }
        })
    }
    else {
        result.error = true;
        res.send(result);
    }
})


app.post('/get_video', function(req, res) {
    let result = {
        video_found: false,
        error: false,
        video: {},
        user_details: []
    }

    let video_id = req.body.video_id;

    if (mongoose.Types.ObjectId.isValid(video_id)) {
        let query = {
            _id: video_id
        }

        Video.findOne(query, function(err, video) {
            if (err) {
                result.error = true;
                res.send(result);
                return;
            }

            if (!video) {
                res.send(result);
            }
            else {
                result.video_found = true;
                let author_ids = [];
                let author_details = [];
                let video_comment_arrays = [video.questions, video.feedback];

                video_comment_arrays.forEach(function(comment_array) {
                    comment_array.forEach(function(comment) {
                        comment.replies_displayed = false;

                        if (!author_ids.includes(comment.author_id)) {
                            author_ids.push(comment.author_id);
                            author_details.push(
                                {
                                    _id: comment.author_id
                                }
                            )
                        }

                        comment.replies.forEach(function(reply) {
                            if (!author_ids.includes(reply.author_id)) {
                                author_ids.push(reply.author_id);
                                author_details.push(
                                    {
                                        _id: reply.author_id
                                    }
                                )
                            }
                        })
                    })
                })

                result.video = video;

                let username_query = {
                    $or: author_details
                }

                User.find(username_query, '_id username avatar_path', function(err, users) {
                    if (err) {
                        console.log(err);
                    }

                    result.user_details = users;
                    res.send(result);
                })
            }
        }).lean();
    }
    else {
        res.send(result);
    }
})



var videos_init = [
    {
        video_path: "/videos/mary berry.mp4",
        questions: [
            {
                author_id: "6260bc02663cb8f265f876da",
                text: "Interesting point! Blehdy blehdy bleh, bleh bleh bleh, blaaaaah bleh...",
                timestamp: 4,
                vote_count: 8,
                posting_time: 1659198387486,
                highlighted: false,
                replies: []
            },
            {
                author_id: "6260c9f4ef640e2f172f00d3",
                text: "So if I do this and this and then I do this then I'll get so and so result, right?",
                timestamp: 2,
                vote_count: 14,
                posting_time: 1659898487486,
                highlighted: false,
                replies: [
                    {
                        author_id: "62617f43c939d489c0de4943",
                        replying_to: "6260c9f4ef640e2f172f00d3",
                        vote_count: 3,
                        text: "Yeah I think that's right if you did that then so and so yup yup yup :)",
                        posting_time: 1659898931128,
                        highlighted: false
                    },
                    {
                        author_id: "62618401a7c8a95abbb58771",
                        replying_to: "62617f43c939d489c0de4943",
                        vote_count: 1,
                        text: "Agreed!",
                        posting_time: 1659899027047,
                        highlighted: false
                    },
                    {
                        author_id: "62631cb9c9f315c800994157",
                        replying_to: "6260c9f4ef640e2f172f00d3",
                        vote_count: -6,
                        text: "Dumb question",
                        posting_time: 1659899147725,
                        highlighted: false
                    }
                ]
            }
        ]
    }
]



app.get('/create_video_object', function(req, res) {
    Video.create(videos_init, function(err, video) {
        if (err) {
            console.log("Error:");
            console.log(err)
        }

        if (!video) {
            console.log("No video returned");
        }
        else {
            console.log("Video creation succcess");
            console.log(video);
        }
        let user = req.session.user;
        let message = "<p>Message</p>";
        let message_title = "Message Title | Studium";
        res.render(__dirname + "/public/message_page", { message, message_title, user });
    })
})

app.post('/message_page', function(req, res) {
    let user = req.session.user;
    let message = req.body.error_message;
    let message_title = req.body.error_title;
    res.render(__dirname + "/public/message_page", { message, message_title, user });
})

app.use(function(req, res, next) {
    res.render(__dirname + "/public/404")
})

function getDuplicateKeyErrorMessage(err) {
    let output = "";
    try {
        let field_name = err.message.split("{ ")[1].split(":")[0];
        output = field_name.charAt(0).toUpperCase() + field_name.slice(1) + ' already exists'
    } catch (ex) {
        output = 'Unique field already exists'
    }

    return output
}

function validateRegisterInput(input) {
    let errors = [];

    if (input.username == undefined) {
        errors.push("Please enter a username");
    }
    else {
        if (input.username.length > 15) {
            errors.push("Username must be a maximum of 15 characters");
        }
    
        if (input.username.match(/\s/g)) {
            errors.push("Username must not contain spaces");
        }
    }

    if (input.email == undefined) {
        errors.push("Please enter an email address");
    }
    else if (!input.email.match(/^\S+@\S+\.\S+$/)) {
        errors.push("Please enter a valid email address");
    }

    if (input.forename == undefined) {
        errors.push("Please enter your forename");
    }

    if (input.surname == undefined) {
        errors.push("Please enter your surname");
    }

    if (input.password == undefined) {
        errors.push("Please enter a password");
    }
    else {
        if (input.password.match(/\s/g)) {
            errors.push("Password must not contain spaces");
        }

        if (input.password.length < 6) {
            errors.push("Password must contain at least 6 characters")
        }
    }

    if (input.password_confirm == undefined) {
        errors.push("Please confirm your password");
    }

    if (input.password !== undefined && input.password_confirm !== undefined) {
        if (input.password !== input.password_confirm) {
            errors.push("Passwords must match");
        }
    }

    return errors;
}

function validateLoginInput(input) {
    let errors = [];
    if (input.username == undefined) {
        errors.push("Please enter a username");
    }
    else {
        if (input.username.match(/\s/g)) {
            errors.push("Username must not contain spaces");
        }
    }

    if (input.password == undefined) {
        errors.push("Please enter a password");
    }
    else {
        if (input.password.match(/\s/g)) {
            errors.push("Password must not contain spaces");
        }
    }

    return errors;
}

function validateCreateCourseInput(input) {
    let errors = [];
    if (input.name == undefined) {
        errors.push("Please enter a course name");
    }
    else if (input.name.length > 100) {
        errors.push("Course name must be no longer than 100 characters");
    }

    if (input.type == undefined) {
        errors.push("Please choose a course type");
    }

    if (input.description == undefined) {
        errors.push("Please enter a course description");
    }
    else if (input.description.length > 1000) {
        errors.push("Description must be no longer than 1000 characters");
    }

    return errors;
}

function getDBErrorMessage(err) {
    let err_message = "Something went wrong";

    if (err.code) {
        switch (err.code) {
            case 11000:
            case 11001:
                err_message = getDuplicateKeyErrorMessage(err);
                break;
            default:
                err_message = "Something went wrong";
        }
    }

    return err_message;
}