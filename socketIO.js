const outController = require('./controller/outController')
const inController = require('./controller/inController')
module.exports = (io) => {
    const chatNamespace = io.of('/chat'); // create a namespace for '/chat'
    const users = {}; // mapping of usernames to socket IDs

    chatNamespace.on('connection', (socket) => {
        // Get the sender from the client
        const sender = socket.handshake.query.username;

        // Store the username-socket ID mapping
        users[sender] = socket.id;

        let reciever, recieverSocketId;
        // establishing one to one connection
        socket.on('one to one', (data) => {            
            reciever = data.to;
        });
        // receiving the message from sender and then emitting it to the reciever
        socket.on('new message', (msg) => {
            // saving message in database
            outController.saveChat(sender, reciever, msg, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    recieverSocketId = users[reciever];
                    // Send the message to the recipient
                    chatNamespace.to(recieverSocketId).emit('message', msg);
                }
            });
        });
        socket.on('friend request sent', (data) => {
            let reciever = data.to;
            let recieverSocket = users[reciever];
            // saving the request in the db
            inController.saveRequest(sender, reciever, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    // Send the request to the recipient
                    chatNamespace.to(recieverSocket).emit('friendRequest', result);
                }
            })
        })
        socket.on('friend request accept', (data) => {
            let reqSender = data.from;
            let reqReciever = sender;
            let reqSenderId = users[reqSender];
            let reqRecieverId = users[reqReciever];

            // saving the request in the db
            inController.acceptRequest(reqSender, reqReciever, (err, result,reqSender) => {
                if (err) {
                    console.log(err);
                } else {                    
                    // accepting friend request
                    chatNamespace.to(reqRecieverId).emit('req Accepted ack', reqSender);    
                    chatNamespace.to(reqSenderId).emit('req Accepted', result);    
                }
            })
        })
        socket.on('disconnect', () => {
            console.log(socket.id + " has disconnected");

        })
    })
}