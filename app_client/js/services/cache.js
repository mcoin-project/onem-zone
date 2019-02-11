
ONEmSimModule.factory('Cache', [
    'Socket',
    function (Socket) {

        var services = [
            { name: 'market', template: 'cards' }
        ];

        return {

            getServices: function (scope) {

                return new Promise(function (resolve, reject) {

                    scope.$on('socket:API MT SMS', function (ev, data) {
                        //                $scope.theData = data;

                        console.log("Cache: MT received:");
                        console.log(data);

                        resolve(data);
                        return data;
                    });
                    Socket.emit('API MO SMS', '#');
                });
            }
        }
    }
]);
