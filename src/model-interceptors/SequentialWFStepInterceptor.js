module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      sequentialWorkflowService,
                      generator,
                      Information,
                      ProxyInfo,
                      AdminResultRelation) {
        'ngInject';
        var modelName = 'SequentialWFStep';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setSequentialWorkflowService(sequentialWorkflowService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            // model.toUserId = generator.getNormalizedValue(model.toUserId, 'id');
            model.toUserId = model.getUserIdFromCombination();
            model.toOUID = model.getOuIdFromCombination();
            model.uiOuId = generator.getNormalizedValue(model.uiOuId, 'id');
            model.actionId = generator.getNormalizedValue(model.actionId, 'id');

            model.sendSMS = model.sendSMS || false;
            model.sendEmail = model.sendEmail || false;

            delete model.userIdAndOuId;
            delete model.isSelectedForSubSeqWF;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.userIdAndOuId = model.getUserIdAndOuIdCombination(); // used in binding user in step popup. because it is binding to applicationUserId which will be multiple in ouApplicationUser list.
            model.toUserInfo = (model.toUserInfo && model.toUserInfo.id) ? new Information(model.toUserInfo) : model.toUserInfo;
            model.toOUInfo = (model.toOUInfo && model.toOUInfo.id) ? new AdminResultRelation(model.toOUInfo) : model.toOUInfo;
            model.proxyUserInfo = (model.proxyUserInfo && model.proxyUserInfo.id) ? new ProxyInfo(model.proxyUserInfo) : model.proxyUserInfo;
            return model;
        });

    })
};
