module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator) {
        'ngInject';

        var modelName = 'ViewerLog';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.updatedOnString;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.userInfo = new Information(model.userInfo);
            model.itemTypeInfo = new Information(model.itemTypeInfo);
            model.documentTypeInfo = new Information(model.documentTypeInfo);
            model.updatedOnString = generator.getDateFromTimeStamp(model.updatedOn, true);
            return model;
        });

    })
};
