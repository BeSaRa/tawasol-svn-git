module.exports = function (app) {
    app.directive('verticalMenuWorkflowItemDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'verticalMenuWorkflowItemDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./vertical-menu-workflow-item-template.html'),
            scope: {
                item: '=',
                callback: '=',
                ignoreCallback: '=',
                display: '=',
                displayButton: '=',
                release: '='
            }
        }
    })
};