module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      DocumentSecuritySetting,
                      generator) {
        'ngInject';
        var modelName = 'DocumentSecurity';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.settingDetails = _.map(model.settingDetails, function (setting) {
                setting = generator.interceptSendInstance('DocumentSecuritySetting', setting);
                return setting;
            });
            delete model.adminResult;   // this was dummy property from service but not used anywhere
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.settingDetails = _.map(model.settingDetails, function (setting) {
                setting = generator.generateInstance(setting, DocumentSecuritySetting);
                setting = generator.interceptReceivedInstance('DocumentSecuritySetting', setting);
                return setting;
            });
            return model;
        });

    })
};