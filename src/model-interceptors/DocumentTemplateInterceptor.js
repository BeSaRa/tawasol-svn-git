module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _) {
        'ngInject';

        var modelName = 'DocumentTemplate';
        // var deletedElse = ['signaturesCount', 'docType', 'templateType', 'ou'];

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ou = angular.copy(model.isGlobal) ? null : Number(model.ou);
            delete model.cbrEnabled;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};