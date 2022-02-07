// const employeeData = require("./data/employees.json");
// const departmentData = require("./data/department.json");
// const fs = require('fs');
// const { ifError } = require("assert");
// let employees = new Array();
// let departments = new Array();

// Host
//     ec2-3-229-166-245.compute-1.amazonaws.com
// Database
//     d8ucia24vlo5a9
// User
//     vhunvoapijsmew
// Port
//     5432
// Password
//     a49ad8086c2695395ee326cfe447920e9e06468420e530044ae34e7ae8f4f6a3
// URI
//     postgres://vhunvoapijsmew:a49ad8086c2695395ee326cfe447920e9e06468420e530044ae34e7ae8f4f6a3@ec2-3-229-166-245.compute-1.amazonaws.com:5432/d8ucia24vlo5a9
// Heroku CLI
//     heroku pg:psql postgresql-contoured-70554 --app secret-meadow-60409

const { where } = require('sequelize');
const Sequelize = require('sequelize');
var sequelize = new Sequelize('d8ucia24vlo5a9', 'vhunvoapijsmew', 'a49ad8086c2695395ee326cfe447920e9e06468420e530044ae34e7ae8f4f6a3', {
    host: 'ec2-3-229-166-245.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    logging: false,
    raw: true,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    addressState: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    department: Sequelize.INTEGER,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});
var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});
Department.hasMany(Employee, { foreignKey: 'department' });

function parseInArray(data) {
    let departArray = [];
    data.forEach(depart => departArray.push(depart.dataValues));
    return departArray;
}

function initialize() {
    return sequelize.sync().then(console.log('Connected!'))
        .catch("unable to sync the database");
};

function addEmployee(employeeData) {
    employeeData.isManager = (employeeData.isManager) ? true : false;
    if (employeeData.employeeManagerNum == 0) employeeData.employeeManagerNum = null;
    for (var prop in employeeData) {
        if (prop == "") prop = null;
    }
    return Employee.create(employeeData).then('Added employee')
        .catch('unable to create employee');
}

function getAllEmployees() {
    return Employee.findAll().then(data => {
            return parseInArray(data);
        })
        .catch('no results returned');
}

function getManagers() {
    return Employee.findAll({
            where: {
                isManager: true
            }
        }).then(data => { return parseInArray(data) })
        .catch('no results returned');
}

function getEmployeesByStatus(status) {
    return Employee.findAll({
            where: {
                status: status
            }
        }).then(data => {
            return parseInArray(data)
        })
        .catch('no results returned');
}

function getEmployeesByDepartment(department) {
    return Employee.findAll({
            where: {
                department: department
            }
        }).then(data => { return parseInArray(data) })
        .catch('no results returned');
}

function getEmployeesByManager(manager) {
    return Employee.findAll({
            where: {
                employeeManagerNum: manager
            }
        }).then(data => { return parseInArray(data) })
        .catch('no results returned');
}

function getEmployeeByNum(value) {
    return Employee.findAll({
            where: {
                employeeNum: value
            }
        }).then(data => { return parseInArray(data) })
        .catch('no results returned');
}

function getAllDepartments() {
    return Department.findAll({ raw: true }).then(data => {
        return data;
    }).catch('failed');
}

function updateEmployee(employeeData) {
    if (employeeData.isManager == null) employeeData.isManager = false;
    else employeeData.isManager = true;
    for (var prop in employeeData) {
        prop = "" ? null : prop;
    }
    return Employee.update(employeeData, {
            where: { email: employeeData.email }
        }).then('Updated employee')
        .catch('unable to create employee');
}

function addDepartment(department) {
    for (var prop in department) {
        prop = "" ? null : prop;
    }
    return Department.create({
            departmentId: department.departmentId,
            departmentName: department.departmentName
        }).then('Added department')
        .catch('unable to create department');
}

function updateDepartment(department) {
    if (!department.departmentName) department.departmentName = "";
    return Department.update(department, { where: { departmentId: department.departmentId }, raw: true })
        .then('Updated department')
        .catch('unable to create department');
}

function getDepartmentID(value) {
    return Department.findAll({
            where: { departmentId: value },
            raw: true
        }).then(data => {
            return data;
        })
        .catch('no results returned');
}

function deleteDepartmentByID(id) {
    return Department.destroy({ where: { departmentId: id }, raw: true })
        .then('Deleted department')
        .catch('Unable to delete');
}

function deleteEmployee(num) {
    return Employee.destroy({ where: { employeeNum: num }, raw: true })
        .then('Deleted employee')
        .catch('Unable to delete');
}

module.exports = {
    initialize: initialize,
    getAllDepartments: getAllDepartments,
    getAllEmployees: getAllEmployees,
    getManagers: getManagers,
    getEmployeesByStatus: getEmployeesByStatus,
    getEmployeesByManager: getEmployeesByManager,
    getEmployeesByDepartment: getEmployeesByDepartment,
    getEmployeeByNum: getEmployeeByNum,
    addEmployee: addEmployee,
    updateEmployee: updateEmployee,
    addDepartment: addDepartment,
    updateDepartment: updateDepartment,
    getDepartmentID: getDepartmentID,
    deleteDepartmentByID: deleteDepartmentByID,
    deleteEmployee: deleteEmployee
};