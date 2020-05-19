module.exports = function (app) {
    app.controller('foldersTreeStructureDirectiveCtrl', function ($scope, LangWatcher, counterService) {
        'ngInject';
        var self = this;
        self.controllerName = 'foldersTreeStructureDirectiveCtrl';
        LangWatcher($scope);
        self.disableSelected = false;
        self.counterService = counterService;
        /**
         * @description to check the disabled selected.
         * @param folder
         * @returns {boolean}
         */
        self.sameFolder = function (folder) {
            return folder.id === self.disableSelected;
        };
        /**
         * @description check highlight selected
         * @param folder
         * @returns {boolean}
         */
        self.checkSelected = function (folder) {
            return self.highlightSelected ? self.highlightSelected.id === folder.id : false;
        };

        self.counterHasFolderId = function (folder) {
            return self.counterProperty ? self.counterService[self.counterProperty].hasOwnProperty(folder.id) : self.counterService.folderCount.hasOwnProperty(folder.id);
        };

        self.getCounter = function (folder) {
            return self.counterProperty ? self.counterService[self.counterProperty][folder.id] : self.counterService.folderCount[folder.id];
        }

    });
};
