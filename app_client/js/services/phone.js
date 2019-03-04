ONEmSimModule.factory('Phone', [
    'Socket',
    '$rootScope',
    'dateFilter',
    function (Socket, $rootScope, dateFilter) {

        var phoneONEm;

        return {
            stop: function () {
                if (!phoneONEm) {
                    console.log("phoneONEm not defined")
                    return;
                }
                if (phoneONEm.isConnected()) phoneONEm.terminateSessions();
                phoneONEm.stop();
                phoneONEm.unregister();
            },
            start: function (response) {
                console.log("got start response");
                Socket.connect();

                // might need to check the response from Socket.connect and return here if already connected

            }
        }
    }
]);
