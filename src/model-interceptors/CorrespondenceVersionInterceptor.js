module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Indicator,
                      Information) {
        'ngInject';
        var modelName = 'CorrespondenceVersion';
        //var index = 0;
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.virtualVersionNumber;
            delete model.versionHasContentIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.lastModifiedFormatted = generator.getDateFromTimeStamp(model.createdOn, true);
            model.lastModifierInfo = new Information(model.lastModifierInfo);
            //index++;
            //model.virtualVersionNumber = index;
            var indicator = new Indicator();
            model.versionHasContentIndicator = indicator.getVersionHasContentIndicator(model.contentSize);
            debugger;
            return model;
        });

    })
};