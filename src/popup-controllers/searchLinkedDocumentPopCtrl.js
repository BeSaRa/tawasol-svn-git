module.exports = function (app) {
    app.controller('searchLinkedDocumentPopCtrl', function (lookupService,
                                                            organizationService,
                                                            documentFileService,
                                                            rootEntity,
                                                            langService,
                                                            viewCallback,
                                                            dialog,
                                                            excludeVsId,
                                                            viewDocumentService,
                                                            correspondenceService,
                                                            classificationService,
                                                            Correspondence,
                                                            employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchLinkedDocumentPopCtrl';
        // all document class for Correspondences
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        // the search criteria for correspondence
        self.correspondence = new Correspondence({
            year: new Date().getFullYear()/*,
            registryOU: employeeService.getCurrentOUApplicationUser().ouRegistryID*/
        });

        self.excludeVsId = excludeVsId;

        // all security levels
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        // all organization organizations -> pop resolve.
        //self.organizations = organizationService.organizations;
        self.organizations = _.filter(organizationService.organizations, function (organization) {
            return organization.hasRegistry;
        });

        // all main classifications -> pop resolve.
        self.classifications = classificationService.getMainClassifications(classificationService.classifications);
        // all document Files ->pop resolve.
        self.documentFiles = documentFileService.documentFiles;

        self.classesMap = {
            1: 'outgoing',
            3: 'internal',
            2: 'incoming'
        };
        self.searchType = self.documentClasses[0];

        self.globalSetting = rootEntity.getGlobalSettings();

        self.selectedCorrespondences = [];

        self.correspondences = [];

        self.selectedIndex = 0;

        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.correspondences.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };


        self.years = function () {
            var currentYear = new Date().getFullYear(), years = [];
            var lastYearForRange = currentYear - 10;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            return years;
        };
        /**
         * @description start search after create your criteria.
         */
        self.searchLinkedDocuments = function () {
            var vsIds = self.excludeVsId ? [self.excludeVsId] : [];
            correspondenceService
                .correspondenceSearch(self.correspondence.setDocClassName(self.searchType.getStringKeyValue()))
                .then(function (result) {
                    self.correspondences = _.filter(result, function (item) {
                        return vsIds.indexOf(item.getInfo().vsId) === -1;
                    });
                    if (self.correspondences.length) {
                        // go to result tab.
                        self.selectedIndex = true;
                    } else {
                        // if no result found display message.
                        dialog.infoMessage(langService.get('no_results_found_for_your_search_criteria'));
                    }
                });
        };
        /**
         * @description view correspondence .
         * @param correspondence
         * @param $event
         */
        self.viewCorrespondence = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            viewCallback(correspondence, false, [], $event, true);
        };
        /**
         * @description send selected correspondences to parent controller
         */
        self.sendLinkedDocuments = function () {
            dialog.hide(self.selectedCorrespondences)
        };
        /**
         * @description close the linkedDocument without sending any correspondence.
         */
        self.closeLinkedDocuments = function () {
            dialog.cancel();
        }


    });
};