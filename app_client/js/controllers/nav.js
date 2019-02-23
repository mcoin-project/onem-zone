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
    'Phone',
    'SmsHandler',
    'User',
    function ($scope, $rootScope, $timeout, $auth, $state, $location, Cache, DataModel, Socket, Phone, SmsHandler, User) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.dropdown="My Profile";
        $scope.user = {};

        $rootScope.$watch('user', function(newVal, oldVal, scope) {
            console.log("rootscope watch");
            console.log(newVal);
            if (newVal) {
                if (newVal.email) $scope.user.email = newVal.email;
                if (newVal.firstName) $scope.user.firstName = newVal.firstName;
                if (newVal.lastName) $scope.user.lastName = newVal.lastName;
            }

            if ($rootScope.user) {
                console.log($scope.dropdown);
                if ($rootScope.user.firstName) {
                    $scope.dropdown = $rootScope.user.firstName;
                    console.log($scope.dropdown);
    
                    if ($rootScope.user.lastName) $scope.dropdown += ' ';
                }
                if ($rootScope.user.lastName) {
                    console.log($scope.dropdown);
    
                    $scope.dropdown += $rootScope.user.lastName;
                }
                if (!$scope.dropdown) {
                    console.log($scope.dropdown);
    
                    $scope.dropdown = $rootScope.user.email;
                }
            }
        });

        $scope.$on('error', function (ev, data) {
            console.log("[MN]: socket error:" + ev);
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:LOGOUT', function (ev, data) {
            $state.go('logout');
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

        $scope.$on('socket:API MT SMS', function (ev, data) {
            console.log("nav: received MT");
            console.log(data.mtText);

            Cache.receivedMt(data.mtText);

        });

    }
]);
