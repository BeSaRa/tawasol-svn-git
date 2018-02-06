module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      referencePlanNumberService) {
        'ngInject';

        var modelName = 'ReferencePlanItemStartSerial';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setReferencePlanNumberService(referencePlanNumberService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};