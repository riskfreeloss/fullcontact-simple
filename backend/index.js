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

var socialEntries = {
    "aboutme": "About.me",
    "academiaedu": "Academia.edu",
    "amplify": "Amplify",
    "angellist": "AngelList",
    "aolchat": "Aol Chat",
    "bandcamp": "Bandcamp",
    "bebo": "Bebo",
    "behance": "Behance",
    "bitbucket": "BitBucket",
    "blipfm": "BlipFM",
    "blippy": "Blippy",
    "blogger": "Blogger",
    "crunchbase": "Crunchbase",
    "dandyid": "DandyId",
    "delicious": "Delicious",
    "deviantart": "Deviant Art",
    "digg": "Digg",
    "diigo": "Diigo",
    "disqus": "Disqus",
    "doyoubuzz": "Do You Buzz",
    "dribble": "Dribbble",
    "econsultancy": "eConsultancy",
    "facebookchat": "Facebook Chat",
    "facebook": "Facebook",
    "flavorsme": "Flavors.me",
    "flickr": "Flickr",
    "foursquare": "FourSquare",
    "friendfeed": "FriendFeed",
    "friendster": "Friendster",
    "fullcontact": "FullContact",
    "gdgt": "gdgt",
    "getglue": "Get Glue",
    "getsatisfaction": "Get Satisfaction",
    "gist": "Gist",
    "github": "GitHub",
    "goodreads": "Good Reads",
    "googleplus": "Google Plus",
    "googleprofile": "Google Profile",
    "gravatar": "Gravatar",
    "gtalkchat": "GTalk",
    "hackernews": "Hacker News",
    "hi5": "Hi5",
    "hunch": "Hunch",
    "hypemachine": "HypeMachine",
    "hyves": "Hyves",
    "icqchat": "ICQ",
    "identica": "Identi.ca",
    "imdb": "IMDB",
    "intensedebate": "Intense Debate",
    "ircchat": "IRC",
    "klout": "Klout",
    "lanyrd": "Lanyrd",
    "lastfm": "Last.FM",
    "linkedin": "LinkedIn",
    "livejournal": "LiveJournal",
    "meadiciona": "Meadiciona",
    "meetup": "Meetup",
    "mixcloud": "Mixcloud",
    "mixi": "Mixi",
    "myspace": "MySpace",
    "ohloh": "Ohloh",
    "orkut": "Orkut",
    "other": "Other",
    "pandora": "Pandora",
    "picasa": "Picasa",
    "pinboard": "Pin Board",
    "pinterest": "Pinterest",
    "plancast": "Plancast",
    "plaxo": "Plaxo",
    "plurk": "Plurk",
    "qik": "Qik",
    "quora": "Quora",
    "reddit": "Reddit",
    "renren": "Ren Ren",
    "reverbnation": "Reverb Nation",
    "scribd": "Scribd",
    "shelfari": "Shelfari",
    "skype": "Skype",
    "slideshare": "SlideShare",
    "smugmug": "Smug Mug",
    "soundcloud": "Sound Cloud",
    "stackexchange": "StackExchange",
    "stackoverflow": "StackOverflow",
    "steam": "Steam",
    "stumbleupon": "Stumble Upon",
    "tagged": "Tagged",
    "tripit": "Tripit",
    "tumblr": "Tumblr",
    "twitter": "Twitter",
    "typepad": "Type Pad",
    "vimeo": "Vimeo",
    "vk": "VK",
    "wordpress": "WordPress.org",
    "xing": "Xing",
    "yahoochat": "Yahoo! Chat",
    "yahoo": "Yahoo!",
    "yelp": "Yelp",
    "youtube": "YouTube"
};

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
            var entityType = settings.entityType || [];
            var profileId = parsedData.profile.id;
            var section = parsedData.session.section;
            var collectApp = parsedData.session.collectApp;
            tasks[indexTask - 1] = emailParam;

            fullcontact.person.email(emailParam, function (error, data) {
                if (error) {
                    return jsonError(res, error);
                }

                var socialProfiles = data && data.socialProfiles;
                var attributes = {};

                inno.getProfileAttributes({
                    collectApp: inno.config.appName,
                    section: section,
                    profileId: profileId
                }, function (error, attrs) {
                    var key;
                    if (attrs && attrs.length && attrs[0].data) {
                        attrs = attrs[0].data;
                        for (var i in attrs) {
                            if (attrs.hasOwnProperty(i)) {
                                var patterns = i.match(/^SocialMedia_(\w+)$/);
                                if (patterns && patterns.length === 2 && socialEntries.hasOwnProperty(patterns[1]) && entityType.indexOf(patterns[1]) === -1) {
                                    key = 'SocialMedia_' + patterns[1];
                                    attributes[key] = {};
                                }
                            }
                        }
                    }

                    for (var j = 0; j < socialProfiles.length; j++) {
                        var socialProfile = socialProfiles[j];
                        if (entityType.length &&
                            socialEntries.hasOwnProperty(socialProfile.typeId) &&
                            entityType.indexOf(socialEntries[socialProfile.typeId]) > -1) {
                            key = 'SocialMedia_' + socialProfile.typeId;
                            delete socialProfile.type;
                            delete socialProfile.typeId;
                            attributes[key] = socialProfile;
                        }
                    }
                    inno.setProfileAttributes({
                        collectApp: collectApp,
                        section: section,
                        profileId: profileId,
                        attributes: attributes
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