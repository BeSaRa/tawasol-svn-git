module.exports = function (app) {
    app.service('annotationLogService', function (_, PSPDFKit, AnnotationType, ActionItemOperation, AnnotationLogType, $q, $http, urlService) {
        'ngInject';
        var self = this;
        self.serviceName = 'annotationLogService';

        self.oldAnnotations = {};

        self.newAnnotations = {};

        /**
         * @description get annotation Ink number
         * @param annotation
         * @return {number}
         * @private
         */
        function _getInkType(annotation) {
            return annotation.isSignature ? AnnotationLogType.TAWASOL_SIGNATURE : AnnotationLogType.INK;
        }

        /**
         * @description get Annotation number from AnnotationType enum
         * @param annotation
         * @return {number}
         * @private
         */
        function _getImageType(annotation) {
            if (!annotation.customData) {
                return AnnotationLogType.IMAGE;
            } else if (annotation.customData.additionalData.type === AnnotationType.SIGNATURE) {
                return AnnotationLogType.TAWASOL_SIGNATURE;
            } else if (annotation.customData.additionalData.type === AnnotationType.STAMP) {
                return AnnotationLogType.TAWASOL_STAMP;
            }
            return 0;
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
         * @description map annotation type to be ready for sending to the server
         * @param annotation
         * @private
         */
        function _mapAnnotationType(annotation) {
            switch (annotation.constructor.readableName) {
                case PSPDFKit.Annotations.Annotation.readableName:
                    annotation.annotationType = null;
                    break;
                case PSPDFKit.Annotations.CommentMarkerAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.NOTE;
                    break;
                case PSPDFKit.Annotations.EllipseAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.ELLIPSE;
                    break;
                case PSPDFKit.Annotations.ImageAnnotation.readableName:
                    annotation.annotationType = _getImageType(annotation);
                    break;
                case PSPDFKit.Annotations.InkAnnotation.readableName:
                    annotation.annotationType = _getInkType(annotation);
                    break;
                case PSPDFKit.Annotations.LineAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.LINE;
                    break;
                case PSPDFKit.Annotations.LinkAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.LINK;
                    break;
                case PSPDFKit.Annotations.NoteAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.NOTE;
                    break;
                case PSPDFKit.Annotations.PolygonAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.POLYGON;
                    break;
                case PSPDFKit.Annotations.PolylineAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.POLYLINE;
                    break;
                case PSPDFKit.Annotations.RectangleAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.RECTANGLE;
                    break;
                case PSPDFKit.Annotations.StampAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.STAMP;
                    break;
                case PSPDFKit.Annotations.TextAnnotation.readableName:
                    annotation.annotationType = AnnotationLogType.TEXT;
                    break;
                case PSPDFKit.Annotations.UnknownAnnotation.readableName:
                    annotation.annotationType = null;
                    break;
                case PSPDFKit.Annotations.WidgetAnnotation.readableName:
                    annotation.annotationType = null;
                    break;
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


        /**
         * @description check if the annotation updated
         * @param id
         * @return {boolean}
         * @private
         */
        function _isAnnotationUpdated(id) {
            var oldBoundingBox = self.oldAnnotations[id].boundingBox;
            var newBoundingBox = self.newAnnotations[id].boundingBox;
            return oldBoundingBox.width !== newBoundingBox.width ||
                oldBoundingBox.height !== newBoundingBox.height ||
                oldBoundingBox.left !== newBoundingBox.left ||
                oldBoundingBox.bottom !== newBoundingBox.bottom;

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
         * @description get all operation that happens to the Annotations for teh document
         * @param oldAnnotations
         * @param newAnnotations
         * @param correspondence
         * @return {Promise<boolean>}
         */
        self.applyAnnotationChanges = function (oldAnnotations, newAnnotations, correspondence) {
            self.oldAnnotations = _createObjectFromCollection(oldAnnotations, 'id');
            self.newAnnotations = _createObjectFromCollection(newAnnotations, 'id');

            var createdAnnotations = self.getCreatedAnnotations(oldAnnotations, newAnnotations);
            var deletedAnnotations = self.getDeletedAnnotations(oldAnnotations, newAnnotations);
            var updatedAnnotations = self.getUpdatedAnnotations(oldAnnotations, newAnnotations);
            var annotationLogs = _generateAnnotationsList([].concat(createdAnnotations, deletedAnnotations, updatedAnnotations));
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
                return annotationLogs.length ? _sendAnnotationLogToServer(annotationLogs, correspondence) : resolve([]);
            });
        }

    });
};
