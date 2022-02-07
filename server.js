/*********************************************************************************
 * WEB322 – Assignment 06
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: Zian Choudhury Student ID: 131048209 Date: 12/07/2021 *
 * Online (Heroku) Link: https://secret-meadow-60409.herokuapp.com/
 *
 * ********************************************************************************/
const dataService = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth.js");
var express = require("express");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const clientSessions = require("client-sessions");
var fs = require("fs");
const port = process.env.PORT || 8080;
var app = express();
const exphbs = require("express-handlebars");
const { get } = require("http");
app.use(express.static("static"));
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.engine(
    ".hbs",
    exphbs({
        extname: ".hbs",
        helpers: {
            navLink: function(url, options) {
                return (
                    "<li" +
                    (url == app.locals.activeRoute ? ' class="active" ' : "") +
                    '><a href="' +
                    url +
                    '">' +
                    options.fn(this) +
                    "</a></li>"
                );
            },
            equal: function(lvalue, rvalue, options) {
                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters");
                if (lvalue != rvalue) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            },
        },
    })
);
app.set("view engine", ".hbs");

app.use(function(req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
    next();
});

app.use(clientSessions({
    cookieName: "session",
    secret: "web322-app-server-js",
    duration: 10 * 60 * 1000,
    activeDuration: 2 * 1000 * 60
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// setup a 'route' to listen on the default url path
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.get("/login", (req, res) => {
    res.render("login", {});
});

app.get("/register", (req, res) => {
    res.render("register", {});
});

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body)
        .then(msg => {
            res.render("register", {
                successMessage: msg
            });
        })
        .catch(err => {
            res.render("register", {
                errorMessage: err,
                username: req.body.username
            });
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then((user) => {
        req.session.user = {
            username: user.username, // authenticated user's username 
            email: user.email, // authenticated user's email 
            loginHistory: user.loginHistory // authenticated user's loginHistory 
        }
        res.redirect('/employees');
    }).catch(err => {
        res.render("login", {
            errorMessage: err,
            username: req.body.username
        });
    });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", {});
});

app.get("/", (req, res) => {
    res.render("home", {
        data: "home",
        layout: "main",
    });
});
app.get("/about", (req, res) => {
    res.render("about", {
        data: "home",
        layout: "main",
    });
});

app.get("/employees/add", ensureLogin, (req, res) => {
    dataService.getAllDepartments().then(function(data) {
        res.render("addEmployee", {
            data: "addEmployee",
            departments: data,
            layout: "main"
        })
    });
});

app.post("/employees/add", ensureLogin, (req, res) => {
    dataService
        .addEmployee(req.body)
        .then(msg => {
            console.log(msg);
            res.redirect("/employees")
        })
        .catch("failed to add");
});

app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment", {
        data: "addDepartment",
        layout: "main"
    });
});

app.post("/departments/add", ensureLogin, (req, res) => {
    dataService
        .addDepartment(req.body)
        .then(res.redirect("/departments"))
        .catch("failed to add");
});

app.get("/department/:value", ensureLogin, (req, res) => {
    dataService
        .getDepartmentID(req.params.value)
        .then(function(list) {
            res.render("department", { data: list });
        })
        .catch(msg => console.log(msg));
});

app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
    dataService.deleteDepartmentByID(req.params.departmentId)
        .then(msg => {
            res.redirect("/departments")
        }).catch();
});

app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployee(req.params.empNum)
        .then(msg => {
            console.log(msg);
            res.redirect("/employees")
        }).catch();
});

app.get("/employees", ensureLogin, (req, res) => {
    if (req.query.status == "Full Time" || req.query.status == "Part Time") {
        dataService
            .getEmployeesByStatus(req.query.status)
            .then(function(list) {
                if (list.length == 0) res.render("employees", { message: 'no results' })
                else res.render("employees", { data: list });
            })
            .catch(msg => {
                console.log(msg);
                res.render("employees", { message: 'no results' })
            });
    } else if (req.query.department >= 1) {
        dataService
            .getEmployeesByDepartment(req.query.department)
            .then(function(list) {
                if (list.length == 0) res.render("employees", { message: 'no results' })
                else res.render("employees", { data: list });
            })
            .catch(msg => {
                console.log(msg);
                res.render("employees", { message: 'no results' })
            });
    } else if (req.query.manager >= 1 && req.query.manager <= 100) {
        dataService
            .getEmployeesByManager(req.query.manager)
            .then(function(list) {
                if (list.length == 0) res.render("employees", { message: 'no results' })
                else res.render("employees", { data: list });
            })
            .catch(msg => {
                console.log(msg);
                res.render("employees", { message: 'no results' })
            });
    } else {
        dataService
            .getAllEmployees()
            .then(function(list) {
                if (list.length == 0) res.render("employees", { message: 'no results' })
                else res.render("employees", { data: list });
            })
            .catch(msg => {
                console.log(msg);
                res.render("employees", { message: 'no results' })
            });
    }
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {

    // initialize an empty object to store the values 
    let viewData = {};

    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
            if (data) {
                viewData.employee = data; //store employee data in the "viewData" object as "employee" 
            } else {
                viewData.employee = null; // set employee to null if none were returned 
            }
        }).catch(() => {
            viewData.employee = null; // set employee to null if there was an error  
        }).then(dataService.getAllDepartments())
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments" 

            // loop through viewData.departments and once we have found the departmentId that matches 
            // the employee's "department" value, add a "selected" property to the matching  
            // viewData.departments object 

            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error 
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error 
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", { data: viewData }); // render the "employee" view 
            }
        });
});

app.get("/images/add", ensureLogin, (req, res) => {
    res.render("addImage", {
        data: "addImage",
        layout: "main",
    });
});

app.get("/images", (req, res) => {
    var path = "./public/images/uploaded/";
    var files = [];
    fs.readdirSync(path).forEach((file) => {
        files.push(file);
    });

    res.render("images", {
        data: files,
        layout: "main",
    });
});

app.get("/departments", ensureLogin, (req, res) => {
    dataService
        .getAllDepartments()
        .then(function(list) {
            if (list.length == 0) res.render("departments", { message: 'no results' })
            else res.render("departments", { data: list });
        })
        .catch(function(msg) {
            console.log(msg);
            res.render("departments", { message: 'no results' })
        });
});

app.get("/*/", (req, res) => {
    res.render("error404Page", {
        data: "error404Page",
        layout: "main",
    });
});

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
    res.redirect("/images");
});

app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body).then(res.redirect("/employees"));
});

app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body).then(res.redirect("/departments"));
});

// setup http server to listen on HTTP_PORT
dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(app.listen(process.env.PORT || 8080))
    .catch((msg) => console.log(msg));