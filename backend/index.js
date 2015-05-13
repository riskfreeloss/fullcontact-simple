var express = require('express'), // Allows easily build a web server
    bodyParser = require('body-parser'),
    InnoHelper = require('innometrics-helper'); // Innometrics helper to work with profile cloud

var FullContact = require('fullcontact'),
    fullcontact = null;

var app = express(),
    port = parseInt(process.env.PORT, 10);

// Parse application/json request
app.use(bodyParser.json());

/**
 * If your app's frontend part is going to communicate directly with backend, you need to allow this
 * https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
 */
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

/**
 * Init params from environment variables. Innometrics platform sets environment variables during install to Paas.
 * In case of manual install of backend part, you need to setup these manually.
 */
var config = {
    groupId: process.env.INNO_COMPANY_ID,
    bucketName: process.env.INNO_BUCKET_ID,
    appName: process.env.INNO_APP_ID,
    appKey: process.env.INNO_APP_KEY,
    apiUrl: process.env.INNO_API_HOST
};
var inno = new InnoHelper(config);

var errors = [];
var tasks = [];

function jsonError(res, error) {
    errors.push(error);
    return res.json({
        error: null
    });
}

// POST request to "/" is always expected to recieve stream with events
app.post('/', function (req, res) {
    var indexTask = tasks.push('---');
    inno.getAppSettings(function (error, settings) {
        if (error) {
            return jsonError(res, error);
        }
        fullcontact = fullcontact || new FullContact(settings.fcApiKey);
        inno.getProfile(req.body, function (error, parsedData) {
            if (error) {
                return jsonError(res, error);
            }
            var emailParam = parsedData.data && parsedData.data.email || settings.email;
            var profileId = parsedData.profile.id;
            var section = parsedData.session.section;
            var collectApp = parsedData.session.collectApp;
            tasks[indexTask - 1] = emailParam;

            fullcontact.person.email(emailParam, function (error, data) {
                if (error) {
                    return jsonError(res, error);
                }

                inno.setProfileAttributes({
                    collectApp: collectApp,
                    section: section,
                    profileId: profileId,
                    attributes: {
                        socialMediaData: data && data.socialProfiles && JSON.stringify(data.socialProfiles)
                    }
                }, function (error) {
                    if (error) {
                        return jsonError(res, error);
                    }
                    res.json({
                        error: null
                    });
                });
            });
        });

    });
});

app.get('/', function (req, res) {
    errors = errors.slice(-10);
    tasks = tasks.slice(-10);
    res.json({
        error: errors,
        tasks: tasks
    });
});

// Starting server
var server = app.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});