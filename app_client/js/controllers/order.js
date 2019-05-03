ONEmSimModule.controller('orderController', [
    '$scope',
    '$state',
    '$rootScope',
    '$stateParams',
    'User',
    function ($scope, $state, $rootScope, $stateParams, User) {

        User.getMsisdn().$promise.then(function (response) {
            $rootScope.msisdn = response.msisdn;
            if (!response.msisdn) throw "not authenticated";
        }).catch(function (error) {
            $state.go('main');
        });

        console.log("msisdn:" + $rootScope.msisdn);

        console.log("ordercontroller:");
        console.log($stateParams);

        $scope.order = $stateParams;
        $scope.amount = parseFloat($scope.order.amount / 100).
                            toLocaleString(undefined, { minimumFractionDigits: 2 });
                            
    }
]);
