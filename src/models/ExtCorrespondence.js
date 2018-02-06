module.exports = function (app) {
    app.factory('ExtCorrespondence', function (CMSModelInterceptor) {
        'ngInject';
        return function ExtCorrespondence(model) {
            var self = this;
            self.signaturesCount;
            self.docSubject = null;
            self.documentTitle = null;
            self.id = null;
            self.createdBy = null;
            self.createdOn = null;
            self.lastModified = null;
            self.lastModifier = null;
            self.mimeType = null;
            self.addMethod = null;
            self.barcode = null;
            self.docFolder = null;
            self.docFullSerial = null;
            self.docNotes = null;
            self.docSerial = null;
            self.docStatus = null;
            self.docSubjectSrc = null;
            self.docType = null;
            self.fileCode = null;
            self.fileSerial = null;
            self.fileId = null;
            self.linkedDocs = [];
            self.linkedEntities = [];
            self.attachmentList = null;
            self.linkedEntitiesList = null;
            self.linkedAttachmentList = null;
            self.mainClassification = null;
            self.subClassification = null;
            self.ou = null;
            self.refNumberElementId = null;
            self.registryOU = null;
            self.securityLevel = null;
            self.tags = [];
            self.vsId = null;
            self.approvers = null;
            self.signaturesCount = null;
            self.exportInfo = null;
            self.sitesInfoTo = [1, 31];
            self.sitesInfoCC = [32, 33];
            self.contentSize = null;
            self.minorVersionNumber = null;
            self.majorVersionNumber = null;
            self.versionStatus = null;
            self.priorityLevel = null;
            self.attachments = [];
            self.classDescription = null;
            self.reservedDate1 = null;
            self.reservedDate2 = null;
            self.reservedDate3 = null;
            self.reservedStr1 = null;
            self.reservedStr2 = null;
            self.reservedStr3 = null;
            self.reservedStr4 = null;
            self.reservedStr5 = null;
            self.reservedStr6 = null;
            self.reservedInt1 = null;
            self.reservedInt2 = null;
            self.reservedInt3 = null;
            self.reservedInt4 = null;
            self.reservedInt5 = null;
            self.reservedInt6 = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ExtCorrespondence.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            ExtCorrespondence.prototype.prepareFrom = function (correspondence) {
                angular.extend(this, correspondence);
                this.classDescription = correspondence.docClassName;
                return CMSModelInterceptor.runEvent('ExtCorrespondence');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ExtCorrespondence', 'init', this);
        }
    })
};