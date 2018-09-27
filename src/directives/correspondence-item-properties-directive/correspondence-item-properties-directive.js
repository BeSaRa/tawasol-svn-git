module.exports = function (app) {
    app.directive('correspondenceItemPropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: function ($scope, $timeout, LangWatcher, lookupService) {
                'ngInject';
                LangWatcher($scope);
                var self = this;
                self.collapse = false;
                self.site = null;
                var properties = {};
                $timeout(function () {
                    self.site = self.item.getFirstSite();
                    _.map(lookupService.getPropertyConfigurations(self.item.getInfo().documentClass), function (item) {
                        properties[item.symbolicName.toLowerCase()] = item;
                    });
                });

                self.toggleCollapse = function ($event) {
                    self.collapse = !self.collapse;
                    angular.element($event.target).parents('.section-title').next().slideToggle('fast');
                };

                self.checkField = function (propertyName, fieldName) {
                    return properties[propertyName.toLowerCase()][fieldName];
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