module.exports = function (app) {
    app.controller('foldersTreeStructureDirectiveCtrl', function ($scope, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'foldersTreeStructureDirectiveCtrl';
        LangWatcher($scope);
        self.disableSelected = false;
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
        }

    });
};