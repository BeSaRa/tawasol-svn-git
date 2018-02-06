module.exports = function (app) {
    app.directive('closeDialogDirective', function ($parse) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<md-button ng-click="$closeDialog.close()" class="md-icon-button close-dialog-button"><md-icon md-svg-icon="close"></md-icon></md-button>',
            controller: function (dialog) {
                var self = this;
                self.close = function () {
                    dialog.cancel(true);
                }
            },
            controllerAs: '$closeDialog',
            link: function (scope, element, attrs, ctrl) {
                if (attrs.whenClose) {
                    ctrl.close = function () {
                        $parse(attrs.whenClose)(scope)();
                    };
                }
            }

        }
    })
};