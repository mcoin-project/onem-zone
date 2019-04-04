
ONEmSimModule.controller('modalTopUpController', [
    '$scope',
    '$window',
    'Wallet',
    'toastr',
    function ($scope, $window, Wallet, toastr) {

        var i = $scope.$parent.selectedAccount;
        $scope.account = $scope.$parent.accounts[i];
        console.log("account:");
        console.log($scope);

        $scope.user = {
            value: "100000"
        }
        $scope.spinner = false;

        $scope.confirm = function (type) {
            var amount = parseInt($scope.user.value);
            console.log("amount:"+amount);
            $scope.spinner = true;
            Wallet.topUp({ account: type, amount: amount }).$promise.then(function (response) {
                $scope.spinner = false;
                console.log("topup:");
                console.log(response);

                console.log("redirecting to: " + response.order.checkoutUrl);
                $scope.redirectUrl = response.order.checkoutUrl;
                $window.location.replace (response.order.checkoutUrl);

            }).catch(function (error) {
                console.log("error");
                console.log(error.data);
                if (!error.data.message) {
                    toastr.error("Unknown error");
                } else {
                    toastr.error(error.data.message);
                }
            });
        };
    }
]);
