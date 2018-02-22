module.exports = function (app) {
    app.directive('bulkCorrespondenceStatusDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'bulkCorrespondenceStatusDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./bulk-correspondence-status-template.html'),
            scope: {
                items: '=',
                deleteCallback: '='
            }
        }
    })
};