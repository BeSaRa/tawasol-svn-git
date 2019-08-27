module.exports = function (app) {
    app.factory('DocumentLink', function (CMSModelInterceptor,
                                          langService,
                                          configurationService,
                                          Outgoing,
                                          Incoming,
                                          Internal,
                                          _) {
        'ngInject';
        return function DocumentLink(model) {
            var self = this, classMaps = {
                0: Outgoing,
                1: Incoming,
                2: Internal
            };

            self.id = null;
            self.createdBy = null;
            self.createdByOU = null;
            self.vsid = null;
            self.docClassId = null;
            self.status = true;
            self.creationTime = null;
            self.expirationTime = new Date();
            self.exportOptionsMap = {
                BOOK: true,
                ATTACHMENTS: [],
                RELATED_BOOKS: []
            };
            self.documentLinkSubscribers = [];
            self.docSubject = null;
            self.expirationHours = configurationService.DEFAULT_START_TASK_TIME;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model) {
                angular.extend(this, model);
                if (!Object.keys(model.exportOptionsMap).length) {
                    self.exportOptionsMap = {
                        BOOK: true,
                        ATTACHMENTS: [],
                        RELATED_BOOKS: []
                    };
                }
            }

            /**
             * @description Get the status of Quick Search Correspondence as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DocumentLink.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentLink.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            DocumentLink.prototype.createCorrespondence = function () {
                return new classMaps[this.docClassId]({
                    vsId: this.vsid,
                    docSubject: this.docSubject
                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentLink', 'init', this);
        }
    })
};
