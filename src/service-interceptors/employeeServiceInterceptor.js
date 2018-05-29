module.exports = function (app) {
    app.run(function (CMSModelInterceptor, applicationUserSignatureService) {
        'ngInject';
        var modelName = 'employeeService';
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setSignatureService(applicationUserSignatureService);
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