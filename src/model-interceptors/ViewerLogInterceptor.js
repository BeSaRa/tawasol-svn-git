module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information) {
        'ngInject';

        var modelName = 'ViewerLog';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.userInfo = new Information(model.userInfo);
            model.itemTypeInfo = new Information(model.itemTypeInfo);
            model.documentTypeInfo = new Information(model.documentTypeInfo);
            return model;
        });

    })
};
