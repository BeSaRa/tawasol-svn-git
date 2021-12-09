module.exports = function (app) {
    require('./cms-close-dialog-directive-style.scss');
    app.directive('cmsCloseDialogDirective', function ($parse) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            template: '<div><md-button ng-click="$closeDialog.close()" class="md-icon-button cms-close-dialog-button"><md-icon md-svg-icon="close"></md-icon></md-button></div>',
            controller: function (dialog) {
                var self = this;
                self.close = function () {
                    if (self.whenClose) {
                        self.whenClose();
                    } else {
                        dialog.cancel(true);
                    }
                }
            },
            controllerAs: '$closeDialog',
            bindToController: true,
            scope: {
                whenClose: '=?'
            }
        }
    })
};
