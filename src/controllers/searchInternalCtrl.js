module.exports = function (app) {
    app.controller('searchInternalCtrl', function (lookupService,
                                                   langService,
                                                   Internal,
                                                   ResolveDefer,
                                                   viewDocumentService,
                                                   organizations,
                                                   correspondenceSiteTypes,
                                                   correspondenceSiteService,
                                                   searchInternalService,
                                                   $q,
                                                   DocumentSearch,
                                                   propertyConfigurations,
                                                   validationService,
                                                   generator,
                                                   documentFiles,
                                                   documentTypes,
                                                   classificationService,
                                                   mainClassifications,
                                                   rootEntity,
                                                   managerService,
                                                   contextHelpService,
                                                   toast,
                                                   viewTrackingSheetService,
                                                   documentStatuses,
                                                   downloadService,
                                                   DocumentStatus,
                                                   distributionWorkflowService,
                                                   counterService,
                                                   employeeService,
                                                   correspondenceService,
                                                   dialog,
                                                   favoriteDocumentsService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchInternalCtrl';
        contextHelpService.setHelpTo('search-internal');

        self.progress = null;
        self.showAdvancedSearch = false;
        self.searchInternal = new DocumentSearch({"reqType": 2});
        self.searchInternal.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
        self.searchInternalModel = angular.copy(self.searchInternal);
        self.organizations = organizations;
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        self.propertyConfigurations = propertyConfigurations;
        /*self.docStatuses = [
         {text: 'Receive', 'value': 1},
         {text: 'Meta Data', 'value': 2},
         {text: 'Draft', 'value': 3},
         {text: 'Completed', 'value': 4},
         {text: 'Rejected', 'value': 7},
         {text: 'Ready For Sent', 'value': 8},
         {text: 'Removed', 'value': 9},
         {text: 'Archived', 'value': 21}
         ];*/
        self.docStatuses = documentStatuses;
        self.docStatuses.unshift(new DocumentStatus({arName: 'الكل', enName: 'All'}));
        self.followupStatuses = lookupService.returnLookups(lookupService.followupStatus);
        self.approvers = [];
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.documentTypes = documentTypes;
        self.documentFiles = documentFiles;

        self.years = function () {
            var currentYear = new Date().getFullYear(), years = ['All'];
            var lastYearForRange = currentYear - 10;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            return years;
        };
        self.correspondenceSiteTypes = correspondenceSiteTypes;
        //self.mainCorrespondenceSites_Copy = angular.copy(mainCorrespondenceSites);
        self.mainClassifications = mainClassifications;

        /**
         * @description Get the dynamic required fields
         */
        self.getSearchInternalRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchInternal = self.getSearchInternalRequiredFields();

        self.validateLabelsSearchInternal = {};


        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchInternal.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchInternal, obj)) {
                    self.validateLabelsSearchInternal[fieldName] = langKey;
                    //self.validateLabelsSearchInternal
                }
                return true;
            }
            return false;
        };


        /**
         * @description Checks the required fields validation
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsSearchInternal = function (model) {
            var required = self.requiredFieldsSearchInternal, result = [];
            /*_.map(required, function (property) {
             var propertyValueToCheck = (model.hasOwnProperty(property) ? model[property] : model.props[property]);
             if (!generator.validRequired(propertyValueToCheck))
             result.push(property);
             });*/
            _.map(required, function (property) {
                var propertyValueToCheck = model[property];
                if (!generator.validRequired(propertyValueToCheck))
                    result.push(property);
            });
            // return result;
            return [];
        };


        self.dynamicValidations = {
            'Integer': {type: 'number', message: langService.get('numberonly')},
            'String': {type: 'ALL', message: ''}
        };

        /**
         * @description Check the type of value allowed in the field
         * @param fieldName
         * @param typeOrMessage
         * @returns {*}
         */
        self.dynamicType = function (fieldName, typeOrMessage) {
            var dataType = _.find(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.symbolicName.toLowerCase() === fieldName.toLowerCase();
            }).dataType;
            return self.dynamicValidations[dataType][typeOrMessage];
        };


        self.toggleAdvancedSearch = function () {
            self.showAdvancedSearch = !self.showAdvancedSearch;
        };

        /**
         * @description Set the selected year on changing the value
         * @param $event
         */
        self.setSelectedYear = function (searchForm, $event) {
            self.selectedYear = self.searchInternal.year;
            self.searchInternal.docDateFrom = self.searchInternal.docDateTo = null;
            searchForm.docDateFrom.$setUntouched();
            searchForm.docDateTo.$setUntouched();
            if (self.selectedYear === 'All') {
                self.requiredFieldsSearchInternal.push('docDateFrom');
                self.requiredFieldsSearchInternal.push('docDateTo');
            }
            else {
                var dateFromIndex = self.requiredFieldsSearchInternal.indexOf('docDateFrom');
                if (dateFromIndex > -1)
                    self.requiredFieldsSearchInternal.splice(dateFromIndex, 1);
                var dateToIndex = self.requiredFieldsSearchInternal.indexOf('docDateTo');
                if (dateToIndex > -1)
                    self.requiredFieldsSearchInternal.splice(dateToIndex, 1);

                self.docDateFromCopy = self.selectedYear + '-01-01 00:00:00.000';
                self.docDateToCopy = self.selectedYear + '-12-31 23:59:59.999';
                self.setMinMaxDocDate('year');
            }
        };

        /**
         * @description Set the min and max range of date
         * @param changedBy
         * @param $event
         */
        self.setMinMaxDocDate = function (changedBy, $event) {
            /*If value is instance of date, that means user has changed the value from datepicker
             * else value is changed on change of year field and we need to cast the value to date type.
             */
            if (changedBy === 'year') {
                self.maxDocDate = self.maxDateForTo = new Date(self.docDateToCopy);
                self.minDocDate = self.minDateForFrom = new Date(self.docDateFromCopy);
            }
            else if (changedBy === 'picker') {
                if (self.selectedYear === 'All') {
                    self.maxDocDate = self.searchInternal.docDateTo;
                    self.minDocDate = self.searchInternal.docDateFrom;
                    self.minDateForFrom = null;
                    self.maxDateForTo = null;
                }
                else {
                    self.maxDocDate = self.searchInternal.docDateTo ? self.searchInternal.docDateTo : new Date(self.docDateToCopy);
                    self.minDocDate = self.searchInternal.docDateFrom ? self.searchInternal.docDateFrom : new Date(self.docDateFromCopy);
                    self.minDateForFrom = new Date(self.docDateFromCopy);
                    self.maxDateForTo = new Date(self.docDateToCopy);
                }
            }
        };

        /**
         * @description Get the main correspondence sites by correspondence site type
         * @returns {Array|*}
         */
        self.getMainCorrespondenceSites = function ($event) {
            self.searchInternal.mainSiteId = self.searchInternal.subSiteId = null;
            /*self.mainCorrespondenceSites = _.filter(self.mainCorrespondenceSites_Copy, function (correspondenceSite) {
             return correspondenceSite.correspondenceTypeId.id === self.searchInternal.siteType;
             });*/
            return correspondenceSiteService.getMainCorrespondenceSitesWithSiteTypeId(self.searchInternal.siteType).then(function (result) {
                self.mainCorrespondenceSites = result;
                return self.mainCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub correspondence sites by main correspondence site
         * @returns {Array|*}
         */
        self.getSubCorrespondenceSites = function ($event) {
            self.searchInternal.subSiteId = null;
            //self.subCorrespondenceSites = correspondenceSiteService.getSubCorrespondenceSites(self.searchInternal.mainSiteId);

            return correspondenceSiteService.getSubCorrespondenceSitesWithSiteTypeId(self.searchInternal.mainSiteId.id).then(function (result) {
                self.subCorrespondenceSites = result;
                return self.subCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub classifications by main classification
         * @returns {Array|*}
         */
        self.getSubClassifications = function (searchInternalForm, $event) {
            self.searchInternal.subClassification = null;
            searchInternalForm.subClassification.$setUntouched();
            self.subClassifications = classificationService.getSubClassifications(self.searchInternal.mainClassification);
            return self.subClassifications;
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTabName = "ens";
        self.selectedTab = 0;

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.showResults = false;

        /**
         * @description All application users
         * @type {*}
         */
        self.searchedInternalDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedInternalDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            validationService
                .createValidation('SEARCH_INTERNAL')
                .addStep('check_required', true, self.checkRequiredFieldsSearchInternal, self.searchInternal, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchInternal[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchInternalService
                        .searchInternalDocuments(self.searchInternal, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchInternalModel = angular.copy(self.searchInternal);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedInternalDocuments = result;
                            self.selectedSearchedInternalDocuments = [];
                        })
                        .catch(function (error) {

                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Resets the document search criteria
         * @param form
         */
        self.resetFilters = function (form) {
            self.searchInternal = new DocumentSearch({"reqType": 2});
            self.searchIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
            self.searchInternalModel = angular.copy(self.searchInternal);
            self.mainCorrespondenceSites = self.subCorrespondenceSites = self.subClassifications = [];
            form.$setUntouched();
        };

        /**
         * @description Saves the search criteria
         */
        self.saveSearch = function () {
            console.log('save search');
        };

        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.searchedInternalDocuments.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };

        /**
         * @description Reload the grid of searched internal documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedInternalDocument = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchInternalService
                .searchInternalDocuments(self.searchInternalModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedInternalDocuments = result;
                    self.selectedSearchedInternalDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedInternalDocument
         * @param $event
         */
        self.addToFavorite = function (searchedInternalDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedInternalDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedInternalDocument.getTranslatedName()
                        }));
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };


        /**
         * @description Export searched internal document
         * @param searchedInternalDocument
         * @param $event
         * @type {[*]}
         */
        self.exportSearchInternalDocument = function (searchedInternalDocument, $event) {
            searchInternalService
                .exportSearchInternal(searchedInternalDocument, $event)
                .then(function (result) {
                    self.reloadSearchedInternalDocument(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                        });
                });
        };

        /**
         * @description Launch distribution workflow for internal item
         * @param searchedInternalDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedInternalDocument, $event) {
            if (!searchedInternalDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            return dialog.confirmMessage(langService.get('confirm_launch_new_distribution_workflow'))
                .then(function () {
                    /*distributionWorkflowService
                     .controllerMethod
                     .distributionWorkflowSend(searchedInternalDocument, false, false, null, "internal", $event)
                     .then(function (result) {
                     self.reloadSearchedInternalDocument(self.grid.page);
                     })
                     .catch(function (result) {
                     self.reloadSearchedInternalDocument(self.grid.page);
                     });*/
                    searchedInternalDocument.launchWorkFlow($event, 'forward', 'favorites')
                        .then(function () {
                            self.reloadSearchedInternalDocument(self.grid.page);
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param searchedInternalDocument
         * @param $event
         */
        self.printBarcode = function (searchedInternalDocument, $event) {
            searchedInternalDocument.barcodePrint($event);
        };

        /**
         * @description View Tracking Sheet
         * @param searchedInternalDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedInternalDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedInternalDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageTags = function (searchedInternalDocument, $event) {
            //console.log('manage tag for searched internal document : ', searchedInternalDocument);
            managerService.manageDocumentTags(searchedInternalDocument.vsId, searchedInternalDocument.docClassName, searchedInternalDocument.docSubject, $event)
                .then(function (tags) {
                    searchedInternalDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedInternalDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageComments = function (searchedInternalDocument, $event) {
            //console.log('manage comments for searched internal document : ', searchedInternalDocument);
            managerService.manageDocumentComments(searchedInternalDocument.vsId, searchedInternalDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedInternalDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedInternalDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageTasks = function (searchedInternalDocument, $event) {
            console.log('manage tasks for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description manage attachments for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageAttachments = function (searchedInternalDocument, $event) {
            //console.log('manage attachments for searched internal document : ', searchedInternalDocument);
            var info = searchedInternalDocument.getInfo();
            managerService.manageDocumentAttachments(info.vsId, info.documentClass, info.title, $event)
                .then(function (attachments) {
                    searchedInternalDocument = attachments;
                })
                .catch(function (attachments) {
                    searchedInternalDocument = attachments;
                });
        };

        /**
         * @description manage linked documents for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedInternalDocument, $event) {
            //console.log('manage linked documents for searched internal document : ', searchedInternalDocument);
            var info = searchedInternalDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description manage linked entities for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedInternalDocument, $event) {
            //console.log('manage linked entities for searched internal document : ', searchedInternalDocument);
            managerService
                .manageDocumentEntities(searchedInternalDocument.vsId, searchedInternalDocument.docClassName, searchedInternalDocument.docSubject, $event);
        };

        /**
         * @description download main document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedInternalDocument, $event) {
            //console.log('download main document for searched internal document : ', searchedInternalDocument);
            downloadService.controllerMethod
                .mainDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description download composite document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedInternalDocument, $event) {
            //console.log('download composite document for searched internal document : ', searchedInternalDocument);
            downloadService.controllerMethod.compositeDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description send link to document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedInternalDocument, $event) {
            console.log('send link to document for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description send composite document as attachment for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedInternalDocument, $event) {
            console.log('send composite document as attachment for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description send composite document as attachment for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedInternalDocument, $event) {
            console.log('send composite document as attachment for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description send main document fax for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedInternalDocument, $event) {
            console.log('send main document fax for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description send sms for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendSMS = function (searchedInternalDocument, $event) {
            console.log('send sms for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description get link for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.getLink = function (searchedInternalDocument, $event) {
            console.log('get link for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description subscribe for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.subscribe = function (searchedInternalDocument, $event) {
            console.log('subscribe for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description create copy for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.createCopy = function (searchedInternalDocument, $event) {
            console.log('create copy for searched internal document : ', searchedInternalDocument);
        };

        self.viewDocument = function (searchedInternalDocument, $event) {
            if (!searchedInternalDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedInternalDocument, self.gridActions, true, true);
            return;
        };

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
             return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
             return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                                return isPermission !== true;
                            }));
                    }
                }
            }
            return (!action.hide);
        };

        /**
         * @description do broadcast for correspondence.
         */
        self.doBroadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedInternalDocument(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
        };

        self.gridActions = [
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                submenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'search-internal'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Add To Favorite
            {
                type: 'action',
                icon: 'star',
                text: 'grid_action_add_to_favorite',
                permissionKey: "MANAGE_FAVORITE",
                shortcut: false,
                callback: self.addToFavorite,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.docStatus >= 22;
                }
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportSearchInternalDocument,
                hide: true,
                class: "action-yellow",
                checkShow: self.checkToShowAction
            },
            //Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                showInView: false,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: self.checkToShowAction
            },
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                callback: self.doBroadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.needApprove();
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && model.barcodeReady();
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                submenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: self.checkToShowAction
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                hide: true,
                checkShow: self.checkToShowAction,
                submenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                callback: self.getLink,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                shortcut: false,
                callback: self.subscribe,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            // Create Copy
            {
                type: 'action',
                icon: 'content-copy',
                text: 'grid_action_create_copy',
                shortcut: true,
                callback: self.createCopy,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            }
        ];

        /*console.log('internal search grid main actions length', self.gridActions.length);
         var actions = [];
         for(var i=0; i < self.gridActions.length; i++){
         if(self.gridActions[i].type === 'action')
         actions.push(langService.getKey(self.gridActions[i].text, 'en'));
         if(self.gridActions[i].hasOwnProperty('submenu')){
         var submenus = self.gridActions[i].submenu;
         for(var j=0; j< submenus.length; j++){
         if(submenus[j].type === 'action')
         actions.push(langService.getKey(submenus[j].text, 'en'));
         }
         }
         }
         console.log('internal search all grid actions', actions);*/
    });
};