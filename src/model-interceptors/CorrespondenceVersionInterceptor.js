module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Information) {
        'ngInject';
        var modelName = 'CorrespondenceVersion';
        //var index = 0;
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.virtualVersionNumber;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.lastModifiedFormatted = generator.getDateFromTimeStamp(model.lastModified, true);
            model.lastModifierInfo = new Information(model.lastModifierInfo);
            //index++;
            //model.virtualVersionNumber = index;
            return model;
        });

    })
};