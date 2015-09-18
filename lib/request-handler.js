var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var mongo = require('../app/mongo');
var User = mongo.User;
var Link = mongo.Link;
// var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  var query = Link.where({});
  query.find(function(err, links){
    console.log("Links found: " + links);
    res.send(200, links);
  });


  // Links.reset().fetch().then(function(links) {
  //   res.send(200, links.models);
  // })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  var query = Link.where({ url: uri});
  query.findOne(function(err, url) {
    if (err) { console.log("Error save link " + uri)}
    else if (url) {
      res.send(200, url);
    }
    else {
      util.getUrlTitle(uri, function(err,title){
        if(err) { 
          console.log('Error reading URL headings: ', err);
          return res.send(404);
        }
        var shasum = crypto.createHash('sha1');
        shasum.update(uri);
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          code: shasum.digest('hex').slice(0, 5)
        });
        link.save(function(err, link){
          res.send(200, link);
        })
      });
    }
  })

  // new Link({ url: uri }).fetch().then(function(found) {
  //   console.log("Attributes: " + found.attributes);
  //   if (found) {
  //     res.send(200, found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.send(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         base_url: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.send(200, newLink);
  //       });
  //     });
  //   }
  // });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

// check if user exists in collection
  var query = User.where({ username: username});
  query.findOne(function(err, user) {
    if(err) { 
      console.log("Error query.findOne()") 
    }
    if (!user) {
      res.redirect('/login');
    } else {
      // -> compare input pwd to found user's pwd
        bcrypt.compare(password, user.password, function(err, isMatch) {
        // -> if they are same, create session
        // -> else redirect to /login
        console.log("Error: " + err);
        console.log("Is match: " + isMatch);
        console.log("User entered password: " + bcrypt.hashSync(password));
        console.log("Password stored in mongo: " + user.password);
        if (isMatch) {
          console.log('Well done!');
          util.createSession(req, res, user);
        }
        else {
          res.redirect("/login");
        }
      });
    }
  })

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       res.redirect('/login');
  //     } else {
  //       user.comparePassword(password, function(match) {
  //         if (match) {
  //           util.createSession(req, res, user);
  //         } else {
  //           res.redirect('/login');
  //         }
  //       })
  //     }
  // });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //check if user exists in collection(table)
  //  -> collection.find(...)
  var query = User.where({username: username});
  query.findOne(function(err, user){
      // if it doesnt, create new user
      if(err) { 
        console.log("Error query.findOne") 
      }
      else if(!user){
        // -> hash password
        var pwd = bcrypt.hashSync(password);
        // var pwd = util.hash(password);
        // -> create new model -> new User(...)
        var user = new User({ username: username, password: pwd });
        // -> save model
        user.save(function(err){
          if (err) {
            console.log("Error creating new user: " + username);
          }
          util.createSession(req, res, user);
        })
      } 
      else {
        // if it does exist
        // -> redirect or something
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       hash(password);
  //       var newUser = new User({
  //         username: username,
  //         password: password
  //       });
  //       newUser.save()
  //         .then(function(newUser) {
  //           Users.add(newUser);
  //           util.createSession(req, res, newUser);
  //         });
  //     } else {
  //       console.log('Account already exists');
  //       res.redirect('/signup');
  //     }
  //   });
};

exports.navToLink = function(req, res) {
  var query = Link.where({ code: req.params[0] });
  //find 
  query.findOne(function(err, link) {
    if(err) { console.log("Error finding url") }
    else if (!link) {
      console.log("Link does not exist");
      res.redirect('/');
    }
    else {
      link.update({$inc: {visits: 1}}, function(err, raw){
        if(err) { console.log("Error updating visit count")}
        res.redirect(link.url);
      });
    }
  });
  // new Link({ code: req.params[0] }).fetch().then(function(link) {
  //   if (!link) {
  //     res.redirect('/');
  //   } else {
  //     link.set({ visits: link.get('visits') + 1 })
  //       .save()
  //       .then(function() {
  //         return res.redirect(link.get('url'));
  //       });
  //   }
  // });
};