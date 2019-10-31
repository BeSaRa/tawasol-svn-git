module.exports = function (app) {
    app.controller('manageDocumentEntitiesPopCtrl', function (dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentEntitiesPopCtrl';

        self.closeDocumentEntities = function () {
            dialog.hide(self.linkedEntities);
        }
    });
};