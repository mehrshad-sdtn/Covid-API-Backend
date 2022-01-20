const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Country = require('../models/country');
const User = require('../models/user');



// in this function superuser is authorized
exports.superuser = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token);
        const decoded = jwt.verify(token, 'secret');
        req.userData = decoded
        next();

    } catch(error){
      
        return res.status(401).json({
            message: "you don't have the required permissions"
        });
    

    }
};

exports.admin = (req, res, next) => {
    try {
        const userpass = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
        const username = userpass.split(':')[0];
        const pass = userpass.split(':')[1];
       
        User.find({username: username})
        .exec()
        .then(user => {
            bcrypt.compare(pass, user[0].password, (err, result) => {
                if (err) { 
                    return res.status(403).json({message: "you don't have the required permissions"});
                }
    
            });


        })  
        next();

    } catch(error){
        return res.status(403).json({
            message: "you don't have the required permissions"
        });
    

    }
   
};

exports.hasEditPermission = (req, res, next) => {
    const userpass = Buffer.from(req.headers.authorization.split(" ")[1], 'base64')
    .toString()
    .split(':');
    const user = userpass[0];
    Country.find({name: req.params.country})
    .exec()
    .then(country => {
       if(country[0].permissions.includes(user)){
           next();
       }
       else {
            return res.status(403).json({
            message: "forbidden action"
            });       
       }
    })
};


