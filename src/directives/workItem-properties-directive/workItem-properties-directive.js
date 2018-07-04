module.exports = function (app) {
    app.directive('workItemPropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: function ($scope, LangWatcher) {
                'ngInject';
                var self = this;
                LangWatcher($scope);
                self.collapse = false;
                self.toggleCollapse = function ($event) {
                    self.collapse = !self.collapse;
                    angular.element($event.target).parents('.section-title').next().slideToggle('fast');
                }
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