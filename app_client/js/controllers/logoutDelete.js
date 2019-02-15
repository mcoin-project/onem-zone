ONEmSimModule.controller('logoutDeleteController', [
    '$auth',
    'toastr',
    '$state',
    '$rootScope',
    'Phone',
    'Socket',
    'DataModel',
    'User',
    function($auth, toastr, $state, $rootScope, Phone, Socket, DataModel, User) {

        Promise.resolve().then(function() {
            if ($auth.isAuthenticated()) { 
                return User.deleteUser().$promise;
            } else {
                return true;
            }
        }).then(function() {
            if ($auth.isAuthenticated()) { 
                return $auth.logout();
            } else {
                return true;
            }
        }).then(function() {
            toastr.info('You have been logged out');
            Phone.stop();
            Socket.disconnect();
            $rootScope.msisdn = undefined;
            $rootScope.user = undefined;
            DataModel.clearResults();
            $state.go('login');
        }).catch(function(error) {
            console.log(error);
            toastr.info('Error logging out - close browser tab');
            $state.go('main');
        });
    }
]);