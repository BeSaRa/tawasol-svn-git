module.exports = function (app) {
    app.factory('ReadyToExportOption', function (CMSModelInterceptor,
                                                 langService,
                                                 _) {
        'ngInject';
        return function ReadyToExportOption(model) {
            var self = this, documentClassMap = {
                outgoing: 0,
                incoming: 1,
                internal: 2
            };
            self.ATTACHMENTS = true;
            self.RELATED_BOOKS = true;
            self.RELATED_OBJECTS = true;
            self.ATTACHMENT_LINKED_DOCS = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ReadyToExportOption.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description get translated true/false for ATTACHMENT
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedAttachmentStatus = function () {
                return this.ATTACHMENTS ? langService.get('yes') : langService.get('no');
            };
            /**
             * @description get translated true/false for RELATED_BOOKS
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedRelatedBookStatus = function () {
                return this.RELATED_BOOKS ? langService.get('yes') : langService.get('no');
            };
            /**
             * @description get translated true/false for RELATED_OBJECTS
             * @returns {*}
             */
            ReadyToExportOption.prototype.getTranslatedRelatedObjectStatus = function () {
                return this.RELATED_OBJECTS ? langService.get('yes') : langService.get('no');
            };

            ReadyToExportOption.prototype.isSelective = function () {
                return false;
            };

            ReadyToExportOption.prototype.setAttachmentLinkedDocs = function (attachmentLinkedDocs) {
                this.ATTACHMENT_LINKED_DOCS = attachmentLinkedDocs;
            };

            ReadyToExportOption.prototype.hasAttachedLinkedDocs = function () {
                return this.ATTACHMENT_LINKED_DOCS.length;
            };

            ReadyToExportOption.prototype.mapSend = function () {
                var self = this;
                if (self.hasAttachedLinkedDocs()) {
                    self.ATTACHMENT_LINKED_DOCS = _.map(self.ATTACHMENT_LINKED_DOCS, function (item) {
                        var info = item.getInfo();
                        return {
                            vsId: info.vsId,
                            docClassId: documentClassMap[info.documentClass.toLowerCase()]
                        }
                    })
                }
                return self;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReadyToExportOption', 'init', this);
        }
    })
};
