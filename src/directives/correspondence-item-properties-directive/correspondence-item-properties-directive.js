module.exports = function (app) {
    app.directive('correspondenceItemPropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: function ($scope, LangWatcher) {
                LangWatcher($scope);
            },
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./correspondence-item-properties-template.html'),
            scope: {
                sectionTitle: '@',
                item: '='
            }
        }
    });
};