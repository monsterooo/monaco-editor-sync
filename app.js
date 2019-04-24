const mongoose = require('mongoose');
const server = require('http').createServer();
const io = require('socket.io')(server);

mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection mongodb error:'));
db.once('open', function() {
  // we're connected!
});
// events => type event
const eventSchema = new mongoose.Schema({
  rid: String,
  type: String,
  event: Object,
});
const Event = mongoose.model('Event', eventSchema);


io.on('connection', function(client) {
  const query = client.handshake.query;
  const room = query.r;
  const historyEvents = Event.find({ rid: room });

  console.log('客户端连接 ' + client.id);
  historyEvents.then((result) => {
    console.log(client.id + '查询历史事件数据 > ');
    io.sockets.to(client.id).emit('initEvents', result);
  })
  client.join(room);
  // 客户端离开
  client.on('disconnect', async () => {
    console.log('断开连接');
  });
  client.on('event', (data) => {
    const rooms = io.sockets.adapter.rooms[room];
    const sockets = Object.keys(rooms.sockets).filter((item) => item !== client.id);
    const saveEvent = new Event({rid: room, ...data});

    saveEvent.save(function(err, e) {
      err && console.log('err > ', err);
    })
    // console.log('socket id > ', client.id);
    // console.log('other sockets > ', sockets)
    let sendTo = null;
    sockets.forEach((s) => {
      sendTo = io.to(s);
    });
    sendTo && sendTo.emit('event', data);
  });
});


server.listen(1024, '0.0.0.0');

function log() {
  console.log.apply(this, arguments);
}