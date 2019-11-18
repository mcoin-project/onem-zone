ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'Cache',
  //  'SmsHandler',
    'User',
    'Phone',
    '$timeout',
    'Cache',
    'toastr',
    'DataModel',
    function ($scope, $rootScope, $state, Cache, User, Phone, $timeout, Cache, toastr, DataModel) {
        console.log("user:" + $rootScope.user);

        return;


        User.getProfile().$promise.then(function (response) {

            console.log("$scope.emailCheckboxModel.on");
            console.log($scope.$parent.emailCheckboxModel.on);
            if (Cache.isInitialized()) {
                console.log("already initialized");
                throw null;
            } else if (!$rootScope.msisdn) {
                return User.getMsisdn().$promise;
            } else {
                return { msisdn: $rootScope.msisdn };
            }
        }).then(function (response) {
            console.log("setting msisdn:" + response.msisdn);
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $rootScope.msisdn = response.msisdn;
                $rootScope.user = response.user;
                $rootScope.$apply();
            });
            return SmsHandler.start().$promise


        }).catch(function (error) {

            //  debugger;
            DataModel.setSpinner(false);

            console.log("error in main ");
            console.log(error);
            if (error == null) {
                resolveState();
            } else if (!$rootScope.msisdn) {
                console.log("no msisdn, going to capture");
                $state.go('captureMsisdn');
            } else {
                if (error) toastr.error(error);
            }
        });

    }
]);
