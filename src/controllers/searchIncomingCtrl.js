module.exports = function (app) {
    app.controller('searchIncomingCtrl', function (lookupService,
                                                   langService,
                                                   Incoming,
                                                   ResolveDefer,
                                                   viewDocumentService,
                                                   organizations,
                                                   correspondenceSiteTypes,
                                                   //mainCorrespondenceSites,
                                                   correspondenceSiteService,
                                                   searchIncomingService,
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
                                                   $state,
                                                   dialog,
                                                   mailNotificationService,
                                                   favoriteDocumentsService//,
                                                   //centralArchives
    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchIncomingCtrl';
        contextHelpService.setHelpTo('search-incoming');
        self.progress = null;
        self.showAdvancedSearch = false;
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchIncoming = new DocumentSearch({"reqType": 1});
        //self.searchIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
        self.searchIncomingModel = angular.copy(self.searchIncoming);
        self.organizations = organizations;
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
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
        self.getSearchIncomingRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchIncoming = self.getSearchIncomingRequiredFields();

        self.validateLabelsSearchIncoming = {};


        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchIncoming.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchIncoming, obj)) {
                    self.validateLabelsSearchIncoming[fieldName] = langKey;
                }
                return true;
            }
            return false;
        };
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
                        return self.searchIncoming.ou;
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
                        self.searchIncoming.regOu = null;
                    }
                };

                self.changeOuToggle = function () {
                    /!*self.isSearchByRegOU = false;
                     self.searchIncoming.regOu = null;*!/
                };*/

        /**
         * @description Checks the required fields validation
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsSearchIncoming = function (model) {
            var required = self.requiredFieldsSearchIncoming, result = [];
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
            'String': {type: 'ALL', message: langService.get('all_validation')}
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
            self.selectedYear = self.searchIncoming.year;
            self.searchIncoming.docDateFrom = self.searchIncoming.docDateTo = null;
            searchForm.docDateFrom.$setUntouched();
            searchForm.docDateTo.$setUntouched();
            if (self.selectedYear === 'All') {
                self.requiredFieldsSearchIncoming.push('docDateFrom');
                self.requiredFieldsSearchIncoming.push('docDateTo');
            }
            else {
                var dateFromIndex = self.requiredFieldsSearchIncoming.indexOf('docDateFrom');
                if (dateFromIndex > -1)
                    self.requiredFieldsSearchIncoming.splice(dateFromIndex, 1);
                var dateToIndex = self.requiredFieldsSearchIncoming.indexOf('docDateTo');
                if (dateToIndex > -1)
                    self.requiredFieldsSearchIncoming.splice(dateToIndex, 1);

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
                    self.maxDocDate = self.searchIncoming.docDateTo;
                    self.minDocDate = self.searchIncoming.docDateFrom;
                    self.minDateForFrom = null;
                    self.maxDateForTo = null;
                }
                else {
                    self.maxDocDate = self.searchIncoming.docDateTo ? self.searchIncoming.docDateTo : new Date(self.docDateToCopy);
                    self.minDocDate = self.searchIncoming.docDateFrom ? self.searchIncoming.docDateFrom : new Date(self.docDateFromCopy);
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
            self.searchIncoming.mainSiteId = self.searchIncoming.subSiteId = null;
            /*self.mainCorrespondenceSites = _.filter(self.mainCorrespondenceSites_Copy, function (correspondenceSite) {
             return correspondenceSite.correspondenceTypeId.id === self.searchIncoming.siteType;
             });
             return self.mainCorrespondenceSites;*/
            return correspondenceSiteService.getMainCorrespondenceSitesWithSiteTypeId(self.searchIncoming.siteType).then(function (result) {
                self.mainCorrespondenceSites = result;
                return self.mainCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub correspondence sites by main correspondence site
         * @returns {Array|*}
         */
        self.getSubCorrespondenceSites = function ($event) {
            self.searchIncoming.subSiteId = null;
            /*self.subCorrespondenceSites = correspondenceSiteService.getSubCorrespondenceSites(self.searchIncoming.mainSiteId);
             return self.subCorrespondenceSites;*/
            return correspondenceSiteService.getSubCorrespondenceSitesWithSiteTypeId(self.searchIncoming.mainSiteId.id).then(function (result) {
                self.subCorrespondenceSites = result;
                return self.subCorrespondenceSites;
            });
        };

        /**
         * @description Get the sub classifications by main classification
         * @returns {Array|*}
         */
        self.getSubClassifications = function (searchIncomingForm, $event) {
            self.searchIncoming.subClassification = null;
            searchIncomingForm.subClassification.$setUntouched();
            self.subClassifications = classificationService.getSubClassifications(self.searchIncoming.mainClassification);
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
        self.searchedIncomingDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedIncomingDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function ($event) {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchIncoming.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_INCOMING')
                .addStep('check_required', true, self.checkRequiredFieldsSearchIncoming, self.searchIncoming, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchIncoming[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchIncomingService
                        .searchIncomingDocuments(self.searchIncoming, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchIncomingModel = angular.copy(self.searchIncoming);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedIncomingDocuments = result;
                            self.selectedSearchedIncomingDocuments = [];
                        })
                        .catch(function (error) {

                        });
                })
                .catch(function (e) {

                });
        };

        /**
         * @description Resets the document search criteria
         * @param form
         * @param $event
         */
        self.resetFilters = function (form, $event) {
            self.searchIncoming = new DocumentSearch({"reqType": 1});
            //self.searchIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
            self.searchIncomingModel = angular.copy(self.searchIncoming);
            self.mainCorrespondenceSites = self.subCorrespondenceSites = self.subClassifications = [];
            self.maxDocDate = self.maxDateForTo = self.minDocDate = self.minDateForFrom = null;
            form.$setUntouched();
        };

        /**
         * @description Saves the search criteria
         * @param form
         * @param $event
         */
        self.saveSearch = function (form, $event) {

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
                        return (self.searchedIncomingDocuments.length + 21);
                    }
                }
            ],
            filter: {search: {}}
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function(property, modelType){
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Reload the grid of searched incoming documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedIncomingDocument = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchIncomingService
                .searchIncomingDocuments(self.searchIncomingModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedIncomingDocuments = result;
                    self.selectedSearchedIncomingDocuments = [];
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
                .favoriteDocumentAddBulk(self.selectedSearchedIncomingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedIncomingDocument(self.grid.page);
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedIncomingDocument
         * @param $event
         */
        self.addToFavorite = function (searchedIncomingDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedIncomingDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedIncomingDocument.getTranslatedName()
                        }));
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /*
         /!**
         * @description Export searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchIncomingDocument = function (searchedIncomingDocument, $event) {
         //console.log('export searched incoming document : ', searchedIncomingDocument);
         searchIncomingService
         .exportSearchIncoming(searchedIncomingDocument, $event)
         .then(function (result) {
         self.reloadSearchedIncomingDocument(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/


        /**
         * @description Launch distribution workflow for incoming item
         * @param searchedIncomingDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            searchedIncomingDocument.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedIncomingDocument(self.grid.page)
                        .then(function(){
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
                        });
                })
            // return dialog.confirmMessage(langService.get('confirm_launch_new_distribution_workflow'))
            //     .then(function () {
            //         /*distributionWorkflowService
            //          .controllerMethod
            //          .distributionWorkflowSend(searchedIncomingDocument, false, false, null, "incoming", $event)
            //          .then(function (result) {
            //          self.reloadSearchedIncomingDocument(self.grid.page);
            //          //self.replaceRecord(result);
            //          })
            //          .catch(function (result) {
            //          self.reloadSearchedIncomingDocument(self.grid.page);
            //          //self.replaceRecord(result);
            //          });*/
            //         searchedIncomingDocument.launchWorkFlow($event, 'forward', 'favorites')
            //             .then(function () {
            //                 self.reloadSearchedIncomingDocument(self.grid.page);
            //             });
            //     });
        };

        /**
         * @description Print Barcode
         * @param searchedIncomingDocument
         * @param $event
         */
        self.printBarcode = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.barcodePrint($event);
        };

        /**
         * @description View Tracking Sheet
         * @param searchedIncomingDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedIncomingDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedIncomingDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTags = function (searchedIncomingDocument, $event) {
            //console.log('manage tag for searched incoming document : ', searchedIncomingDocument);
            managerService.manageDocumentTags(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
                .then(function (tags) {
                    searchedIncomingDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedIncomingDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageComments = function (searchedIncomingDocument, $event) {
            //console.log('manage comments for searched incoming document : ', searchedIncomingDocument);
            managerService.manageDocumentComments(searchedIncomingDocument.vsId, searchedIncomingDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTasks = function (searchedIncomingDocument, $event) {
            console.log('manage tasks for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description manage attachments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageAttachments = function (searchedIncomingDocument, $event) {
            //console.log('manage attachments for searched incoming document : ', searchedIncomingDocument);
            var info = searchedIncomingDocument.getInfo();
            managerService.manageDocumentAttachments(info.vsId, info.documentClass, info.title, $event)
                .then(function (attachments) {
                    searchedIncomingDocument = attachments;
                })
                .catch(function (attachments) {
                    searchedIncomingDocument = attachments;
                });
        };

        /**
         * @description manage linked documents for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedIncomingDocument, $event) {
            //console.log('manage linked documents for searched incoming document : ', searchedIncomingDocument);
            var info = searchedIncomingDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description manage linked entities for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedIncomingDocument, $event) {
            //console.log('manage linked entities for searched incoming document : ', searchedIncomingDocument);
            managerService
                .manageDocumentEntities(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageDestinations = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentCorrespondence(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
        };

        /**
         * @description download main document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedIncomingDocument, $event) {
            //console.log('download main document for searched incoming document : ', searchedIncomingDocument);
            downloadService.controllerMethod
                .mainDocumentDownload(searchedIncomingDocument.vsId);
        };

        /**
         * @description download composite document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedIncomingDocument, $event) {
            //console.log('download composite document for searched incoming document : ', searchedIncomingDocument);
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedIncomingDocument.vsId);
        };

        /**
         * @description send link to document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedIncomingDocument, $event) {
            console.log('send link to document for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description send composite document as attachment for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedIncomingDocument, $event) {
            console.log('send composite document as attachment for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description send composite document as attachment for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedIncomingDocument, $event) {
            console.log('send composite document as attachment for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description send main document fax for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedIncomingDocument, $event) {
            console.log('send main document fax for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description send sms for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendSMS = function (searchedIncomingDocument, $event) {
            console.log('send sms for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description get link for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.getLink = function (searchedIncomingDocument, $event) {
            console.log('get link for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description subscribe for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.subscribe = function (searchedIncomingDocument, $event) {
            console.log('subscribe for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description create copy for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.createCopy = function (searchedIncomingDocument, $event) {
            console.log('create copy for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description Create Reply
         * @param workItem
         * @param $event
         */
        self.createReply = function (workItem, $event) {
            var info = workItem.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {vsId: info.vsId, action: 'reply'});
        };


        /**
         * @description View document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.viewDocument = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedIncomingDocument, self.gridActions, true, false);
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
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedIncomingDocument(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);;
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
                        gridName: 'search-incoming'
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
             callback: self.exportSearchIncomingDocument,
             class: "action-yellow",
             checkShow: self.checkToShowAction
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
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReply,
                class: "action-green",
                //hide: true, //TODO: Need service from Issawi
                checkShow: function (action, model) {
                    //var info = model.getInfo();
                    return self.checkToShowAction(action, model); //&& info.wobNumber;
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
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                callback: self.broadcast,
                checkShow: self.checkToShowAction
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
                        class: "action-yellow",
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