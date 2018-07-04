module.exports = function (app) {
    app.directive('correspondenceItemPropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: function ($scope, LangWatcher) {
                'ngInject';
                LangWatcher($scope);
                var self = this;
                self.collapse = false;
                self.toggleCollapse = function ($event) {
                    self.collapse = !self.collapse;
                    angular.element($event.target).parents('.section-title').next().slideToggle('fast');
                }
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