module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator) {
        'ngInject';

        var modelName = 'ApplicationUserView';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.updatedOnString;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.updatedOnString = generator.getDateFromTimeStamp(model.updatedOn, true);

            return model;
        });

    });
};
