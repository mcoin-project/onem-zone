
ONEmSimModule.factory('Socket', [
    '$window',
    '$auth',
    '$rootScope',
    function ($window, $auth, $rootScope) {

        var mySocket;
        //debugger;
        return {
            disconnect: function () {
                if (!mySocket) {
                    console.log("mySocket undefined");
                    return;
                }
                return mySocket.destroy();
            },
            connect: function () {
                var secure = false, port, token = $auth.getToken();

                if (!token) {
                    console.log("could not locate jwt token")
                    return false;
                } else {
                    console.log("token:");
                    console.log(token);
                }
                $window.localStorage.setItem('socketCluster.authToken', token);
                //var path = $window.location.protocol + "//" + $window.location.host;
                console.log("making connection")

                port = $window.location.port;
                // derive the port from hostname
                if ($window.location.protocol == "https:") {
                    port = 443;
                    secure = true;
                } else  {
                    port = 8000;
                }
                console.log("using port:" + port);
                console.log("using hostname:" + $window.location.hostname);

                var options = {
                    hostname: $window.location.hostname,
                    secure: secure,
                    port: port,
                };
                // Initiate the connection to the server
                mySocket = socketCluster.create(options);
                //mySocket.setAuthToken(token, function(response) {console.log(response);});

                // myIoSocket = io.connect(path, { query: { token: token } });

                // console.log("token:");
                // console.log(token);

                // mySocket = socketFactory({
                //     ioSocket: myIoSocket
                // });

                // //var mySocket = socketFactory();
                // mySocket.forward('error');
                // mySocket.forward('MT SMS');
                // mySocket.forward('LOGOUT');

                mySocket.on('subscribe', function(status){
                    console.log('SUBSCRIBED TO CHANNEL');
                    console.log(status);
                });

                mySocket.on('connect', function (status) {
                    console.log("isAuthenticated:");
                    console.log(status.isAuthenticated)
                    console.log('SOCKET CONNECTED');
                    mySocket.subscribe($rootScope.msisdn, { waitForAuth: true })
                });

                return mySocket;
            },
            emit: function (param1, param2) {
                return mySocket.publish($rootScope.msisdn, param2, function(result) {
                    console.log(result);
                });
            }
        }
    }
]);