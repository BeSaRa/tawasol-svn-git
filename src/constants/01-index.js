module.exports = function (app) {
    require('./AnnotationType')(app);
    require('./AnnotationLogType')(app);
    require('./ActionItemOperation')(app);
    require('./PDFViewer')(app);
};
