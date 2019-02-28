ONEmSimModule.controller('logoutController', [
    '$scope',
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    'Phone',
    'Socket',
    'DataModel',
    'Cache',
    'Request',
    function($scope, $auth, toastr, $state, $rootScope, Phone, Socket, DataModel, Cache, Request) {
        $scope.$parent.spinner = false;

        if ($auth.isAuthenticated()) { 
            $auth.logout().then(function() {
                toastr.info('You have been logged out');
            });
        }
        Phone.stop();
        Socket.disconnect();
        $rootScope.msisdn = undefined;
        $rootScope.user = undefined;
        DataModel.clearResults();
        Request.reset();
        Cache.reset();
        $state.go('login');
    }
]);
