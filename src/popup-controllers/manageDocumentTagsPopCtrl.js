module.exports = function (app) {
    app.controller('manageDocumentTagsPopCtrl', function (toast, model, $timeout, LangWatcher, dialog, documentTagService, langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentTagsPopCtrl';
        self.saveTags = function () {
            console.log(self.vsId);
            documentTagService
                .saveDocumentTags(self.documentClass, self.vsId, self.tags)
                .then(function (tags) {
                    toast.success(langService.get('tags_saved_success'));
                    self.model = angular.copy(tags);
                    dialog.hide(self.model);
                });
        };

        self.closeDocumentTags = function () {
            dialog.cancel(self.model);
        }

    });
};