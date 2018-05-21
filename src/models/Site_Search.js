module.exports = function (app) {
    app.factory('Site_Search', function (CMSModelInterceptor,
                                  langService,
                                         generator) {
        'ngInject';
        return function Site_Search(model) {
            var self = this, exportTypes = {
                    1: 'export_electronic',
                    2: 'export_manual',
                    3: 'export_g_tow_g'
                    // 4: 'export_private'
                },
                maps = {
                    mainSiteId: ['parentInfo', 'id'],
                    subSiteId: 'id',
                    mainEnSiteText: ['parentInfo', 'enName'],
                    mainArSiteText: ['parentInfo', 'arName'],
                    subArSiteText: 'arName',
                    subEnSiteText: 'enName',
                    siteType: 'correspondenceSiteTypeId'
                };
            self.followupDate1 = null;
            self.followupDate2 = null;
            self.followupStatus = null;
            self.siteType = null;
            self.mainSiteId = null;
            self.subSiteId = null;
            self.mainEnSiteText = null;
            self.mainArSiteText = null;
            self.subArSiteText = null;
            self.subEnSiteText = null;
            self.followupStatusResult = null;
            self.siteTypeResult = null;
            self.siteCategory = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'followupStatus',
                'siteType',
                'mainSiteId',
                'subSiteId'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            Site_Search.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * map Site from SiteView Model.
             * @param siteView
             * @return {Site}
             */
            Site_Search.prototype.mapFromSiteView = function (siteView) {
                var self = this;
                _.map(maps, function (property, key) {
                    if (!angular.isArray(property)) {
                        self[key] = siteView[property];
                    } else {
                        self[key] = _.get(siteView, property);
                    }
                });
                return self;
            };
            /**
             * @description set followup Status
             * @param followupStatus
             */
            Site_Search.prototype.setFollowupStatus = function (followupStatus) {
                this.followupStatus = followupStatus;
                return this;
            };

            Site_Search.prototype.setCorrespondenceSiteType = function (type) {
                this.siteType = type;
                return this;
            };
            /**
             * @description get translated name
             * @param reverse
             * @return {null}
             */
            Site_Search.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.subEnSiteText : this.subArSiteText) : (reverse ? this.subArSiteText : this.subEnSiteText);
            };
            /**
             * @description get translated parent name
             * @param reverse
             * @return {null}
             */
            Site_Search.prototype.getTranslatedParentName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.mainEnSiteText : this.mainArSiteText) : (reverse ? this.mainArSiteText : this.mainEnSiteText);
            };

            Site_Search.prototype.getTranslatedSiteType = function () {
                return this.siteType && this.siteType.hasOwnProperty('id') ? this.siteType.getTranslatedName() : '';
            };

            Site_Search.prototype.getSiteToIncoming = function (model) {
                model.siteType = this.siteType && this.siteType.hasOwnProperty('id') ? this.siteType.lookupKey : this.siteType;
                model.mainSiteId = this.mainSiteId && this.mainSiteId.hasOwnProperty('id') ? this.mainSiteId.id : this.mainSiteId;
                model.subSiteId = this.subSiteId && this.subSiteId.hasOwnProperty('id') ? this.subSiteId.id : this.subSiteId;
                model.followupStatus = this.followupStatus && this.followupStatus.hasOwnProperty('id') ? this.followupStatus.lookupKey : this.followupStatus;
                //model.followupDate = this.followupDate;
                return model;
            };

            Site_Search.prototype.getExportType = function () {
                return langService.get(exportTypes[this.siteCategory]);
            };

            Site_Search.prototype.getVersionType = function () {
                return this.ccVerion ? langService.get('sites_copy') : langService.get('sites_original');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Site_Search', 'init', this);
        }
    })
};