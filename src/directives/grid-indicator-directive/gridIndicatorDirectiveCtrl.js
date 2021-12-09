module.exports = function (app) {
    app.controller('gridIndicatorDirectiveCtrl', function ($q,
                                                           $scope,
                                                           langService
                                                           //,gridIndicatorDirectiveService
    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridIndicatorDirectiveCtrl';
        self.langService = langService;

        /**
         * @description Checks if indicator will be displayed or not
         * @returns {boolean}
         */
        self.isShowIndicator = function () {
            return !self.showIndicator;
        };

        self.indicatorCallback = function (record, $event) {
            if (!self.callback || typeof self.callback !== 'function') {
                return;
            }
            self.callback(record, $event);
        };

        /* self.serviceMethods = {
             securityLevel: gridIndicatorDirectiveService.getSecurityLevelIndicator,
             docClass: gridIndicatorDirectiveService.getDocClassIndicator,
             paperElectronic: gridIndicatorDirectiveService.getPaperElectronicIndicator,
             isReassigned: gridIndicatorDirectiveService.getIsReassignedIndicator,
             hasLinkedDocuments: gridIndicatorDirectiveService.getHasLinkedDocumentsIndicator,
             tags: gridIndicatorDirectiveService.getTagsIndicator,
             followupStatus: gridIndicatorDirectiveService.getFollowUpStatusIndicator,
             priorityLevel: gridIndicatorDirectiveService.getPriorityLevelIndicator,
             hasAttachment: gridIndicatorDirectiveService.getHasAttachmentIndicator,
             dueDate: gridIndicatorDirectiveService.getDueDateIndicator,
             isLinkedExportedDoc: gridIndicatorDirectiveService.getIsLinkedExportedDocIndicator,
             originalCopy: gridIndicatorDirectiveService.getOriginalCopyIndicator,
             isLockedG2G: gridIndicatorDirectiveService.getIsLockedG2GIndicator,
             exportedViaCentralArchive: gridIndicatorDirectiveService.getExportViaCentralArchiveIndicator
         };

         var indicator = null;
         self.getIndicator = function () {
             if (!self.isShowIndicator())
                 return false;
             indicator = indicator ? indicator : self.serviceMethods[self.indicatorType](self.record);
             self[self.indicatorType + 'Indicator'] = angular.copy(indicator);
             return indicator;
         };

         self.getIndicatorTooltip = function () {
             var tooltip = langService.get(self[self.indicatorType+'Indicator'].tooltip) || '';
             if(tooltip.indexOf(':name') > -1){
                 tooltip = tooltip.change({name : indicator.value.getTranslatedName()});
             }
             else if(tooltip.indexOf(':due_date_status') > -1){
                 tooltip= tooltip.change({due_date_status : indicator.value});
             }
             else if(tooltip.indexOf(':locked_by_name') > -1){
                 tooltip= tooltip.change({locked_by_name: indicator.value});
             }
             return tooltip;
         };

         self.getIndicatorText = function () {
             var text = langService.get(self[self.indicatorType+'Indicator'].text) || '';
             if(text.indexOf(':name') > -1){
                 text = text.change({name : indicator.value.getTranslatedName()});
             }
             else if(text.indexOf(':due_date_status') > -1){
                 text = text.change({due_date_status : indicator.value});
             }
             else if(text.indexOf(':locked_by_name') > -1){
                 text = text.change({locked_by_name: indicator.value});
             }
             return text;
         }*/
    });
};
