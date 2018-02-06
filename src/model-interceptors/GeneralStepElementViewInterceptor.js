module.exports = function (app) {
    app.run(function (CMSModelInterceptor , correspondenceService) {
        'ngInject';

        var modelName = 'GeneralStepElementView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setCorrespondenceService(correspondenceService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mapReceived();
            console.log(model);
            return model;
        });

    })
};