module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope,
                                                           employeeService,
                                                           LangWatcher,
                                                           langService,
                                                           generator,
                                                           gridService,
                                                           $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);
        self.employeeService = employeeService;

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        $timeout(function () {
            self.shortcutActions = gridService.getShortcutActions(self.gridActions);
            self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
        })
    });
};
