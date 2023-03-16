module.exports = function (app) {
    app.service('annotationLogService', function (_, PSPDFKit, AnnotationType, ActionItemOperation, AnnotationLogType, $q, $http, urlService) {
        'ngInject';
        var self = this;
        self.serviceName = 'annotationLogService';

        self.oldAnnotations = {};

        self.newAnnotations = {};

        self.oldBookmarks = {};

        self.newBookmarks = {};

        self.documentOperations = [];

        /**
         * @description get annotation Ink number
         * @param annotation
         * @return {number}
         * @private
         */
        function _getInkType(annotation) {
            return annotation.isSignature ? AnnotationLogType.TawasolSignature : AnnotationLogType.InkAnnotation;
        }

        /**
         * @description get Annotation number from AnnotationType enum
         * @param annotation
         * @return {number}
         * @private
         */
        function _getImageType(annotation) {
            if (!annotation.customData || !annotation.customData.hasOwnProperty("additionalData") || annotation.customData.additionalData.type === AnnotationType.ANNOTATION) {
                return AnnotationLogType.ImageAnnotation;
            } else if (annotation.customData.additionalData.type === AnnotationType.SIGNATURE) {
                return AnnotationLogType.TawasolSignature;
            } else if (annotation.customData.additionalData.type === AnnotationType.STAMP) {
                return AnnotationLogType.TawasolStamp;
            } else if (annotation.customData.additionalData.type === AnnotationType.BARCODE) {
                return AnnotationLogType.TawasolBarcode;
            }
        }

        /**
         * @description create Object from Collection based on given key.
         * @param collection
         * @param key
         * @return {{}}
         */
        function _createObjectFromCollection(collection, key) {
            var returnValue = {};
            _.map(collection, function (item) {
                returnValue[item[key]] = item;
            });
            return returnValue;
        }

        /**
         * @description send Annotation log to the server
         * @param annotationLogs
         * @param correspondence
         * @return {Promise<boolean>}
         * @private
         */
        function _sendAnnotationLogToServer(annotationLogs, correspondence) {
            var info = correspondence.getInfo();
            return $http.post(urlService.vts_annotationLog.change({vsId: info.vsId}), annotationLogs).then(function (result) {
                return result.data.rs;
            });
        }

        /**
         * @description get annotation type if it Image or other types
         * @param annotation
         * @return {Number}
         * @private
         */
        function _getImageOrOtherAnnotationType(annotation) {
            return annotation instanceof PSPDFKit.Annotations.ImageAnnotation ? _getImageType(annotation) : AnnotationLogType[annotation.constructor.readableName + 'Annotation']
        }

        /**
         * @description
         * @param annotation
         * @private
         */
        function _getAnnotationType(annotation) {
            return annotation instanceof PSPDFKit.Annotations.InkAnnotation ? _getInkType(annotation) : _getImageOrOtherAnnotationType(annotation);
        }

        /**
         * @description map annotation type to be ready for sending to the server
         * @param annotation
         * @private
         */
        function _mapAnnotationType(annotation) {
            if (annotation.constructor.hasOwnProperty('readableName')) {
                annotation.annotationType = _getAnnotationType(annotation);
            } else {
                annotation.annotationType = AnnotationLogType.UnknownAnnotation;
            }
            return {
                annotationType: annotation.annotationType,
                actionItemType: annotation.actionItemType
            };
        }


        /**
         * @description to prepare the log list to be ready to send to the server.
         * @param collection
         * @return {Array}
         * @private
         */
        function _generateAnnotationsList(collection) {
            return _.map(collection, _mapAnnotationType);
        }

        function _checkNoteIsUpdated(oldNote, newNote) {
            return _sizeAndPositionUpdated(oldNote, newNote) ||
                _checkIsColorsUpdated(oldNote.color, newNote.color) ||
                _checkTextUpdated(oldNote.text, newNote.text) ||
                _checkTextUpdated(oldNote.icon, newNote.icon);
        }

        function _checkTextUpdated(oldText, newText) {
            return oldText !== newText;
        }

        function _checkIsColorsUpdated(oldColor, newColor) {
            return oldColor.r !== newColor.r || oldColor.b !== newColor.b || oldColor.g !== newColor.g;
        }


        /**
         * @description check if the annotation updated
         * @param id
         * @return {boolean}
         * @private
         */
        function _isAnnotationUpdated(id) {
            var oldAnnotation = self.oldAnnotations[id];
            var newAnnotation = self.newAnnotations[id];
            if (oldAnnotation instanceof PSPDFKit.Annotations.NoteAnnotation) {
                return _checkNoteIsUpdated(oldAnnotation, newAnnotation);
            }
            return _sizeAndPositionUpdated(oldAnnotation, newAnnotation);
        }

        function _sizeAndPositionUpdated(oldAnnotation, newAnnotation) {
            var oldBoundingBox = oldAnnotation.boundingBox;
            var newBoundingBox = newAnnotation.boundingBox;
            return oldBoundingBox.width !== newBoundingBox.width ||
                oldBoundingBox.height !== newBoundingBox.height ||
                oldBoundingBox.left !== newBoundingBox.left ||
                oldBoundingBox.bottom !== newBoundingBox.bottom;
        }

        /**
         * @description check if the bookmark updated
         * @param id
         * @return {boolean}
         * @private
         */
        function _isUpdatedBookmark(id) {
            var oldBookmark = self.oldBookmarks[id];
            var newBookmark = self.newBookmarks[id];
            return oldBookmark.name !== newBookmark.name || oldBookmark.action.pageIndex !== newBookmark.action.pageIndex;
        }

        /**
         * @description map the document operations to be ready to send to the server.
         * @param documentOperations
         * @return {Array}
         * @private
         */
        function _mapDocumentOperations(documentOperations) {
            return _.map(documentOperations, (operation) => {
                return {
                    annotationType: AnnotationLogType[operation.type],
                    actionItemType: ActionItemOperation.EDIT
                }
            });
        }

        /**
         * @description get Created Annotations
         * @param oldAnnotations
         * @param newAnnotations
         * @return {Array}
         */
        self.getCreatedAnnotations = function (oldAnnotations, newAnnotations) {
            return _.map(_.differenceBy(newAnnotations, oldAnnotations, 'id'), function (annotation) {
                annotation.actionItemType = ActionItemOperation.ADD;
                return annotation;
            });
        };
        /**
         * @description get deleted Annotations
         * @param oldAnnotations
         * @param newAnnotations
         * @return {Array}
         */
        self.getDeletedAnnotations = function (oldAnnotations, newAnnotations) {
            return _.map(_.differenceBy(oldAnnotations, newAnnotations, 'id'), function (annotation) {
                annotation.actionItemType = ActionItemOperation.REMOVE;
                return annotation
            });
        };
        /**
         * @default get updated Annotations
         * @param oldAnnotations
         * @param newAnnotations
         * @return {Array}
         */
        self.getUpdatedAnnotations = function (oldAnnotations, newAnnotations) {
            return _.map(_.filter(_.intersectionBy(oldAnnotations, newAnnotations, 'id'), function (annotation) {
                return _isAnnotationUpdated(annotation.id);
            }), function (annotation) {
                annotation.actionItemType = ActionItemOperation.EDIT;
                return annotation;
            });
        };
        /**
         * @description get created bookmarks
         * @param oldBookmarks
         * @param newBookmarks
         * @return {Array}
         */
        self.getCreatedBookmarks = function (oldBookmarks, newBookmarks) {
            return _.map(_.differenceBy(newBookmarks, oldBookmarks, 'id'), function (bookmark) {
                return {
                    actionItemType: ActionItemOperation.ADD,
                    annotationType: AnnotationLogType.Bookmark
                };
            });
        };
        /**
         * @description get deleted bookmarks
         * @param oldBookmarks
         * @param newBookmarks
         */
        self.getDeletedBookmarks = function (oldBookmarks, newBookmarks) {
            return _.map(_.differenceBy(oldBookmarks, newBookmarks, 'id'), function (bookmark) {
                return {
                    actionItemType: ActionItemOperation.REMOVE,
                    annotationType: AnnotationLogType.Bookmark
                };
            });
        };
        /**
         * @description get updated bookmarks
         * @param oldBookmarks
         * @param newBookmarks
         */
        self.getUpdatedBookmarks = function (oldBookmarks, newBookmarks) {
            return _.map(_.filter(_.intersectionBy(oldBookmarks, newBookmarks, 'id'), function (bookmark) {
                return _isUpdatedBookmark(bookmark.id);
            }), function (bookmark) {
                return {
                    actionItemType: ActionItemOperation.EDIT,
                    annotationType: AnnotationLogType.Bookmark
                };
            });
        };
        /**
         * @description return list of changes log
         * @param oldAnnotations
         * @param newAnnotations
         * @param documentOperations
         * @param oldBookmarks
         * @param newBookmarks
         * @return {*[]}
         */
        self.getAnnotationsChanges = function (oldAnnotations, newAnnotations, documentOperations, oldBookmarks, newBookmarks) {
            self.oldAnnotations = _createObjectFromCollection(oldAnnotations, 'id');
            self.newAnnotations = _createObjectFromCollection(newAnnotations, 'id');
            self.documentOperations = documentOperations;
            var createdAnnotations = self.getCreatedAnnotations(oldAnnotations, newAnnotations);
            var deletedAnnotations = self.getDeletedAnnotations(oldAnnotations, newAnnotations);
            var updatedAnnotations = self.getUpdatedAnnotations(oldAnnotations, newAnnotations);
            self.oldBookmarks = _createObjectFromCollection(oldBookmarks, 'id');
            self.newBookmarks = _createObjectFromCollection(newBookmarks, 'id');
            var createdBookmarks = self.getCreatedBookmarks(oldBookmarks, newBookmarks);
            var deletedBookmarks = self.getDeletedBookmarks(oldBookmarks, newBookmarks);
            var updatedBookmarks = self.getUpdatedBookmarks(oldBookmarks, newBookmarks);
            console.log('createdBookmarks, deletedBookmarks, updatedBookmarks', createdBookmarks, deletedBookmarks, updatedBookmarks);
            return _generateAnnotationsList([].concat(createdAnnotations, deletedAnnotations, updatedAnnotations)).concat(_mapDocumentOperations(self.documentOperations), createdBookmarks, deletedBookmarks, updatedBookmarks);
        };
        /**
         * @description get all operation that happens to the Annotations for teh document
         * @param oldAnnotations
         * @param newAnnotations
         * @param correspondence
         * @param documentOperations
         * @param oldBookmarks
         * @param newBookmarks
         * @return {Promise<boolean>}
         */
        self.applyAnnotationChanges = function (oldAnnotations, newAnnotations, correspondence, documentOperations, oldBookmarks, newBookmarks) {
            var annotationLogs = self.getAnnotationsChanges(oldAnnotations, newAnnotations, documentOperations, oldBookmarks, newBookmarks);
            return self.sendDifferenceAnnotations(annotationLogs, correspondence);
        };
        /**
         * @description send all difference between old and new annotations
         * @param annotationLogs
         * @param correspondence
         * @return {*}
         */
        self.sendDifferenceAnnotations = function (annotationLogs, correspondence) {
            return $q(function (resolve, reject) {
                return annotationLogs.length ? resolve(_sendAnnotationLogToServer(annotationLogs, correspondence)) : resolve([]);
            });
        }

    });
};
