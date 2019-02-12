ONEmSimModule.controller('navbarController', [
    '$scope',
    '$rootScope',
    '$timeout',
    '$auth',
    '$state',
    '$location',
    'Cache',
    'DataModel',
    'Socket',
    function ($scope, $rootScope, $timeout, $auth, $state, $location, Cache, DataModel, Socket) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.agree = function() {
            $state.go('logoutDelete');
        }

        $scope.$on('error', function (ev, data) {
            console.log("[MN]: socket error:" + ev);
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:LOGOUT', function (ev, data) {
            $location.path('/logout');
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $rootScope.$apply();
            });
        });

        $scope.$on('socket:MT SMS', function (ev, data) {
            $scope.theData = data;

            console.log("[MN]: MT received:");
            console.log(data);

            var outputObj = {
                type: "mt",
                value: data.mtText
            };

            $scope.results = DataModel.addResult(outputObj);

        });

        $scope.smsInput = function () {

            if (typeof $scope.smsText === 'undefined' || $scope.smsText.length === 0) return;

            var inputObj = {
                type: "mo",
                value: $scope.smsText
            };
            $scope.results = DataModel.addResult(inputObj);
            console.log("[MN]: calling emit");
            Socket.emit('MO SMS', $scope.smsText);
            $scope.smsText = '';
        };

        $scope.$on('socket:API MT SMS', function (ev, data) {
            console.log("getService: received MT");
            console.log(data);

            Cache.receivedMt(data.mtText);

        });

    }
]);
