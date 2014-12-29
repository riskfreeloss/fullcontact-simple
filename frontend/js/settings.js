var formEl = $('#form')[0];

var editor = new JSONEditor(formEl, {
    disable_collapse: true,
    disable_edit_json: true,
    disable_properties: true,
    no_additional_properties: true,
    schema: {
        type: 'object',
        title: 'Alchemy app settings',
        properties: {
            inputValue: {
                title: 'Import',
                type: 'string',
                minLength: 0,
                maxLength: 40
            },
            exportValue: {
                title: 'Export',
                type: 'string',
                minLength: 0,
                readonly: true
            }
        }
    },
    //startval: {},
    required: ['apiKey'],
    required_by_default: true,
    theme: 'bootstrap3'
});



var props = new IframeHelper();

props.onReady(function () {
    props.getProperties(function (status, data) {
        if (status){
            console.log(data);
            editor.setValue(data);
        } else {
            alert('Error');
        }
        console.log(status, data);
    });
});


$('#submit').on('click', function() {
    var errors = editor.validate();
    var errMsg = [];
    if (errors.length) {
        errors.forEach(function (err) {
            var field = editor.getEditor(err.path);
            var title = field.schema.title;
            errMsg.push(title + ': ' + err.message);
        });
        alert(errMsg.join('\n'));
    } else {
        props.setProperties(editor.getValue(), function (status /*, data*/ ) {
            if (status) {
                alert('Settings were saved.');
            }
        });
    }
});