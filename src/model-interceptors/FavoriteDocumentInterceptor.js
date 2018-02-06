module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information) {
        'ngInject';

        var modelName = 'FavoriteDocument';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.docTypeInfo = model.docTypeInfo ? new Information(model.docTypeInfo) : new Information();
            model.securityLevelInfo = model.securityLevelInfo ? new Information(model.securityLevelInfo) : new Information();
            model.priorityLevelInfo = model.priorityLevelInfo ? new Information(model.priorityLevelInfo) : new Information();
            return model;
        });

    })
};