module.exports = function (app) {
    app
        .directive('form', function ($timeout) {
            'ngInject';
            return {
                require: 'form',
                restrict: 'E',
                link: function (scope, element, attrs, ctrl) {
                    $timeout(function () {
                        console.log(scope, element, attrs, ctrl);
                        if (scope.hasOwnProperty('ctrl') && scope.ctrl && scope.ctrl.hasOwnProperty('editMode') && !!scope.ctrl.editMode) {
                            //if (ctrl.$error && !ctrl.$valid && Object.keys(ctrl.$error).length > 0) {
                            for (var i = 0; i < ctrl.$$controls.length; i++) {
                                ctrl.$$controls[i].$setTouched();
                            }
                            //} else {
                            //    //console.log('success');
                            //}
                        }
                    });

                }
            }
        })
        .directive('ng-form', function ($timeout) {
            'ngInject';
            return {
                require: 'ng-form',
                restrict: 'E',
                link: function (scope, element, attrs, ctrl) {
                    $timeout(function () {
                        console.log(scope, element, attrs, ctrl);
                        if (scope.hasOwnProperty('ctrl') && scope.ctrl && scope.ctrl.hasOwnProperty('editMode') && !!scope.ctrl.editMode) {
                            //if (ctrl.$error && !ctrl.$valid && Object.keys(ctrl.$error).length > 0) {
                            for (var i = 0; i < ctrl.$$controls.length; i++) {
                                ctrl.$$controls[i].$setTouched();
                            }
                            //} else {
                            //    //console.log('success');
                            //}
                        }
                    });

                }
            }
        })
};
