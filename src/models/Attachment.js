module.exports = function (app) {
    app.factory('Attachment', function (CMSModelInterceptor,
                                        _,
                                        langService,
                                        Indicator) {
        'ngInject';
        return function Attachment(model) {
            var self = this;
            self.vsId = null;
            self.docSubject = null;
            self.documentTitle = '';
            self.id = null;
            self.createdBy = null;
            self.createdOn = null;
            self.lastModified = null;
            self.lastModifier = null;
            self.mimeType = null;
            self.contentSize = null;
            self.minorVersionNumber = null;
            self.majorVersionNumber = null;
            self.versionStatus = null;
            self.isCurrent = null;
            self.attachmentType = null;
            self.securityLevel = null;
            self.priorityLevel = null;
            self.updateActionStatus = null;
            self.isDeletable = null;
            self.sourceType = 1;
            self.exportStatus = true;
            self.refVSID = null;//This is for the linked Exported Documents
            // will removed when send to backend.
            self.file = null;
            self.progress = 0;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Attachment.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            Attachment.prototype.getSecurityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                var propName = 'default' + lang + 'Name';
                return this.securityLevel.hasOwnProperty(propName) ? this.securityLevel[propName] : this.securityLevel[langService.current + 'Name'];
            };
            Attachment.prototype.getMemType = function () {

            };
            /**
             * @description Get the name of the Attachment. It is done to make it similar to any model request of getTranslatedName
             */
            Attachment.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            Attachment.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            var indicator = new Indicator();
            Attachment.prototype.getIsLinkedExportedDocIndicator = function () {
                return indicator.getIsLinkedExportedDocIndicator();
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Attachment', 'init', this);
        }
    })
};
