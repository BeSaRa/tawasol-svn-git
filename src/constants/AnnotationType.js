module.exports = function (app) {
    app.constant('AnnotationType', {
        NON_EXISTING: 0,
        ANNOTATION: 1,
        BARCODE: 2,
        SIGNATURE: 3,
        STAMP: 4
    });
};
