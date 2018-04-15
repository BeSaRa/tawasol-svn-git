module.exports = function (app) {
    app.run(function (CMSModelInterceptor, userFilterService) {
        'ngInject';
        var modelName = 'UserFilter';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setUserFilterService(userFilterService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.prepareSendUserFilter();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedUserFilter();
            return model;
        });

    })
};