ONEmSimModule.directive('inputHistory', [
    function () {
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
                                        //element[0].selectionStart = element[0].selectionEnd = scope.ngModel.length;
                                        // element[0].set('selectionStart',scope.ngModel.length);
                                    } else {
                                        pointer = history.length - 1;
                                    }
                                    scope.ngModel = history[pointer];   
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
