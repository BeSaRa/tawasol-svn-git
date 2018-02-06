module.exports = function (app) {
    app.controller('manageDocumentPropertiesPopCtrl', function (dialog, langService, $timeout, toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentPropertiesPopCtrl';

        $timeout(function(){
            self.sourceModel = self.document;
        });

        self.saveProperties = function () {
            self.document.saveDocument()
                .then(function (result) {
                    self.document = result;
                    toast.success(langService.get('outgoing_metadata_saved_success'));
                    self.model = angular.copy(self.document);
                    dialog.hide(self.model);
                });
        };

        self.closeDocumentProperties = function () {
            dialog.cancel(self.model);
        }

    });
};