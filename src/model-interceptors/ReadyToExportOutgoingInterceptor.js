module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      CorrespondenceSite,
                      CorrespondenceSiteType,
                      SenderInfo,
                      WorkflowAction,
                      correspondenceService,
                      moment) {
        'ngInject';

        var modelName = 'ReadyToExport';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.mainCoreSite = new CorrespondenceSite(model.mainCoreSite);
            model.subCoreSite = new CorrespondenceSite(model.subCoreSite);
            model.siteType = new CorrespondenceSiteType(model.siteType);
            model.senderInfo = new SenderInfo(model.senderInfo);
            model.action = model.action ? new WorkflowAction(model.action) : new WorkflowAction();
            model.setCorrespondenceService(correspondenceService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.generalStepElm.numberOfDays = getNumberOfDays(model.generalStepElm.receivedDate);
            if (model.generalStepElm.receivedDate)
                getDateFromUnixTimeStamp(model.generalStepElm, ["receivedDate"]);
            else
                model.generalStepElm.receivedDate = "";
            if (model.generalStepElm.dueDate && model.generalStepElm.dueDate > 0 && model.generalStepElm.dueDate >= moment().unix())
                getDateFromUnixTimeStamp(model.generalStepElm, ["dueDate"]);
            else
                model.generalStepElm.dueDate = "";
            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD') : null;
            }
            return model;
        };

        /**
         * @description Gets the difference in days between received date and now
         * @param {timestamp} receivedDate
         * @returns {*}
         */
        var getNumberOfDays = function (receivedDate) {
            return (receivedDate) ? -(moment(receivedDate).diff(moment(), 'days')) : "";
        };

    })
};