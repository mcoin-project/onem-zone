
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    function (Socket, $timeout) {

        var services = [
            { name: 'market', template: 'cards' }
        ];

        return {

            // taking scope as a param is a hack
            getServices: function (scope) {

                return new Promise(function (resolve, reject) {

                    scope.$on('socket:API MT SMS', function (ev, data) {
                        $timeout.cancel(timer);
                        resolve(data);
                    });
                    Socket.emit('API MO SMS', '#');
                    var timer = $timeout(
                        function () {
                            reject("no response to MO SMS");
                        }, 100
                    );
                });
            }
        }
    }
]);
