ONEmSimModule.directive('inputHistory', ['$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            // require: 'ngModel',
            scope: {
                ngModel: '=',
                history: '='
            },
            require: 'ngModel', // get a hold of NgModelController
            link: function (scope, element, attrs, ctrl) {

                scope.$watch(function () {
                    return element.css('height');
                },  styleChangedCallBack,
                true);
    
                function styleChangedCallBack(newValue, oldValue) {
                    console.log("/styleChangedCallBack")
                    console.log(newValue);
                    console.log(oldValue);
                    if (newValue !== oldValue) {
                        console.log("height changed:"+newValue)
                        var val = parseInt(newValue)
                        $('#input-box').css({ height: val + 25 });
                    }
                }

                function pasteIntoInput(el, text) {
                    el.focus();
                    if (typeof el.selectionStart == "number"
                        && typeof el.selectionEnd == "number") {
                        var val = el.value;
                        console.log("el.selectionStart:" + el.selectionStart)
                        console.log("el.selectionEnd:" + el.selectionEnd)
                        var selStart = el.selectionStart;
                        val = val.slice(0, selStart) + text + val.slice(el.selectionEnd);
                        console.log("val:" + val)
                        console.log("***")
                        el.selectionEnd = el.selectionStart = selStart + text.length;
                        scope.ngModel = val;
                        //       scope.history[pointer] = val;
                        console.log("scope.ngModel***:");
                        console.log(scope.ngModel);
                        ctrl.$setViewValue(val);
                        // ctrl.$setModelValue(val);
                        ctrl.$render();

                        console.log("height:");
                        console.log(el.offsetHeight);

                    } else if (typeof document.selection != "undefined") {
                        console.log("**** UNDEFINED ****")
                        var textRange = document.selection.createRange();
                        textRange.text = text;
                        textRange.collapse(false);
                        textRange.select();
                    }
                }

                var pointer = -1;
                //scope.history = [];

                element.on("input propertychange", function () {
                    // debugger;
                    console.log("changed");
                    if (!scope.history) return;
                    if (scope.history.length == 0) {
                        scope.history.push(scope.ngModel.slice(1));
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

                    if (event.which === 13 && !event.shiftKey) {
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
                    var code = event.keyCode || event.which;
                    switch (code) {

                        case 13:
                            if (event.shiftKey) {
                                //     if (event.type == "keypress") {
                                var val = parseInt($('#input-box').css('height'));
                                //console.log("VAL:"+val);
                               // $('#input-box').css({ height: val + 20 });
                               // pasteIntoInput(element[0], "\n");
                                //     }
                            } else {
                                pointer = scope.history.length;

                                scope.$apply(function () {
                                    scope.$eval(attrs.ngEnter);
                                });
                        //        $('#input-box').css({ bottom: 40 });
                                event.preventDefault();

                            }
    

                            break;

                        case 38:

                            scope.$apply(function () {
                                if (scope.history.length > 0) {
                                    if (pointer - 1 >= 0) {
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
