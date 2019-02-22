ONEmSimModule.controller('settingsController', [
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

        $scope.agree = function () {
            $state.go('logoutDelete');
        }

    }
]);
