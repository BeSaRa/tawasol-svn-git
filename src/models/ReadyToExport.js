module.exports = function (app) {
    app.factory('ReadyToExport', function (CMSModelInterceptor,
                                            langService,
                                            _) {
        'ngInject';
        return function ReadyToExport(model) {
            var self = this, correspondenceService = null;
            self.generalStepElm = null;
            self.folder = null;
            self.mainClassification = null;
            self.subClassification = null;
            self.creatorOu = null;
            self.registeryOu = null;
            self.securityLevel = null;
            self.priorityLevel = null;
            self.docType = null;
            self.senderInfo = null;
            self.action = null;
            self.siteInfo = null;
            self.fromRegOu = null;
            self.toRegOu = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);
            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ReadyToExport.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Ready To Export Outgoing. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ReadyToExport.prototype.getNames = function (separator) {
                //return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
                return this.generalStepElm.docSubject;
            };

            /**
             * @description Get the status of entity name as Active or Inactive instead of true or false.
             * @returns {string}
             */
            ReadyToExport.prototype.getTranslatedStarred = function () {
                return this.generalStepElm.starred ? langService.get('starred') : langService.get('un_starred');
            };

            /**
             * @description Get the translated arabic or english name according to current language for Ready To Export Outgoing. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ReadyToExport.prototype.getTranslatedName = function (reverse) {
               // return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
                return this.generalStepElm.docSubject;
            };

            ReadyToExport.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
            };
            ReadyToExport.prototype.hasContent = function () {
                // return correspondenceService.getContentSize(this);
                return true;
            };
            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            ReadyToExport.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            /*/!**
             * @description Get the globalization of Ready To Export Outgoing as Yes or No instead of true or false.
             * @returns {string}
             *!/
             ReadyToExport.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReadyToExport', 'init', this);
        }
    })
};