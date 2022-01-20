const express = require('express');
const app = express();
const Joi = require('joi');
const url = require('url');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const Country = require('./models/country');
const User = require('./models/user');
const utils = require('./utils');
const checkAuth = require('./middleware/checkAuth');





mongoose.connect('mongodb+srv://mehrshad:mehrshad1010@ie-final.7fa0l.mongodb.net/IE-final?retryWrites=true&w=majority')
.then(() => console.log('connected to DB successfully'))
.catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/countries', (req, res) => {
    sortParam = url.parse(req.url,true).query.sort;
    console.log(sortParam);
    Country.find().sort(`-${sortParam}`)
    .then(docs => {
        res.status(200).json(docs);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });

});


app.post('/countries/country', checkAuth.superuser, (req, res) => {
    countryName = utils.capitalize(req.body.name);
    console.log(countryName);
    const country = createNewCountry(countryName);  
    country.save()
    .then(result => { 
        console.log(result); 
        res.status(201).json({
            message: "successfull POST request to /countries",
            createdCountry: country
          });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
});



app.get('/countries/:country', (req, res) => {
    countryName = utils.capitalize(req.params.country);
    Country.findOne({name: countryName}, (err, data) => {
        if (err) {
            res.status(500).json({error:err});
            return;
        }
        if(data === null) {
            res.status(404).json({
                code: '404',
                message: "no records found"
            });
            return;
        }
        res.status(200).json(data);
    });

});
//NOTE: superuser needs token to be validated, token can be recieved by logging in through /superuser/login route
app.put('/countries/country', checkAuth.superuser, (req, res) => {
    countryName = utils.capitalize(req.body.name);
    updateCountryPermissions(req, res);

});
// requests to this route go through 2 middleware to validate th admin and check 
//if admin has permissions to edit that country
//NOTE: admins are validated with user-pass
app.put('/countries/:country', checkAuth.admin, checkAuth.hasEditPermission, (req, res) => {
    countryName = utils.capitalize(req.params.country);
    updateCountryInfromation(req, res, countryName);

});
//----------------------------------------------
app.post('/admin', checkAuth.superuser, (req, res) => {
    User.find({username: req.body.username}).exec()
    .then(user => {
        if(user.length >= 1) {
            return res.status(409).json({message: 'username already exist'});
        }
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });

    bcrypt.hash(req.body.password, 10, (err, pwd) => {
        if (err) {
            res.status(500).json({error: err});
            return;
        }
        
        const user = createNewAdmin(req.body.username, pwd);

        user.save()
        .then(result => { 
            res.status(201).json({
                message: "admin created", createdUser: result });
        }).catch(err => {
            console.log(err);
        });


    });

});


app.post('/superuser/login', (req, res) => {
    if (req.body.username !== "superuser"){
        return res.status(404).json({message: "auth failed, username is not correct"});
    }
    
    User.find({username: "superuser"})
    .exec()
    .then(user => {
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if (err) {
                return res.status(404).json({message: "auth failed"});
            }
            if (result) {
                const token = jwt.sign(
                    {username: "superuser"},
                     'secret', 
                     {expiresIn: '1h'}
                     );

                res.status(200).json({message: "auth successful", token: token});
            }
            else{
                return res.status(404).json({message: "auth failed"});
            }

        });
    }).catch(err => { res.status(500).json({error: err}); });

});

const updateCountryInfromation = (req, res, countryName) => {
    Country.updateOne({name: countryName}, { 
        todayCases: req.body.todayCases, 
        todayDeaths: req.body.todayDeaths,
        todayRecovered: req.body.todayRecovered,
        critical: req.body.critical
    }).exec()
    .then(result => { 
        console.log(result); 
        res.status(201).json({
            message: "successfull PUT request to /countries",
          });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
}


const createNewCountry = (countryName) => {
    const country = new Country({
        _id: new mongoose.Types.ObjectId(),
        name: countryName,
        todayCases: 0, 
        todayDeaths: 0,
        todayRecovered: 0,
        critical: 0
    });
    return country;
};

const createNewAdmin = (adminUsername, Adminpassword) => {
    return new User({
        _id: new mongoose.Types.ObjectId(),
        username: adminUsername,
        password: Adminpassword,
        role:"admin"
        
    });
};


const updateCountryPermissions = (req, res) => {
    Country.updateOne({ name: req.body.name },
          { $addToSet: { permissions: req.body.adminIDs} })
    .exec()
    .then(result => { 
        console.log(result); 
        res.status(201).json({
            message: "successfull PUT request to /countries",
          });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });

};


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on port ${port} ...`);
});