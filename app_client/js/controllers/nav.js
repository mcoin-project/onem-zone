ONEmSimModule.controller('navbarController', [
    '$scope',
    '$rootScope',
    '$auth',
    '$state',
    'Socket',
    'DataModel',
    function ($scope, $rootScope, $auth, $state, Socket, DataModel) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.$on('socket:connect', function (ev, data) {
            console.log("socket connect:");
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:error', function (ev, data) {
            console.log("socket error:");
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:LOGOUT', function (ev, data) {
            $state.go('LOGOUT');
        });

        $scope.$on('socket:MESSAGE RECEIVED', function (ev, data) {
            console.log("MESSAGE RECEIVED:");
            console.log(data);
            var outputObj = {
                type: "mt",
                value: data.mtText
            };
            $scope.results = DataModel.addResult(outputObj);
        });

        Socket.connect();

        $state.go('main')

    }
]);
