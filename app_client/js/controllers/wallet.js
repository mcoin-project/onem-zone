ONEmSimModule.controller('walletController', [
    '$scope',
    '$window',
    'Wallet',
    'toastr',
    function ($scope, $window, Wallet, toastr) {

        $scope.accounts = [];

        Wallet.getAccounts().$promise.then(function(response) {
            console.log("got result:");
            console.log(response);
            $scope.accounts = response.accounts;
        }).catch(function(error) {
            toastr.error("Could not retrieve wallets"); 
        });

        $scope.topUp = function (type) {
            Wallet.topUp({ account: type, amount: 1000 }).$promise.then(function (response) {
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
