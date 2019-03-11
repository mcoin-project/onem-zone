
ONEmSimModule.factory('Socket', [
    '$window',
    '$auth',
    '$rootScope',
    'DataModel',
    function ($window, $auth, $rootScope, DataModel) {

        var mySocket, channel;
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
                } else if ($window.location.port.length > 0) {
                    port = $window.location.port;
                } else {
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



                mySocket.on('subscribe', function(data){
                    console.log('SUBSCRIBED TO CHANNEL');
                    console.log(data);
                    channel.watch(function (data) {
                        console.log('Client received data from pong channel:');
                        console.log(data);
                        var outputObj = {
                            type: "mt",
                            value: data.mtText
                        };
                        $scope.results = DataModel.addResult(outputObj);
                    });
                    // pongChannel.watch(function (count) {
                    //     console.log('Client received data from pong channel:', count);
                    //   });
                    // mySocket.on(channel, function(data) {
                    //     console.log("Mysocket MT received:");
                    //     console.log(data);
            
                    //     var outputObj = {
                    //         type: "mt",
                    //         value: data.mtText
                    //     };
            
                    //     $scope.results = DataModel.addResult(outputObj);
                    // })
                });


                mySocket.on('connect', function (status) {
                    console.log("isAuthenticated:");
                    console.log(status.isAuthenticated)
                    console.log('SOCKET CONNECTED');
                    channel = mySocket.subscribe($rootScope.msisdn, { waitForAuth: true });
                });

                return mySocket;
            },
            emit: function (data) {
                return mySocket.publish(channel, data, function(result) {
                    console.log(result);
                });
            }
        }
    }
]);