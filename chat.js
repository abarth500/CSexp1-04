var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(10080, function() {
    console.log((new Date()) + ' Server is listening on port 10080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  return true;
}

var connections = {};
var connectionIDCounter = 0;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    var sendUTFAll = function(msg){
        Object.keys(connections).forEach(function(key){
            console.log("key:"+key);
            connections[key].sendUTF(msg);
        });
    }
    var sendBinaryAll = function(msg){
        Object.keys(connections).forEach(function(key){
            connections[key].sendBinary(msg);
        });
    }
    var connection = request.accept('chat', request.origin);
    connection.id = connectionIDCounter ++;
    connections[connection.id] = connection;
    console.log((new Date()) + ' Connection ID ' + connection.id + ' accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            sendUTFAll(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            sendBytesAll(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
                    "Connection ID: " + connection.id);
        delete connections[connection.id];
    });
});