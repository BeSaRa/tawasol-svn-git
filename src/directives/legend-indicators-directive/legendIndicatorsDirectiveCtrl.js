module.exports = function (app) {
    app.controller('legendIndicatorsDirectiveCtrl', function (gridService,
                                                              langService,
                                                              Indicator,
                                                              lookupService,
                                                              $scope,
                                                              _,
                                                              $timeout,
                                                              rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'legendIndicatorsDirectiveCtrl';

        self.legendIndicators = [];
        var indicator = new Indicator();

        self.loadLegends = function () {
            _.map(self.gridLegends, function (indicatorKey) {
                switch (indicatorKey) {
                    case 'securityLevel':
                        var securityLevels = rootEntity.getGlobalSettings().securityLevels;
                        _.map(securityLevels, function (securityLevel) {
                            self.legendIndicators.push(indicator.getSecurityLevelIndicator(securityLevel));
                        });
                        break;
                    case 'priorityLevel':
                        var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                        _.map(priorityLevels, function (priorityLevel) {
                            var _priorityLevelIndicator = indicator.getPriorityLevelIndicator(priorityLevel);
                            if (_priorityLevelIndicator)
                                self.legendIndicators.push(_priorityLevelIndicator);
                        });
                        break;
                    case 'docClass':
                        var docClasses = ['outgoing', 'incoming', 'internal'];
                        _.map(docClasses, function (docClass) {
                            self.legendIndicators.push(indicator.getDocClassIndicator(docClass));
                        });
                        break;
                    case  'paperElectronic':
                        self.legendIndicators.push(indicator.getIsPaperIndicator(true));
                        self.legendIndicators.push(indicator.getIsPaperIndicator(false));
                        break;
                    case 'isReassigned':
                        self.legendIndicators.push(indicator.getReassignedIndicator(true));
                        break;
                    case 'followupStatus':
                        var followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
                        _.map(followUpStatuses, function (followUpStatus) {
                            var _followUpStatusIndicator = indicator.getFollowUpStatusIndicator(followUpStatus);

                            if (_followUpStatusIndicator)
                                self.legendIndicators.push(_followUpStatusIndicator);
                        });
                        break;
                    case 'hasLinkedDocuments':
                        self.legendIndicators.push(indicator.getLinkedDocumentsIndicator());
                        break;
                    case 'hasAttachment':
                        self.legendIndicators.push(indicator.getAttachmentsIndicator());
                        break;
                    case 'exportViaCentralArchive':
                        self.legendIndicators.push(indicator.getExportViaCentralArchiveIndicator(true));
                        break;
                    case 'linkedExportedDoc':
                        self.legendIndicators.push(indicator.getIsLinkedExportedDocIndicator());
                        break;
                    case 'copy':
                        self.legendIndicators.push(indicator.getOriginalCopyIndicator(1));
                        break;
                    case 'lockedG2g':
                    case 'lockedWorkItem':
                        self.legendIndicators.push(indicator.getIsLockedG2GIndicator(true));
                        break;
                    case 'versionHasContent':
                        self.legendIndicators.push(indicator.getVersionHasContentIndicator(true));
                        break;
                    case 'internalG2g':
                        self.legendIndicators.push(indicator.getIsInternalG2GIndicator(true));
                        break;
                    case 'transferredDocument':
                        self.legendIndicators.push(indicator.getIsTransferredDocumentIndicator(true));
                        break;
                    case 'broadcast':
                        self.legendIndicators.push(indicator.getIsBroadcastedIndicator(true));
                        break;
                    case 'siteFollowUpDueDate':
                        var today = new Date(), tomorrow = new Date(today), yesterday = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        yesterday.setDate(yesterday.getDate() - 1);
                        _.map([yesterday, today, tomorrow], function (date) {
                            self.legendIndicators.push(indicator.getSiteFollowUpDueDateIndicator(date));
                        });
                        break;
                    case 'siteFollowUpEnded':
                        self.legendIndicators.push(indicator.getSiteFollowUpEndedIndicator(true));
                        break;
                    case 'sequentialWF':
                        self.legendIndicators.push(indicator.getSequentialWFIndicator());
                        break;
                    case 'conditionalApprove':
                        self.legendIndicators.push(indicator.getConditionalApproveIndicator(true));
                        break;
                }
            });
        };

        $timeout(function () {
            if (!self.visibleCount) {
                self.visibleCount = 5;
            }

            self.loadLegends();
        })
    });
};
