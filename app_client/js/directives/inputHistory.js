ONEmSimModule.directive('inputHistory', ['$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                ngModel: '=',
                history: '='
            },
            link: function (scope, element, attrs) {

                var pointer = 0;
                //scope.history = [];

                element.on("input propertychange", function () {
                    if (scope.history.length == 0) {
                        scope.history.push(scope.ngModel);
                    } else {
                        scope.history[pointer] = scope.ngModel;
                    }
                    console.log(pointer);
                    console.log(scope.history);
                    console.log(scope.ngModel);
                });

                element.bind("keypress", function (event) {
                     if (event.which === 13) {
                         pointer++
                     }
                });

                element.bind('keydown', function (event) {
                    switch (event.keyCode) {
                        case 38:
                            console.log("key up");
                            console.log(pointer);
                            console.log(scope.history);
                            console.log(scope.ngModel);

                            scope.$apply(function() {
                                if (scope.history.length > 0) {
                                    if (pointer - 1  > -1) {
                                        pointer--;
                                        scope.ngModel = scope.history[pointer];
                                        console.log("element:")
                                        console.log(element[0].selectionStart);
                                        console.log(element[0].selectionEnd);
                                        $timeout(function() {
                                            element[0].setSelectionRange(scope.ngModel.length, scope.ngModel.length);
                                        });
                                    }
                                }
                            });
                            break;
                        case 40:
                            console.log("key down");
                            console.log(pointer);
                            console.log(scope.history);
                            console.log(scope.ngModel);
                            scope.$apply(function() {
                                if (scope.history.length > 0) {
                                    if (pointer + 1 < scope.history.length) {
                                        pointer++;
                                        scope.ngModel = scope.history[pointer];
                                        $timeout(function() {
                                            element[0].setSelectionRange(scope.ngModel.length, scope.ngModel.length);
                                        });
                                    } else if (pointer + 1 == scope.history.length) {
                                        scope.ngModel = '';
                                    }
                                }
                            });
                            break;
                        default:
                            break;
                    }
                });
            }
        }
    }
]);
