
ONEmSimModule.factory('Socket', [
    '$window',
    '$auth',
    'socketFactory',
    function ($window, $auth, socketFactory) {

        var mySocket, myIoSocket;
        //debugger;
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
                var token = $auth.getToken();

                if (!token) {
                    console.log("could not locate jwt token")
                    return false;
                }

                if (myIoSocket && myIoSocket.connected) {
                    console.log("already connected, returning");
                    return myIoSocket;
                }

                var path = $window.location.protocol + "//" + $window.location.host;
                console.log("making connection")
                myIoSocket = io.connect(path, { query: { token: token } });

                console.log("token:");
                console.log(token);

                mySocket = socketFactory({
                    ioSocket: myIoSocket
                });

                //var mySocket = socketFactory();
                mySocket.forward('error');
                mySocket.forward('MT SMS');
                mySocket.forward('API MT SMS');
                mySocket.forward('LOGOUT');

                return mySocket;
            },
            emit: function (param1, param2) {
                return myIoSocket.emit(param1, param2);
            }
        }
    }
]);