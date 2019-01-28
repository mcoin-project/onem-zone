ONEmSimModule.directive('inputHistory', ['$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            require: "ngModel",
            scope: {
                ngModel: '='
            },
            link: function (scope, element, attrs, ngModel) {

                var history = [];
                var pointer = 0;

                element.on("input propertychange", function () {
                    if (history.length == 0) {
                        history.push(scope.ngModel);
                    } else{
                        history[pointer] = scope.ngModel;
                    }
                    console.log(pointer);
                    console.log(history);
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
                            console.log(history);
                            console.log(scope.ngModel);

                            scope.$apply(function() {
                                if (history.length > 0) {
                                    if (pointer - 1  > -1) {
                                        pointer--;
                                        scope.ngModel = history[pointer];
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
                            console.log(history);
                            console.log(scope.ngModel);
                            scope.$apply(function() {
                                if (history.length > 0) {
                                    if (pointer + 1 < history.length) {
                                        pointer++;
                                        scope.ngModel = history[pointer];
                                        $timeout(function() {
                                            element[0].setSelectionRange(scope.ngModel.length, scope.ngModel.length);
                                        });
                                    } else if (pointer + 1 == history.length) {
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
