const express = require("express")
const path = require("path")
const http = require("http")
const formatMessage = require("./utils/messages")
const {userJoin , getCurrentUser , userLeave , getRoomUsers} = require("./utils/users")
const app = express()
const socketio = require("socket.io")



const PORT = 3000 || process.env.PORT
const server = http.createServer(app)
const io = socketio(server) 

// set static folder
app.use(express.static(path.join(__dirname,'public')))

const botname = "Chatchord bot"

// run when client connects
io.on('connection', socket=>{
    // console.log("new socket connection")

    socket.on('joinroom',({username, room})=>{

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        socket.emit('message', formatMessage(botname,"welcome to chatchord"))  // for single client

        // Broadcast when an user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botname,`${user.username} has joined the chat`))  // all the clients except connected client
        // ^- to specific room

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users : getRoomUsers(user.room)
        })
    })

    

    // io.emit() // all the clients

    socket.on('disconnect',()=>{

        const user = userLeave(socket.id)

        

        if(user){
            io.emit('message', formatMessage(botname,`${user.username} has left the chat`))
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users : getRoomUsers(user.room)
            })
        }

        
    })

    // Listen for chat message
    socket.on('chatMessage', (msg) => {

        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message' , formatMessage(user.username, msg))
    })
})


server.listen(PORT , ()=>{
    console.log(`server is running on the port ${PORT}`)
})