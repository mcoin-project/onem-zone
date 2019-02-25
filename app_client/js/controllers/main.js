ONEmSimModule.controller('mainController', [
    '$scope',
    '$rootScope',
    '$state',
    'Cache',
    'SmsHandler',
    'User',
    'Phone',
    '$timeout',
    'Cache',
    'toastr',
    function ($scope, $rootScope, $state, Cache, SmsHandler, User, Phone, $timeout, Cache, toastr) {
        console.log("user:" + $rootScope.user);

        $scope.history = [];

        function resolveState() {
            console.log("$scope.$parent.checkboxModel.on");
            console.log($scope.$parent.checkboxModel.on);
            console.log("resolving state:" + $scope.$parent.checkboxModel.on)
            if ($scope.$parent.checkboxModel.on) {
                $state.go('service', { initialize: true, service: Cache.getLandingService() });
            } else {
                $state.go('console');
            }
        }
        $scope.$parent.checkboxModel = {};

        User.getProfile().$promise.then(function (response) {
            $scope.$parent.checkboxModel = {
                on: response.user.touchMode
            };
            console.log("$scope.checkboxModel.on");
            console.log($scope.$parent.checkboxModel.on);
            if (Cache.isInitialized()) {
                console.log("already initialized");
                resolveState();
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
            return SmsHandler.start().$promise;
        }).then(function (response) {
            console.log("response fom smshandler.start");
            console.log(response);
            return Phone.start(response);
        }).then(function (response) {
            console.log("finished call to phone.start");
            $scope.$parent.spinner = true;
            return Cache.getServices();
        }).then(function (services) {

            $scope.$parent.spinner = false;

            $scope.$parent.services1 = [];
            $scope.$parent.services2 = [];

            console.log("cache got response");
            console.log(services);
            // $timeout(function () {
            // anything you want can go here and will safely be run on the next digest.
            for (var i = 0; i < services.length; i += 2) {
                $scope.$parent.services1.push(services[i]);
            }
            for (var i = 1; i < services.length; i += 2) {
                $scope.$parent.services2.push(services[i]);
            }
            //   $rootScope.$apply();
            // });
            resolveState();
        }).catch(function (error) {

            //  debugger;
            $scope.$parent.spinner = false;
            if (error) toastr.error(error);

            console.log("error in main " + error);
            if (!$rootScope.msisdn) {
                console.log("no msisdn, going to capture");
                $state.go('captureMsisdn');
            }
        });
    }
]);
