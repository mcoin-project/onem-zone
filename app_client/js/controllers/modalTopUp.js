
ONEmSimModule.controller('modalTopUpController', [
    '$scope',
    '$window',
    'Wallet',
    'toastr',
    'DataModel',
    function ($scope, $window, Wallet, toastr, DataModel) {

        var i = DataModel.selectedAccount();
        $scope.account = DataModel.accounts()[i];
        console.log("account:");
        console.log($scope);

        $scope.user = {
            value: "100"
        }
        $scope.spinner = false;

        $scope.confirm = function (account) {
            var amount = parseInt($scope.user.value);
            console.log("amount:"+amount);
            $scope.spinner = true;
            Wallet.topUp({ account: account.name, amount: amount, currency: account.currency }).$promise.then(function (response) {
                $scope.spinner = false;
                console.log("topup:");
                console.log(response);

                console.log("redirecting to: " + response.order.checkoutUrl);
                $scope.redirectUrl = response.order.checkoutUrl;
                $window.location.replace (response.order.checkoutUrl);

            }).catch(function (error) {
                console.log("error");
                console.log(error.data);
                $scope.spinner = false;

                if (!error.data.message) {
                    toastr.error("Unknown error");
                } else {
                    toastr.error(error.data.message);
                }
            });
        };
    }
]);
