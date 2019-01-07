ONEmSimModule.controller('logoutController', [
    '$location',
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    'Phone',
    'Socket',
    'DataModel',
    function($location, $auth, toastr, $state, $rootScope, Phone, Socket, DataModel) {
        if ($auth.isAuthenticated()) { 
            $auth.logout().then(function() {
                toastr.info('You have been logged out');
            });
        }
        Phone.stop();
        Socket.disconnect();
        $rootScope.msisdn = undefined;
        DataModel.clearResults();
        $state.go('home');
    }
]);