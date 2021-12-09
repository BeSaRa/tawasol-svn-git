module.exports = function (app) {
    app.controller('pdfViewerPopCtrl', function (dialog,
                                                 $scope,
                                                 $element,
                                                 $cookies,
                                                 moment,
                                                 uuidv4,
                                                 PDFService,
                                                 PDFViewer,
                                                 errorCode,
                                                 loadingIndicatorService,
                                                 configurationService,
                                                 rootEntity,
                                                 langService,
                                                 documentStampService,
                                                 AnnotationType, // constant
                                                 annotationType, // current annotation type
                                                 correspondence,
                                                 applicationUserSignatureService,
                                                 attachmentService,
                                                 Attachment,
                                                 employeeService,
                                                 _,
                                                 $q,
                                                 $timeout,
                                                 PSPDFKit,
                                                 toast,
                                                 pdfData,
                                                 instantJSON,
                                                 attachedBook,
                                                 flatten,
                                                 correspondenceService,
                                                 annotationLogService,
                                                 sequentialWF,
                                                 sequentialWorkflowService,
                                                 WorkItem,
                                                 operations,
                                                 generalStepElementView,
                                                 downloadService,
                                                 lookupService,
                                                 generator,
                                                 tableGeneratorService,
                                                 jobTitle,
                                                 cmsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'pdfViewerPopCtrl';
        // pdf buffer to load inside the viewer
        self.pdfData = pdfData;
        // current viewer instance
        self.currentInstance = null;
        // pdf viewer license key
        self.licenseKey = rootEntity.returnRootEntity().rootEntity.psPDFLicenseKey;
        // to user it later to display
        //self.canRepeatAnnotations = false;
        // current document meta data
        self.correspondence = correspondence;
        // current annotation mode to load the document from right service and set the annotation types for all signature Annotations (ink,Imag)
        self.annotationType = annotationType;
        // loading  service
        self.loadingIndicatorService = loadingIndicatorService;
        // all document annotations after load the document
        self.oldAnnotations = [];
        // all document annotations after click on  save button
        self.newAnnotations = [];
        // used to save last ink annotation from signature dialog to update it later after set the vsId
        self.latestInkAnnotation = null;
        // the skipped pdf Object , will use it later
        self.skippedPdfObjectIds = [];
        // all document operations
        self.documentOperations = [];
        // show/hide attach username and date toggle
        self.enableAttachUsernameAndDate = true;

        self.oldBookmarks = [];

        self.newBookmarks = [];

        self.baseUrl = (location.protocol + '//' + location.host + '/' + (configurationService.APP_CONTEXT ? configurationService.APP_CONTEXT + '/' : ''));

        // document information
        self.info = self.correspondence.getInfo();

        self.sequentialWF = sequentialWF;

        self.nextSeqStep = null;
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);

        self.isLaunchStep = false;

        self.disableSaveButton = false;

        self.unlinkInProgress = false;

        self.savedPdfContent = null;

        self.isStampEnabled = rootEntity.getGlobalSettings().stampModuleEnabled;

        self.excludedRepeatedAnnotations = configurationService.REPLICATION_EXCLUDED_LIST;

        self.needOpenForApproval = false;

        self.notifyPreviousSteps = false;

        self.readyToExportExcludedAnnotationList = configurationService.READY_TO_EXPORT_EXCLUDED_TOOLBAR_ITEMS;

        self.officialAttachmentExcludedList = configurationService.OFFICIAL_ATTACHMENT_EXCLUDED_TOOLBAR_ITEMS;

        self.generalStepElementView = generalStepElementView;
        // used to store value of attache user name and date toggle
        var cookieKey = employeeService.getEmployee().domainName + '_' + 'attach_username_date';
        var cookieAttachedTypeKey = employeeService.getEmployee().domainName + '_' + 'attached_data_type';

        self.attacheUsernameAndDateToSignature = false;

        self.documentClassPermissionMap = {
            outgoing: function (isPaper) {
                return isPaper ? 'EDIT_OUTGOING_PAPER' : 'EDIT_OUTGOING_CONTENT';
            },
            incoming: 'EDIT_INCOMING’S_CONTENT',
            internal: 'EDIT_INTERNAL_CONTENT'
        };

        function _getFlattenStatus(hasMySignature) {
            if (typeof hasMySignature === 'undefined') {
                return !!(self.sequentialWF && self.sequentialWF.getLastStepId() === self.nextSeqStep.id) || (self.info && !self.info.isAttachment && !self.info.isPaper && self.info.signaturesCount === 1 && !self.correspondence.getSeqWFId());
            } else {
                return !!(self.sequentialWF && self.sequentialWF.getLastStepId() === self.nextSeqStep.id) || (self.info && !self.info.isAttachment && !self.info.isPaper && self.info.signaturesCount === 1 && !self.correspondence.getSeqWFId() && hasMySignature);
            }
        }

        function _isLastStep() {
            return self.sequentialWF.getLastStepId() === self.nextSeqStep.id;
        }

        /**
         * @description getNext step of seqWF
         * @private
         */
        function _getNextStepFromSeqWF() {
            if (self.sequentialWF) {
                if (self.correspondence instanceof WorkItem) {
                    self.nextSeqStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                    if (!self.nextSeqStep) {
                        self.nextSeqStep = self.sequentialWF.stepRows[0];
                        console.log('It Is launch SEQ , WorkItem ');
                        self.isLaunchStep = true
                    }
                } else {
                    self.nextSeqStep = self.sequentialWF.stepRows[0];
                    console.log('It Is launch SEQ , Correspondence ');
                    self.isLaunchStep = true
                }
            }
        }

        function _getStepById(stepId) {
            return _.find(self.sequentialWF.stepRows, function (step) {
                return step.id === stepId;
            });
        }

        function _hasAnyApprovePermission() {
            return employeeService.hasPermissionTo('ELECTRONIC_SIGNATURE_MEMO') || employeeService.hasPermissionTo('ELECTRONIC_SIGNATURE');
        }

        function _addButtonToToolbar(toolbarInstance, button) {
            toolbarInstance.push(button);
        }

        function _itemInExcludedList(item) {
            return (self.readyToExportExcludedAnnotationList.indexOf(item) !== -1);
        }

        function _itemInOfficialExcludedList(item) {
            return (self.officialAttachmentExcludedList.indexOf(item) !== -1);
        }

        /**
         * @description create custom buttons and attache it to  viewer toolbar.
         * @return {*}
         */
        function makeToolbarItems() {
            var defaultToolbar = angular.copy(PSPDFKit.defaultToolbarItems);
            var exportButton = {
                type: "custom",
                id: "export-pdf",
                title: "Export",
                icon: "./assets/images/download.svg",
                onPress: function () {
                    self.exportDocument();
                }
            };
            var bookmarkButton = {
                type: "custom",
                id: "bookmark-shortcut",
                title: "Bookmarks",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n" +
                    "    <path fill=\"currentColor\" d=\"M15,5A2,2 0 0,1 17,7V23L10,20L3,23V7C3,5.89 3.9,5 5,5H15M9,1H19A2,2 0 0,1 21,3V19L19,18.13V3H7A2,2 0 0,1 9,1Z\" />\n" +
                    "</svg>",
                onPress: function () {
                    self.currentInstance.setViewState((state) => {
                        self.currentInstance.setToolbarItems(items => {
                            return items.map(item => {
                                if (item.id === "bookmark-shortcut") {
                                    item.selected = !item.selected;
                                    state = state.set('sidebarMode', item.selected ? PSPDFKit.SidebarMode.BOOKMARKS : null);
                                }
                                return item;
                            });
                        });
                        return state;
                    });
                }
            };
            var customStampsButton = {
                type: "custom",
                id: "custom-stamps",
                title: "custom stamps",
                icon: "./assets/images/custom-stamps.svg",
                disabled: !(employeeService.hasPermissionTo('ADD_STAMP')),
                onPress: self.openCustomStampsDialog
            };
            var barcodeButton = {
                type: "custom",
                id: "barcode",
                title: "barcode",
                icon: "./assets/images/barcode.svg",
                onPress: self.openBarcodeDialog
            };
            var printWithoutAnnotationButton = {
                type: "custom",
                id: "print-without-annotations",
                title: "print without annotations",
                icon: "./assets/images/print-without-annotation.svg",
                dropdownGroup: 'print-menu',
                disabled: !(employeeService.hasPermissionTo('PRINT_DOCUMENT')),
                onPress: function (e) {
                    self.printWithOutAnnotations(e, true);
                }
            };
            var approveButton = {
                type: "custom",
                id: "approve",
                title: "Electronic Signatures",
                icon: "./assets/images/approve.svg",
                onPress: self.openSignaturesDialog
            };
            var openForApprovalButton = {
                type: "custom",
                id: "open-for-approval",
                title: "open for approval",
                icon: "./assets/images/open-for-approve.svg",
                onPress: function () {
                    dialog.hide(AnnotationType.SIGNATURE);
                }
            };
            var usernameDateButton = {
                type: "custom",
                id: "username-date",
                title: "user name and date",
                dropdownGroup: 'title-data-username',
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\"  width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n" +
                    "   <path fill=\"currentColor\" d=\"M19,4H18V2H16V4H8V2H6V4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19M12,11C14,11 15,13.42 13.59,14.84C12.17,16.26 9.75,15.25 9.75,13.25C9.75,12 10.75,11 12,11M16.5,18.88V19H7.5V18.88C7.5,17.63 9.5,16.63 12,16.63C14.5,16.63 16.5,17.63 16.5,18.88Z\" />\n" +
                    "</svg>",
                onPress: self.addUserNameAndDateToDocument
            };
            var usernameJobTitleButton = {
                type: "custom",
                id: "username-job-title",
                dropdownGroup: 'title-data-username',
                title: "user name and job title ",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\"  width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n" +
                    "   <path fill=\"currentColor\" d=\"M2,3H22C23.05,3 24,3.95 24,5V19C24,20.05 23.05,21 22,21H2C0.95,21 0,20.05 0,19V5C0,3.95 0.95,3 2,3M14,6V7H22V6H14M14,8V9H21.5L22,9V8H14M14,10V11H21V10H14M8,13.91C6,13.91 2,15 2,17V18H14V17C14,15 10,13.91 8,13.91M8,6A3,3 0 0,0 5,9A3,3 0 0,0 8,12A3,3 0 0,0 11,9A3,3 0 0,0 8,6Z\" />\n" +
                    "</svg>",
                onPress: self.addUserNameAndJobTitleToDocument
            };
            // remove default print from toolbar
            var toolbarInstance = _.filter(defaultToolbar.concat([usernameDateButton, usernameJobTitleButton, printWithoutAnnotationButton, bookmarkButton]), function (item) {
                return item.type !== 'print';
            });

            if (self.isStampEnabled) {
                toolbarInstance.push(customStampsButton);
            } else {
                toolbarInstance = _.filter(toolbarInstance, function (item) {
                    return item.type !== 'stamp';
                });
            }
            // add custom normal print function
            toolbarInstance.splice(26, 0, {
                type: 'custom',
                id: 'print',
                icon: './assets/images/print.svg',
                title: 'Print',
                dropdownGroup: 'print-menu',
                disabled: !(employeeService.hasPermissionTo('PRINT_DOCUMENT')),
                onPress: function (e) {
                    self.printWithOutAnnotations(e, false);
                }
            });
            // disable/enable stamps button
            toolbarInstance = _.map(toolbarInstance, function (item) {
                if (item.type === 'stamp') {
                    item.disabled = !(employeeService.hasPermissionTo('ADD_STAMP'));
                }
                return item;
            });


            if (_checkForDocumentAllowedSignatures('internal', 'ELECTRONIC_SIGNATURE_MEMO')) {
                _addButtonToToolbar(toolbarInstance, approveButton)
            } else if (_checkForDocumentAllowedSignatures('outgoing', 'ELECTRONIC_SIGNATURE')) {
                _addButtonToToolbar(toolbarInstance, approveButton)
            } else if (_checkForDocumentAllowedSignatures('incoming')) {
                _addButtonToToolbar(toolbarInstance, approveButton)
            } else if (self.info.documentClass === 'outgoing' && employeeService.hasPermissionTo('ELECTRONIC_SIGNATURE')) {
                _addButtonToToolbar(toolbarInstance, approveButton)
            } else if (self.info.documentClass === 'internal' && employeeService.hasPermissionTo('ELECTRONIC_SIGNATURE_MEMO')) {
                _addButtonToToolbar(toolbarInstance, approveButton)
            } else if (self.info.documentClass === 'incoming' && employeeService.getEmployee().hasAnyPermissions(['ELECTRONIC_SIGNATURE', 'ELECTRONIC_SIGNATURE_MEMO'])) {
                _addButtonToToolbar(toolbarInstance, approveButton);
            } else {
                approveButton.disabled = true;
                _addButtonToToolbar(toolbarInstance, approveButton);
                toolbarInstance = toolbarInstance.map(function (toolbarItem) {
                    if (toolbarItem.type === 'ink-signature') {
                        toolbarItem.disabled = true;
                    }
                    return toolbarItem;
                });
            }


            // displaying barcode button
            if (self.info.docStatus >= 24 || (!self.info.isAttachment && self.info.docStatus >= 23 && self.correspondence.getAuthorizeByAnnotationStatus()) || self.annotationType === AnnotationType.SIGNATURE || (!self.info.isAttachment && self.info.isPaper)) {
                barcodeButton.disabled = !(employeeService.hasPermissionTo('PRINT_BARCODE'));
                toolbarInstance = toolbarInstance.concat(barcodeButton);
            }
            // displaying open for approval Button
            if (!self.info.isAttachment &&
                (self.info.docStatus < 23 && !self.sequentialWF && !self.correspondence.getSeqWFId() || self.info.docStatus < 23 && self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep()) &&
                self.annotationType !== AnnotationType.SIGNATURE &&
                !self.info.isPaper
            ) {
                var permission = self.info.documentClass === 'outgoing' ? 'ELECTRONIC_SIGNATURE' : 'ELECTRONIC_SIGNATURE_MEMO';
                openForApprovalButton.disabled = !employeeService.hasPermissionTo(permission);
                self.needOpenForApproval = true;
                toolbarInstance.push(openForApprovalButton);
            }

            if (self.info.docStatus === 24 && (self.info.documentClass === 'outgoing' || self.info.documentClass === 'internal') && !self.sequentialWF && !self.correspondence.fromUserInbox) {
                toolbarInstance = toolbarInstance.filter(item => {
                    return item.type === 'custom' ? !_itemInExcludedList(item.id) : !_itemInExcludedList(item.type);
                });
            }

            if (_isElectronicAndAuthorizeByAnnotationBefore() || self.annotationType === AnnotationType.SIGNATURE) {
                toolbarInstance = toolbarInstance.filter(item => item.type !== 'document-editor');
            }

            if (self.info.docStatus === 24) {
                toolbarInstance = toolbarInstance.filter(item => item.type !== 'document-editor');
            }

            toolbarInstance = toolbarInstance.filter(item => item.type !== 'ink-eraser');

            if (self.info.isAttachment && self.correspondence.isOfficial) {
                toolbarInstance = toolbarInstance.filter(item => {
                    return item.type === 'custom' ? !_itemInOfficialExcludedList(item.id) : !_itemInOfficialExcludedList(item.type);
                });
            }

            return toolbarInstance;
        }

        function _checkForDocumentAllowedSignatures(docClass, permission) {
            if (permission) {
                return self.info.isAttachment && attachedBook && attachedBook.getInfo().documentClass === docClass && employeeService.hasPermissionTo(permission)
            } else {
                return self.info.isAttachment && attachedBook && attachedBook.getInfo().documentClass === docClass && _hasAnyApprovePermission();
            }
        }

        /**
         * @description download the document after annotate
         * @param blob
         */
        function downloadPdf(blob) {
            var a = document.createElement("a");
            a.href = blob;
            a.style.display = "none";
            a.download = "download.pdf";
            a.setAttribute("download", "download.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        /**
         * @description check if the given annotation is signature
         * @param annotation
         * @return {boolean}
         * @private
         */
        function _isSignature(annotation) {
            if (annotation instanceof PSPDFKit.Annotations.InkAnnotation && annotation.isSignature) {
                return true;
            } else return !!(annotation instanceof PSPDFKit.Annotations.ImageAnnotation && annotation.customData && annotation.customData.additionalData.type === AnnotationType.SIGNATURE);
        }

        /**
         * @description check if the given annotation is signature and not old signature
         * @param annotation
         * @return {boolean}
         * @private
         */
        function _isCurrentUserSignature(annotation) {
            return annotation.pdfObjectId ? false : _isSignature(annotation);
        }

        function _getRightTypeForElectronicSignature() {
            return (self.annotationType === AnnotationType.SIGNATURE || self.info.isPaper || self.info.isAttachment || (self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep() && !self.needOpenForApproval)) ? AnnotationType.SIGNATURE : (_isElectronicAndAuthorizeByAnnotationBefore() && self.correspondence instanceof WorkItem && !self.correspondence.getSeqWFId() ? AnnotationType.SIGNATURE : AnnotationType.ANNOTATION)
            // return self.needOpenForApproval ? AnnotationType.ANNOTATION : AnnotationType.SIGNATURE;
        }

        function _isElectronicAndAuthorizeByAnnotationBefore() {
            // return (self.info.docStatus === 23 && !self.info.isPaper && (self.correspondence.getAuthorizeByAnnotationStatus() || (self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep())))
            return self.info.docStatus === 23 && !self.info.isPaper && self.correspondence.getAuthorizeByAnnotationStatus();
        }

        /**
         * @description Gets the custom data - additional data value from annotation
         * @param annotation
         * @param property
         * property to get data. If not passed, additionalData will be returned
         * @returns {null|*}
         * @private
         */
        function _getCustomAdditionalData(annotation, property) {
            if (!annotation) {
                return null;
            } else if (!property) {
                return _.get(annotation, 'customData.additionalData');
            }
            return _.get(annotation, 'customData.additionalData.' + property);
        }

        self.onAttachToggleChange = function () {
            var date = (new Date());
            date.setFullYear(date.getFullYear() + 1);
            $cookies.put(cookieKey, self.attacheUsernameAndDateToSignature, {
                expires: date
            });
        };

        function _setButtonCookies(value) {
            var date = (new Date());
            date.setFullYear(date.getFullYear() + 1);
            $cookies.put(cookieAttachedTypeKey, value, {
                expires: date
            });
        }

        /**
         * @description add username and date to the document
         * @return {Promise<void>}
         */
        self.addUserNameAndJobTitleToDocument = function (event, buttonId, annotation) {
            if (event) {
                _setButtonCookies('addUserNameAndJobTitleToDocument');
            }
            var pageInfo = self.currentInstance.pageInfoForIndex(self.currentInstance.viewState.currentPageIndex);
            var usernameAnnotation = new PSPDFKit.Annotations.TextAnnotation({
                text: employeeService.getEmployee().getTranslatedName() + '\r\n' + jobTitle.getTranslatedName(),
                pageIndex: self.currentInstance.viewState.currentPageIndex,
                boundingBox: new PSPDFKit.Geometry.Rect({
                    left: 10,
                    top: 20,
                    width: 100,
                    height: 20
                }),
                fontSize: 15,
                horizontalAlign: 'center',
                isFitting: true,
                customData: {
                    additionalData: {type: _getRightTypeForElectronicSignature()}
                }
            });
            usernameAnnotation = self.currentInstance.calculateFittingTextAnnotationBoundingBox(usernameAnnotation);

            usernameAnnotation = usernameAnnotation.set('boundingBox', new PSPDFKit.Geometry.Rect({
                left: annotation ? (annotation.boundingBox.left + annotation.boundingBox.width) : (pageInfo.width / 2) - usernameAnnotation.boundingBox.width,
                top: (pageInfo.height / 2) - usernameAnnotation.boundingBox.height,
                width: usernameAnnotation.boundingBox.width,
                height: usernameAnnotation.boundingBox.height,
            }));

            self.currentInstance.create(usernameAnnotation).then(annotations => {
                self.selectAnnotation(annotations[0]);
            });
        };

        self.addUserNameAndDateToDocument = function (event, buttonId, annotation) {
            if (event) {
                _setButtonCookies('addUserNameAndDateToDocument');
            }
            var date = moment().format('DD-MM-YYYY');
            var pageInfo = self.currentInstance.pageInfoForIndex(self.currentInstance.viewState.currentPageIndex);
            var usernameAnnotation = new PSPDFKit.Annotations.TextAnnotation({
                text: employeeService.getEmployee().getTranslatedName() + '\r\n' + date.toString(),
                pageIndex: self.currentInstance.viewState.currentPageIndex,
                boundingBox: new PSPDFKit.Geometry.Rect({
                    left: 10,
                    top: 20,
                    width: 100,
                    height: 20
                }),
                fontSize: 15,
                horizontalAlign: 'center',
                isFitting: true,
                customData: {
                    additionalData: {type: _getRightTypeForElectronicSignature()}
                }
            });
            usernameAnnotation = self.currentInstance.calculateFittingTextAnnotationBoundingBox(usernameAnnotation);

            usernameAnnotation = usernameAnnotation.set('boundingBox', new PSPDFKit.Geometry.Rect({
                left: annotation ? (annotation.boundingBox.left + annotation.boundingBox.width) : (pageInfo.width / 2) - usernameAnnotation.boundingBox.width,
                top: (pageInfo.height / 2) - usernameAnnotation.boundingBox.height,
                width: usernameAnnotation.boundingBox.width,
                height: usernameAnnotation.boundingBox.height,
            }));

            self.currentInstance.create(usernameAnnotation).then(annotations => {
                self.selectAnnotation(annotations[0]);
            });
        }

        /**
         * @description select given annotation
         * @param annotation
         */
        self.selectAnnotation = function (annotation) {
            self.currentInstance
                .setSelectedAnnotation(annotation);
        };
        /**
         * @description convert url to image object
         * @param url
         * @returns {*}
         */
        self.convertUrlToImage = function (url) {
            var image = new Image();
            return $q(function (resolve, reject) {
                image.onload = function () {
                    resolve(image);
                };
                image.crossOrigin = '';
                image.src = url;
            });
        };
        /**
         * @description convert image to blob object
         * @param image
         * @returns {*}
         */
        self.convertImageToBlob = function (image) {
            var c = document.createElement('canvas');
            var ctx = c.getContext('2d');
            return $q(function (resolve, reject) {
                c.width = image.naturalWidth;     // update canvas size to match image
                c.height = image.naturalHeight;
                ctx.drawImage(image, 0, 0);
                c.toBlob(function (blob) {
                    resolve({blob: blob, size: {width: c.width, height: c.height}});
                });
            });
        };
        /**
         * @description create annotation from blob object
         * @param blob
         * @param repeated
         * @param size {width,height}
         * @param additionalData a some data to add it to annotation in customData
         * @returns {*}
         */
        self.createAnnotationFromBlob = function (blob, repeated, size, additionalData) {
            var pageIndex = self.currentInstance.viewState.currentPageIndex;
            var pageInfo = self.currentInstance.pageInfoForIndex(pageIndex);
            var attachments = [];
            var totalPages = self.currentInstance.totalPageCount;
            attachments.push(self.currentInstance.createAttachment(blob));
            var isBarcode = !!(additionalData && additionalData.type === AnnotationType.BARCODE);
            return $q(function (resolve, reject) {
                var imageAnnotations = [];
                $q.all(attachments).then(function (attachmentIds) {
                    _.map(attachmentIds, function (attachmentId, index) {
                        imageAnnotations.push(new PSPDFKit.Annotations.ImageAnnotation({
                            imageAttachmentId: attachmentId,
                            pageIndex: pageIndex,
                            contentType: 'image/png',
                            customData: {
                                additionalData: additionalData,
                                id: uuidv4()
                            },
                            boundingBox: new PSPDFKit.Geometry.Rect({
                                left: (pageInfo.width / 2) - (size ? (size.width / 2) : 50),
                                top: isBarcode ? 50 : (pageInfo.height / 2) - (size ? (size.height / 2) : 50),
                                width: size ? size.width : 100,
                                height: size ? size.height : 100,
                            })
                        }));
                    });
                    resolve(imageAnnotations);
                });
            });
        };
        /**
         * @description add annotation to current PDF document
         * @param annotation
         * @returns {Promise<Annotation>}
         */
        self.addAnnotationsToPDFDocument = function (annotation) {
            return self.currentInstance.create(annotation);
        };
        /**
         * @description add Stamp annotation to PDF document
         * @param imageUrl
         * @param repeated
         */
        self.addStampAnnotationToPDF = function (imageUrl, repeated) {
            return $timeout(function () {
                return self.convertUrlToImage(imageUrl);
            }).then(function (image) {
                return self.convertImageToBlob(image);
            }).then(function (data) {
                return self.createAnnotationFromBlob(data.blob, repeated, data.size, {type: AnnotationType.STAMP});
            }).then(function (annotations) {
                return self.addAnnotationsToPDFDocument(annotations);
            }).then(function (annotations) {
                annotations.length === 1 ? self.selectAnnotation(annotations[0]) : null;
            });
        };
        /**
         * @description add Signature annotation to PDF document
         * @param imageUrl
         * @param repeated
         */
        self.addSignatureAnnotationToPDF = function (imageUrl, repeated) {
            return $timeout(function () {
                return self.convertUrlToImage(imageUrl);
            }).then(function (image) {
                return self.convertImageToBlob(image);
            }).then(function (data) {
                var heightRatio = Math.min(configurationService.SIGNATURE_BOX_SIZE.height, data.size.height) / Math.max(configurationService.SIGNATURE_BOX_SIZE.height, data.size.height);
                var widthRatio = Math.min(configurationService.SIGNATURE_BOX_SIZE.width, data.size.width) / Math.max(configurationService.SIGNATURE_BOX_SIZE.width, data.size.width);
                return self.createAnnotationFromBlob(data.blob, repeated, {
                    width: widthRatio * data.size.width,
                    height: heightRatio * data.size.height,
                }, {type: _getRightTypeForElectronicSignature()});
            }).then(function (annotations) {
                return self.addAnnotationsToPDFDocument(annotations);
            }).then(function (annotations) {
                annotations.length === 1 ? self.selectAnnotation(annotations[0]) : null;
                if (self.attacheUsernameAndDateToSignature) {
                    return $cookies.get(cookieAttachedTypeKey) ? self[$cookies.get(cookieAttachedTypeKey)](null, null, annotations[0]) : self.addUserNameAndDateToDocument(null, null, annotations[0]);
                }
            });
        };
        /**
         * @description add barcode annotation to PDF document
         * @param blob
         * @param repeated
         * @param size has width and height of the annotation.
         */
        self.addBarcodeAnnotationToPDF = function (blob, repeated, size) {
            return $timeout(function () {
                return URL.createObjectURL(blob);
            }).then(function (imageUrl) {
                return self.convertUrlToImage(imageUrl);
            }).then(function (image) {
                return self.convertImageToBlob(image);
            }).then(function (data) {
                var heightRatio = Math.min(configurationService.BARCODE_BOX_SIZE.height, data.size.height) / Math.max(configurationService.BARCODE_BOX_SIZE.height, data.size.height);
                var widthRatio = Math.min(configurationService.BARCODE_BOX_SIZE.width, data.size.width) / Math.max(configurationService.BARCODE_BOX_SIZE.width, data.size.width);
                return self.createAnnotationFromBlob(data.blob, repeated, {
                    width: data.size.width * widthRatio,
                    height: data.size.height * heightRatio
                }, {type: AnnotationType.BARCODE});
            }).then(function (annotations) {
                return self.addAnnotationsToPDFDocument(annotations);
            }).then(function (annotations) {
                annotations.length === 1 ? self.selectAnnotation(annotations[0]) : null;
            });
        };
        /**
         * @description download document
         */
        self.exportDocument = function () {
            self.currentInstance
                .exportPDF()
                .then(buffer => {
                    var supportsDownloadAttribute = HTMLAnchorElement.prototype.hasOwnProperty(
                        "download"
                    );
                    var blob = new Blob([buffer], {type: "application/pdf"});
                    if (navigator.msSaveOrOpenBlob) {
                        navigator.msSaveOrOpenBlob(blob, "download.pdf");
                    } else if (!supportsDownloadAttribute) {
                        var reader = new FileReader();
                        reader.onloadend = () => {
                            var dataUrl = reader.result;
                            downloadPdf(dataUrl);
                        };
                        reader.readAsDataURL(blob);
                    } else {
                        var objectUrl = window.URL.createObjectURL(blob);
                        downloadPdf(objectUrl);
                        window.URL.revokeObjectURL(objectUrl);
                    }
                });
        };
        /**
         * @description open custom stamps dialog to select stamp to add it to the PDF Document
         * @param event
         * @returns {promise}
         */
        self.openCustomStampsDialog = function (event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('custom-stamps'),
                controller: function (_, stamps, repeatAble) {
                    'ngInject';
                    var ctrl = this;
                    ctrl.rows = _.chunk(stamps, 4);
                    ctrl.selectedStamp = null;
                    ctrl.repeatAble = repeatAble;
                    ctrl.repeatOption = false;
                    ctrl.inprogress = false;
                    /**
                     * @description to check if the given stamp selected or not.
                     * @param stamp
                     * @returns {null|boolean}
                     */
                    ctrl.isSelectedStamp = function (stamp) {
                        return ctrl.selectedStamp && ctrl.selectedStamp.vsId === stamp.vsId;
                    };
                    /**
                     * @description to make given stamp selected.
                     * @param stamp
                     */
                    ctrl.setSelectedStamp = function (stamp) {
                        ctrl.selectedStamp = stamp;
                    };
                    /**
                     * @description add stamp and close the Stamps dialog.
                     */
                    ctrl.addStamp = function () {
                        if (ctrl.inprogress) {
                            return;
                        }
                        ctrl.inprogress = true;
                        self.addStampAnnotationToPDF(ctrl.selectedStamp.contentElementUrl, ctrl.repeatOption)
                            .then(function () {
                                dialog.hide();
                            });
                    };
                    /**
                     * @description close Stamps dialog.
                     */
                    ctrl.closePopup = function () {
                        dialog.cancel();
                    }
                },
                controllerAs: 'ctrl',
                locals: {
                    repeatAble: self.isAbleToRepeatAnnotations()
                },
                resolve: {
                    stamps: function (documentStampService) {
                        'ngInject';
                        return documentStampService.loadActiveStamps();
                    }
                }
            })
        };
        /**
         * @description open barcode dialog to select the barcode to add it to the PDF document.
         * @param $event
         */
        self.openBarcodeDialog = function ($event) {
            var info = self.correspondence.getInfo();
            documentStampService
                .loadAnnotationContent(info.vsId, AnnotationType.BARCODE, info.docClassId)
                .then(function (blob) {
                    self.addBarcodeAnnotationToPDF(blob, false, {width: 300, height: 150});
                });
        };
        /**
         * @description open signature dialog to select signature to add it to the PDF Document
         * @param event
         * @returns {promise}
         */
        self.openSignaturesDialog = function (event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('signature-annotation'),
                controller: function (_, signatures, repeatAble) {
                    'ngInject';
                    var ctrl = this;
                    ctrl.rows = _.chunk(signatures, 4);
                    ctrl.selectedSignature = null;
                    ctrl.repeatAble = repeatAble;
                    ctrl.repeatOption = false;
                    ctrl.inprogress = false;
                    /**
                     * @description to check if the given stamp selected or not.
                     * @param signature
                     * @returns {null|boolean}
                     */
                    ctrl.isSelectedSignature = function (signature) {
                        return ctrl.selectedSignature && ctrl.selectedSignature.vsId === signature.vsId;
                    };
                    /**
                     * @description to make given signature selected.
                     * @param signature
                     */
                    ctrl.setSelectedSignature = function (signature) {
                        ctrl.selectedSignature = signature;
                    };
                    /**
                     * @description add signature and close the Signatures dialog.
                     */
                    ctrl.addSignature = function () {
                        if (ctrl.inprogress) {
                            return;
                        }
                        ctrl.inprogress = true;
                        self.addSignatureAnnotationToPDF(ctrl.selectedSignature.contentElementUrl, ctrl.repeatOption)
                            .then(function () {
                                dialog.hide();
                            });
                    };
                    /**
                     * @description close Stamps dialog.
                     */
                    ctrl.closePopup = function () {
                        dialog.cancel();
                    }
                },
                controllerAs: 'ctrl',
                locals: {
                    repeatAble: self.isAbleToRepeatAnnotations()
                },
                resolve: {
                    signatures: function (applicationUserSignatureService) {
                        'ngInject';
                        return applicationUserSignatureService
                            .loadApplicationUserSignatures(employeeService.getEmployee().id);
                    }
                }
            });
        };
        /**
         * @description print pdf document without any annotations.
         * @param $event
         * @param noPrintValue
         */
        self.printWithOutAnnotations = function ($event, noPrintValue) {
            var updatedAnnotations = [];
            self.getDocumentAnnotations()
                .then(function (annotations) {
                    annotations.map(function (annotation) {
                        if (!_isSignature(annotation)) {
                            annotation = annotation.set('noPrint', noPrintValue);
                        }
                        updatedAnnotations.push(self.currentInstance.update(annotation));
                    });
                    $q.all(updatedAnnotations)
                        .then(function () {
                            self.currentInstance.save().then(function () {
                                self.currentInstance.print(PSPDFKit.PrintMode.EXPORT_PDF);
                                self.handleAfterPrint();
                            });
                        });
                })
        };
        /**
         * @description close pdfViewer
         */
        self.closeDialog = function () {
            self.launchAfterSave = false;
            dialog.cancel();
        };
        /**
         * @description get all document annotations
         * @returns {Promise<[]>}
         */
        self.getDocumentAnnotations = function (withBookmarks) {
            var pageCount = self.currentInstance.totalPageCount;
            var pagesAnnotations = [], annotations = [];
            _.map(_.range(pageCount), function (pageIndex) {
                pagesAnnotations.push(self.currentInstance.getAnnotations(Number(pageIndex)));
            });
            return $q.all(withBookmarks ? {
                bookmarks: self.getDocumentBookmarks(),
                annotations: $q.all(pagesAnnotations)
            } : pagesAnnotations)
                .then(function (pages) {
                    _.map(withBookmarks ? pages.annotations : pages, function (pageAnnotation) {
                        pageAnnotation.forEach(function (annotation) {
                            annotations.push(annotation);
                        })
                    });
                    if (withBookmarks) {
                        return {
                            annotations: annotations,
                            bookmarks: pages.bookmarks.toArray()
                        }
                    } else {
                        return annotations;
                    }
                });
        };
        /**
         * @description get all document bookmarks
         * @return {Promise<List<Bookmark>>}
         */
        self.getDocumentBookmarks = async function () {
            return self.currentInstance.getBookmarks();
        };
        /**
         * @description handle Annotations Changes
         * @param event
         */
        self.handleAnnotationChanges = function (event) {
            var annotation = event.annotations.get(0), updatedAnnotations = [];
            if (!annotation)
                return;

            var boundingBox = annotation.get('boundingBox');

            var eventListenerList = [
                PSPDFKit.AnnotationsWillChangeReason.DELETE_END,
                PSPDFKit.AnnotationsWillChangeReason.MOVE_END,
                PSPDFKit.AnnotationsWillChangeReason.RESIZE_END,
                PSPDFKit.AnnotationsWillChangeReason.PROPERTY_CHANGE,
                PSPDFKit.AnnotationsWillChangeReason.TEXT_EDIT_END,
            ];
            if (eventListenerList.indexOf(event.reason) !== -1 && annotation.customData && annotation.customData.repeaterHandler && annotation.customData.repeatedAnnotation) {
                self.getDocumentAnnotations().then(function (annotations) {
                    annotations.forEach(function (annotationItem) {
                        if (annotationItem.customData && annotationItem.customData.id && annotation.customData.repeatedAnnotation.indexOf(annotationItem.customData.id) !== -1) {
                            if (event.reason === PSPDFKit.AnnotationsWillChangeReason.DELETE_END) {
                                return self.currentInstance.delete(annotationItem.id);
                            }
                            annotationItem = annotationItem.set('boundingBox', new PSPDFKit.Geometry.Rect({
                                left: boundingBox.left,
                                top: boundingBox.top,
                                width: boundingBox.width,
                                height: boundingBox.height
                            }));

                            if (annotationItem instanceof PSPDFKit.Annotations.InkAnnotation) {
                                annotationItem = annotationItem
                                    .set('lines', annotation.lines)
                                    .set('lineWidth', annotation.lineWidth);
                            }

                            if (annotationItem instanceof PSPDFKit.Annotations.TextAnnotation) {
                                annotationItem = annotationItem.set('font', annotation.font)
                                    .set('fontColor', annotation.fontColor)
                                    .set('fontSize', annotation.fontSize)
                                    .set('text', annotation.text)
                            }

                            if (annotationItem instanceof PSPDFKit.Annotations.LineAnnotation) {
                                annotationItem = annotationItem.set('endPoint', annotation.endPoint)
                                    .set('startPoint', annotation.startPoint)
                                    .set('strokeColor', annotation.strokeColor)
                                    .set('strokeWidth', annotation.strokeWidth)
                                    .set('strokeDashArray', annotation.strokeDashArray)
                                    .set('lineCaps', annotation.lineCaps);
                            }

                            if (annotationItem instanceof PSPDFKit.Annotations.PolylineAnnotation || annotationItem instanceof PSPDFKit.Annotations.PolygonAnnotation) {
                                annotationItem = annotationItem.set('points', annotation.points)
                                    .set('strokeColor', annotation.strokeColor)
                                    .set('strokeDashArray', annotation.strokeDashArray);
                            }

                            return updatedAnnotations.push(annotationItem);
                        }
                    });
                    if (updatedAnnotations.length) {
                        self.currentInstance.update(updatedAnnotations).then(function (aa) {
                            updatedAnnotations = [];
                        });
                    }
                });

            }
        };
        /**
         * @description create inKSignature handler
         * @param annotation
         * @returns {*}
         */
        self.handleCreateInkSignatureAnnotation = function (annotation) {
            annotation = annotation.set('customData', {
                additionalData: {
                    type: AnnotationType.SIGNATURE,
                    vsId: null
                }
            }).set('pageIndex', self.currentInstance.viewState.currentPageIndex);

            return applicationUserSignatureService
                .addUserInkSignature(PSPDFKit.Annotations.toSerializableObject(annotation))
                .then(function (vsId) {
                    var reasonableSize = self.generateReasonableSize(self.latestInkAnnotation);

                    var customData = angular.extend(annotation.customData);
                    customData.additionalData.vsId = vsId;
                    self.latestInkAnnotation = self.latestInkAnnotation.set('customData', customData);

                    self.latestInkAnnotation = self.latestInkAnnotation.set('boundingBox', reasonableSize.boundingBox)
                        .set('lines', reasonableSize.lines)
                        .set('lineWidth', reasonableSize.lineWidth);

                    return self.currentInstance.getInkSignatures().then(function (signatures) {
                        signatures = signatures.splice(signatures.size - 1, 0, self.latestInkAnnotation);
                        return self.currentInstance.setInkSignatures(signatures).then(function () {
                            return self.currentInstance.update(self.latestInkAnnotation).then(function () {
                                self.latestInkAnnotation = null;
                            });
                        });
                    });
                });
        };
        /**
         * @description delete inkSignature
         * @param annotation
         * @returns {*}
         */
        self.handleDeleteInkSignatureAnnotation = function (annotation) {
            return applicationUserSignatureService
                .deleteUserInkSignature(annotation.customData.additionalData.vsId)
                .then(function () {
                    self.populateInkSignatures().then(function (list) {
                        console.log(list);
                        self.currentInstance.setInkSignatures(list);
                    })
                });
        };

        self.generateReasonableSize = function (annotation) {
            var pageSize = self.currentInstance.pageInfoForIndex(self.currentInstance.viewState.currentPageIndex);
            var defaultWidth = configurationService.SIGNATURE_BOX_SIZE.width,
                defaultHeight = configurationService.SIGNATURE_BOX_SIZE.height,
                defaultLeft = (pageSize.width / 2) - (defaultWidth / 2),
                defaultTop = (pageSize.height / 2) - (defaultHeight / 2);

            var widthRatio = defaultWidth / annotation.boundingBox.width,
                heightRatio = defaultHeight / annotation.boundingBox.height,
                ratio = Math.min(widthRatio, heightRatio),
                newWidth = annotation.boundingBox.width * ratio,
                newHeight = annotation.boundingBox.height * ratio,
                resizeRatio = newWidth / annotation.boundingBox.width,
                newLeft = (defaultLeft + defaultWidth / 2) - (newWidth / 2),
                newTop = (defaultTop + defaultHeight / 2) - (newHeight / 2),
                newLines = annotation.lines.map(line => {
                    return line.map(point => {
                        return new PSPDFKit.Geometry.DrawingPoint({
                            x: newLeft + (point.x - annotation.boundingBox.left) * resizeRatio,
                            y: newTop + (point.y - annotation.boundingBox.top) * resizeRatio,
                        });
                    })
                }),
                boundingBox = new PSPDFKit.Geometry.Rect({
                    width: newWidth,
                    height: newHeight,
                    left: newLeft,
                    top: newTop
                }),
                lineWidth = annotation.lineWidth * resizeRatio;
            return {
                lines: newLines,
                boundingBox: boundingBox,
                lineWidth: lineWidth
            }
        };
        /**
         * @description create annotation handler
         * @param annotations
         */
        self.handleCreateAnnotations = function (annotations) {
            var annotation = annotations.first();
            if (annotation instanceof PSPDFKit.Annotations.InkAnnotation && annotation.isSignature && !annotation.customData) {
                self.latestInkAnnotation = annotation;
            }

            if (annotation instanceof PSPDFKit.Annotations.InkAnnotation && annotation.isSignature && annotation.customData) {
                var customData = angular.copy(annotation.customData);
                delete customData.repeaterHandler;
                delete customData.repeatedAnnotation;
                var reasonableSize = self.generateReasonableSize(annotation);
                var updatedAnnotation = annotation
                    .set('isSignature', _getRightTypeForElectronicSignature() !== 1)
                    .set('customData', customData);

                if (!customData.hasOwnProperty('parentId')) {
                    updatedAnnotation = updatedAnnotation.set('boundingBox', reasonableSize.boundingBox)
                        .set('lines', reasonableSize.lines)
                        .set('lineWidth', reasonableSize.lineWidth);
                }

                if (self.attacheUsernameAndDateToSignature && !customData.hasOwnProperty('parentId')) {
                    $cookies.get(cookieAttachedTypeKey) ? self[$cookies.get(cookieAttachedTypeKey)](null, null, updatedAnnotation) : self.addUserNameAndDateToDocument(null, null, updatedAnnotation);
                }
                return self.currentInstance.update(updatedAnnotation);
            }
        };
        /**
         * @description handle delete Signature Annotations
         * @param event
         */
        self.handleDeleteAnnotations = function (event) {
            var annotation = event.annotations.get(0);
            var reason = PSPDFKit.AnnotationsWillChangeReason.DELETE_START;
            // in case if the current annotation is Ink Signature.
            if (event.reason === reason &&
                annotation instanceof PSPDFKit.Annotations.InkAnnotation &&
                annotation.isSignature &&
                !!(annotation.pdfObjectId)
            ) {
                toast.error(langService.get('delete_saved_signature_no_allowed'));
                throw Error(langService.get('delete_saved_signature_no_allowed'));
            }
            // in case if the current annotation is Tawasol Electronic Signature.
            if (event.reason === reason &&
                annotation instanceof PSPDFKit.Annotations.ImageAnnotation &&
                annotation.customData &&
                annotation.customData.additionalData &&
                annotation.customData.additionalData.type === AnnotationType.SIGNATURE &&
                !!(annotation.pdfObjectId)
            ) {
                toast.error(langService.get('delete_saved_signature_no_allowed'));
                throw Error(langService.get('delete_saved_signature_no_allowed'));
            }
        };
        /**
         * @description to check is able to repeat annotations for each page
         * @returns {boolean|*}
         */
        self.isAbleToRepeatAnnotations = function () {
            return self.currentInstance.totalPageCount > 1;// && self.isAllPageSameSize();
        };
        /**
         * @description return true if the all pages has same size.
         * @returns {boolean}
         */
        self.isAllPageSameSize = function () {
            var pagesInfo = self.getAllPagesInfo(), page = pagesInfo[0];
            return !_.some(pagesInfo, function (p) {
                return page.width !== p.width || page.height !== p.height;
            });
        };
        /**
         * @description get all pages information (width , height , index)
         * @returns {Array}
         */
        self.getAllPagesInfo = function () {
            return _.map(_.range(self.currentInstance.totalPageCount), function (page) {
                return self.currentInstance.pageInfoForIndex(page);
            });
        };
        /**
         * @description remove all event listeners and unload the PDFViewer
         */
        self.disposable = function () {
            if (self.currentInstance) {
                self.currentInstance.removeEventListener("annotations.willChange", self.handleAnnotationChanges);
                self.currentInstance.removeEventListener("inkSignatures.create", self.handleCreateInkSignatureAnnotation);
                self.currentInstance.removeEventListener("inkSignatures.delete", self.handleDeleteInkSignatureAnnotation);
                self.currentInstance.removeEventListener("annotations.create", self.handleCreateAnnotations);
                self.currentInstance.removeEventListener("annotations.willChange", self.handleDeleteAnnotations);
                self.currentInstance.removeEventListener("viewState.change", self.bookmarkSidebarListener);
            }
            try {
                PSPDFKit.unload($element.find('#pdf-viewer')[0]);
            } catch (e) {

            }
        };
        /**
         * @default handle success Authorize
         * @param result
         * @param ignoreClosePopup
         */
        self.handleSuccessAuthorize = function (result, ignoreClosePopup) {
            self.disableSaveButton = false;
            if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text) {
                self.sendAnnotationLogs();
                toast.success(langService.get('sign_specific_success').change({name: self.correspondence.getTranslatedName()}));
                dialog
                    .confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: self.correspondence.getTranslatedName()}))
                    .then(function () {
                        return self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                            .then(function () {
                                dialog.hide({
                                    content: self.savedPdfContent,
                                    action: PDFViewer.DOCUMENT_LAUNCHED_ALREADY
                                });
                            })
                            .catch(self.handleExceptions);
                    })
                    .catch(function () {
                        if (ignoreClosePopup) {
                            return self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                        }
                        if (self.launchAfterSave) {
                            self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                                .then(function () {
                                    dialog.hide({
                                        content: self.savedPdfContent,
                                        action: PDFViewer.DOCUMENT_LAUNCHED_ALREADY
                                    });
                                });
                        } else {
                            dialog.hide({
                                content: self.savedPdfContent,
                                action: PDFViewer.CANCEL_LAUNCH
                            });
                        }
                    });
            } else if (result === correspondenceService.authorizeStatus.SAME_USER_AUTHORIZED.text) {
                dialog
                    .confirmMessage(langService.get('confirm_authorize_same_user').change({user: employeeService.getEmployee().getTranslatedName()}))
                    .then(function () {
                        self.saveDocumentAnnotations(true, ignoreClosePopup);
                    });
            } else {
                self.sendAnnotationLogs(function () {
                    toast.success(langService.get('sign_specific_success').change({name: self.correspondence.getTranslatedName()}));
                    if (ignoreClosePopup) {
                        if (result === correspondenceService.authorizeStatus.FULLY_AUTHORIZED.text) {
                            dialog.hide({
                                content: self.savedPdfContent,
                                action: PDFViewer.JUST_AUTHORIZE
                            });
                            return;
                        }
                        return self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                    }

                    if (self.launchAfterSave) {
                        self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                            .then(function () {
                                dialog.hide({
                                    content: self.savedPdfContent,
                                    action: PDFViewer.DOCUMENT_LAUNCHED_ALREADY
                                });
                            });
                    } else {
                        dialog.hide({
                            content: self.savedPdfContent,
                            action: PDFViewer.JUST_AUTHORIZE
                        });
                    }
                }, function (error) {
                    console.log('error', error);
                });
            }
        };
        /**
         * @description send annotations  logs to the server
         * @return {boolean|*}
         */
        self.sendAnnotationLogs = function (successCallback, errorCallback) {
            self.disableSaveButton = true;
            return annotationLogService.applyAnnotationChanges(self.oldAnnotations, self.newAnnotations, self.correspondence, self.documentOperations, self.oldBookmarks, self.newBookmarks)
                .then(function () {
                    self.disableSaveButton = false;
                    if (successCallback)
                        successCallback();
                })
                .catch(function (error) {
                    self.disableSaveButton = false;
                    if (errorCallback)
                        errorCallback(error);
                });
        };
        /**
         * @default handle all expected exceptions.
         * @param error
         */
        self.handleExceptions = function (error) {
            self.disableSaveButton = false;
            if (error === 'PINCODE_MISSING') {
                toast.error(langService.get('pincode_required_to_complete_authorization'));
            } else {
                errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                    dialog.errorMessage(langService.get('authorize_failed'))
                });
                errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                    dialog.errorMessage(langService.get('certificate_missing'))
                });
                errorCode.checkIf(error, 'PIN_CODE_NOT_MATCH', function () {
                    dialog.errorMessage(langService.get('pincode_not_match'))
                });
                errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                    toast.error(langService.get('work_item_not_found').change({wobNumber: self.correspondence.getInfo().wobNumber}));
                    dialog.hide();
                });
                errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                    dialog.errorMessage(langService.get('authorize_failed'))
                });
            }
        };
        /**
         * @description handle
         * @param pdfContent
         * @param ignoreClosePopup
         */
        self.handleSaveAttachment = function (pdfContent, ignoreClosePopup) {
            self.correspondence.file = pdfContent;
            self.correspondence.sourceType = 1;
            attachmentService.updateAttachment(attachedBook, self.correspondence)
                .then(function (attachment) {
                    self.disableSaveButton = false;
                    toast.success(langService.get('save_success'));
                    if (ignoreClosePopup) {
                        return self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                    }
                    dialog.hide({
                        content: attachment,
                        type: 'ATTACHMENT',
                        action: PDFViewer.UPDATE_ATTACHMENT
                    });
                }).catch(self.handleExceptions);
        };
        /**
         * @description handle open for approval save action.
         * @param ignoreValidationSignature
         * @param ignoreClosePopup
         */
        self.handleOpenForApprovalSave = function (ignoreValidationSignature, ignoreClosePopup) {
            self.isDocumentHasCurrentUserSignature().then(function () {
                self.getPDFContentForCurrentDocument().then(function (pdfContent) {
                    self.savedPdfContent = pdfContent;
                    self.correspondence
                        .handlePinCodeAndCompositeThenCompleteAuthorization(pdfContent, ignoreValidationSignature)
                        .then(function (result) {
                            self.handleSuccessAuthorize(result, ignoreClosePopup)
                        })
                        .catch(self.handleExceptions);
                });
            }).catch(function () {
                self.disableSaveButton = false;
                toast.error(langService.get(self.needOpenForApproval ? 'you_missed_open_for_appoval' : 'provide_signature_to_proceed'));
            });
        };
        /**
         * @description to check if the current document has user signature , it will not count the old signature from current user.
         * @return {Promise}
         */
        self.isDocumentHasCurrentUserSignature = function () {
            return $q(function (resolve, reject) {
                $timeout(function () {
                    return self.getDocumentAnnotations();
                }).then(function (annotations) {
                    return _.some(annotations, function (annotation) {
                        return _isCurrentUserSignature(annotation);
                    });
                }).then(function (result) {
                    result ? resolve(result) : (self.correspondence instanceof WorkItem && _isFromBackStep() ? resolve(true) : reject(result));
                });
            });
        };
        /**
         * @description handle update document content
         * @param pdfContent
         * @param annotationType
         * @param ignoreClosePopup
         */
        self.handleUpdateDocumentContent = function (pdfContent, annotationType, ignoreClosePopup) {
            self.correspondence.updateDocumentContentByAnnotation(pdfContent, annotationType).then(function () {
                toast.success(langService.get('save_success'));
                self.disableSaveButton = false;
                self.sendAnnotationLogs();
                if (ignoreClosePopup) {
                    return self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                }

                if (self.launchAfterSave) {
                    self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                        .then(function () {
                            dialog.hide({
                                content: self.savedPdfContent,
                                action: PDFViewer.DOCUMENT_LAUNCHED_ALREADY
                            });
                        });
                } else {
                    dialog.hide({
                        content: self.savedPdfContent,
                        action: PDFViewer.UPDATE_DOCUMENT_CONTENT
                    });
                }
            }).catch(self.handleExceptions);
        };
        /**
         * @description save annotations as attachments
         * @param pdfContent
         * @param callback
         * @param ignoreClosePopup
         */
        self.handleSaveAnnotationAsAttachment = function (pdfContent, callback, ignoreClosePopup) {
            self.correspondence.addAnnotationAsAttachment(pdfContent).then(function (attachment) {
                toast.success(langService.get('save_success'));
                self.disableSaveButton = false;
                if (callback) {
                    callback();
                    return;
                }
                if (ignoreClosePopup) {
                    return self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                }
                if (self.launchAfterSave) {
                    self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                        .then(function () {
                            dialog.hide({
                                content: self.savedPdfContent,
                                action: PDFViewer.DOCUMENT_LAUNCHED_ALREADY
                            });
                        });
                } else {
                    dialog.hide({
                        content: attachment,
                        type: 'ATTACHMENT',
                        action: PDFViewer.ADD_ATTACHMENT
                    });
                }
            }).catch(self.handleExceptions);
        };
        /**
         * @description handle none signature save part
         */
        self.handleSaveNoneSignaturePart = function (ignoreValidationSignature, ignoreClosePopup) {
            self.currentInstance.exportInstantJSON().then(async function (instantJSON) {
                delete instantJSON.pdfId;
                instantJSON.skippedPdfObjectIds = _.difference(instantJSON.skippedPdfObjectIds, self.skippedPdfObjectIds);
                var hasMySignature = await self.isDocumentHasCurrentUserSignature().catch(result => result);
                PDFService.applyAnnotationsOnPDFDocument(self.correspondence, AnnotationType.ANNOTATION, instantJSON, self.documentOperations, _getFlattenStatus(hasMySignature))
                    .then(function (pdfContent) {
                        self.savedPdfContent = pdfContent;
                        self.skippedPdfObjectIds = self.skippedPdfObjectIds.concat(instantJSON.skippedPdfObjectIds);
                        if (self.correspondence instanceof Attachment) {
                            self.handleSaveAttachment(pdfContent, ignoreClosePopup);
                        } else {
                            if (self.info.isPaper) {
                                self.info.docStatus === 25 ? self.handleSaveAnnotationAsAttachment(pdfContent, null, ignoreClosePopup) : self.handleUpdateDocumentContent(pdfContent, null, ignoreClosePopup);
                            } else if (_isElectronicAndAuthorizeByAnnotationBefore() && !self.correspondence.getSeqWFId()) {
                                if (hasMySignature) {
                                    self.correspondence.handlePinCodeAndCompositeThenCompleteAuthorization(pdfContent, ignoreValidationSignature)
                                        .then(function (authorizeResult) {
                                            self.handleSuccessAuthorize(authorizeResult, ignoreClosePopup);
                                        })
                                        .catch(self.handleExceptions);
                                } else {
                                    self.handleUpdateDocumentContent(pdfContent, null, ignoreClosePopup);
                                }
                            } else {
                                // for electronic document in ready to export or internal in approved queue.
                                if (self.correspondence.getSeqWFId() && _isElectronicAndAuthorizeByAnnotationBefore()) {
                                    self.handleUpdateDocumentContent(pdfContent, null, ignoreClosePopup);
                                } else {
                                    (self.info.docStatus === 24 && (self.info.documentClass === 'outgoing' || self.info.documentClass === 'internal')) ? self.handleUpdateDocumentContent(pdfContent, AnnotationType.STAMP, ignoreClosePopup) : self.handleSaveAnnotationAsAttachment(pdfContent, null, ignoreClosePopup);
                                }
                            }
                        }
                    });
            });
        };

        self.saveAndSendDocumentAnnotations = function () {
            self.launchAfterSave = true;
            self.saveDocumentAnnotations(false, false)
        };

        self.saveAnnotationsNoClose = function () {
            self.launchAfterSave = false;
            self.saveDocumentAnnotations(false, true);
        };

        self.loadUpdatedContent = function (withWatermark) {
            downloadService.downloadContentWithOutWaterMark(self.correspondence, (withWatermark ? AnnotationType.ANNOTATION : AnnotationType.SIGNATURE))
                .then(function (blob) {
                    self.disposable();
                    var fr = new FileReader();
                    return $q(function (resolve) {
                        fr.onloadend = function () {
                            self.pdfData = fr.result;
                            self.$onInit();
                        };
                        fr.readAsArrayBuffer(blob);
                    });
                })
        };

        /**
         * @description save document annotations
         * @param ignoreValidationSignature
         * @param ignoreClosePopup
         */
        self.saveDocumentAnnotations = function (ignoreValidationSignature, ignoreClosePopup) {
            if (self.disableSaveButton) {
                return null;
            }
            self.disableSaveButton = true;
            self.getDocumentAnnotations(true).then(function ({annotations, bookmarks}) {
                self.newAnnotations = annotations;
                self.newBookmarks = bookmarks;
                var hasChanges = annotationLogService.getAnnotationsChanges(self.oldAnnotations, self.newAnnotations, self.documentOperations, self.oldBookmarks, self.newBookmarks);
                if (!hasChanges.length) {
                    dialog.infoMessage(langService.get('there_is_no_changes_to_save'));
                    self.disableSaveButton = false;
                    return;
                }
                if (self.annotationType === AnnotationType.SIGNATURE) {
                    self.handleOpenForApprovalSave(ignoreValidationSignature, ignoreClosePopup); // document is already with watermark
                } else {
                    self.handleSaveNoneSignaturePart(ignoreValidationSignature, ignoreClosePopup);
                }
            }); // get document annotations
        };
        /**
         * @description display sequentialWF Steps
         * @return {promise}
         */
        self.displaySeqWFSteps = function () {
            self.launchAfterSave = false;
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('view-seq-wf-steps'),
                locals: {
                    correspondence: self.correspondence
                },
                resolve: {
                    sequentialWF: function (sequentialWorkflowService) {
                        'ngInject';
                        return sequentialWorkflowService.loadSequentialWorkflowById(self.sequentialWF)
                    }
                },
                controllerAs: 'ctrl',
                bindToController: true,
                controller: function (dialog, sequentialWorkflowService) {
                    'ngInject';
                    var ctrl = this,
                        minimumStepsCount = 2;

                    ctrl.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.viewWFSteps;

                    ctrl.isValidSeqWF = function () {
                        return _isValidSteps() && _hasOneAuthorizeAndSend();
                    };

                    function _isValidSteps() {
                        if (!_hasStepRows()) {
                            return false;
                        }
                        return _.every(ctrl.sequentialWF.stepRows, function (stepRow) {
                            if (!stepRow) {
                                return false;
                            }
                            return stepRow.isValidStep(ctrl.sequentialWF);
                        })
                    }

                    function _hasOneAuthorizeAndSend() {
                        if (!_hasStepRows()) {
                            return false;
                        }
                        if (ctrl.sequentialWF.isIncomingSeqWF()) {
                            return true;
                        } else {
                            return !!_.find(ctrl.sequentialWF.stepRows, function (stepRow) {
                                if (!stepRow) {
                                    return false;
                                }
                                return stepRow.isAuthorizeAndSendStep();
                            })
                        }
                    }

                    function _hasStepRows() {
                        return ctrl.sequentialWF.stepRows && ctrl.sequentialWF.stepRows.length;
                    }

                    ctrl.saveSeqWF = function () {
                        if (ctrl.sequentialWF.stepRows.length < minimumStepsCount) {
                            toast.info(langService.get('error_min_steps').change({number: minimumStepsCount}));
                            return;
                        }

                        sequentialWorkflowService.updateSequentialWorkflow(ctrl.sequentialWF)
                            .then(function (result) {
                                toast.success(langService.get('edit_success').change({name: result.getNames()}));
                                dialog.hide('SEQ_WF_UPDATED');
                            });
                    };

                    ctrl.closePopup = function () {
                        dialog.cancel();
                    }
                }
            })
        };

        /**
         * @description Reset the seqWF
         * @param $event
         */
        self.resetSeqWF = function ($event) {
            sequentialWorkflowService.resetSeqWF(self.correspondence, $event)
                .then(function (result) {
                    toast.success(langService.get('success_reset_seq_wf'));
                    dialog.cancel();
                })
        };

        /**
         * @description get PDF Content for current document with changes
         * @param flatten
         * @return {Promise<Blob>}
         */
        self.getPDFContentForCurrentDocument = function (flatten) {
            return self.currentInstance.exportPDF({flatten: typeof flatten === 'undefined' ? _getFlattenStatus() : flatten}).then(function (buffer) {
                return new Blob([buffer], {type: 'application/pdf'});
            });
        };
        /**
         * @description handle Seq WorkFlow
         * @param error
         */
        self.handleSeqExceptions = function (error) {
            self.disableSaveButton = false;
            toast.error(error.data.eo[langService.current + 'Name']);
            // errorCode.checkIf(error, 'SEQ_WF_INVALID_SIGNATURE_COUNT', function () {
            //
            // });
        };
        /**
         * @description apply next step for Seq workflow
         * @param content
         * @param signatureModel
         * @param ignoreValidateMultiSignature
         * @param terminateAllWFS
         * @return {*}
         */
        self.applyNextStep = function (content, signatureModel, ignoreValidateMultiSignature, terminateAllWFS) {
            signatureModel.setValidateMultiSignature(self.isSeqBackStep() ? false : !ignoreValidateMultiSignature);
            signatureModel.setSeqWFId(self.sequentialWF.id);
            signatureModel.setIsNotifyAllPrevious(self.notifyPreviousSteps);
            return sequentialWorkflowService
                .launchSeqWFCorrespondence(self.correspondence, signatureModel, content, self.isLaunchStep, terminateAllWFS)
                .then(function (result) {
                    if (result === correspondenceService.authorizeStatus.SAME_USER_AUTHORIZED.text) {
                        return dialog
                            .confirmMessage(langService.get('confirm_authorize_same_user').change({user: employeeService.getEmployee().getTranslatedName()}))
                            .then(function () {
                                return self.applyNextStep(content, signatureModel, true, terminateAllWFS);
                            });
                    }

                    if (result === 'ERROR_MULTI_USER') {
                        return dialog.confirmMessage(langService.get('workflow_in_multi_user_inbox'))
                            .then(function () {
                                return self.applyNextStep(content, signatureModel, ignoreValidateMultiSignature, true)
                            });
                    }
                    return result;
                });
        };
        /**
         * @description apply Next step on Correspondence and send/or not the annotation  log
         * @param pdfContent
         * @param signatureModel
         * @param logAnnotations
         */
        self.applyNextStepOnCorrespondence = function (pdfContent, signatureModel, logAnnotations) {
            signatureModel = signatureModel ? signatureModel : self.correspondence.prepareSignatureModel(null, null, null);
            return self.applyNextStep(pdfContent, signatureModel)
                .then(logAnnotations ? function (result) {
                    self.disableSaveButton = false;
                    toast.success(langService.get('launch_sequential_workflow_success'));
                    self.sendAnnotationLogs(function () {
                        dialog.hide({
                            content: self.savedPdfContent,
                            action: PDFViewer.SEQ_LAUNCHED
                        });
                    }, function (error) {
                        toast.error('ERROR While Sending the log to Server', error);
                    });
                } : function () {
                    self.disableSaveButton = false;
                    toast.success(langService.get('launch_sequential_workflow_success'));
                    dialog.hide({
                        content: self.savedPdfContent,
                        action: PDFViewer.SEQ_LAUNCHED
                    });
                });
        };
        /**
         * @description start Next Step Validation to launch or advance seq workflow.
         */
        self.startNextStepValidation = async function () {
            self.launchAfterSave = false;
            if (self.disableSaveButton || !self.nextSeqStep) {
                return null;
            }

            if (!!self.nextSeqStep.proxyUserInfo) {
                _showProxyMessage([self.nextSeqStep.proxyUserInfo]);
            }

            self.disableSaveButton = true;
            self.getDocumentAnnotations(true)
                .then(function ({annotations, bookmarks}) {
                    self.newAnnotations = annotations;
                    self.newBookmarks = bookmarks;
                    if (self.nextSeqStep.isAuthorizeAndSendStep()) {
                        self.isDocumentHasCurrentUserSignature()
                            .then(function () {
                                if (self.annotationType === AnnotationType.SIGNATURE) {
                                    self.getPDFContentForCurrentDocument()
                                        .then(function (pdfContent) {
                                            if (_isFromBackStep()) {
                                                self.applyNextStepOnCorrespondence(pdfContent, null, true).catch(self.handleSeqExceptions);
                                            } else {
                                                self.correspondence.handlePinCodeAndComposite().then(function (signatureModel) {
                                                    self.applyNextStepOnCorrespondence(pdfContent, signatureModel, true).catch(self.handleSeqExceptions);
                                                }).catch(self.handleExceptions);
                                            }
                                        });
                                } else {
                                    self.currentInstance.exportInstantJSON().then(function (instantJSON) {
                                        delete instantJSON.pdfId;
                                        PDFService.applyAnnotationsOnPDFDocument(self.correspondence, self.annotationType, instantJSON, self.documentOperations, _getFlattenStatus()).then(function (pdfContent) {
                                            if (_isFromBackStep()) {
                                                self.applyNextStepOnCorrespondence(pdfContent, null, true).catch(self.handleSeqExceptions);
                                            } else {
                                                self.correspondence.handlePinCodeAndComposite().then(function (signatureModel) {
                                                    self.applyNextStepOnCorrespondence(pdfContent, signatureModel, true).catch(self.handleSeqExceptions);
                                                }).catch(self.handleExceptions);
                                            }
                                        });
                                    });
                                }
                            })
                            .catch(function () {
                                self.disableSaveButton = false;
                                toast.error(langService.get(self.needOpenForApproval ? 'you_missed_open_for_appoval' : 'provide_signature_to_proceed'));
                            });
                    } else { // else nextSeqStep.isAuthorizeAndSendStep()
                        var hasChanges = annotationLogService.getAnnotationsChanges(self.oldAnnotations, self.newAnnotations, self.documentOperations, self.oldBookmarks, self.newBookmarks);
                        if (!hasChanges.length) {
                            return self.applyNextStepOnCorrespondence(null).catch(self.handleSeqExceptions);
                        }
                        self.currentInstance.exportInstantJSON().then(function (instantJSON) {
                            delete instantJSON.pdfId;
                            PDFService.applyAnnotationsOnPDFDocument(self.correspondence, self.annotationType, instantJSON, self.documentOperations, _getFlattenStatus()).then(function (pdfContent) {
                                if (self.info.isPaper || _isElectronicAndAuthorizeByAnnotationBefore()) {
                                    self.applyNextStepOnCorrespondence(pdfContent, null, true).catch(self.handleSeqExceptions);
                                } else {
                                    self.handleSaveAnnotationAsAttachment(pdfContent, function () {
                                        return self.applyNextStepOnCorrespondence(null).catch(self.handleSeqExceptions);
                                    });
                                }
                            });
                        });
                    } // end nextSeqStep.isAuthorizeAndSendStep()
                }); //end getDocumentAnnotations
        };

        self.startBackStepValidation = function () {
            self.launchAfterSave = false;
            if (self.disableSaveButton) {
                return false;
            }
            $timeout(function () {
                self.disableSaveButton = true;
            });

            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('seq-back-step-options'),
                    bindToController: true,
                    controller: 'seqBackStepPopCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        actions: function () {
                            return employeeService.getEmployee().loadMyWorkflowActions();
                        },
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserComments();
                        }
                    }
                })
                .then(function (backStepOptions) {
                    self.getDocumentAnnotations(true).then(function ({annotations, bookmarks}) {
                        self.newAnnotations = annotations;
                        self.newBookmarks = bookmarks;
                        var hasChanges = annotationLogService.getAnnotationsChanges(self.oldAnnotations, self.newAnnotations, self.documentOperations, self.oldBookmarks, self.newBookmarks);
                        if (self.info.isPaper || self.info.docStatus >= 23) {
                            if (!hasChanges.length) {
                                return self.performSendBackStep(backStepOptions, true, hasChanges.length);
                            }
                            return dialog.confirmMessage(langService.get('confirm_annotation_save_on_content'))
                                .then(function () {
                                    return self.performSendBackStep(backStepOptions, false, hasChanges.length);
                                })
                                .catch(function () {
                                    return self.performSendBackStep(backStepOptions, true, hasChanges.length);
                                });
                        } else {
                            return self.performSendBackStep(backStepOptions, false, hasChanges.length);
                        }
                    });


                }).catch(function () {
                    self.disableSaveButton = false;
                });
        };
        /**
         * @description perform back step action
         * @param backStepOptions
         * @param ignoreContent
         * @param hasChanges
         */
        self.performSendBackStep = function (backStepOptions, ignoreContent, hasChanges) {
            sequentialWorkflowService.backStepSeqWFCorrespondence(self.correspondence, backStepOptions, self.currentInstance, self.documentOperations, ignoreContent, hasChanges).then(function (data) {
                toast.success(langService.get('launch_sequential_workflow_back_success'));
                !ignoreContent ? self.sendAnnotationLogs(function () {
                    self.disableSaveButton = false;
                    dialog.hide();
                }, function (error) {
                    self.disableSaveButton = false;
                    toast.error(error.data.eo[langService.current + 'Name']);
                }) : (function () {
                    self.disableSaveButton = false;
                    dialog.hide();
                })();
            }).catch(function (error) {
                self.disableSaveButton = false;
                toast.error(error.data.eo[langService.current + 'Name']);
            });
        };
        /**
         * @description check if the current user can edit annotation or not
         * @param annotation
         * @return {Boolean}
         */
        self.userCanEditAnnotation = function (annotation) {
            var employee = employeeService.getEmployee(), returnValue = true;
            // for the ink signature
            if (annotation instanceof PSPDFKit.Annotations.InkAnnotation && annotation.isSignature && annotation.creatorName !== employee.domainName) {
                returnValue = false;
                // for image signature
            } else if (annotation instanceof PSPDFKit.Annotations.ImageAnnotation && annotation.customData && annotation.customData.additionalData && annotation.customData.additionalData.type === AnnotationType.SIGNATURE && annotation.creatorName !== employee.domainName) {
                returnValue = false;
            }
            return returnValue;
        };
        /**
         * @description load ink signature for the current user while clicking on ink Signature button.
         * @return {PSPDFKit.Immutable.List}
         */
        self.populateInkSignatures = function () {
            return applicationUserSignatureService
                .loadUserInkSignatures()
                .then(function (signatures) {
                    var signatureList = [];
                    signatures.map(function (sign) {
                        signatureList.push(sign.fetchPSPDFKitSignature());
                    });
                    return $q.all(signatureList).then(function (list) {
                        return PSPDFKit.Immutable.List(list);
                    });
                });
        };

        self.annotationTooltipCallback = function (annotation) {

            function _isRepeaterRoot(annotation) {
                return annotation.customData && annotation.customData.repeaterHandler;
            }

            function _isRepeaterChild(annotation) {
                return annotation.customData && annotation.customData.parentId;
            }

            if (self.excludedRepeatedAnnotations.indexOf(annotation.constructor.readableName) !== -1) {
                return [];
            }

            var tooltipItems = [], replicationButton = {
                type: "custom",
                title: "Replicate",
                id: "tooltip-Replication-annotation",
                className: "TooltipItem-Replication",
                onPress: async function () {
                    var currentPageIndex = annotation.pageIndex, boundingBox = annotation.boundingBox,
                        totalPages = self.currentInstance.totalPageCount, duplicated = [],
                        customData = angular.copy(annotation.customData) || {}, updatedAnnotation = null,
                        parentId = uuidv4();

                    var isImageAnnotation = annotation instanceof PSPDFKit.Annotations.ImageAnnotation;
                    if (isImageAnnotation) {
                        var attachmentId = annotation.imageAttachmentId;
                        var blob = await self.currentInstance.getAttachment(attachmentId);
                        var newAttachmentId = await self.currentInstance.createAttachment(blob);
                    }

                    for (var i = 0; i < totalPages; i++) {
                        var id = uuidv4(), currentDuplicated = null;
                        if (i === currentPageIndex) {
                            continue;
                        }
                        var customDuplicatedData = {
                            ...customData,
                            id: id,
                            parentId: parentId
                        };

                        if (isImageAnnotation) {
                            currentDuplicated = new PSPDFKit.Annotations.ImageAnnotation({
                                pageIndex: i,
                                customData: customDuplicatedData,
                                boundingBox: boundingBox,
                                imageAttachmentId: newAttachmentId,
                                contentType: annotation.contentType
                            });
                        } else {
                            currentDuplicated = annotation
                                .set('id', null)
                                .set('pdfObjectId', null)
                                .set('pageIndex', i)
                                .set('customData', customDuplicatedData)
                                .set('boundingBox', boundingBox);
                        }
                        duplicated.push(currentDuplicated);
                    }
                    self.currentInstance.create(duplicated).then(function (annotations) {
                        updatedAnnotation = annotation.set('customData', {
                            ...customData,
                            repeaterHandler: true,
                            id: parentId,
                            repeatedAnnotation: _.map(annotations, function (item) {
                                return item.customData.id;
                            })
                        });
                        self.currentInstance.update(updatedAnnotation);
                    });

                }
            }, unlinkButton = {
                type: "custom",
                title: "Unlink Replication",
                id: "tooltip-Unlink-Replication-annotation",
                className: "TooltipItem-Unlink-Replication",
                onPress: function () {

                    if (self.unlinkInProgress) {
                        return null;
                    }

                    var updatedAnnotation = null, customData = angular.extend(annotation.customData),
                        updatedCustomData = angular.copy(customData), updatedAnnotationsList = [];
                    self.unlinkInProgress = true;
                    self.getDocumentAnnotations().then(function (annotations) {
                        if (_isRepeaterRoot(annotation)) {
                            delete updatedCustomData.repeaterHandler;
                            delete updatedCustomData.repeatedAnnotation;
                            updatedAnnotation = annotation.set('customData', updatedCustomData);
                            annotations.forEach(function (annotation) {
                                var customAnnotationData = annotation.customData;
                                if (customAnnotationData) {
                                    delete customAnnotationData.parentId;
                                }
                                var updatedAnnotation = annotation.set('customData', customAnnotationData);
                                updatedAnnotationsList.push(updatedAnnotation);
                            });
                            self.currentInstance.update(updatedAnnotationsList).then(function () {
                                return self.currentInstance.update(updatedAnnotation);
                            });
                        } else {
                            var parentAnnotation = _.find(annotations, function (annotation) {
                                return annotation.customData && annotation.customData.id === customData.parentId;
                            });
                            delete updatedCustomData.parentId;
                            parentAnnotation.customData.repeatedAnnotation.splice(parentAnnotation.customData.repeatedAnnotation.indexOf(annotation.customData.id), 1);
                            if (!parentAnnotation.customData.repeatedAnnotation.length) {
                                delete parentAnnotation.customData.repeaterHandler;
                                delete parentAnnotation.customData.repeatedAnnotation;
                            }
                            updatedAnnotation = annotation.set('customData', updatedCustomData);
                            self.currentInstance.update([updatedAnnotation, parentAnnotation]);
                        }
                        self.unlinkInProgress = false;
                    });

                }
            };

            if (self.isAbleToRepeatAnnotations() && !_isRepeaterChild(annotation) && !_isRepeaterRoot(annotation)) {
                tooltipItems.push(replicationButton);
            }

            if (annotation.customData && (_isRepeaterChild(annotation) || _isRepeaterRoot(annotation))) {
                tooltipItems.push(unlinkButton);
            }

            return tooltipItems;
        };

        self.handleAfterPrint = function () {
            self.getDocumentAnnotations()
                .then(function (annotations) {
                    annotations.forEach(function (annotation) {
                        self.currentInstance.update(annotation.set('noView', false))
                    });
                });
        };

        self.bookmarkSidebarListener = function (state) {
            if (state.sidebarMode === 'BOOKMARKS') {
                self.currentInstance.setToolbarItems(items => {
                    return items.map(item => {
                        if (item.id === "bookmark-shortcut") {
                            item.selected = true;
                        }
                        return item;
                    });
                });
            } else {
                self.currentInstance.setToolbarItems(items => {
                    return items.map(item => {
                        if (item.id === "bookmark-shortcut") {
                            item.selected = false;
                        }
                        return item;
                    });
                });

            }
        };
        /**
         * @description to register all event listener that we need during annotate the document.
         */
        self.registerEventListeners = function () {
            self.currentInstance.addEventListener("annotations.willChange", self.handleAnnotationChanges);
            self.currentInstance.addEventListener("inkSignatures.create", self.handleCreateInkSignatureAnnotation);
            self.currentInstance.addEventListener("inkSignatures.delete", self.handleDeleteInkSignatureAnnotation);
            self.currentInstance.addEventListener("annotations.create", self.handleCreateAnnotations);
            self.currentInstance.addEventListener("viewState.change", self.bookmarkSidebarListener);
            // to handle delete annotations
            self.currentInstance.addEventListener("annotations.willChange", self.handleDeleteAnnotations);
            // for debug purpose
            self.currentInstance.addEventListener("annotations.focus", function (event) {
                var annotation = event.annotation;
                console.log('Focused Annotation', annotation);
            });
            self.currentInstance.addEventListener("document.change", (operations) => {
                self.documentOperations = self.documentOperations.concat(operations);
            });

            var editorElement = self.currentInstance.contentDocument
                .querySelector(".PSPDFKit-Toolbar-Button-Document-Editor");

            if (!editorElement)
                return;

            editorElement.addEventListener("click", self.handleEditorClick);
        };
        /**
         * @description handle remove save as button from document editor.
         */
        self.handleEditorClick = function () {
            $timeout(function () {
                var buttons = self.currentInstance.contentDocument.querySelectorAll('button');
                var saveAsButton = _.find(buttons, function (btn) {
                    return btn.innerText === 'Save As…'
                });
                saveAsButton && (saveAsButton.style.display = 'none');
            }, 1000);
        };

        /**
         * @description load Instant Json to apply the Annotations on the document
         * @return {Promise<void>}
         */
        self.loadInstantJSON = async function () {
            var documentWithOperationsBuffer = null, instance;

            var configuration = {
                baseUrl: self.baseUrl,
                document: self.pdfData,
                headless: true,
                instantJSON: operations.length ? null : instantJSON,
                licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                customFonts: PDFService.customFonts,
                isAPStreamRendered: () => false
            }

            if (configurationService.PSPDF_LICENSE_KEY) {
                delete configuration.licenseKey;
            }

            instance = await PSPDFKit.load(configuration);

            if (operations.length) {
                documentWithOperationsBuffer = await instance.exportPDFWithOperations(operations);
                var configuration = {
                    baseUrl: self.baseUrl,
                    document: documentWithOperationsBuffer,
                    headless: true,
                    instantJSON: instantJSON,
                    licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                    customFonts: PDFService.customFonts,
                    isAPStreamRendered: () => false
                };
                if (configurationService.PSPDF_LICENSE_KEY) {
                    delete configuration.licenseKey;
                }

                instance = await PSPDFKit.load(configuration);
            }

            instance.exportPDF({flatten: flatten})
                .then(function (buffer) {
                    var pdfContent = new Blob([buffer], {type: "application/pdf"});
                    $timeout(function () {
                        dialog.hide(pdfContent);
                    }, 1000);
                });
        };
        /**
         * @description viewer initialization
         */
        self.$onInit = function () {
            _getNextStepFromSeqWF();
            if (self.nextSeqStep && (self.nextSeqStep.isAuthorizeAndSendStep() || _isLastStep())) {
                self.notifyPreviousSteps = true;
            }

            if ((!self.sequentialWF && self.info.docStatus >= 24)) { // || (self.info.isAttachment && self.correspondence.isOfficial)
                self.enableAttachUsernameAndDate = false;
            }
            self.attacheUsernameAndDateToSignature = $cookies.get(cookieKey) ? JSON.parse($cookies.get(cookieKey)) : false;
            self.onAttachToggleChange();
            $timeout(function () {
                if (instantJSON) {
                    return self.loadInstantJSON();
                }
                PSPDFKit.Options.INITIAL_DESKTOP_SIDEBAR_WIDTH = 250;
                var configuration = {
                    baseUrl: self.baseUrl,
                    container: $element.find('#pdf-viewer')[0],
                    document: self.pdfData,
                    isEditableAnnotation: self.userCanEditAnnotation,
                    toolbarItems: makeToolbarItems(),
                    populateInkSignatures: self.populateInkSignatures,
                    licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                    annotationTooltipCallback: self.annotationTooltipCallback,
                    customFonts: PDFService.customFonts,
                    isAPStreamRendered: () => false
                }

                if (configurationService.PSPDF_LICENSE_KEY) {
                    delete configuration.licenseKey;
                }

                PSPDFKit.load(configuration).then(function (instance) {
                    self.currentInstance = instance;
                    // set current annotations for loaded document
                    self.getDocumentAnnotations().then(function (annotations) {
                        self.oldAnnotations = annotations;
                    });
                    self.getDocumentBookmarks().then(function (bookmarks) {
                        self.oldBookmarks = bookmarks.toArray();
                        if (self.oldBookmarks.length && ((self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep()) || self.info.isAttachment)) {
                            self.currentInstance.setViewState(function (state) {
                                return state.set('sidebarMode', PSPDFKit.SidebarMode.BOOKMARKS);
                            });
                        }
                    });
                    self.currentInstance.setAnnotationCreatorName(employeeService.getEmployee().domainName);
                    self.registerEventListeners();
                });
            });
        };

        function _isFromBackStep() {
            return (self.generalStepElementView && typeof self.generalStepElementView.isSeqInBackStep !== "undefined") && self.generalStepElementView.isSeqInBackStep();
        }

        /**
         * @description check if the it is seq and in back step.
         * @return {*}
         */
        self.isSeqBackStep = function () {
            return self.sequentialWF && _isFromBackStep();
        };

        /**
         * @description Checks if back step button can be shown
         * @returns {boolean}
         */
        self.checkCanSendBack = function () {
            if (!self.sequentialWF) {
                return false;
            }
            return !self.isLaunchStep && (self.sequentialWF.getFirstStepId() !== self.nextSeqStep.id);
        };

        /**
         * @description Checks if save and send button can be shown
         * @returns {boolean|boolean}
         */
        self.checkSaveAndSend = function () {
            return !self.sequentialWF && !self.info.isAttachment && (typeof self.correspondence.hasActiveSeqWF !== "undefined") && !self.correspondence.hasActiveSeqWF();
        };

        /**
         * @description Checks if sequential workflow can be reset
         * @returns {boolean|*}
         */
        self.canResetSeqWF = function () {
            return !!self.sequentialWF && employeeService.hasPermissionTo('MULTI_SIGNATURE_RESET')
                && self.info.documentClass.toLowerCase() !== 'incoming'
                && self.correspondence && (typeof self.correspondence.getSeqWFNextStepId !== "undefined") && !!self.correspondence.getSeqWFNextStepId();
        };

        /**
         * @description Terminate sequential workflow
         * @param $event
         * @returns {*}
         */
        self.terminateSEQWF = function ($event) {
            var terminateAction = _.find(self.generalStepElementView.actions, {text: 'grid_action_terminate'});
            var defer = $q.defer();
            defer.promise.then(function () {
                dialog.cancel();
            });
            return terminateAction ? terminateAction.callback(self.correspondence, $event, defer) : null;
        };

        /**
         * @description Check if edit content is enabled
         * @returns {boolean|*}
         */
        self.employeeCanEditContent = function () {
            if (!self.info || self.info.isAttachment) {
                return false;
            }
            var documentClass = (self.info.documentClass + ''),
                permissionName = self.documentClassPermissionMap[documentClass];
            if (typeof permissionName === 'function') {
                permissionName = permissionName(self.info.isPaper);
            }
            return employeeService.hasPermissionTo(permissionName)
                && !!self.sequentialWF
                && (self.info.documentClass.toLowerCase() !== 'incoming')
                && (self.info.docStatus < 23) && !self.info.isPaper;
        };

        /**
         * @description Edit content
         */
        self.toggleCorrespondenceEditMode = function () {
            self.correspondence.manageDocumentContent(null)
                .then(function () {
                    self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                })
                .catch(function () {
                    self.loadUpdatedContent(self.annotationType !== AnnotationType.SIGNATURE);
                });
        };

        self.getUsersDoesNotHaveDocumentSecurityLevel = function (proxyUsers) {
            return _.filter(proxyUsers, function (proxyUser) {
                var proxyUserSecurityLevels = generator.getSelectedCollectionFromResult(self.securityLevels, proxyUser.securityLevels, 'lookupKey');

                return _.every(proxyUserSecurityLevels, function (userSecurityLevel) {
                    if (self.correspondence.hasOwnProperty('securityLevelLookup')) {
                        return userSecurityLevel.lookupKey !== self.correspondence.securityLevelLookup.lookupKey
                    } else {
                        return userSecurityLevel.lookupKey !== self.correspondence.securityLevel.lookupKey
                    }
                });
            })
        }

        function _showProxyMessage(proxies) {
            var proxyUsersNotHaveDocumentSecurityLevel = self.getUsersDoesNotHaveDocumentSecurityLevel(proxies);
            if (proxyUsersNotHaveDocumentSecurityLevel && proxyUsersNotHaveDocumentSecurityLevel.length) {
                dialog.alertMessage(_prepareProxyMessage(proxyUsersNotHaveDocumentSecurityLevel, false));
            }
            var proxyUsersHaveSecurityLevel = _.differenceBy(proxies, proxyUsersNotHaveDocumentSecurityLevel, 'proxyInfo.proxyDomain');
            if (proxyUsersHaveSecurityLevel.length) {
                dialog.alertMessage(_prepareProxyMessage(proxyUsersHaveSecurityLevel, true));
            }
        }

        /**
         * @description prepare proxy Message
         * @param proxyUsers
         * @param isDocumentHaveSecurityLevel
         * @private
         */
        function _prepareProxyMessage(proxyUsers, isDocumentHaveSecurityLevel) {
            var titleMessage = isDocumentHaveSecurityLevel ?
                langService.get('proxy_user_message') :
                langService.get('document_doesnot_have_security_level_as_delegated_user');

            var titleTemplate = angular.element('<span class="validation-title">' + titleMessage + '</span> <br/>');
            titleTemplate.html(titleMessage);

            var tableRows = _.map(proxyUsers, function (proxyUser) {
                return [self.nextSeqStep.toUserInfo.arName, self.nextSeqStep.toUserInfo.enName, proxyUser.arName, proxyUser.enName, proxyUser.proxyDomain, moment(proxyUser.proxyStartDate).format('YYYY-MM-DD'), moment(proxyUser.proxyEndDate).format('YYYY-MM-DD'), proxyUser.proxyMessage];
            });

            var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        }

        /**
         * @description watch destroy event to call disposable method
         */
        $scope.$on('$destroy', function () {
            self.disposable();
        });
    });
};
