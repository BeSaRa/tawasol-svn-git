module.exports = function (app) {
    app.controller('moveToFolderPopCtrl', function (userFolderService,
                                                    moveToFolders,
                                                    lookupService,
                                                    $q,
                                                    langService,
                                                    toast,
                                                    dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'moveToFolderPopCtrl';
        self.progress = null;
        self.userFolders = moveToFolders;

        self.closeMoveToFolderPopupFromCtrl = function () {
            dialog.cancel();
        };
    });
};