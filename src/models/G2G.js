module.exports = function (app) {
    app.factory('G2G', function (CMSModelInterceptor,
                                 langService,
                                 Information,
                                 downloadService,
                                 viewDocumentService,
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
            self.isInternal = false;


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
             * @description Returns the document subject
             * @returns {null}
             */
            G2G.prototype.getTranslatedName = function () {
                return this.correspondence.docSubject;
            };

            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            G2G.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                /*var mainSite = new Information(this.siteInfo.mainSite);
                var subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;

                return mainSite.getTranslatedName() + (subSite ? (' - ' + subSite.getTranslatedName()) : '');*/
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            G2G.prototype.setMainSiteSubSiteString = function () {
                this.mainSiteSubSiteString = new Information({
                    arName: '',
                    enName: ''
                });
                if (this.siteInfo) {
                    var mainSite = new Information(this.siteInfo.mainSite);
                    var subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;

                    this.mainSiteSubSiteString.arName = mainSite.getTranslatedNameByLang('ar') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('ar')) : '');
                    this.mainSiteSubSiteString.enName = mainSite.getTranslatedNameByLang('en') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('en')) : '');
                }
                return this;
            };

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            G2G.prototype.getInfo = function () {
                return this.recordInfo;
            };

            /**
             * @description Checks if G2G record is internal G2G record
             * @returns {boolean}
             */
            G2G.prototype.isInternalG2G = function () {
                return this.internal;
            };

            var indicator = new Indicator();
            /*G2G.prototype.getIsLockedG2GIndicator = function(){
                  return indicator.getIsLockedG2GIndicator(this.stepElm.lockedStatus);
            };*/

            G2G.prototype.getIsInternalG2GIndicator = function () {
                return indicator.getIsInternalG2GIndicator(this.internal);
            };

            G2G.prototype.viewDocument = function (actions, queueName, $event) {
                return viewDocumentService.viewG2GDocument(this, actions, queueName, $event);
            };

            G2G.prototype.getTranslatedOriginalCopy = function () {
                return this.correspondence.siteType === 0
                    ? new Information({enName: langService.getByLangKey('original', 'en'), arName: langService.getByLangKey('original', 'ar')})
                    : new Information({enName: langService.getByLangKey('copy', 'en'), arName: langService.getByLangKey('copy', 'ar')});
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('G2G', 'init', this);
        }
    })
};