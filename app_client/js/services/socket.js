
ONEmSimModule.factory('Socket', [
    '$window',
    '$auth',
    'socketFactory',
    function ($window, $auth, socketFactory) {

        var mySocket, myIoSocket;

        return {

            disconnect: function () {
                if (!myIoSocket) {
                    console.log("myIoSocket undefined");
                    return;
                }
                console.log("disconnecting socket");
                return myIoSocket.disconnect();
            },

            connect: function () {
                var token = null;

                if (myIoSocket && myIoSocket.connected) {
                    console.log("already connected, returning");
                    return myIoSocket;
                }

                var path = $window.location.protocol + "//" + $window.location.host;
                console.log("making connection")
                //myIoSocket = io.connect(path, { query: { token: token } });

                myIoSocket = io.connect('http://localhost:5000', { query: { token: token } });

                console.log("token:");
                console.log(token);

                mySocket = socketFactory({
                    ioSocket: myIoSocket
                });

                mySocket.forward('connect')
                mySocket.forward('disconnect')
                mySocket.forward('error');
                mySocket.forward('MESSAGE RECEIVED');
                mySocket.forward('LOGOUT');

                return mySocket;
            },

            emit: function (...args) {
                return myIoSocket.emit(...args);
            }
        }
    }
]);