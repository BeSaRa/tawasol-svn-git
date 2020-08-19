module.exports = function (app) {
    app.constant('AnnotationLogType', {
        LINK: 0,
        TEXT: 1,
        INK: 2,
        ELLIPSE: 3,
        RECTANGLE: 4,
        LINE: 5,
        POLYLINE: 6,
        POLYGON: 7,
        NOTE: 8,
        IMAGE: 9,
        STAMP: 10,
        TAWASOL_STAMP: 11,
        TAWASOL_SIGNATURE: 12,
    });
};
