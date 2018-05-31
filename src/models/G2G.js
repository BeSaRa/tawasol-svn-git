module.exports = function (app) {
    app.factory('G2G', function (CMSModelInterceptor,
                                 langService,
                                 Information,
                                 downloadService,
                                 Indicator) {
        return function G2G(model) {
            var self = this;

            self.correspondence = null;
            self.documentFile = null;
            self.mainClassification = null;
            self.subClassification = null;
            self.creatorOu = null;
            self.registeryOu = null;
            self.securityLevel = new Information();
            self.priorityLevel = new Information();
            self.docType = null;
            self.docStatus = null;
            self.fromOuInfo = null;
            self.documentViewInfo = null;
            self.senderInfo = null;
            self.stepElm = null;
            self.action = null;
            self.siteInfo = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            G2G.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            G2G.prototype.mainDocumentDownload = function ($event) {
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .mainDocumentDownload(info.vsId, $event);
            };
            G2G.prototype.compositeDocumentDownload = function ($event) {
                var info = this.getInfo();
                return downloadService.controllerMethod
                    .compositeDocumentDownload(info.vsId, $event);
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            G2G.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for entity name. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            G2G.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of entity name as Active or Inactive instead of true or false.
             * @returns {string}
             */
            G2G.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of entity name as Yes or No instead of true or false.
             * @returns {string}
             */
            G2G.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };

            G2G.prototype.getTranslatedType = function () {
                return (this.correspondence.type !== null) ? (this.correspondence.type === 0 ? langService.get('original') : langService.get('copy')) : null;
            };


            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            G2G.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                var mainSite = new Information(this.siteInfo.mainSite);
                var subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;
                return mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : '');
            };


            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            G2G.prototype.getInfo = function () {
                return this.recordInfo;
            };

            var indicator = new Indicator();
            G2G.prototype.getIsLockedG2GIndicator = function(){
                  return indicator.getIsLockedG2GIndicator(this.stepElm.lockedStatus);
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('G2G', 'init', this);
        }
    })
};