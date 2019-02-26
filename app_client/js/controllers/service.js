
ONEmSimModule.controller('serviceController', [
    '$scope',
    'Cache',
    '$stateParams',
    '$rootScope',
    '$timeout',
    'toastr',
    'screenSize',
    function ($scope, Cache, $stateParams, $rootScope, $timeout, toastr, screenSize) {

        console.log("stateParams:");
        console.log($stateParams);

        $scope.showPn = function() {
            console.log("showPn");
           return !(screenSize.is('xs, sm'));
        }

        $scope.$parent.spinner = false;

        $scope.result = {};
        $scope.ready = false;

        $scope.isSpinnerActive = function() {
            return $scope.spinner;
        }

        $scope.activeService = $stateParams.service;

        $scope.goCommand = Cache.getGoCommand();
        console.log("go command:" + $scope.goCommand);

        var applyResult = function (response) {
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $scope.result = response;
                $scope.ready = true;
                $scope.$parent.spinner = false;

                $rootScope.$apply();
            });
        }

        if ($stateParams.initialize) {

            $scope.ready = false;

            try {
                $scope.$parent.spinner = true;
                var serviceName = $stateParams.service.getName();
                Cache.getService(serviceName).then(function (response) {
                    console.log("got response");
                    applyResult(response);

                }).catch(function (error) {
                    $scope.$parent.spinner = false;
                    toastr.error(error);
                    console.log(error);
                });
            } catch (error) {
                $scope.$parent.spinner = false;
                console.log(error);
            }
        }

        $scope.moText = "";

        $scope.moSubmit = function (moText) {
            console.log("motext:" + $scope.moText);
            console.log("motext param:" + moText);
            if (!$scope.moText || $scope.moText.length == 0) return;
            $scope.$parent.spinner = true;
            Cache.selectOption($scope.moText).then(function (response) {
                console.log("got response");
                $scope.moText = "";
                applyResult(response);
            }).catch(function (error) {
                $scope.$parent.spinner = false;
                console.log(error);
            });
        }

        $scope.optionSelected = function (option) {

            $scope.ready = false;
            $scope.$parent.spinner = true;
            Cache.selectOption(option.option).then(function (response) {
                console.log("got response from selectOption");
                console.log(response);
                applyResult(response);
            }).catch(function (error) {
                $scope.$parent.spinner = false;
                console.log(error);
            });
        }

        $scope.buttonSelected = function (buttonText) {
            $scope.$parent.spinner = true;
            Cache.selectOption(buttonText).then(function (response) {
                console.log("got response");
                applyResult(response);
            }).catch(function (error) {
                $scope.$parent.spinner = false;
                console.log(error);
            });
        }
    }
]);
