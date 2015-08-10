var express = require('express'), // Allows easily build a web server
    bodyParser = require('body-parser'),
    inno = require('innometrics-helper'); // Innometrics helper to work with profile cloud

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
var innoHelper = new inno.InnoHelper(config);

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
    innoHelper.getAppSettings(function (error, settings) {
        if (error) {
            return jsonError(res, error);
        }

        var profile = innoHelper.getProfileFromRequest(req.body);
        var profileId = profile.getId();
        var lastSession = profile.getLastSession();
        var entityType = settings.entityType || [];
        var section = settings.section;
        var collectApp = innoHelper.getCollectApp();
        var eventData = settings.eventData || 'email';
        var email;

        if (!section) {
            return jsonError(res, new Error('You have no section of the app in settings'));
        }

        if (!entityType.length) {
            return jsonError(res, new Error('You need to choose at least one "Entity type" in settings'));
        }

        try {
            email = lastSession.getEvents()[0].getDataValue(eventData);
        } catch (e) {
            email = settings.email;
        }

        if (!email) {
            return jsonError(res, new Error('Email is empty'));
        }

        tasks[indexTask - 1] = email;

        fullcontact = fullcontact || new FullContact(settings.fcApiKey);
        fullcontact.person.email(email, function (error, data) {
            if (error) {
                return jsonError(res, error);
            }

            var socialProfiles = data && data.socialProfiles;
            if (!socialProfiles.length) {
                return;
            }

            innoHelper.loadProfile(profileId, function (error, fullProfile) {
                if (error) {
                    return jsonError(res, error);
                }

                var attrs = fullProfile.getAttributes(collectApp, section);
                var attrsMap = {};
                var attributes = [];

                attrs.forEach(function (attr) {
                    var name = attr.getName();
                    var m = name.match(/^SocialMedia_(\w+)$/);
                    if (m && m.length === 2 && socialEntries.hasOwnProperty(m[1]) && entityType.indexOf(m[1]) === -1) {
                        attrsMap[name] = {};
                    }
                });

                socialProfiles.forEach(function (socialProfile) {
                    var spTypeId = socialProfile.typeId;
                    var key;

                    if (socialEntries.hasOwnProperty(spTypeId) &&
                        entityType.indexOf(socialEntries[spTypeId]) > -1) {

                        key = 'SocialMedia_' + spTypeId;
                        delete socialProfile.type;
                        delete socialProfile.typeId;

                        attrsMap[key] = {
                            collectApp: collectApp,
                            section: section,
                            name: key,
                            value: socialProfile
                        };

                    }
                });

                var key;
                for (key in attrsMap) {
                    if (attrsMap.hasOwnProperty(key)) {
                        attributes.push(attrsMap[key]);
                    }
                }

                fullProfile.setAttributes(attributes);

                innoHelper.saveProfile(fullProfile, function (error) {
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
        error: errors.map(function (e) { return e.message; }),
        tasks: tasks
    });
});

// Starting server
var server = app.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});