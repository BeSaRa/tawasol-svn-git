module.exports = function (app) {
    app.service('globalSettingService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  GlobalSetting,
                                                  _,
                                                  errorCode,
                                                  dialog,
                                                  langService) {
        'ngInject';
        var self = this;
        self.serviceName = 'globalSettingService';

        self.globalSetting = [];

        /**
         * @description Get globalSetting by id
         * @returns {GlobalSetting}
         */
        self.getGlobalSetting = function (id) {
            return $http.get(urlService.globalSettings + '/' + id).then(function (result) {
                self.globalSetting = generator.generateInstance(result.data.rs, GlobalSetting);
                return self.globalSetting;
            })
        };

        /**
         * @description Add new global setting
         * @param globalSetting
         * @return {Promise|GlobalSetting}
         */
        self.addGlobalSetting = function (globalSetting) {
            return $http
                .post(urlService.globalSettings,
                    generator.interceptSendInstance('GlobalSetting', globalSetting))
                .then(function () {
                    return globalSetting;
                });
        };

        /**
         * @description Update the given global setting.
         * @param globalSetting
         * @return {Promise|GlobalSetting}
         */
        self.updateGlobalSetting = function (globalSetting) {
            return $http
                .put(urlService.globalSettings,
                    generator.interceptSendInstance('GlobalSetting', globalSetting))
                .then(function () {
                    return globalSetting;
                });
        };

        /**
         * @description Get global setting by globalSettingId
         * @param globalSettingId
         * @returns {GlobalSetting|undefined} return GlobalSetting Model or undefined if not found.
         */
        self.getGlobalSettingById = function (globalSettingId) {
            globalSettingId = globalSettingId instanceof GlobalSetting ? globalSettingId.id : globalSettingId;
            return _.find(self.globalSetting, function (globalSetting) {
                return Number(globalSetting.id) === Number(globalSettingId)
            });
        };

        /**
         * Get globalSetting by identifier
         * @returns {GlobalSetting}
         */
        self.getGlobalSettingByRootIdentifier = function (entity) {
            var url = urlService.globalSettings + '/tawasol-entity-id/' + entity.identifier;
            return $http.get(url).then(function (result) {
                self.globalSetting = generator.generateInstance(result.data.rs, GlobalSetting);
                self.globalSetting = generator.interceptReceivedInstance('GlobalSetting', self.globalSetting);
                return self.globalSetting;
            });
        };


        /**
         * @param globalSetting,file,Url(banner-logo/login-logo)
         * @param file
         * @param modelName
         * @returns {GlobalSetting}
         */
        self.saveLogoImage = function (globalSetting, file, modelName) {
            var url = "";
            if (modelName === "bannerLogo") {
                url = urlService.globalSettings + "/banner-logo";
            } else {
                url = urlService.globalSettings + "/login-logo";
            }
            var form = new FormData();
            form.append('id', globalSetting.id);
            form.append('content', file);
            return $http.post(url, form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, GlobalSetting, self._sharedMethods);
                })
        };

        self.testBarcodeSettings = function (globalSettings) {
            return $http
                .post(urlService.globalSettings + '/print-test-barcode', generator.interceptSendInstance('GlobalSetting', globalSettings))
                .then(function (result) {
                    return result.data.rs;
                })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'PRINT_BARCODE_ERROR_NO_BARCODE_ELEMENT', function () {
                        dialog.errorMessage(langService.get('print_barcode_error_no_barcode_element'));
                    })
                });
        }
    });
};
