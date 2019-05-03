ONEmSimModule.directive('inputHistory', ['$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
           // require: 'ngModel',
            scope: {
                ngModel: '=',
                history: '='
            },
            link: function (scope, element, attrs) {

                var pointer = 0;
                //scope.history = [];

                element.on("input propertychange", function () {
                    // debugger;
                    console.log("changed");
                    if (!scope.history) return;
                    if (scope.history.length == 0) {
                        scope.history.push(scope.ngModel);
                        pointer++;
                    } else {
                        scope.history[pointer] = scope.ngModel;
                        //scope.history.push(scope.ngModel);

                    }
                    console.log("pointer:" + pointer);
                    console.log("history");
                    console.log(scope.history);
                    console.log("model");
                    console.log(scope.ngModel);
                });

                element.bind("keypress", function (event) {
                    if (event.which === 13) {
                       // scope.history.push(scope.ngModel);
                        pointer = scope.history.length;
                        console.log("key 13");
                        console.log("pointer:" + pointer);
                        console.log("history");
                        console.log(scope.history);
                        console.log("model");
                        console.log(scope.ngModel);
                    }
                });

                element.bind('keydown', function (event) {
                    switch (event.keyCode) {
                        case 38:

                            scope.$apply(function () {
                                if (scope.history.length > 0) {
                                    if (pointer - 1 > -1) {
                                        pointer--;
                                        scope.ngModel = scope.history[pointer];
                                        console.log("element:")
                                        console.log(element[0].selectionStart);
                                        console.log(element[0].selectionEnd);
                                    }
                                    $timeout(function () {
                                        element[0].setSelectionRange(scope.ngModel.length, scope.ngModel.length);
                                    });
                                }
                            });
                            console.log("key up");
                            console.log("pointer:" + pointer);
                            console.log("history");
                            console.log(scope.history);
                            console.log("model");
                            console.log(scope.ngModel);
                            break;
                        case 40:

                            scope.$apply(function () {
                                if (scope.history.length > 0) {
                                    if (pointer + 1 < scope.history.length) {
                                        pointer++;
                                        scope.ngModel = scope.history[pointer];
                                    } else if (pointer + 1 == scope.history.length) {
                                        scope.ngModel = '';
                                        pointer++;
                                    }
                                    $timeout(function () {
                                        element[0].setSelectionRange(scope.ngModel.length, scope.ngModel.length);
                                    });
                                }
                            });
                            console.log("key down");
                            console.log("pointer:" + pointer);
                            console.log("history");
                            console.log(scope.history);
                            console.log("model");
                            console.log(scope.ngModel);
                            break;
                        default:
                            break;
                    }
                });
            }
        }
    }
]);
