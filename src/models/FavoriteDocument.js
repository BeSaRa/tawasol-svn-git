module.exports = function (app) {
    app.factory('FavoriteDocument', function (CMSModelInterceptor,
                                              langService) {
        'ngInject';
            return function FavoriteDocument(model) {
                var self = this;
                self.id = null;

                self.docSubject = null;
                self.documentTitle = null;

                self.createdBy = null;
                self.createdOn = null;
                self.lastModified = null;
                self.lastModifier = null;
                self.mimeType = null;
                self.contentSize = null;
                self.minorVersionNumber = null;
                self.majorVersionNumber = null;
                self.vsId = null;
                self.versionStatus = null;
                self.isCurrent = null;
                self.classDescription = null;
                self.lockTimeout = null;
                self.lockOwner = null;
                self.contentElementUrl = null;
                self.addMethod = null;
                self.attachments = null;
                self.barcode = null;
                self.docFolder = null;
                self.docFullSerial = null;
                self.docNotes = null;
                self.docSerial = null;
                self.docStatus = null;
                self.docSubjectSrc = null;
                self.g2gRefNO = null;
                self.g2gVSID = null;
                self.lifeCycleVsid = null;
                self.docDate = null;
                self.docType = null;
                self.fileCode = null;
                self.fileSerial = null;
                self.fileId = null;
                self.linkedDocs = [];
                self.linkedEntities = null;
                self.mainClassification = null;
                self.subClassification = null;
                self.ou = null;
                self.refNumberElementId = null;
                self.registryOU = null;
                self.securityLevel = null;
                self.tags = [];
                self.priorityLevel = null;
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
                self.linkedAttachmenstList = [];
                self.linkedEntitiesList = [];
                self.linkedDocList = [];
                self.linkedCommentsList = [];
                self.documentFileInfo = null;
                self.mainClassificationInfo = null;
                self.subClassificationInfo = null;
                self.creatorOuInfo = null;
                self.creatorInfo = null;
                self.lastModifierInfo = null;
                self.registeryOuInfo = null;
                self.securityLevelInfo = null;
                self.priorityLevelInfo = null;
                self.docTypeInfo = null;
                self.docStatusInfo = null;
                self.toSitesLis = [];
                self.ccSitesList = [];
                self.cbrEnabled = true;

                // every model has required fields
                // if you don't need to make any required fields leave it as an empty array
                var requiredFields = [];

                if (model)
                    angular.extend(this, model);

                /**
                 * @description Get all required fields
                 * @return {Array|requiredFields}
                 */
                FavoriteDocument.prototype.getRequiredFields = function () {
                    return requiredFields;
                };

                /**
                 * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
                 * @param separator
                 * @returns {string}
                 */
                FavoriteDocument.prototype.getNames = function (separator) {
                    return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
                };

                /**
                 * @description Get the translated arabic or english name according to current language for entity name. If reverse is passed, it will return the name in language other than current language
                 * @param reverse
                 * @returns {string}
                 */
                FavoriteDocument.prototype.getTranslatedName = function (reverse) {
                    return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
                };

                /**
                 * @description Get the status of entity name as Active or Inactive instead of true or false.
                 * @returns {string}
                 */
                FavoriteDocument.prototype.getTranslatedStatus = function () {
                    return this.status ? langService.get('active') : langService.get('inactive');
                };

                /**
                 * @description Get the globalization of entity name as Yes or No instead of true or false.
                 * @returns {string}
                 */
                FavoriteDocument.prototype.getTranslatedGlobal = function () {
                    return this.global ? langService.get('yes') : langService.get('no');
                };

                // don't remove CMSModelInterceptor from last line
                // should be always at last thing after all methods and properties.
                CMSModelInterceptor.runEvent('FavoriteDocument', 'init', this);
            }
        }
    )
}
;