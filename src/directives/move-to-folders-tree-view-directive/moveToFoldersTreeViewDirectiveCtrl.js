module.exports = function (app) {
    app.controller('moveToFoldersTreeViewDirectiveCtrl', function (lookupService,
                                                                   $q,
                                                                   langService,
                                                                   toast,
                                                                   dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'moveToFoldersTreeViewDirectiveCtrl';

        self.progress = null;
        self.currentLang = langService.current;
        /**
         * @description Toggles the child nodes on click of parent node
         * @param selectedNode
         */
        self.toggleChildNodes = function (selectedNode) {
            selectedNode.collapsed = !selectedNode.collapsed;
        };

        /**
         * @description Highlight the selected node
         * @param selectedNode
         */
        self.selectCurrentNode = function (selectedNode) {
            if (selectedNode.id === self.currentNode)
                self.currentNode = null;
            else
                self.currentNode = selectedNode.id;
        };
    });
};