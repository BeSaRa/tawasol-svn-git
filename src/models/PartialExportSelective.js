module.exports = function (app) {
    app.factory('PartialExportSelective', function (CMSModelInterceptor, _, PartialExport, rootEntity) {
        'ngInject';
        return function PartialExportSelective(model) {
            var self = this, PartialExportCollection,
                documentClassMap = {
                    outgoing: 0,
                    incoming: 1,
                    internal: 2
                };
            PartialExport.call(this);
            self.exportItems = {
                ATTACHMENTS: [],
                RELATED_BOOKS: [],
                RELATED_OBJECTS: [],
                ATTACHMENT_LINKED_DOCS: [],
                MAILING_ROOM: []
            };
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            PartialExportSelective.prototype.setPartialExportCollection = function (model) {
                PartialExportCollection = model;
                return this;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            PartialExportSelective.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            PartialExportSelective.prototype.changeExportType = function () {
                return (new PartialExportCollection()).setSitesCCList(this.sitesCCList).setSitesToList(this.sitesToList)
            };
            PartialExportSelective.prototype.getDetails = function () {
                return {
                    url: 'selective-partial-export',
                    interceptor: 'PartialExportSelective'
                };
            };

            PartialExportSelective.prototype.mapSend = function () {
                var self = this, keys = this.getKeys();
                if (keys.indexOf('ATTACHMENT_LINKED_DOCS') === -1) {
                    keys.push('ATTACHMENT_LINKED_DOCS');
                }

                if (!rootEntity.isMailRoomIntegrationEnabled()) {
                    delete self.exportItems.MAILING_ROOM;
                    keys.splice(keys.indexOf('MAILING_ROOM'), 1);
                }

                _.map(keys, function (key) {
                    self.exportItems[key] = _.map(self.exportItems[key], function (item) {
                        if (key === 'ATTACHMENT_LINKED_DOCS') {
                            var info = item.getInfo();
                            return {
                                vsId: info.vsId,
                                docClassId: documentClassMap[info.documentClass.toLowerCase()]
                            }
                        } else if (key === 'MAILING_ROOM') {
                            return item.subSiteId;
                        }
                        return item.hasOwnProperty('vsId') ? item.vsId : item;
                    });
                });
                return this;
            };

            PartialExportSelective.prototype.isSelective = function () {
                return true;
            };

            PartialExportSelective.prototype.prepareResendModel = function () {
                var self = this;
                delete self.sitesCCList;
                delete self.sitesToList;
                _.map(self.exportItems, function (item, key) {
                    self[key] = item;
                });
                delete self.exportItems;
                return this;
            };

            PartialExportSelective.prototype.setAttachmentLinkedDocs = function (attachmentLinkedDocs) {
                this.exportItems.ATTACHMENT_LINKED_DOCS = attachmentLinkedDocs;
            };
            PartialExportSelective.prototype.setMailingRoomSites = function (correspondenceSites) {
                this.exportItems.MAILING_ROOM = correspondenceSites;
            };
            PartialExportSelective.prototype.getAttachmentLinkedDocs = function () {
                return this.exportItems.ATTACHMENT_LINKED_DOCS;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PartialExportSelective', 'init', this);
        }
    })
};
