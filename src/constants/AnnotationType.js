module.exports = function (app) {
    app.constant('AnnotationType', {
        UPDATE_CONTENT: 0,
        ANNOTATION: 1,
        BARCODE: 2,
        SIGNATURE: 3,
        STAMP: 4
    });
};
