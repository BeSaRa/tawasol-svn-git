module.exports = function (app) {
    app.controller('simpleIncomingCtrl', function (Incoming,
                                                   // classifications,
                                                   $state,
                                                   $q,
                                                   incomingService,
                                                   queueStatusService,
                                                   organizationService,
                                                   // documentTypes,
                                                   officeWebAppService,
                                                   counterService,
                                                   generator,
                                                   $stateParams,
                                                   // documentFiles,
                                                   managerService,
                                                   documentTypeService,
                                                   validationService,
                                                   langService,
                                                   toast,
                                                   employeeService,
                                                   $timeout,
                                                   // templates,
                                                   lookupService,
                                                   centralArchives,
                                                   contextHelpService,
                                                   organizations,
                                                   cmsTemplate,
                                                   lookups,
                                                   dialog,
                                                   receive, // available when the normal receive.
                                                   receiveG2G, // available when g2g receive
                                                   mailNotificationService,
                                                   gridService,
                                                   errorCode,
                                                   downloadService,
                                                   _) {
        'ngInject';
        var self = this;
        self.controllerName = 'simpleIncomingCtrl';
        contextHelpService.setHelpTo('simple-add-incoming');
        self.employeeService = employeeService;
        // current employee
        self.employee = employeeService.getEmployee();
        // validation for accordion
        self.validation = false;
        // collapse from label
        self.collapse = true;
        // current mode
        self.editMode = !!(receive || receiveG2G);
        // self.editMode = false;
        // copy of the current incoming if saved.
        // self.model = angular.copy(demoOutgoing);
        self.model = null;

        self.emptySubSites = false;

        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = angular.copy(organizations);
        // in case of central archive.
        self.registryOrganizations = centralArchives;

        self.templates = lookups.templates;

        self.documentInformation = null;
        self.isNewDocument = false;

        //is in simple add mode
        self.simpleAdd = true;

        // incoming document
        self.incoming = /*demoOutgoing;*/
            new Incoming({
                ou: centralArchives ? null : self.employee.getOUID(),
                addMethod: 1,//Paper document
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date()),
                registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0]
            });

        if (receive) {
            self.receive = true;
            self.receiveG2G = false;
            self.incoming = receive.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receive.content;
        }
        if (receiveG2G) {
            self.receiveG2G = true;
            self.receive = false;
            self.incoming = receiveG2G.metaData;
            self.model = angular.copy(self.incoming);
            self.documentInformation = receiveG2G.content;
        }

        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        /**
         * @description Finds the property configuration by symbolic name
         * @param symbolicName
         * @returns {*|null}
         * @private
         */
        var _findPropertyConfiguration = function (symbolicName) {
            if (!symbolicName) {
                return null;
            }
            return _.find(properties, function (item) {
                return item.symbolicName.toLowerCase() === symbolicName.toLowerCase();
            }) || null;
        };

        var properties = angular.copy(lookupService.getPropertyConfigurations('outgoing'));
        var followupStatusConfiguration = _findPropertyConfiguration('FollowupStatus');
        var isNeedReplyFromConfiguration = followupStatusConfiguration ? followupStatusConfiguration.isMandatory : false;


        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };


        self.saveCorrespondence = function (status, skipCheck, isSaveAndPrintBarcode) {
            if (status && !self.documentInformation) {
                toast.error(langService.get('cannot_save_as_draft_without_content'));
                return;
            }
            var promise = null;
            //var isDocHasVsId = angular.copy(self.incoming).hasVsId();
            if (self.receive) {
                promise = self.incoming.receiveDocument($stateParams.wobNum);
            } else if (self.receiveG2G) {
                promise = self.incoming.receiveG2GDocument($stateParams.vsId);
            } else {
                promise = self.incoming
                    .saveDocument(status, !!skipCheck);
            }

            return promise.then(function (result) {
                self.incoming.vsId = result.vsId;
                self.model = angular.copy(self.incoming);
                self.documentInformationExist = !!angular.copy(self.documentInformation);

                //var newId = self.model.vsId;

                /*If content file was attached */
                if (self.incoming.contentFile) {
                    return self.incoming.addDocumentContentFile()
                        .then(function () {
                            self.contentFileExist = !!(self.incoming.hasOwnProperty('contentFile') && self.incoming.contentFile);
                            self.contentFileSizeExist = !!(self.contentFileExist && self.incoming.contentFile.size);

                            saveCorrespondenceFinished(status, isSaveAndPrintBarcode);
                            return true;
                        })
                } else {
                    self.contentFileExist = false;
                    self.contentFileSizeExist = false;

                    saveCorrespondenceFinished(status, isSaveAndPrintBarcode);
                    return true;
                }

            }).catch(function (error) {
                if (isSaveAndPrintBarcode) {
                    return $q.reject(error);
                }
                if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                    dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                        .then(function () {
                            return self.saveCorrespondence(status, true, isSaveAndPrintBarcode);
                        }).catch(function () {
                        return $q.reject(error);
                    });
                } else {
                    if (error)
                        toast.error(error);

                    return $q.reject(error);
                }
            });
        };

        self.saveCorrespondenceAndPrintBarcode = function ($event) {
            self.saveCorrespondence(null, false, true)
                .then(function () {
                    self.docActionPrintBarcode(self.incoming, $event);
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                        dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                            .then(function () {
                                self.saveCorrespondence(null, true, true)
                                    .then(function () {
                                        self.docActionPrintBarcode(self.incoming, $event);
                                    })
                            }).catch(function () {
                            return $q.reject(error);
                        });
                    }
                })
        };

        self.requestCompleted = false;
        var saveCorrespondenceFinished = function (status, isSaveAndPrintBarcode) {
            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
            counterService.loadCounters();
            if (status) {
                toast.success(langService.get('save_success'));
            } else {
                var successKey = 'incoming_metadata_saved_success';
                if (self.documentInformation) {
                    self.incoming.contentSize = 1;
                    successKey = 'save_success';
                } else if (self.incoming.contentFile && self.incoming.contentFile.size) {
                    self.incoming.contentSize = self.incoming.contentFile.size;
                    successKey = 'save_success';
                }

                self.requestCompleted = true;
                toast.success(langService.get(successKey));

                if (!isSaveAndPrintBarcode && employeeService.hasPermissionTo('LAUNCH_DISTRIBUTION_WORKFLOW')) {
                    if (centralArchives && self.incoming.hasContent()) {
                        self.docActionLaunchDistributionWorkflow(self.incoming, false);
                    } else if (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist)) {
                        dialog.confirmMessage(langService.get('confirm_launch_distribution_workflow'))
                            .then(function () {
                                self.docActionLaunchDistributionWorkflow(self.incoming);
                            });
                    }
                }
            }
        };

        /**
         * demo manage document tags
         * @param $event
         */
        self.openManageDocumentTags = function ($event) {
            managerService
                .manageDocumentTags(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (tags) {
                    self.incoming.tags = tags;
                })
                .catch(function (tags) {
                    self.incoming.tags = tags;
                });
        };
        /**
         * demo for manage document attachments.
         * @param $event
         */
        self.openManageDocumentAttachments = function ($event) {
            managerService
                .manageDocumentAttachments(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (attachments) {
                    self.incoming.attachments = attachments;
                })
                .catch(function (attachments) {
                    self.incoming.attachments = attachments;
                });
        };
        /**
         * demo for manage document comments .
         * @param $event
         */
        self.openManageDocumentComments = function ($event) {
            managerService
                .manageDocumentComments(self.incoming.vsId, self.incoming.docSubject, $event)
                .then(function (documentComments) {
                    self.incoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.incoming.documentComments = documentComments;
                });
        };

        self.openManageDocumentProperties = function ($event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(self.incoming.vsId, self.incoming.docClassName, self.incoming.docSubject, $event)
                .then(function (document) {
                    self.incoming = generator.preserveProperties(properties, self.incoming, document);
                })
                .catch(function (document) {
                    self.incoming = generator.preserveProperties(properties, self.incoming, document);
                });
        };


        self.docActionPrintBarcode = function (document, $event) {
            document.barcodePrint(document);
        };

        self.docActionLaunchDistributionWorkflow = function (document, $event) {
            if (!self.incoming.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            var defaultTab = 'favorites';
            if (centralArchives && self.incoming.hasContent()) {
                defaultTab = {
                    tab: 'registry_organizations',
                    registryOU: self.incoming.registryOU,
                    ou: self.incoming.ou || self.incoming.registryOU
                };
            }
            document.launchWorkFlow($event, 'forward', defaultTab)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    self.resetAddCorrespondence();
                });
        };

        /**
         * @description Send Link To Document By Email
         * @param model
         * @param $event
         * @param defer
         */
        self.docActionSendLinkToDocumentByEmail = function(model, $event, defer){
            downloadService.getMainDocumentEmailContent(model.getInfo().vsId);
        };

        self.docActionManageTasks = function (document, $event) {
            console.log('manage tasks', document);
        };

        self.docActionConfigureSecurity = function (document, $event) {
            console.log('configure document security', document);
        };

        /**
         * @description Archive the document to icn
         * @param document
         * @param $event
         */
        self.addToIcnArchive = function (document, $event) {
            document.addToIcnArchiveDialog($event)
                .then(function () {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    //self.resetAddCorrespondence();
                });
        };

        self.documentAction = null;
        self.performDocumentAction = function ($event) {
            self.documentAction.callback(self.incoming, $event);
        };

        var _hasContent = function () {
            return (!!self.documentInformationExist || !!(self.contentFileExist && self.contentFileSizeExist));
        };

        self.visibilityArray = [];
        self.isActionsAvailable = false;

        var isVisible = false;
        self.documentActions = [
            //Print Barcode
            {
                text: langService.get('content_action_print_barcode'),
                callback: self.docActionPrintBarcode,
                class: "action-green",
                permissionKey: "PRINT_BARCODE",
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action); //Incoming is always a paper, so no need to check paper/electronic
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }

            },
            // Launch Distribution Workflow
            {
                text: langService.get('content_action_launch_distribution_workflow'),
                callback: self.docActionLaunchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model, index) {
                    //Show if content is uploaded
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Link To Document By Email
            {
                text: langService.get('grid_action_link_to_document_by_email'),
                callback: self.docActionSendLinkToDocumentByEmail,
                class: "action-green",
                permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                checkShow: function (action, model, index) {
                    // paper, not private security level, has content
                    var info = model.getInfo();
                    isVisible = gridService.checkToShowAction(action) && !model.isPrivateSecurityLevel() && info.isPaper && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Manage Tasks
            {
                text: langService.get('content_action_manage_tasks'),
                callback: self.docActionManageTasks,
                class: "action-red",
                hide: true,
                permissionKey: 'MANAGE_TASKS',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            //Configure Security
            {
                text: langService.get('content_action_configure_security'),
                callback: self.docActionConfigureSecurity,
                class: "action-red",
                hide: true,
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action);
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            },
            // Add To ICN Archive
            {
                text: langService.get('grid_action_icn_archive'),
                callback: self.addToIcnArchive,
                class: "action-green",
                permissionKey: 'ICN_ENTRY_TEMPLATE',
                checkShow: function (action, model, index) {
                    isVisible = gridService.checkToShowAction(action) && _hasContent();
                    self.setDropdownAvailability(index, isVisible);
                    return isVisible;
                }
            }
        ];

        /**
         * @description Sets the availability for the dropdown of actions. If any action is available, dropdown is available.
         * @param actionIndex
         * @param isActionVisible
         */
        self.setDropdownAvailability = function (actionIndex, isActionVisible) {
            if (actionIndex === 0)
                self.visibilityArray = [];
            self.visibilityArray.push(isActionVisible);
            if (actionIndex + 1 === self.documentActions.length) {
                self.isActionsAvailable = !self.visibilityArray.length ? false : self.visibilityArray.indexOf(true) > -1;
            }
        };


        /**
         * @description confirm message when reset the Add Incoming form
         * @param $event
         */
        self.confirmResetAddCorrespondence = function ($event) {
            dialog.confirmMessage(langService.get('confirm_reset_add'))
                .then(function () {
                    self.resetAddCorrespondence($event);
                });
        };

        /**
         * @description Reset the Add Incoming form
         * @param $event
         */
        self.resetAddCorrespondence = function ($event) {
            self.incoming = new Incoming({
                ou: centralArchives ? null : self.employee.getOUID(),
                addMethod: 1,
                createdOn: new Date(),
                docDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                refDocDate: generator.convertDateToString(new Date(), self.defaultDateFormat),
                registryOU: centralArchives ? null : self.employee.getRegistryOUID(),
                securityLevel: lookups.securityLevels[0],
                site: null
            });
            self.emptySubSites = true;
            self.documentInformation = null;
            self.documentAction = null;
            self.documentInformationExist = false;
            self.contentFileExist = false;
            self.contentFileSizeExist = false;
            self.document_properties.$setUntouched();

            self.simpleViewUrl = null;
            self.isNewDocument = true;
        };

        /**
         * @description Redirects the user to landing-page
         * @param $event
         */
        self.cancelAddCorrespondence = function ($event) {
            $timeout(function () {
                if (employeeService.hasPermissionTo('LANDING_PAGE'))
                    $state.go('app.landing-page');
                else
                    $state.go('app.inbox.user-inbox');
            })
        };

        /**
         * @description Manage the attachments
         * @param $event
         */
        self.manageAttachments = function ($event) {
            self.incoming.manageDocumentAttachments($event, true)
                .then(function (result) {
                    self.incoming.attachments = result;
                })
                .catch(function (result) {
                    self.incoming.attachments = result;
                });
        };

        /**
         * @description Manage the linked documents
         * @param $event
         */
        self.manageLinkedDocuments = function ($event) {
            self.incoming.manageDocumentLinkedDocuments($event, true)
                .then(function (result) {
                    self.incoming.linkedDocs = result;
                })
                .catch(function (result) {
                    self.incoming.linkedDocs = result;
                });
        };

        /**
         * @description Manage linked entities
         * @param $event
         */
        self.manageLinkedEntities = function ($event) {
            self.incoming
                .manageDocumentEntities($event, true)
                .then(function (result) {
                    self.incoming.linkedEntities = result;
                }).catch(function (result) {
                self.incoming.linkedEntities = result;
            })
        };

        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };

        var _isValidSubSite = function () {
            if (!isNeedReplyFromConfiguration) {
                return true;
            }
            var isValid = true;
            if (self.needReply(self.incoming.site.followupStatus)) {
                isValid = !!self.incoming.site.followupDate;
            }

            return isValid;
        };

        /**
         * @description Checks if form is invalid
         * @param form
         * @returns {boolean|boolean}
         */
        self.isInValidForm = function (form) {
            if (!form) {
                return true;
            }

            return form.$invalid
                || !self.incoming.site || !_isValidSubSite()
                || ((self.documentInformationExist || (self.contentFileExist && self.contentFileSizeExist))
                    && !(self.documentInformation || self.incoming.contentFile))
        };

    });
};
