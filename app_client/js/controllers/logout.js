ONEmSimModule.controller('logoutController', [
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    'Phone',
    'Socket',
    'DataModel',
    function($auth, toastr, $state, $rootScope, Phone, Socket, DataModel) {
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
        $state.go('login');
    }
]);
