module.exports = function (app) {
    app.controller('pdfViewerPopCtrl', function (dialog,
                                                 $scope,
                                                 $element,
                                                 uuidv4,
                                                 PDFService,
                                                 errorCode,
                                                 loadingIndicatorService,
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
                                                 viewTrackingSheetService,
                                                 cmsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'pdfViewerPopCtrl';
        self.pdfData = pdfData;
        self.currentInstance = null;

        self.canRepeatAnnotations = false;

        self.correspondence = correspondence;

        self.annotationType = annotationType;

        self.loadingIndicatorService = loadingIndicatorService;

        self.oldAnnotations = {};

        self.newAnnotations = {};

        self.latestInkAnnotation = null;

        self.skippedPdfObjectIds = [];

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
                }
            };
            var customStampsButton = {
                type: "custom",
                id: "custom-stamps",
                title: "custom stamps",
                icon: "./assets/images/custom-stamps.svg",
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
                onPress: self.printWithOutAnnotations
            };
            var approveButton = {
                type: "custom",
                id: "approve",
                title: "Authorize By digital Signature",
                icon: "./assets/images/approve.svg",
                onPress: self.openSignaturesDialog
            };

            var instanceToolbar = defaultToolbar.concat([printWithoutAnnotationButton, customStampsButton, exportButton]);

            if (self.annotationType === AnnotationType.SIGNATURE) {
                instanceToolbar = instanceToolbar.concat(approveButton)
            } else {
                instanceToolbar = _.filter(instanceToolbar, function (button) {
                    return button.type !== 'ink-signature';
                });
            }
            // barcode Button
            if (self.annotationType === AnnotationType.BARCODE) {
                instanceToolbar = instanceToolbar.concat(barcodeButton);
            }

            return instanceToolbar;
        }

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

            function repeatedAnnotations() {
                return repeated && self.currentInstance.totalPageCount > 1;
            }

            return $q(function (resolve, reject) {
                var imageAnnotations = [];
                $q.all(attachments).then(function (attachmentIds) {
                    attachmentIds = repeatedAnnotations() ? _.fill(new Array(totalPages), attachmentIds[0]) : attachmentIds;
                    _.map(attachmentIds, function (attachmentId, index) {
                        imageAnnotations.push(new PSPDFKit.Annotations.ImageAnnotation({
                            imageAttachmentId: attachmentId,
                            pageIndex: index,
                            contentType: 'image/png',
                            customData: {
                                additionalData: additionalData,
                                id: uuidv4(),
                                pageIndex: index,
                                attachmentId: attachmentId,
                                repeaterHandler: repeatedAnnotations() && pageIndex === index,
                                repeatedAnnotation: []
                            },
                            boundingBox: new PSPDFKit.Geometry.Rect({
                                left: (pageInfo.width / 2) - (size ? (size.width / 2) : 50),
                                top: (pageInfo.height / 2) - (size ? (size.height / 2) : 50),
                                width: size ? size.width : 100,
                                height: size ? size.height : 100,
                            })
                        }));
                    });

                    if (repeatedAnnotations()) {
                        imageAnnotations[pageIndex] = imageAnnotations[pageIndex].set('customData',
                            angular.extend(
                                imageAnnotations[pageIndex].customData,
                                {
                                    repeatedAnnotation: _.map(_.filter(imageAnnotations, function (annotation) {
                                        return !annotation.customData.repeaterHandler;
                                    }), function (annotation) {
                                        return annotation.customData.id;
                                    })
                                }
                            )
                        );
                    }
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
                return self.createAnnotationFromBlob(blob, repeated, null, {type: self.annotationType === AnnotationType.SIGNATURE ? AnnotationType.SIGNATURE : AnnotationType.ANNOTATION});
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
            if (self.currentInstance.totalPageCount > 1) {
                dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('barcode-annotation'),
                    controller: function (_, $sce, barcode, repeatAble) {
                        'ngInject';
                        var ctrl = this;
                        ctrl.barcodeURL = window.URL.createObjectURL(barcode);
                        ctrl.repeatAble = repeatAble;
                        ctrl.repeatOption = false;
                        /**
                         * @description add stamp and close the Stamps dialog.
                         */
                        ctrl.addBarcode = function () {
                            self.addBarcodeAnnotationToPDF(barcode, ctrl.repeatOption, {width: 300, height: 150})
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
                        barcode: function (documentStampService) {
                            'ngInject';
                            return documentStampService
                                .loadAnnotationContent(info.vsId, AnnotationType.BARCODE, info.docClassId);
                        }
                    }
                });
            } else {
                documentStampService
                    .loadAnnotationContent(info.vsId, AnnotationType.BARCODE, info.docClassId)
                    .then(function (blob) {
                        self.addBarcodeAnnotationToPDF(blob, false, {width: 300, height: 150});
                    });
            }
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
         */
        self.printWithOutAnnotations = function ($event) {
            dialog.hide(AnnotationType.SIGNATURE);
            return;
            var updatedAnnotations = [];
            self.getDocumentAnnotations()
                .then(function (annotations) {
                    annotations.map(function (annotation) {
                        annotation = annotation.set('noPrint', true);
                        updatedAnnotations.push(self.currentInstance.updateAnnotation(annotation));
                    });
                    $q.all(updatedAnnotations)
                        .then(function () {
                            self.currentInstance.print();
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
         * @description handel Annotations Changes
         * @param event
         */
        self.handelAnnotationChanges = function (event) {
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
        self.handelCreateInkSignatureAnnotation = function (annotation) {
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
        self.handelDeleteInkSignatureAnnotation = function (annotation) {
            return applicationUserSignatureService.deleteUserInkSignature(annotation.customData.additionalData.vsId);
        };
        /**
         * @description create annotation handler
         * @param annotations
         */
        self.handelCreateAnnotations = function (annotations) {
            var annotation = annotations.first();
            if (annotation instanceof PSPDFKit.Annotations.InkAnnotation && annotation.isSignature && !annotation.customData) {
                self.latestInkAnnotation = annotation;
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
            self.currentInstance.removeEventListener('annotations.willChange', self.handelAnnotationChanges);
            self.currentInstance.removeEventListener("inkSignatures.create", self.handelCreateInkSignatureAnnotation);
            self.currentInstance.removeEventListener("inkSignatures.delete", self.handelDeleteInkSignatureAnnotation);
            self.currentInstance.removeEventListener("annotations.create", self.handelCreateAnnotations);
            try {
                PSPDFKit.unload($element.find('#pdf-viewer')[0]);
            } catch (e) {

            }
        };
        /**
         * @default handle success Authorize
         * @param result
         */
        self.handelSuccessAuthorize = function (result) {
            if (result === correspondenceService.authorizeStatus.PARTIALLY_AUTHORIZED.text) {
                self.sendAnnotationLogs();

                toast.success(langService.get('sign_specific_success').change({name: self.correspondence.getTranslatedName()}));
                dialog
                    .confirmMessage(langService.get('book_needs_more_signatures_launch_to_user').change({name: self.correspondence.getTranslatedName()}))
                    .then(function () {
                        return self.correspondence.launchWorkFlow(null, 'forward', 'favorites')
                            .then(dialog.hide)
                            .catch(self.handelExceptions);
                    }).catch(dialog.hide);
            } else if (result === correspondenceService.authorizeStatus.SAME_USER_AUTHORIZED.text) {
                dialog
                    .confirmMessage(langService.get('confirm_authorize_same_user').change({user: employeeService.getEmployee().getTranslatedName()}))
                    .then(function () {
                        self.saveDocumentAnnotations(true);
                    });
            } else {
                self.sendAnnotationLogs(function () {
                    dialog.hide();
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
            return annotationLogService.applyAnnotationChanges(self.oldAnnotations, self.newAnnotations, self.correspondence)
                .then(function () {
                    if (successCallback)
                        successCallback();
                })
                .catch(function (error) {
                    if (errorCallback)
                        errorCallback(error);
                });
        };
        /**
         * @default handel all expected exceptions.
         * @param error
         */
        self.handelExceptions = function (error) {
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
            }
        };
        /**
         * @description save document annotations
         * @param ignoreValidationSignature
         */
        self.saveDocumentAnnotations = function (ignoreValidationSignature) {
            var info = self.correspondence.getInfo();
            self.getDocumentAnnotations().then(function (newAnnotations) {
                self.newAnnotations = newAnnotations;
                if (self.annotationType === AnnotationType.SIGNATURE) {
                    self.currentInstance.exportPDF({flatten: info.signaturesCount === 1}).then(function (buffer) {
                        var pdfContent = new Blob([buffer], {type: 'application/pdf'});
                        self.correspondence
                            .handelPinCodeAndCompositeThenCompleteAuthorization(pdfContent, ignoreValidationSignature)
                            .then(self.handelSuccessAuthorize)
                            .catch(self.handelExceptions);
                    });
                } else {
                    self.currentInstance.exportInstantJSON().then(function (instantJSON) {
                        delete instantJSON.pdfId;

                        instantJSON.skippedPdfObjectIds = _.difference(instantJSON.skippedPdfObjectIds, self.skippedPdfObjectIds);

                        PDFService.applyAnnotationsOnPDFDocument(self.correspondence, AnnotationType.ANNOTATION, instantJSON)
                            .then(function (pdfContent) {
                                self.skippedPdfObjectIds = self.skippedPdfObjectIds.concat(instantJSON.skippedPdfObjectIds);
                                if (self.correspondence instanceof Attachment) {
                                    self.correspondence.file = pdfContent;
                                    attachmentService.updateAttachment(attachedBook, self.correspondence)
                                        .then(function () {
                                            toast.success(langService.get('save_success'));
                                            dialog.hide();
                                        }).catch(self.handelExceptions);
                                } else {
                                    if (info.isPaper) {
                                        self.correspondence.addDocumentContentFile(pdfContent).then(function () {
                                            toast.success(langService.get('save_success'));
                                            self.sendAnnotationLogs();
                                        }).catch(self.handelExceptions);
                                    } else {
                                        self.correspondence.addAnnotationAsAttachment(pdfContent).then(function () {
                                            toast.success(langService.get('save_success'));
                                            dialog.hide();
                                        }).catch(self.handelExceptions);
                                    }
                                }
                            });
                    });
                }
            }); // get document annotations
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
         * @description viewer initialization
         */
        self.$onInit = function () {
            $timeout(function () {
                // PSPDFKit.Options.IGNORE_DOCUMENT_PERMISSIONS = true;
                PSPDFKit.load({
                    baseUrl: location.protocol + '//' + location.host + '/node_modules/pspdfkit/dist/',
                    container: $element.find('#pdf-viewer')[0],
                    document: self.pdfData,
                    instantJSON: instantJSON,
                    isEditableAnnotation: self.userCanEditAnnotation,
                    toolbarItems: makeToolbarItems(function () {
                        return self.currentInstance;
                    }),
                    populateInkSignatures: function () {
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
                    },
                    licenseKey: 'VGY-5RnVwIvECCo92mgVKqwBhdffibQ7xdO_3dVCUPBFJuvQhE3FYbuzLsxjOGmLBwfN18npbT52undRB5-CP3Lvb4oU3BLqmaFUMR2lzxvvXQpGfNOkU47LpA1j4yvR46aUZJiqc26xKUg4kbKPQm49UeY7Z00hjTJOzL4xk49pe0-B9VH958oeawkXUqzmhnjwKo_Fq7VwR_24-_OVhii3qXOsHXbEUpHTR7uFA4Xwc1mFsBpqIis3X_JLCTQ8gcuIH2Ab4AkHv1sgD8Ugv7CpwAzdOwHCz2Jl5qRK0u9c08yyrT-0Wn7htmoMZuttHZXu8CStgLyyKtMeH0uiwm4KTXVKB7oN0dSElT0ifLsazf_ABlmxYjf-JAx5HG4C0pElg2Dc4-7Ru_lz-HCIOn52UzcAZUTKBRcpAs_7uUSaS7r0YH0chnTOj8ExP9c2'
                }).then(function (instance) {
                    self.currentInstance = instance;
                    if (instantJSON) {
                        self.currentInstance.exportPDF({flatten: flatten})
                            .then(function (buffer) {
                                var pdfContent = new Blob([buffer], {type: "application/pdf"});
                                $timeout(function () {
                                    dialog.hide(pdfContent);
                                }, 1000);
                            });
                    } else {
                        // set current annotations for loaded document
                        self.getDocumentAnnotations().then(function (annotations) {
                            self.oldAnnotations = annotations;
                        });
                    }
                    self.canRepeatAnnotations = self.isAbleToRepeatAnnotations();
                    self.currentInstance.setAnnotationCreatorName(employeeService.getEmployee().domainName);
                    self.currentInstance.addEventListener("annotations.willChange", self.handelAnnotationChanges);
                    self.currentInstance.addEventListener("inkSignatures.create", self.handelCreateInkSignatureAnnotation);
                    self.currentInstance.addEventListener("inkSignatures.delete", self.handelDeleteInkSignatureAnnotation);
                    self.currentInstance.addEventListener("annotations.create", self.handelCreateAnnotations);
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
