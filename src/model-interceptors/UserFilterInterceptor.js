module.exports = function (app) {
    app.run(function (CMSModelInterceptor, userFilterService, generator) {
        'ngInject';
        var modelName = 'UserFilter';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setUserFilterService(userFilterService);
            model.selectedReceivedDateFilterType = null;
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.prepareSendUserFilter();

            delete model.selectedReceivedDateFilterType;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedUserFilter();
            return model;
        });

    })
};
