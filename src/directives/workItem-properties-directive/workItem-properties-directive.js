module.exports = function (app) {
    app.directive('workItemPropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: function ($scope, LangWatcher) {
                'ngInject';
                LangWatcher($scope);
            },
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./workItem-properties-template.html'),
            scope: {
                item: '=',
                sectionTitle: '@'
            }
        }
    })
};