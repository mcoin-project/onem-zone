
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    function (Socket, $timeout) {

        var services = [
            { name: 'account', template: 'cards' },
            { name: 'aljazeera', template: 'cards' },
            { name: 'contacts', template: 'cards' },
            { name: 'france24', template: 'cards' },
            { name: 'market', template: 'cards' },
            { name: 'msg', template: 'cards' },
            { name: 'onem', template: 'cards' },
            { name: 'reuters', template: 'cards' },
            { name: 'subscribe', template: 'cards' },
            { name: 'xgroup', template: 'cards' },
            { name: 'unsubscribe', template: 'cards' }
        ];

        var activeServices = [];

        processServices = function (mtText) {

            var matches = mtText.match(/(^([A-Z])[ ].*\n+)/gm);
            var results = [];
            if (matches.length > 0) {
                matches.filter(function (s) {
                    var r = s.split(' #');
                    results.push(r[1].trim().toLowerCase());
                });
                for (var i = 0; i < results.length; i++) {
                    if (services[i].name == results[i]) {
                        activeServices.push(services[i]);
                    }
                }
            } else {
                return -1;
            }
            return activeServices;
        }

        return {

            // taking scope as a param is a hack
            getServices: function (scope) {

                return new Promise(function (resolve, reject) {

                    scope.$on('socket:API MT SMS', function (ev, data) {
                        $timeout.cancel(timer);
                        var results = processServices(data);
                        console.log(results);
                        resolve(data);
                    });
                    Socket.emit('API MO SMS', '#');
                    var timer = $timeout(
                        function () {
                            reject("no response to MO SMS");
                        }, 10000 // run 10s timer to wait for response from server
                    );
                });
            }
        }
    }
]);
