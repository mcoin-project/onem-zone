
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

        $scope.moText = "";

        $scope.moSubmit = function(moText) {
            if (!moText || moText.length == 0) return;
            $scope.moText = moText;
            console.log("motext: "+moText);
            console.log("motext: "+$scope.moText);
            Cache.selectOption(moText).then(function (response) {
                $scope.moText = "";
                console.log("motext: "+$scope.moText);

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

        $scope.optionSelected = function(option) {
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

        $scope.buttonSelected = function(buttonText) {
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
