module.exports = function (app) {
    app.controller('currentTabLabelDirectiveCtrl', function (langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'currentTabLabelDirectiveCtrl';
        // override from directive bindings
        self.selectedTab = '';
        self.workflowTabs = {};
        /**
         * @description get current tab translation
         */
        self.getCurrentTabLabel = function () {
            return langService.get(self.workflowTabs[self.selectedTab].lang);
        };

        self.getOverrideTitle = function (title) {
            return langService.get(title);
        };
        
        /**
         * @description get current icon for selected tab.
         */
        self.getCurrentTabIcon = function () {
            return self.workflowTabs[self.selectedTab].icon;
        };

    });
};