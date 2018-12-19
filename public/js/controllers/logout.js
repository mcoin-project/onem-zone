ONEmSimModule.controller('logoutController', [
    '$location',
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    'Setupphone',
    'Socket',
    function($location, $auth, toastr, $state, $rootScope, Setupphone, Socket) {
        if ($auth.isAuthenticated()) { 
            $auth.logout().then(function() {
                toastr.info('You have been logged out');
            });
        }
        Setupphone.stop();
        Socket.disconnect();
        $rootScope.msisdn = undefined;
        $state.go('home');
    }
]);