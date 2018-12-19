ONEmSimModule.controller('logoutController', [
    '$location',
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    function($location, $auth, toastr, $state, $rootScope) {
        if ($auth.isAuthenticated()) { 
            $auth.logout().then(function() {
                toastr.info('You have been logged out');
            });
        }
        $rootScope.msisdn = undefined;
        $state.go('home');
    }
]);