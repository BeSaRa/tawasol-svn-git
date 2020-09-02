module.exports = function (app) {
    app.constant('AnnotationLogType', {
        Annotation: 0,
        CommentMarkerAnnotation: 1,
        EllipseAnnotation: 2,
        HighlightAnnotation: 3,
        ImageAnnotation: 4,
        InkAnnotation: 5,
        LineAnnotation: 6,
        LinkAnnotation: 7,
        MarkupAnnotation: 8,
        NoteAnnotation: 9,
        PolygonAnnotation: 10,
        PolylineAnnotation: 11,
        RectangleAnnotation: 12,
        RedactionAnnotation: 13,
        ShapeAnnotation: 14,
        SquiggleAnnotation: 15,
        StampAnnotation: 16,
        StrikeOutAnnotation: 17,
        TextAnnotation: 18,
        UnderlineAnnotation: 19,
        UnknownAnnotation: 20,
        WidgetAnnotation: 21,
        TawasolSignature: 22,
        TawasolStamp: 23,
        TawasolBarcode: 24
    });
};
