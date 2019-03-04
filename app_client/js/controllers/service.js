
ONEmSimModule.controller('serviceController', [
    '$scope',
    'Cache',
    '$stateParams',
    '$rootScope',
    '$timeout',
    'toastr',
    'screenSize',
    'DataModel',
    function ($scope, Cache, $stateParams, $rootScope, $timeout, toastr, screenSize, DataModel) {

        console.log("stateParams:");
        console.log($stateParams);
 
        var initialize = $stateParams.initialize;
        $scope.ready = false;

        var applyResult = function (response) {
            $timeout(function () {
                // anything you want can go here and will safely be run on the next digest.
                $scope.result = DataModel.setTouchResult(response);
                $scope.ready = true;
                if ($scope.$parent) {
                    $scope.$parent.spinner = false;
                }

                $rootScope.$apply();
            });
        }
        $scope.activeService = $stateParams.service;
        $scope.goCommand = Cache.getGoCommand();
        console.log("go command:" + $scope.goCommand);

        $scope.showPn = function() {
            return !(screenSize.is('xs, sm'));
         }

         $scope.isSpinnerActive = function() {
            return $scope.$parent.spinner;
        }

        $scope.$parent.spinner = false;

        var serviceName;
        try {
            serviceName = $stateParams.service.getName();
        } catch (error) {
            console.log(error);
            serviceName = Cache.getLandingService();
            if (!serviceName) {
                toastr.error("Can't resolve landing service");
            }
        }
        $scope.result = DataModel.getTouchResult();

        if ($scope.result) {
            applyResult($scope.result);
        }

       // if initialize is true then home was clicked, if results already exist, just display them otherwise use the landing service passed as parameter
        // if initialize is false, then a service was clicked explicitly

        if ((!initialize && serviceName) || (initialize && !$scope.result)) {

            $timeout(function () {
                $scope.ready = false;
                $scope.result = {};
                $scope.$parent.spinner = true;

                $rootScope.$apply();
            });

            try {
                Cache.getService(serviceName).then(function (response) {
                    console.log("got response");
                    applyResult(response);

                }).catch(function (error) {
                    console.log("catch error");

                    Cache.selectOption('#').then(function(response) {
                        console.log("apply result");

                        applyResult(response);                      
                    })
                    $scope.$parent.spinner = false;
         //           toastr.error(error);
                    console.log(error);
                });
            } catch (error) {
                Cache.selectOption('#').then(function(response) {
                    console.log("apply result");

                    applyResult(response);                      
                });
                $scope.$parent.spinner = false;
          //      toastr.error(error);
                console.log(error);
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
