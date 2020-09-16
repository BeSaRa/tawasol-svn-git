module.exports = function (app) {
    app.controller('pdfViewerPopCtrl', function (dialog,
                                                 $scope,
                                                 $element,
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
        self.canRepeatAnnotations = false;
        // current document meta data
        self.correspondence = correspondence;
        // current annotation mode to load the document from right service and set the annotation types for all signature Annotations (ink,Imag)
        self.annotationType = annotationType;
        // loading  service
        self.loadingIndicatorService = loadingIndicatorService;
        // all document annotations after load the document
        self.oldAnnotations = {};
        // all document annotations after click on  save button
        self.newAnnotations = {};
        // used to save last ink annotation from signature dialog to update it later after set the vsId
        self.latestInkAnnotation = null;
        // the skipped pdf Object , will use it later
        self.skippedPdfObjectIds = [];
        // all document operations
        self.documentOperations = [];

        self.baseUrl = (location.protocol + '//' + location.host + '/' + (configurationService.APP_CONTEXT ? configurationService.APP_CONTEXT + '/' : ''));

        // document information
        self.info = self.correspondence.getInfo();

        self.sequentialWF = sequentialWF;

        self.nextSeqStep = null;

        self.isLaunchStep = false;

        self.disableSaveButton = false;

        self.unlinkInProgress = false;

        self.savedPdfContent = null;

        console.log('correspondence', correspondence);

        self.isStampEnabled = rootEntity.getGlobalSettings().stampModuleEnabled;

        self.excludedRepeatedAnnotations = [
            'Note'
        ];

        self.readyToExportExcludedAnnotationList = [
            "annotate",
            "ink",
            "highlighter",
            "text-highlighter",
            "ink-eraser",
            "ink-signature",
            "image",
            "note",
            "text",
            "line",
            "arrow",
            "rectangle",
            "ellipse",
            "polyline",
            "polygon",
            "document-editor",
            "approve",
            // "barcode",
        ];

        self.generalStepElementView = generalStepElementView;

        function _getFlattenStatus(hasMySignature) {
            if (typeof hasMySignature === 'undefined') {
                return !!(self.sequentialWF && self.sequentialWF.getLastStepId() === self.nextSeqStep.id) || (self.info && !self.info.isAttachment && !self.info.isPaper && self.info.signaturesCount === 1);
            } else {
                return !!(self.sequentialWF && self.sequentialWF.getLastStepId() === self.nextSeqStep.id) || (self.info && !self.info.isAttachment && !self.info.isPaper && self.info.signaturesCount === 1 && hasMySignature);
            }
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
            return (self.readyToExportExcludedAnnotationList.indexOf(item) !== -1)
        }

        /**
         * @description create custom buttons and attache it to  viewer toolbar.
         * @param getInstance
         * @param callback
         * @return {*}
         */
        function makeToolbarItems(getInstance, callback) {
            var defaultToolbar = angular.copy(PSPDFKit.defaultToolbarItems);
            if (typeof callback !== "function") {
                callback = () => {
                };
            }
            var exportButton = {
                type: "custom",
                id: "export-pdf",
                title: "Export",
                icon: "./assets/images/download.svg",
                onPress: function () {
                    self.exportDocument(getInstance, callback);
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
            // remove default print from toolbar
            var toolbarInstance = _.filter(defaultToolbar.concat([printWithoutAnnotationButton]), function (item) {
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
                disabled: !(employeeService.hasPermissionTo('PRINT_DOCUMENT')),
                onPress: function (e) {
                    self.printWithOutAnnotations(e, false);
                }
            });
            console.log('Toolbar', toolbarInstance);
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
                (self.info.docStatus < 23 && !self.sequentialWF && !self.correspondence.hasActiveSeqWF() || self.info.docStatus < 23 && self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep()) &&
                self.annotationType !== AnnotationType.SIGNATURE &&
                !self.info.isPaper
            ) {
                var permission = self.info.documentClass === 'outgoing' ? 'ELECTRONIC_SIGNATURE' : 'ELECTRONIC_SIGNATURE_MEMO';
                openForApprovalButton.disabled = !employeeService.hasPermissionTo(permission);
                toolbarInstance.push(openForApprovalButton);
            }

            if (self.info.docStatus === 24 && self.info.documentClass === 'outgoing') {
                toolbarInstance = toolbarInstance.filter(item => {
                    return item.type === 'custom' ? !_itemInExcludedList(item.id) : !_itemInExcludedList(item.type);
                });
            }

            if (_isElectronicAndAuthorizeByAnnotationBefore() && !rootEntity.getGlobalSettings().allowEditAfterFirstApprove) {
                toolbarInstance = toolbarInstance.filter(item => item.type !== 'document-editor');
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
            return AnnotationType.SIGNATURE;
            // return (self.annotationType === AnnotationType.SIGNATURE || (self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep())) ? AnnotationType.SIGNATURE : (_isElectronicAndAuthorizeByAnnotationBefore() && self.correspondence instanceof WorkItem ? AnnotationType.SIGNATURE : AnnotationType.ANNOTATION)
        }

        function _isElectronicAndAuthorizeByAnnotationBefore() {
            // return (self.info.docStatus === 23 && !self.info.isPaper && (self.correspondence.getAuthorizeByAnnotationStatus() || (self.sequentialWF && self.nextSeqStep.isAuthorizeAndSendStep())))
            return self.info.docStatus === 23 && !self.info.isPaper && self.correspondence.getAuthorizeByAnnotationStatus();
        }

        /**
         * @description select given annotation
         * @param annotation
         */
        self.selectAnnotation = function (annotation) {
            self.currentInstance
                .setEditingAnnotation(annotation, false);
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
                    resolve(blob);
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
                                top: (pageInfo.height / 2) - (size ? (size.height / 2) : 50),
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
        self.addAnnotationToPDFDocument = function (annotation) {
            return self.currentInstance.createAnnotation(annotation);
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
            }).then(function (blob) {
                return self.createAnnotationFromBlob(blob, repeated, null, {type: AnnotationType.STAMP});
            }).then(function (annotations) {
                var promises = [];
                _.each(annotations, function (annotation) {
                    promises.push(self.addAnnotationToPDFDocument(annotation));
                });
                return $q.all(promises)
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
            }).then(function (blob) {
                return self.createAnnotationFromBlob(blob, repeated, null, {type: _getRightTypeForElectronicSignature()});
            }).then(function (annotations) {
                var promises = [];
                _.each(annotations, function (annotation) {
                    promises.push(self.addAnnotationToPDFDocument(annotation));
                });
                return $q.all(promises)
            }).then(function (annotations) {
                annotations.length === 1 ? self.selectAnnotation(annotations[0]) : null;
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
                return self.createAnnotationFromBlob(blob, repeated, size, {type: AnnotationType.BARCODE});
            }).then(function (annotations) {
                var promises = [];
                _.each(annotations, function (annotation) {
                    promises.push(self.addAnnotationToPDFDocument(annotation));
                });
                return $q.all(promises);
            }).then(function (annotations) {
                annotations.length === 1 ? self.selectAnnotation(annotations[0]) : null;
            });
        };
        /**
         * @description download document
         * @param getInstance
         * @param callback
         */
        self.exportDocument = function (getInstance, callback) {
            getInstance()
                .exportPDF()
                .then(buffer => {
                    var supportsDownloadAttribute = HTMLAnchorElement.prototype.hasOwnProperty(
                        "download"
                    );
                    var blob = new Blob([buffer], {type: "application/pdf"});
                    if (navigator.msSaveOrOpenBlob) {
                        navigator.msSaveOrOpenBlob(blob, "download.pdf");
                        callback();
                    } else if (!supportsDownloadAttribute) {
                        var reader = new FileReader();
                        reader.onloadend = () => {
                            var dataUrl = reader.result;
                            downloadPdf(dataUrl);
                            callback();
                        };
                        reader.readAsDataURL(blob);
                    } else {
                        var objectUrl = window.URL.createObjectURL(blob);
                        downloadPdf(objectUrl);
                        window.URL.revokeObjectURL(objectUrl);
                        callback();
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
                        if (self.inprogress) {
                            return;
                        }
                        self.inprogress = true;
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
                    repeatAble: self.canRepeatAnnotations
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
                    repeatAble: self.canRepeatAnnotations
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
                        annotation = annotation.set('noPrint', noPrintValue);
                        updatedAnnotations.push(self.currentInstance.updateAnnotation(annotation));
                    });
                    $q.all(updatedAnnotations)
                        .then(function () {
                            self.currentInstance.print(noPrintValue ? PSPDFKit.PrintMode.DOM : PSPDFKit.PrintMode.EXPORT_PDF);
                        });
                })
        };
        /**
         * @description close pdfViewer
         */
        self.closeDialog = function () {
            dialog.cancel();
        };
        /**
         * @description get all document annotations
         * @returns {Promise<[]>}
         */
        self.getDocumentAnnotations = function () {
            var pageCount = self.currentInstance.totalPageCount;
            var pagesAnnotations = [], annotations = [];
            _.map(_.range(pageCount), function (pageIndex) {
                pagesAnnotations.push(self.currentInstance.getAnnotations(Number(pageIndex)));
            });
            return $q.all(pagesAnnotations)
                .then(function (pages) {
                    _.map(pages, function (pageAnnotation) {
                        pageAnnotation.forEach(function (annotation) {
                            annotations.push(annotation);
                        })
                    });
                    return annotations;
                });
        };
        /**
         * @description handle Annotations Changes
         * @param event
         */
        self.handleAnnotationChanges = function (event) {
            var annotation = event.annotations.get(0), promises = [];
            if (!annotation)
                return;

            var boundingBox = annotation.get('boundingBox');

            var eventListenerList = [
                PSPDFKit.AnnotationsWillChangeReason.DELETE_END,
                PSPDFKit.AnnotationsWillChangeReason.MOVE_END,
                PSPDFKit.AnnotationsWillChangeReason.RESIZE_END
            ];
            if (eventListenerList.indexOf(event.reason) !== -1 && annotation.customData && annotation.customData.repeaterHandler && annotation.customData.repeatedAnnotation) {
                self.getDocumentAnnotations().then(function (annotations) {
                    annotations.forEach(function (annotationItem) {
                        if (annotationItem.customData && annotationItem.customData.id && annotation.customData.repeatedAnnotation.indexOf(annotationItem.customData.id) !== -1) {
                            if (event.reason === PSPDFKit.AnnotationsWillChangeReason.DELETE_END) {
                                return self.currentInstance.deleteAnnotation(annotationItem.id);
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
                            return self.currentInstance.updateAnnotation(annotationItem);
                        }
                    });
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

                    var customData = angular.extend(annotation.customData);
                    customData.additionalData.vsId = vsId;
                    self.latestInkAnnotation = self.latestInkAnnotation.set('customData', customData);

                    return self.currentInstance.getInkSignatures().then(function (signatures) {
                        signatures = signatures.splice(signatures.size - 1, 1, self.latestInkAnnotation);
                        return self.currentInstance.setInkSignatures(signatures).then(function () {
                            return self.currentInstance.updateAnnotation(self.latestInkAnnotation).then(function () {
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
            return applicationUserSignatureService.deleteUserInkSignature(annotation.customData.additionalData.vsId);
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
                delete customData.id;

                var updatedAnnotation = annotation
                    // .set('isSignature', _getRightTypeForElectronicSignature() !== 1)
                    .set('customData', customData);
                return self.currentInstance.updateAnnotation(updatedAnnotation);
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
            return self.currentInstance.totalPageCount > 1 && self.isAllPageSameSize();
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
            }
            try {
                PSPDFKit.unload($element.find('#pdf-viewer')[0]);
            } catch (e) {

            }
        };
        /**
         * @default handle success Authorize
         * @param result
         */
        self.handleSuccessAuthorize = function (result) {
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
                        dialog.hide({
                            content: self.savedPdfContent,
                            action: PDFViewer.CANCEL_LAUNCH
                        });
                    });
            } else if (result === correspondenceService.authorizeStatus.SAME_USER_AUTHORIZED.text) {
                dialog
                    .confirmMessage(langService.get('confirm_authorize_same_user').change({user: employeeService.getEmployee().getTranslatedName()}))
                    .then(function () {
                        self.saveDocumentAnnotations(true);
                    });
            } else {
                self.sendAnnotationLogs(function () {
                    dialog.hide({
                        content: self.savedPdfContent,
                        action: PDFViewer.JUST_AUTHORIZE
                    });
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
            return annotationLogService.applyAnnotationChanges(self.oldAnnotations, self.newAnnotations, self.correspondence)
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
         */
        self.handleSaveAttachment = function (pdfContent) {
            self.correspondence.file = pdfContent;
            self.correspondence.sourceType = 1;
            attachmentService.updateAttachment(attachedBook, self.correspondence)
                .then(function () {
                    self.disableSaveButton = false;
                    toast.success(langService.get('save_success'));
                    dialog.hide({
                        content: self.savedPdfContent,
                        type: 'ATTACHMENT',
                        action: PDFViewer.UPDATE_ATTACHMENT
                    });
                }).catch(self.handleExceptions);
        };
        /**
         * @description handle open for approval save action.
         * @param ignoreValidationSignature
         */
        self.handleOpenForApprovalSave = function (ignoreValidationSignature) {
            self.isDocumentHasCurrentUserSignature().then(function () {
                self.getPDFContentForCurrentDocument().then(function (pdfContent) {
                    self.savedPdfContent = pdfContent;
                    self.correspondence
                        .handlePinCodeAndCompositeThenCompleteAuthorization(pdfContent, ignoreValidationSignature)
                        .then(self.handleSuccessAuthorize)
                        .catch(self.handleExceptions);
                });
            }).catch(function () {
                self.disableSaveButton = false;
                toast.error(langService.get('provide_signature_to_proceed'));
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
                    result ? resolve(result) : reject(result);
                });
            });
        };
        /**
         * @description handle update document content
         * @param pdfContent
         * @param annotationType
         */
        self.handleUpdateDocumentContent = function (pdfContent, annotationType) {
            self.correspondence.updateDocumentContentByAnnotation(pdfContent, annotationType).then(function () {
                toast.success(langService.get('save_success'));
                self.disableSaveButton = false;
                self.sendAnnotationLogs();
                dialog.hide({
                    content: self.savedPdfContent,
                    action: PDFViewer.UPDATE_DOCUMENT_CONTENT
                });
            }).catch(self.handleExceptions);
        };
        /**
         * @description save annotations as attachments
         * @param pdfContent
         */
        self.handleSaveAnnotationAsAttachment = function (pdfContent) {
            self.correspondence.addAnnotationAsAttachment(pdfContent).then(function (attachment) {
                toast.success(langService.get('save_success'));
                self.disableSaveButton = false;
                dialog.hide({
                    content: self.savedPdfContent,
                    type: 'ATTACHMENT',
                    action: PDFViewer.ADD_ATTACHMENT
                });
            }).catch(self.handleExceptions);
        };
        /**
         * @description handle none signature save part
         */
        self.handleSaveNoneSignaturePart = function (ignoreValidationSignature) {
            self.currentInstance.exportInstantJSON().then(async function (instantJSON) {
                delete instantJSON.pdfId;
                instantJSON.skippedPdfObjectIds = _.difference(instantJSON.skippedPdfObjectIds, self.skippedPdfObjectIds);
                var hasMySignature = await self.isDocumentHasCurrentUserSignature().catch(result => result);
                PDFService.applyAnnotationsOnPDFDocument(self.correspondence, AnnotationType.ANNOTATION, instantJSON, self.documentOperations, _getFlattenStatus(hasMySignature))
                    .then(function (pdfContent) {
                        self.savedPdfContent = pdfContent;
                        self.skippedPdfObjectIds = self.skippedPdfObjectIds.concat(instantJSON.skippedPdfObjectIds);
                        if (self.correspondence instanceof Attachment) {
                            self.handleSaveAttachment(pdfContent);
                        } else {
                            if (self.info.isPaper) {
                                self.info.docStatus === 25 ? self.handleSaveAnnotationAsAttachment(pdfContent) : self.handleUpdateDocumentContent(pdfContent);
                            } else if (_isElectronicAndAuthorizeByAnnotationBefore()) {
                                if (hasMySignature) {
                                    self.correspondence.handlePinCodeAndCompositeThenCompleteAuthorization(pdfContent, ignoreValidationSignature)
                                        .then(self.handleSuccessAuthorize)
                                        .catch(self.handleExceptions);
                                } else {
                                    self.handleUpdateDocumentContent(pdfContent);
                                }
                            } else {
                                // for electronic document in ready to export
                                self.info.docStatus === 24 && self.info.documentClass === 'outgoing' ? self.handleUpdateDocumentContent(pdfContent, AnnotationType.STAMP) : self.handleSaveAnnotationAsAttachment(pdfContent);
                            }
                        }
                    });
            });
        };
        /**
         * @description save document annotations
         * @param ignoreValidationSignature
         */
        self.saveDocumentAnnotations = function (ignoreValidationSignature) {
            if (self.disableSaveButton) {
                return null;
            }
            self.disableSaveButton = true;
            self.getDocumentAnnotations().then(function (newAnnotations) {
                self.newAnnotations = newAnnotations;
                var hasChanges = annotationLogService.getAnnotationsChanges(self.oldAnnotations, self.newAnnotations);
                if (!hasChanges.length && !self.documentOperations.length) {
                    dialog.infoMessage(langService.get('there_is_no_changes_to_save'));
                    self.disableSaveButton = false;
                    return;
                }

                if (self.annotationType === AnnotationType.SIGNATURE) {
                    self.handleOpenForApprovalSave(ignoreValidationSignature);
                } else {
                    self.handleSaveNoneSignaturePart(ignoreValidationSignature);
                }
            }); // get document annotations
        };
        /**
         * @description display sequentialWF Steps
         * @return {promise}
         */
        self.displaySeqWFSteps = function () {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('view-seq-wf-steps'),
                locals: {
                    correspondence: self.correspondence,
                    sequentialWF: self.sequentialWF
                },
                controllerAs: 'ctrl',
                bindToController: true,
                controller: function (dialog) {
                    'ngInject';
                    var ctrl = this;
                    ctrl.closePopup = function () {
                        dialog.cancel();
                    }
                }
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
            signatureModel.setValidateMultiSignature(!ignoreValidateMultiSignature);
            signatureModel.setSeqWFId(self.sequentialWF.id);
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
                    toast.success(langService.get('launch_success_distribution_workflow'));
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
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide({
                        content: self.savedPdfContent,
                        action: PDFViewer.SEQ_LAUNCHED
                    });
                });
        };
        /**
         * @description start Next Step Validation to launch or advance seq workflow.
         */
        self.startNextStepValidation = function () {
            if (self.disableSaveButton) {
                return null;
            }
            self.disableSaveButton = true;
            self.getDocumentAnnotations()
                .then(function (newAnnotations) {
                    self.newAnnotations = newAnnotations;
                    if (self.nextSeqStep.isAuthorizeAndSendStep()) {
                        self.isDocumentHasCurrentUserSignature()
                            .then(function () {
                                if (self.annotationType === AnnotationType.SIGNATURE) {
                                    self.getPDFContentForCurrentDocument()
                                        .then(function (pdfContent) {
                                            self.correspondence.handlePinCodeAndComposite().then(function (signatureModel) {
                                                self.applyNextStepOnCorrespondence(pdfContent, signatureModel, true).catch(self.handleSeqExceptions);
                                            }).catch(self.handleExceptions);
                                        });
                                } else {
                                    self.currentInstance.exportInstantJSON().then(function (instantJSON) {
                                        delete instantJSON.pdfId;
                                        PDFService.applyAnnotationsOnPDFDocument(self.correspondence, self.annotationType, instantJSON, self.documentOperations, _getFlattenStatus()).then(function (pdfContent) {
                                            self.correspondence.handlePinCodeAndComposite().then(function (signatureModel) {
                                                self.applyNextStepOnCorrespondence(pdfContent, signatureModel, true).catch(self.handleSeqExceptions);
                                            }).catch(self.handleExceptions);
                                        });
                                    });
                                }
                            })
                            .catch(function () {
                                self.disableSaveButton = false;
                                toast.error(langService.get('provide_signature_to_proceed'));
                            });
                    } else { // else nextSeqStep.isAuthorizeAndSendStep()
                        var hasChanges = annotationLogService.getAnnotationsChanges(self.oldAnnotations, self.newAnnotations);
                        if (!hasChanges.length && !self.documentOperations.length) {
                            return self.applyNextStepOnCorrespondence(null).catch(self.handleSeqExceptions);
                        }
                        self.currentInstance.exportInstantJSON().then(function (instantJSON) {
                            delete instantJSON.pdfId;
                            PDFService.applyAnnotationsOnPDFDocument(self.correspondence, self.annotationType, instantJSON, self.documentOperations, _getFlattenStatus()).then(function (pdfContent) {
                                self.applyNextStepOnCorrespondence(pdfContent, null, true).catch(self.handleSeqExceptions);
                            });
                        });
                    } // end nextSeqStep.isAuthorizeAndSendStep()
                }); //end getDocumentAnnotations
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
            } else if (annotation instanceof PSPDFKit.Annotations.ImageAnnotation && annotation.customData && annotation.customData.additionalData.type === AnnotationType.SIGNATURE && annotation.creatorName !== employee.domainName) {
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
                onPress: function () {
                    var currentPageIndex = annotation.pageIndex, boundingBox = annotation.boundingBox,
                        totalPages = self.currentInstance.totalPageCount, duplicated = [],
                        customData = angular.copy(annotation.customData) || {}, updatedAnnotation = null,
                        parentId = uuidv4();

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

                        currentDuplicated = annotation
                            .set('id', null)
                            .set('pageIndex', i)
                            .set('customData', customDuplicatedData)
                            .set('boundingBox', boundingBox);

                        duplicated.push(currentDuplicated);
                        self.currentInstance.createAnnotation(currentDuplicated);
                    }

                    updatedAnnotation = annotation.set('customData', {
                        ...customData,
                        repeaterHandler: true,
                        id: parentId,
                        repeatedAnnotation: _.map(duplicated, function (item) {
                            return item.customData.id;
                        })
                    });
                    self.currentInstance.updateAnnotation(updatedAnnotation);

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
                        updatedCustomData = angular.copy(customData);
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
                                self.currentInstance.updateAnnotation(updatedAnnotation);
                            });
                            self.currentInstance.updateAnnotation(updatedAnnotation);
                        } else {
                            delete updatedCustomData.parentId;
                            var parentAnnotation = _.find(annotations, function (annotation) {
                                return annotation.customData && annotation.customData.id === customData.parentId;
                            });
                            parentAnnotation.customData.repeatedAnnotation.splice(parentAnnotation.customData.repeatedAnnotation.indexOf(annotation.customData.id), 1);
                            if (!parentAnnotation.customData.repeatedAnnotation.length) {
                                delete parentAnnotation.customData.repeaterHandler;
                                delete parentAnnotation.customData.repeatedAnnotation;
                            }
                            updatedAnnotation = annotation.set('customData', updatedCustomData);
                            self.currentInstance.updateAnnotation(updatedAnnotation);
                            self.currentInstance.updateAnnotation(parentAnnotationUpdate);
                        }
                        self.unlinkInProgress = false;
                    });

                }
            };

            if (self.canRepeatAnnotations && !_isRepeaterChild(annotation) && !_isRepeaterRoot(annotation)) {
                tooltipItems.push(replicationButton);
            }

            if (annotation.customData && (_isRepeaterChild(annotation) || _isRepeaterRoot(annotation))) {
                tooltipItems.push(unlinkButton);
            }

            return tooltipItems;
        };
        /**
         * @description to register all event listener that we need during annotate the document.
         */
        self.registerEventListeners = function () {
            self.currentInstance.addEventListener("annotations.willChange", self.handleAnnotationChanges);
            self.currentInstance.addEventListener("inkSignatures.create", self.handleCreateInkSignatureAnnotation);
            self.currentInstance.addEventListener("inkSignatures.delete", self.handleDeleteInkSignatureAnnotation);
            self.currentInstance.addEventListener("annotations.create", self.handleCreateAnnotations);
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
        };

        self.loadInstantJSON = async function () {
            var documentWithOperationsBuffer = null, instance;
            instance = await PSPDFKit.load({
                baseUrl: self.baseUrl,
                document: self.pdfData,
                headless: true,
                instantJSON: operations.length ? null : instantJSON,
                licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey
            });

            if (operations.length) {
                documentWithOperationsBuffer = await instance.exportPDFWithOperations(operations);
                instance = await PSPDFKit.load({
                    baseUrl: self.baseUrl,
                    document: documentWithOperationsBuffer,
                    headless: true,
                    instantJSON: instantJSON,
                    licenseKey: self.licenseKey
                });
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
            $timeout(function () {
                if (instantJSON) {
                    return self.loadInstantJSON();
                }
                // PSPDFKit.Options.IGNORE_DOCUMENT_PERMISSIONS = true;
                PSPDFKit.load({
                    baseUrl: self.baseUrl,
                    container: $element.find('#pdf-viewer')[0],
                    document: self.pdfData,
                    isEditableAnnotation: self.userCanEditAnnotation,
                    toolbarItems: makeToolbarItems(function () {
                        return self.currentInstance;
                    }),
                    populateInkSignatures: self.populateInkSignatures,
                    licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                    annotationTooltipCallback: self.annotationTooltipCallback
                }).then(function (instance) {
                    self.currentInstance = instance;
                    // set current annotations for loaded document
                    self.getDocumentAnnotations().then(function (annotations) {
                        self.oldAnnotations = annotations;
                    });
                    self.canRepeatAnnotations = self.isAbleToRepeatAnnotations();
                    self.currentInstance.setAnnotationCreatorName(employeeService.getEmployee().domainName);
                    self.registerEventListeners();
                });
            });
        };
        /**
         * @description watch destroy event to call disposable method
         */
        $scope.$on('$destroy', function () {
            self.disposable();
        });
    });
};
