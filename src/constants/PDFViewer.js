module.exports = function (app) {
    app.constant('PDFViewer', {
        DOCUMENT_LAUNCHED_ALREADY: 'DOCUMENT_LAUNCHED_ALREADY',
        CANCEL_LAUNCH: 'CANCEL_LAUNCH',
        JUST_AUTHORIZE: 'JUST_AUTHORIZE',
        UPDATE_DOCUMENT_CONTENT: 'UPDATE_DOCUMENT_CONTENT',
        UPDATE_ATTACHMENT: 'UPDATE_ATTACHMENT',
        ADD_ATTACHMENT: 'ADD_ATTACHMENT',
        SEQ_LAUNCHED: 'SEQ_LAUNCHED',
        DEFAULT_INSTANT_JSON: {
            format: "https://pspdfkit.com/instant-json/v1",
            skippedPdfObjectIds: [],
            annotations: [],
            formFieldValues: []
        }
    });
};
