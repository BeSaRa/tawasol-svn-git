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

        self.legends = [];
        var indicator = new Indicator();

        self.loadLegends = function () {
            _.map(self.gridLegends, function (indicatorKey) {
                switch (indicatorKey) {
                    case 'securityLevel':
                        var securityLevels = rootEntity.getGlobalSettings().securityLevels;
                        _.map(securityLevels, function (securityLevel) {
                            self.legends.push(indicator.getSecurityLevelIndicator(securityLevel));
                        });
                        break;
                    case 'priorityLevel':
                        var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                        _.map(priorityLevels, function (priorityLevel) {
                            var _priorityLevelIndicator = indicator.getPriorityLevelIndicator(priorityLevel);
                            if (_priorityLevelIndicator)
                                self.legends.push(_priorityLevelIndicator);
                        });
                        break;
                    case 'docClass':
                        var docClasses = ['outgoing', 'incoming', 'internal'];
                        _.map(docClasses, function (docClass) {
                            self.legends.push(indicator.getDocClassIndicator(docClass));
                        });
                        break;
                    case  'paperElectronic':
                        self.legends.push(indicator.getIsPaperIndicator(true));
                        self.legends.push(indicator.getIsPaperIndicator(false));
                        break;
                    case 'isReassigned':
                        self.legends.push(indicator.getReassignedIndicator(true));
                        break;
                    case 'followupStatus':
                        var followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
                        _.map(followUpStatuses, function (followUpStatus) {
                            var _followUpStatusIndicator = indicator.getFollowUpStatusIndicator(followUpStatus);

                            if (_followUpStatusIndicator)
                                self.legends.push(_followUpStatusIndicator);
                        });
                        break;
                    case 'hasLinkedDocuments':
                        self.legends.push(indicator.getLinkedDocumentsIndicator());
                        break;
                    case 'hasAttachment':
                        self.legends.push(indicator.getAttachmentsIndicator());
                        break;
                    case 'exportViaCentralArchive':
                        self.legends.push(indicator.getExportViaCentralArchiveIndicator(true));
                        break;
                    case 'linkedExportedDoc':
                        self.legends.push(indicator.getIsLinkedExportedDocIndicator());
                        break;
                    case 'copy':
                        self.legends.push(indicator.getOriginalCopyIndicator(1));
                        break;
                    case 'lockedG2g':
                    case 'lockedWorkItem':
                        self.legends.push(indicator.getIsLockedG2GIndicator(true));
                        break;
                    case 'versionHasContent':
                        self.legends.push(indicator.getVersionHasContentIndicator(true));
                        break;
                    case 'internalG2g':
                        self.legends.push(indicator.getIsInternalG2GIndicator(true));
                        break;
                    case 'transferredDocument':
                        self.legends.push(indicator.getIsTransferredDocumentIndicator(true));
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
