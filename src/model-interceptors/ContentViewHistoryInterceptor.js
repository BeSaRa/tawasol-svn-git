module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      applicationUserService,
                      moment,
                      lookupService,
                      ContentViewHistoryEvents,
                      langService,
                      generator) {
        'ngInject';

        var modelName = 'ContentViewHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.documentType;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //(model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
            model.documentType = model.mainDoc === 0 ? langService.get('view_tracking_sheet_main_doc') : (model.mainDoc ===1 ? langService.get('view_tracking_sheet_linked_doc') : langService.get('view_tracking_sheet_attachment'));
            if (model.events) {
                model.events = _.orderBy(model.events, 'actionDate', 'desc');
                model.events = generator.generateCollection(model.events, ContentViewHistoryEvents, self._sharedMethods);
                model.events = generator.interceptReceivedCollection('ContentViewHistoryEvents', model.events);
            }
            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD hh:mm:ss A)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD hh:mm:ss A') : null;
            }
            return model;
        };
    })
};