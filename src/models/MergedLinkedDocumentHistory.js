module.exports = function (app) {
    app.factory('MergedLinkedDocumentHistory', function (CMSModelInterceptor,
                                                         langService) {
        'ngInject';
        return function MergedLinkedDocumentHistory(model) {
            var self = this;
            self.documentCreationDate = null;
            self.mainDoc = false;
            self.docSubject = null;
            self.events = [];


            if (model)
                angular.extend(this, model);

            /**
             * @description Returns the value showing if document is main document or not
             * @returns {*}
             */
            MergedLinkedDocumentHistory.prototype.getTranslatedMainDocument = function () {
                return (this.mainDoc === true) ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('MergedLinkedDocumentHistory', 'init', this);
        }
    })
};