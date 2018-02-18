module.exports = function (app) {
    app.directive('workflow-groups-directive', function () {
        return {
            restrict: 'E',
            controller: 'workflow-groups-directiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./workflow-groups-template.html'),
            scope: {
                items: '@',
                excludeExists: '=',
                excludeCallback: '=',
                addCallback: '=',
                removeCallback: '='
            }
        }
    })
};