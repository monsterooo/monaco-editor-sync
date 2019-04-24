const server = require('http').createServer();
const io = require('socket.io')(server);


io.on('connection', function(client) {
  const query = client.handshake.query;
  const room = query.r;
  
  client.join(room);
  // 客户端离开
  client.on('disconnect', async () => {
    console.log('断开连接');
  });
  client.on('event', (data) => {
    const rooms = io.sockets.adapter.rooms[room];
    const sockets = Object.keys(rooms.sockets).filter((item) => item !== client.id);

    console.log('socket id > ', client.id);
    console.log('rooms > ', client.rooms);
    // console.log('clients > ', io.sockets) // .clients(room)
    console.log('other sockets > ', sockets)
    let sendTo = null;
    sockets.forEach((s) => {
      sendTo = io.to(s);
    });
    sendTo && sendTo.emit('event', data);
    // io.to(room).emit('event', data);
  });
  // io.to(room).emit('welcome', 'welcome to ' + room);
});


server.listen(1024, '0.0.0.0');

function log() {
  console.log.apply(this, arguments);
}