module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      sequentialWorkflowService,
                      generator,
                      uuidv4) {
        'ngInject';
        var modelName = 'SequentialWFStep';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setSequentialWorkflowService(sequentialWorkflowService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            // model.toUserId = generator.getNormalizedValue(model.toUserId, 'id');
            model.toUserId = model.getUserIdFromCombination();
            model.uiOuId = model.getOuIdFromCombination();
            model.toOUID = generator.getNormalizedValue(model.toOUID, 'id');
            model.actionId = generator.getNormalizedValue(model.actionId, 'id');

            model.sendSMS = model.sendSMS || false;
            model.sendEmail = model.sendEmail || false;

            delete model.dummyId;
            delete model.userIdAndOuId;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.dummyId = uuidv4();
            model.userIdAndOuId = model.getUserIdAndOuIdCombination(); // used in binding user in step popup. because it is binding to applicationUserId which will be multiple in ouApplicationUser list.
            return model;
        });

    })
};
