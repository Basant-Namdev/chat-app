const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true ,unique : true},
    password: { type: String},
    profile:{type:String},
    authType : {type : String},
    googleId : {type:String},
    friendReq: [{ type: String }],
    friends: [{ type: String }],
    sentReq: [{ type: String }]
}, {
    timestamps: true
  }
);

const chatSchema = new Schema({
    sender: { type: String, required: true },
    reciever: { type: String, required: true },
    message: { type: String, required: true }
}, {
    timestamps: true
  }
);

exports.users = mongoose.model('users', userSchema);
exports.chats = mongoose.model('chats', chatSchema);