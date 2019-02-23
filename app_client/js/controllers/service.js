
ONEmSimModule.controller('serviceController', [
    '$scope',
    'Cache',
    '$stateParams',
    '$rootScope',
    '$timeout',
    'toastr',
    function ($scope, Cache, $stateParams, $rootScope, $timeout, toastr) {

        console.log("stateParams:");
        console.log($stateParams);

        $scope.result = {};
        $scope.ready = false;

        $scope.activeService = $stateParams.service;

        $scope.goCommand = Cache.getGoCommand();
        console.log("go command:" + $scope.goCommand);

        var applyResult = function (response) {
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $scope.result = response;
                $scope.ready = true;
                $rootScope.$apply();
            });
        }

        if ($stateParams.initialize) {

            $scope.ready = false;

            try {
                var serviceName = $stateParams.service.getName();
                Cache.getService(serviceName).then(function (response) {
                    console.log("got response");
                    applyResult(response);
                }).catch(function (error) {
                    toastr.error(error);
                    console.log(error);
                });
            } catch (error) {
                console.log(error);
            }
        }

        $scope.moText = "";

        $scope.moSubmit = function (moText) {
            console.log("motext:" + $scope.moText);
            console.log("motext param:" + moText);
            if (!$scope.moText || $scope.moText.length == 0) return;

            Cache.selectOption($scope.moText).then(function (response) {
                console.log("got response");
                $scope.moText = "";
                applyResult(response);
            }).catch(function (error) {
                console.log(error);
            });
        }

        $scope.optionSelected = function (option) {

            $scope.ready = false;

            Cache.selectOption(option.option).then(function (response) {
                console.log("got response from selectOption");
                console.log(response);
                applyResult(response);
            }).catch(function (error) {
                console.log(error);
            });
        }

        $scope.buttonSelected = function (buttonText) {
            Cache.selectOption(buttonText).then(function (response) {
                console.log("got response");
                applyResult(response);
            }).catch(function (error) {
                console.log(error);
            });
        }
    }
]);
