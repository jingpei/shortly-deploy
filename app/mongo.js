var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('localhost:27017/shortly');

var urlSchema = new Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: {type: Number, default: 0},
  timestamp: Date
});

var Link = mongoose.model('Link', urlSchema);

var userSchema = new Schema({
  username: String,
  password: String,
  timestamp: Date
})

var User = mongoose.model('User', userSchema);

// var kitty = new Cat({ name: "Zildjian" });
// kitty.save(function(err){
//   if(err){
//     console.log('meow');
//   }
// });

module.exports.User = User;
module.exports.Link = Link;