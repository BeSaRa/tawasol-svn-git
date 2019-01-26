module.exports = function (app) {
    app.factory('PartialExportCollection', function (CMSModelInterceptor, _, PartialExport) {
        'ngInject';
        return function PartialExportCollection(model) {
            var self = this, PartialExportSelective,
                documentClassMap = {
                    outgoing: 0,
                    incoming: 1,
                    internal: 2
                };
            PartialExport.call(this);
            self.exportOptions = {
                ATTACHMENTS: false,
                RELATED_BOOKS: false,
                RELATED_OBJECTS: false,
                ATTACHMENT_LINKED_DOCS: []
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
            PartialExportCollection.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            PartialExportCollection.prototype.setPartialExportSelective = function (model) {
                PartialExportSelective = model;
                return this;
            };

            PartialExportCollection.prototype.changeExportType = function () {
                return (new PartialExportSelective()).setSitesCCList(this.sitesCCList).setSitesToList(this.sitesToList)
            };

            PartialExportCollection.prototype.getDetails = function () {
                return {
                    url: 'partial-export',
                    interceptor: 'PartialExportCollection'
                };
            };
            PartialExportCollection.prototype.setAttachmentLinkedDocs = function (attachmentLinkedDocs) {
                this.exportOptions.ATTACHMENT_LINKED_DOCS = attachmentLinkedDocs;
            };

            PartialExportCollection.prototype.mapSend = function () {
                this.exportOptions.ATTACHMENT_LINKED_DOCS = _.map(this.exportOptions.ATTACHMENT_LINKED_DOCS, function (item) {
                    var info = item.getInfo();
                    return {
                        vsId: info.vsId,
                        docClassId: documentClassMap[info.documentClass.toLowerCase()]
                    };
                });
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PartialExportCollection', 'init', this);
        }
    })
};
