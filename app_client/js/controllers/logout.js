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
    function($scope, $auth, toastr, $state, $rootScope, Phone, Socket, DataModel, Cache) {
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
        Cache.reset();
        $state.go('login');
    }
]);
