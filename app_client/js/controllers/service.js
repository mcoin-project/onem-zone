
ONEmSimModule.controller('serviceController', [
    '$scope',
    'SmsHandler',
    'Cache',
    'Phone',
    '$stateParams',
    'Socket',
    '$state',
    '$rootScope',
    '$location',
    '$timeout',
    function ($scope, SmsHandler, Cache, Phone, $stateParams, Socket, $state, $rootScope, $location, $timeout) {

        console.log("stateParams:");
        console.log($stateParams);

        $scope.activeService = $stateParams.service;

        if ($stateParams.initialize) {
            Cache.getService($stateParams.service.name).then(function (response) {

                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.
                    $scope.result = response;
                    $rootScope.$apply();
                });
                console.log("got response");
            }).catch(function (error) {
                console.log(error);
            });
        }

        $scope.moText = "";

        $scope.moSubmit = function () {
            if (!$scope.moText || $scope.moText.length == 0) return;

            Cache.selectOption($scope.moText).then(function (response) {
                $scope.moText = "";

                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.
                    $scope.result = response;
                    $rootScope.$apply();
                });
                console.log("got response");
            }).catch(function (error) {
                console.log(error);
            });
        }

        $scope.optionSelected = function (option) {
            Cache.selectOption(option.option).then(function (response) {

                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.
                    $scope.result = response;
                    $rootScope.$apply();
                });
                console.log("got response from selectOption");
                console.log(response);
            }).catch(function (error) {
                console.log(error);
            });
        }

        $scope.buttonSelected = function (buttonText) {
            Cache.selectOption(buttonText).then(function (response) {

                $timeout(function () {
                    // anything you want can go here and will safely be run on the next digest.
                    $scope.result = response;
                    $rootScope.$apply();
                });
                console.log("got response");
            }).catch(function (error) {
                console.log(error);
            });
        }

    }
]);
