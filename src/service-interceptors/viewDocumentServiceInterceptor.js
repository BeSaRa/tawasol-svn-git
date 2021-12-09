module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      WorkItem,
                      GeneralStepElementView,
                      SentItemDepartmentInbox,
                      EventHistory) {
        'ngInject';
        var modelName = 'viewDocumentService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setGeneralStepElementView(GeneralStepElementView)
                .setWorkItem(WorkItem)
                .setEventHistory(EventHistory)
                .setSentItemDepartmentInbox(SentItemDepartmentInbox);
            return model;
        });

    })
};