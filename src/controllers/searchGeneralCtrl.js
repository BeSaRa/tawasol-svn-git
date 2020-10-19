module.exports = function (app) {
    app.controller('searchGeneralCtrl', function (lookupService,
                                                  langService,
                                                  ResolveDefer,
                                                  viewDocumentService,
                                                  searchGeneralService,
                                                  $q,
                                                  _,
                                                  $filter,
                                                  GeneralSearch,
                                                  propertyConfigurations,
                                                  $state,
                                                  validationService,
                                                  generator,
                                                  rootEntity,
                                                  managerService,
                                                  organizationService,
                                                  contextHelpService,
                                                  toast,
                                                  viewTrackingSheetService,
                                                  downloadService,
                                                  DocumentStatus,
                                                  employeeService,
                                                  counterService,
                                                  Organization,
                                                  correspondenceService,
                                                  dialog,
                                                  mailNotificationService,
                                                  gridService,
                                                  favoriteDocumentsService,
                                                  //centralArchives,
                                                  registryOrganizations,
                                                  userSubscriptionService,
                                                  printService,
                                                  $timeout) {
        'ngInject';

        var self = this;
        self.controllerName = 'searchGeneralCtrl';
        contextHelpService.setHelpTo('search-general');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchGeneral = new GeneralSearch({dummySearchDocClass: 'correspondence'});
        self.searchGeneralModel = angular.copy(self.searchGeneral);
        self.emptyResults = false;

        self.propertyConfigurations = propertyConfigurations;

        if (!self.employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
            self.searchGeneral.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.searchGeneral.ou = self.employeeService.getEmployee().getOUID();
            self.loadSubOrganizations = true;
        } else {
            self.searchGeneral.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.loadSubOrganizations = true;
        }

        /**
         * @description Get the dynamic required fields
         */
        self.getSearchGeneralRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchGeneral = self.getSearchGeneralRequiredFields();

        self.validateLabelsSearchGeneral = {};

        //self.registryOrganizations = employeeService.isCentralArchive() ? angular.copy(centralArchives) : angular.copy(organizationService.getAllRegistryOrganizations());
        self.registryOrganizations = registryOrganizations;


        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                var docClass = item.getInfo().documentClass.toLowerCase();
                switch (docClass) {
                    case 'outgoing':
                        _outgoingCorrespondence(item);
                        break;
                    case 'incoming':
                        _incomingCorrespondence(item);
                        break;
                }
                return item;
            });
        }

        function _incomingCorrespondence(correspondence) {
            correspondence.mainSiteId = true;
            return correspondence;
        }

        function _outgoingCorrespondence(correspondence) {
            correspondence.sitesInfoTo = [true];
            return correspondence;
        }

        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchGeneral.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchGeneral, obj)) {
                    self.validateLabelsSearchGeneral[fieldName] = langKey;
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
        self.checkRequiredFieldsSearchGeneral = function (model) {
            var required = self.requiredFieldsSearchGeneral, result = [];
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

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTabName = "search";
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
        self.searchedGeneralDocuments = [];

        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedGeneralDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchGeneral.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchGeneral.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_GENERAL')
                .addStep('check_required', true, self.checkRequiredFieldsSearchGeneral, self.searchGeneral, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchGeneral[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchGeneralService
                        .searchGeneralDocuments(self.searchGeneral, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchGeneralModel = angular.copy(self.searchGeneral);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedGeneralDocuments = result;
                            self.selectedSearchedGeneralDocuments = [];
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
            self.searchGeneral = new GeneralSearch({dummySearchDocClass: 'correspondence'});
            self.emptyResults = true;
            form.$setUntouched();
            $timeout(function () {
                self.searchGeneralModel = angular.copy(self.searchGeneral);
            })
        };

        /**
         * @description Saves the search criteria
         */
        self.saveSearch = function () {
           // console.log('save search');
        };

        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " + langService.get("from") + " " + generator.convertDateToString(self.searchGeneral.docDateFrom) +
                " " + langService.get("to") + " " + generator.convertDateToString(self.searchGeneral.docDateTo);

            var headers = ['label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on'];

            printService
                .printData(self.searchedGeneralDocuments, headers, printTitle);

        };


        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.general) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.general, self.searchedGeneralDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.general, limit);
            },
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.search.general),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.search.general, self.grid.truncateSubject);
            }
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.searchedGeneralDocuments = $filter('orderBy')(self.searchedGeneralDocuments, self.grid.order);
        };


        /**
         * @description Reload the grid of searched general documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedGeneralDocuments = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return searchGeneralService
                .searchGeneralDocuments(self.searchGeneralModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedGeneralDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    // self.searchedGeneralDocuments = result;
                    self.selectedSearchedGeneralDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description add selected items to the favorite documents
         * @param $event
         */
        self.addToFavoriteBulk = function ($event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAddBulk(self.selectedSearchedGeneralDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param searchedGeneralDocument
         * @param $event
         */
        self.addToFavorite = function (searchedGeneralDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedGeneralDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedGeneralDocument.getTranslatedName()
                        }));
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Archive the document to icn
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (correspondence, $event, defer) {
            correspondence.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /* /!**
         * @description Export searched general document
         * @param searchedGeneralDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchGeneralDocument = function (searchedGeneralDocument, $event) {
         //console.log('export searched general document : ', searchedGeneralDocument);
         searchGeneralService
         .exportSearchGeneral(searchedGeneralDocument, $event)
         .then(function (result) {
         self.reloadSearchedGeneralDocuments(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/

        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReplyIncoming = function (correspondence, $event, defer) {
            correspondence.createReply($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Launch distribution workflow for internal item
         * @param correspondence
         * @param $event
         */

        self.launchDistributionWorkflow = function (correspondence, $event) {
            var promise = null;
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            // run launch for any incoming document or other documents not in the inbox
            if (correspondence.hasDocumentClass('incoming') || correspondence.docStatus !== 22) {
                promise = correspondence.launchWorkFlow($event, null, 'favorites');
            } else {
                if (correspondence.hasDocumentClass('internal')) {
                    promise = correspondence.launchWorkFlowAndCheckApprovedInternal($event, null, 'favorites');
                } else {
                    promise = correspondence.launchWorkFlowAndCheckExists($event, null, 'favorites');
                }
            }

            promise.then(function () {
                self.reloadSearchedGeneralDocuments(self.grid.page)
                    .then(function () {
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    });
            });
        };

        /**
         * @description Subscribe to actions on the workItem
         * @param correspondence
         * @param $event
         */
        self.subscribe = function (correspondence, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(correspondence, $event);
        };

        /**
         * @description Print Barcode
         * @param searchedGeneralDocument
         * @param $event
         */
        self.printBarcode = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.barcodePrint($event);
        };

        self.addDocumentTask = function (correspondence, $event) {
            correspondence.createDocumentTask($event)
        };

        /**
         * @description View Tracking Sheet
         * @param searchedGeneralDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedGeneralDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedGeneralDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageTags = function (searchedGeneralDocument, $event) {
            var info = searchedGeneralDocument.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, info.title, $event)
                .then(function (tags) {
                    searchedGeneralDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedGeneralDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageComments = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.manageDocumentComments($event)
                .then(function (documentComments) {
                    searchedGeneralDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedGeneralDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageTasks = function (searchedGeneralDocument, $event) {
          //  console.log('manage tasks for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description manage attachments for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageAttachments = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description manage linked documents for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedGeneralDocument, $event) {
            var info = searchedGeneralDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                }).catch(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param correspondence
         * @param $event
         */
        self.manageDestinations = function (correspondence, $event) {
            correspondence.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowedByDocClass = (info.documentClass === 'outgoing') ? (info.docStatus < 25) : (info.documentClass === 'incoming');
            var allowed = (hasPermission && info.documentClass !== "internal") && allowedByDocClass;
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description download main document for searched general document
         * @param correspondence
         * @param $event
         */
        self.downloadMainDocument = function (correspondence, $event) {
            correspondence
                .mainDocumentDownload($event);
        };

        /**
         * @description download composite document for searched general document
         * @param correspondence
         * @param $event
         */
        self.downloadCompositeDocument = function (correspondence, $event) {
            correspondence
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.downloadSelected = function(searchedGeneralDocument,$event){
            downloadService.openSelectedDownloadDialog(searchedGeneralDocument, $event);
        };

        /**
         * @description merge and download
         * @param searchedGeneralDocument
         */
        self.mergeAndDownloadFullDocument = function (searchedGeneralDocument) {
            downloadService.mergeAndDownload(searchedGeneralDocument);
        };

        /**
         * @description send link to document for searched general document
         * @param correspondence
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (correspondence, $event) {
            correspondence
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description send composite document as attachment for searched general document
         * @param correspondence
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (correspondence, $event) {
            correspondence
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description send main document fax for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched general document
         * @param searchedGeneralDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedGeneralDocument, $event, defer) {
            searchedGeneralDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.getLink = function (searchedGeneralDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedGeneralDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.createCopy = function (searchedGeneralDocument, $event) {
          //  console.log('create copy for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description End followup of correspondence site
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.endFollowup = function (correspondence, $event, defer) {
            correspondence.endFollowup($event)
                .then(function (result) {
                    if (result !== 'FAILED_TERMINATE_FOLLOWUP') {
                        self.reloadSearchedGeneralDocuments(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    }
                });
        };

        /**
         * @description Preview document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.previewDocument = function (searchedGeneralDocument, $event) {
            if (!searchedGeneralDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedGeneralDocument, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(searchedGeneralDocument, true))
                .then(function () {
                    // return self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function () {
                    //  return self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondence.viewFromQueue(self.gridActions, 'searchGeneral', $event)
                .then(function () {
                    //  return self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function (error) {
                    // return self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (correspondence, $event) {
            return correspondence
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param correspondence
         * @param $event
         */
        self.duplicateCurrentVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };

        self.gridActions = [
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'search-general'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: false,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: false,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // viewInDeskTop
                    {
                        type: 'action',
                        icon: 'monitor',
                        text: 'grid_action_view_in_desktop',
                        shortcut: false,
                        hide: false,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed) {
                                return false;
                            }
                            return info.needToApprove();
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        shortcut: false,
                        callback: self.addToFavorite,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return info.docStatus >= 22;
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
             type: 'action',
             icon: 'export',
             text: 'grid_action_export',
             shortcut: true,
             callback: self.exportSearchGeneralDocument,
             class: "action-green",
             checkShow: function (action, model) {
             //If document is paper outgoing and unapproved/partially approved, show the button.
             var info = model.getInfo();
             return model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
             }
             },*/
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                permissionKey: 'CREATE_REPLY',
                callback: self.createReplyIncoming,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.documentClass === 'incoming';
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
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                callback: self.subscribe,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (!model.needApprove() || model.hasDocumentClass('incoming')) && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
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
                    return (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.general)
            },
            // add task
            {
                type: 'action',
                icon: 'calendar-check-outline',
                text: 'create_task',
                callback: self.addDocumentTask,
                class: "action-green",
                shortcut: true,
                checkShow: gridService.checkToShowAction
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                showInView: false,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
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
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
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
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
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
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text:'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "SHARE_BOOK_LINK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // send document link
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'send_document_link',
                        permissionKey: "SHARE_BOOK_LINK",
                        callback: self.sendDocumentLink,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
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
                checkShow: function (action, model) {
                    return true;
                }
            },
            // End Follow up
            {
                type: 'action',
                icon: gridService.gridIcons.actions.endFollowup,
                text: 'grid_action_end_follow_up',
                callback: self.endFollowup,
                class: "action-green",
                permissionKey: "MANAGE_DESTINATIONS",
                checkShow: function (action, model) {
                    // only for outgoing/incoming
                    var info = model.getInfo();
                    if (info.documentClass === 'outgoing' || info.documentClass === 'incoming'){
                        // no follow up status = 0 (need reply)
                        return !model.getSiteFollowupStatus() && !model.getSiteFollowupEndDate()// && model.getSiteMaxFollowupDate();
                    }
                    return false;
                }
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate current version
                    {
                        type: 'action',
                        icon: 'content-copy',
                        text: 'grid_action_duplication_current_version',
                        shortcut: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
