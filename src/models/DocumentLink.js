module.exports = function (app) {
    app.factory('DocumentLink', function (CMSModelInterceptor,
                                          langService,
                                          _) {
        'ngInject';
        return function DocumentLink(model) {
            var self = this;

            self.id = null;
            self.createdBy = null;
            self.createdByOU = null;
            self.vsid = null;
            self.docClassId = null;
            self.status = true;
            self.creationTime = null;
            self.expirationTime = null;
            self.exportOptionsMap = null;
            self.documentLinkSubscribers = [];
            self.docSubject = null;

            /**
             * @description Get the status of Quick Search Correspondence as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentLink.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentLink.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentLink', 'init', this);
        }
    })
};
