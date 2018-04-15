module.exports = function (app) {
    app.controller('searchOutgoingCtrl', function (lookupService,
                                                   langService,
                                                   Outgoing,
                                                   viewDocumentService,
                                                   organizations,
                                                   ResolveDefer,
                                                   correspondenceSiteTypes,
                                                   //mainCorrespondenceSites,
                                                   correspondenceSiteService,
                                                   searchOutgoingService,
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
                                                   employeeService,
                                                   distributionWorkflowService,
                                                   dialog,
                                                   counterService,
                                                   correspondenceService,
                                                   favoriteDocumentsService
                                                   //centralArchives
    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchOutgoingCtrl';
        contextHelpService.setHelpTo('search-outgoing');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.progress = null;
        self.showAdvancedSearch = false;

        self.searchOutgoing = new DocumentSearch({
            reqType: 0
        });
        //self.searchOutgoing.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
        self.searchOutgoingModel = angular.copy(self.searchOutgoing);

        self.organizations = organizations;

        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        self.propertyConfigurations = propertyConfigurations;

        self.docStatuses = angular.copy(documentStatuses);
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
        self.getSearchOutgoingRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchOutgoing = self.getSearchOutgoingRequiredFields();

        self.validateLabelsSearchOutgoing = {};
        /*
                // in case of central archive.
                self.registryOrganizations = centralArchives;

                self.isSearchByRegOU = true;
                self.getTranslatedYesNo = function (fieldName) {
                    return self[fieldName] ? langService.get('yes') : langService.get('no');
                };

                self.ouToggleDefaultDisabled = false;
                self.regOuToggleDefaultDisabled = false;

                self.checkRegOuToggleDisabled = function () {
                    if (employeeService.isCentralArchive()) {
                        return self.searchOutgoing.ou;
                    }
                    return false;
                };

                self.checkOuToggleDisabled = function () {
                    if (employeeService.isCentralArchive()) {
                        return self.isSearchByRegOU;
                    }
                    return false;
                };

                self.changeRegOuToggle = function () {
                    if (!self.isSearchByRegOU) {
                        self.searchOutgoing.regOu = null;
                    }
                };

                self.changeOuToggle = function () {
                    /!*self.isSearchByRegOU = false;
                     self.searchOutgoing.regOu = null;*!/
                };*/

        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchOutgoing.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchOutgoing, obj)) {
                    self.validateLabelsSearchOutgoing[fieldName] = langKey;
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
        self.checkRequiredFieldsSearchOutgoing = function (model) {
            var required = self.requiredFieldsSearchOutgoing, result = [];
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
            return [];
            //return result;
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
         * @param searchForm
         * @param $event
         */
        self.setSelectedYear = function (searchForm, $event) {
            self.selectedYear = self.searchOutgoing.year;
            self.searchOutgoing.docDateFrom = self.searchOutgoing.docDateTo = null;
            searchForm.docDateFrom.$setUntouched();
            searchForm.docDateTo.$setUntouched();
            if (self.selectedYear === 'All') {
                self.requiredFieldsSearchOutgoing.push('docDateFrom');
                self.requiredFieldsSearchOutgoing.push('docDateTo');
            }
            else {
                var dateFromIndex = self.requiredFieldsSearchOutgoing.indexOf('docDateFrom');
                if (dateFromIndex > -1)
                    self.requiredFieldsSearchOutgoing.splice(dateFromIndex, 1);
                var dateToIndex = self.requiredFieldsSearchOutgoing.indexOf('docDateTo');
                if (dateToIndex > -1)
                    self.requiredFieldsSearchOutgoing.splice(dateToIndex, 1);

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
                    self.maxDocDate = self.searchOutgoing.docDateTo;
                    self.minDocDate = self.searchOutgoing.docDateFrom;
                    self.minDateForFrom = null;
                    self.maxDateForTo = null;
                }
                else {
                    self.maxDocDate = self.searchOutgoing.docDateTo ? self.searchOutgoing.docDateTo : new Date(self.docDateToCopy);
                    self.minDocDate = self.searchOutgoing.docDateFrom ? self.searchOutgoing.docDateFrom : new Date(self.docDateFromCopy);
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
            self.searchOutgoing.mainSiteId = self.searchOutgoing.subSiteId = null;
            return correspondenceSiteService.getMainCorrespondenceSitesWithSiteTypeId(self.searchOutgoing.siteType).then(function (result) {
                self.mainCorrespondenceSites = result;
                return self.mainCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub correspondence sites by main correspondence site
         * @returns {Array|*}
         */
        self.getSubCorrespondenceSites = function ($event) {
            self.searchOutgoing.subSiteId = null;
            return correspondenceSiteService.getSubCorrespondenceSitesWithSiteTypeId(self.searchOutgoing.mainSiteId.id).then(function (result) {
                self.subCorrespondenceSites = result;
                return self.subCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub classifications by main classification
         * @returns {Array|*}
         */
        self.getSubClassifications = function (searchOutgoingForm, $event) {
            self.searchOutgoing.subClassification = null;
            searchOutgoingForm.subClassification.$setUntouched();
            self.subClassifications = classificationService.getSubClassifications(self.searchOutgoing.mainClassification);
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
        self.searchedOutgoingDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedOutgoingDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchOutgoing.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchOutgoing.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_OUTGOING')
                .addStep('check_required', true, self.checkRequiredFieldsSearchOutgoing, self.searchOutgoing, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchOutgoing[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchOutgoingService
                        .searchOutgoingDocuments(self.searchOutgoing, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchOutgoingModel = angular.copy(self.searchOutgoing);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedOutgoingDocuments = result;
                            self.selectedSearchedOutgoingDocuments = [];
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
            self.searchOutgoing = new DocumentSearch({"reqType": 0});
            //self.searchOutgoing.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
            self.searchOutgoingModel = angular.copy(self.searchOutgoing);
            self.mainCorrespondenceSites = self.subCorrespondenceSites = self.subClassifications = [];
            self.maxDocDate = self.maxDateForTo = self.minDocDate = self.minDateForFrom = null;
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
                        return (self.searchedOutgoingDocuments.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };

        /**
         * @description Reload the grid of searched outgoing documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedOutgoingDocument = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchOutgoingService
                .searchOutgoingDocuments(self.searchOutgoingModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedOutgoingDocuments = result;
                    self.selectedSearchedOutgoingDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description add selected items to the favorite documents
         * @param $event
         */
        self.addToFavoriteBulk = function ($event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAddBulk(self.selectedSearchedOutgoingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.addToFavorite = function (searchedOutgoingDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedOutgoingDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedOutgoingDocument.getTranslatedName()
                        }));
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /* /!**
         * @description Export searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchOutgoingDocument = function (searchedOutgoingDocument, $event) {
         //console.log('export searched outgoing document : ', searchedOutgoingDocument);
         searchOutgoingService
         .exportSearchOutgoing(searchedOutgoingDocument, $event)
         .then(function (result) {
         self.reloadSearchedOutgoingDocument(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/

        /**
         * @description Launch distribution workflow for outgoing item
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedOutgoingDocument, $event) {


            if (!searchedOutgoingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            searchedOutgoingDocument.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
            // return dialog.confirmMessage(langService.get('confirm_launch_new_distribution_workflow'))
            //     .then(function () {
            //         /*distributionWorkflowService
            //          .controllerMethod
            //          .distributionWorkflowSend(searchedOutgoingDocument, false, false, null, "outgoing", $event)
            //          .then(function (result) {
            //          self.reloadSearchedOutgoingDocument(self.grid.page);
            //          //self.replaceRecord(result);
            //          })
            //          .catch(function (result) {
            //          self.reloadSearchedOutgoingDocument(self.grid.page);
            //          //self.replaceRecord(result);
            //          });*/
            //         searchedOutgoingDocument.launchWorkFlow($event, 'forward', 'favorites')
            //             .then(function () {
            //                 self.reloadSearchedOutgoingDocument(self.grid.page);
            //             });
            //     });
        };

        /**
         * @description Print Barcode
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.printBarcode = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.barcodePrint($event);
        };


        /**
         * @description View Tracking Sheet
         * @param searchedOutgoingDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedOutgoingDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedOutgoingDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageTags = function (searchedOutgoingDocument, $event) {
            //console.log('manage tag for searched outgoing document : ', searchedOutgoingDocument);
            managerService.manageDocumentTags(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docClassName, searchedOutgoingDocument.docSubject, $event)
                .then(function (tags) {
                    searchedOutgoingDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedOutgoingDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageComments = function (searchedOutgoingDocument, $event) {
            //console.log('manage comments for searched outgoing document : ', searchedOutgoingDocument);
            managerService.manageDocumentComments(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedOutgoingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedOutgoingDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageTasks = function (searchedOutgoingDocument, $event) {
            console.log('manage tasks for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description manage attachments for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageAttachments = function (searchedOutgoingDocument, $event) {
            //console.log('manage attachments for searched outgoing document : ', searchedOutgoingDocument);
            var info = searchedOutgoingDocument.getInfo();
            //managerService.manageDocumentAttachments(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docClassName, searchedOutgoingDocument.docSubject, $event)
            managerService.manageDocumentAttachments(info.vsId, info.documentClass, info.title, $event)
                .then(function (attachments) {
                    searchedOutgoingDocument = attachments;
                })
                .catch(function (attachments) {
                    searchedOutgoingDocument = attachments;
                });
        };

        /**
         * @description manage linked documents for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedOutgoingDocument, $event) {
            //console.log('manage linked documents for searched outgoing document : ', searchedOutgoingDocument);
            var info = searchedOutgoingDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description manage linked entities for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedOutgoingDocument, $event) {
            //console.log('manage linked entities for searched outgoing document : ', searchedOutgoingDocument);
            managerService
                .manageDocumentEntities(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docClassName, searchedOutgoingDocument.docSubject, $event);
        };


        /**
         * @description Destinations
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageDestinations = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        /**
         * @description download main document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedOutgoingDocument, $event) {
            //console.log('download main document for searched outgoing document : ', searchedOutgoingDocument);
            downloadService.controllerMethod
                .mainDocumentDownload(searchedOutgoingDocument.vsId);
        };

        /**
         * @description download composite document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedOutgoingDocument, $event) {
            //console.log('download composite document for searched outgoing document : ', searchedOutgoingDocument);
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedOutgoingDocument.vsId);
        };

        /**
         * @description send link to document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedOutgoingDocument, $event) {
            console.log('send link to document for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description send composite document as attachment for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedOutgoingDocument, $event) {
            console.log('send composite document as attachment for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description send composite document as attachment for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedOutgoingDocument, $event) {
            console.log('send composite document as attachment for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description send main document fax for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedOutgoingDocument, $event) {
            console.log('send main document fax for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description send sms for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendSMS = function (searchedOutgoingDocument, $event) {
            console.log('send sms for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description get link for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.getLink = function (searchedOutgoingDocument, $event) {
            console.log('get link for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description subscribe for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.subscribe = function (searchedOutgoingDocument, $event) {
            console.log('subscribe for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description create copy for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.createCopy = function (searchedOutgoingDocument, $event) {
            console.log('create copy for searched outgoing document : ', searchedOutgoingDocument);
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal") && info.docStatus < 25;
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        self.viewDocument = function (searchedOutgoingDocument, $event) {
            if (!searchedOutgoingDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedOutgoingDocument, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(searchedOutgoingDocument, true));
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
         * @description do broadcast for workItem.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page)
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
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'search-outgoing'
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
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
             type: 'action',
             icon: 'export',
             text: 'grid_action_export',
             shortcut: true,
             callback: self.exportSearchOutgoingDocument,
             class: "action-yellow",
             checkShow: function (action, model) {
             //If document is paper outgoing and unapproved/partially approved, show the button.
             return self.checkToShowAction(action, model) && model.docStatus < 24 && model.addMethod === 1;
             }
             },*/
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
                callback: self.broadcast,
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
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && model.barcodeReady() && info.isPaper;
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: self.checkToShowAction,
                subMenu: [
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
                        //hide:true,
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
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return self.checkToShowAction(action, model) && checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
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
                subMenu: [
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
                subMenu: [
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
    });
};