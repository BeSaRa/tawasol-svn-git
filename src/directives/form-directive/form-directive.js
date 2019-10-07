module.exports = function (app) {
    app
        .directive('form', function ($timeout) {
            'ngInject';
            return {
                require: 'form',
                restrict: 'E',
                link: function (scope, element, attrs, ctrl) {
                    $timeout(function () {
                        //console.log('formDirective', scope, element, attrs, ctrl);
                        var control;
                        if (scope.hasOwnProperty('ctrl') && scope.ctrl && scope.ctrl.hasOwnProperty('editMode') && !!scope.ctrl.editMode) {
                            for (var i = 0; i < ctrl.$$controls.length; i++) {
                                control = ctrl.$$controls[i];
                                if (typeof control.$setTouched !== 'undefined' && typeof control.$setTouched === 'function') {
                                    control.$setTouched();
                                    control.$setDirty();
                                }
                            }
                        }
                    });

                }
            };
        })
        .directive('ngForm', function ($timeout) {
            'ngInject';
            return {
                require: 'form',
                restrict: 'E',
                link: function (scope, element, attrs, ctrl) {
                    //console.log('ngFormDirective', scope);
                    var control,
                        editPath = attrs.hasOwnProperty('editModePath') ? attrs.editModePath : false;

                    if (editPath) {
                        $timeout(function () {
                            var editMode = scope.$eval(editPath);
                            if (editMode) {
                                for (var i = 0; i < ctrl.$$controls.length; i++) {
                                    control = ctrl.$$controls[i];
                                    if (typeof control.$setTouched !== 'undefined' && typeof control.$setTouched === 'function') {
                                        control.$setTouched();
                                        control.$setDirty();
                                    }
                                }
                            }
                        });
                    }

                }
            };
        })
};
