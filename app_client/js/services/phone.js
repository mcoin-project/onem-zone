ONEmSimModule.factory('Phone', [
    'Socket',
    function (Socket) {

        var phoneData, phoneSession;

        return {
            phoneData: phoneData,
            phoneSession: phoneSession,
            stop: function () {
                if (!phoneData) {
                    console.log("phoneData not defined")
                    return;
                }
                if (phoneData.isConnected()) phoneData.terminateSessions();
                phoneData.stop();
                phoneData.unregister();
            },
            start: function (response) {
                console.log("got start response");
                Socket.connect();

                // might need to check the response from Socket.connect and return here if already connected

            }
        }
    }
]);
