module.exports = function (app) {
    app.directive('correspondenceItemPropertiesDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: function ($scope, $timeout, LangWatcher, lookupService, _, viewTrackingSheetService) {
                'ngInject';
                LangWatcher($scope);
                var self = this;
                self.collapse = false;
                self.site = null;
                self.action = null;
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
                    return Object.keys(properties).length && properties[propertyName.toLowerCase()][fieldName];
                }

                self.loadLastAction = function ($event) {
                    viewTrackingSheetService.loadCorrespondenceLastAction(self.item)
                        .then(function (result) {
                            self.action = result;
                        });
                }
            },
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('correspondence-item-properties-template.html'),
            scope: {
                sectionTitle: '@',
                item: '='
            }
        }
    });
};
