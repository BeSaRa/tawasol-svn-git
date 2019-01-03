module.exports = function (app) {
    app.factory('RootEntity', function (CMSModelInterceptor,
                                        _,
                                        $sce,
                                        generator,
                                        Idle,
                                        $rootScope,
                                        lookupService,
                                        langService,
                                        Settings) {
        'ngInject';
        return function RootEntity(model) {
            var self = this;
            self.settings = null;
            self.publicAnnouncements = null;
            self.globalAnnouncements = null;
            self.rootEntity = null;
            self.globalLookup = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model) {
                self.settings = generator.interceptReceivedInstance('GlobalSetting', new Settings(model.globalSetting));
                self.rootEntity = model.tawasolEntity;
                // hide it till finish the service
                if (model.hasOwnProperty('localization')) {
                    langService.prepareLocalization(model.localization, true);
                }
                $rootScope.lang = langService.getCurrentTranslate();
                // prepare public announcements.
                self.publicAnnouncements = _.map(model.publicAnnounce, function (a) {
                    a.arBody = $sce.trustAsHtml(a.arBody);
                    a.enBody = $sce.trustAsHtml(a.enBody);
                    return a;
                });
                // prepare global announcements.
                self.globalAnnouncements = _.map(model.globalAnnounce, function (a) {
                    a.arBody = $sce.trustAsHtml(a.arBody);
                    a.enBody = $sce.trustAsHtml(a.enBody);
                    return a;
                });
                // set the timeout for the current session to start count the
                if (self.settings.sessionTimeout > 1) {
                    //Idle.setIdle((self.settings.sessionTimeout - 1) * 60);
                }
            }

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            RootEntity.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            RootEntity.prototype.getTranslatedName = function () {
                return langService.current === 'ar' ? this.rootEntity.arName : this.rootEntity.enName;
            };
            RootEntity.prototype.getTranslatedAppName = function () {
                return langService.current === 'ar' ? this.rootEntity.appArName : this.rootEntity.appEnName;
            };

            RootEntity.prototype.getBannerLogoUrl = function () {
                return this.settings && this.settings.bannerLogo ? this.settings.bannerLogo.fileUrl : false;
            };
            RootEntity.prototype.getLoginLogoUrl = function () {
                return this.settings && this.settings.loginLogo ? this.settings.loginLogo.fileUrl : false;
            };
            RootEntity.prototype.setGlobalSetting = function (globalSetting) {
                this.settings = new Settings(globalSetting);
                return this;
            };
            RootEntity.prototype.identifierEqual = function (identifier) {
                return this.rootEntity.identifier === identifier;
            };

            RootEntity.prototype.setFileTypesHashMapToGlobalSettings = function (map) {
                this.settings.fileTypesMap = map;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('RootEntity', 'init', this);
        }
    })
};
