
ONEmSimModule.factory('Socket', [
    '$window',
    '$auth',
    'socketFactory',
    function ($window, $auth, socketFactory) {

        var mySocket, myIoSocket;
        //debugger;
        return {
            disconnect: function () {
                if (!mySocket) {
                    console.log("mySocket undefined");
                    return;
                }
                return myIoSocket.disconnect();
            },
            connect: function () {
                var token = $auth.getToken();

                if (!token) {
                    console.log("could not locate jwt token")
                    return false;
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
                mySocket.forward('LOGOUT');

                return mySocket;
            },
            emit: function (param1, param2) {
                return myIoSocket.emit(param1, param2);
            }
        }
    }
]);