
(function (window, $, undefined) {
    'use strict';

    // define namespace
    window.app = window.app || {};
    var app = window.app;

    app.debug = false;
    app.registeredNamespaces = [];

    /**
     * Creates a function calling fn
     * @param function fn
     * @param object scope
     * @return function
     */
    window.curry = function (fn, scope) {

        // console.log("currying");
        // console.log(scope);
        // console.log(arguments);
        // console.log(fn);
        scope = scope || window;

        // return a function executing fn
        return function () {

            // console.log("currying");
            // console.log(scope);
            // console.log(arguments);
            // console.log(fn);
            
            fn.apply(scope, arguments);
        };
    };

    /**
     * Creates a function calling fn, with optional arguments
     * @param function fn
     * @param object scope
     * @param ...
     * @return function
     */
    window.curryWithArguments = function (fn, scope) {

        var args = [];

        scope = scope || window;

        for(var i = 2, length = arguments.length; i < length; i++ ) {

            args.push(arguments[i]);
        }

        // return a function executing fn
        return function () {
            fn.apply(scope, args);
        };
    };

    window.currySelf = function (fn, self) {

        return function () {
            
            for (var i = arguments.length; i > 0; i--) {
                arguments[i] = arguments[i-1];
            }
            arguments[0] = self;
            arguments.length++;

            fn.apply(this, arguments);
        };
    };

    /**
     * Sets the current namespace
     * @param string namespace
     * @return object
     */
    window.setNamespace = function (namespace) {

        // declare variables
        var namespaceCompenents = namespace.split("."),
            parent = window,
            component,
            i,
            length;

        // loop through namespaceComponents and create new sub-objects for each component
        for (i = 0, length = namespaceCompenents.length; i < length; i++) {
            component = namespaceCompenents[i];
            parent[component] = parent[component] || {};
            parent = parent[component];
        }

        // return the namespace object
        return parent;
    };

    /**
     * Returns an object based on a fully qualified classname
     * @param string fullyQualifiedClassName
     * @return mixed
     */
    window.use = function (fullyQualifiedClassName) {

        var components = fullyQualifiedClassName.split('.'),
            parent = window,
            child;

        while (child = components.shift()) {

            // if (parent[child]) {
            //     parent = parent[child];
            // } else {
            //     throw new Error('Could not resolve ' + child + ' in ' + fullyQualifiedClassName);
            //     return;
            // }
            parent = parent[child] || {};
        }

        return parent;
    };

    /**
     * Dynamically loads a javascript file containing namespace
     * @param string namespace
     */
    window.loadNamespace = function (namespace) {

        // declare variables
        var namespaceLoadedHandler,
            namespaceCompenents = namespace.split('.'),
            prototype = 'http://__hostname__/js/__path__.min.js?2.1.9',
            url;

        if (app.debug) {
            prototype = 'http://__hostname__/js/__path__.js';
        }

        // remove 'app' from namespaceComponents
        namespaceCompenents = namespaceCompenents.splice(1, namespaceCompenents.length - 1);

        // create the url to the javascript file
        url = prototype
            .replace(/__hostname__/g, window.location.hostname)
            .replace(/__path__/g, namespaceCompenents.join('/'));
        
        namespaceLoadedHandler = window.curryWithArguments(window.initializeNamespace, window, namespace);

        // get the script
        if (window.hasNamespace(namespace)) {
            window.initializeNamespace(namespace);

        } else {
            $.getScript(url)
                .done(namespaceLoadedHandler)
                .fail(function (jqxhr, settings, exception) {
                    console.log(namespace);
                    eval(jqxhr);
                    window.initializeNamespace(namespace);
                    // console.log('script failed to load!');
                    // console.log(exception);
                    // console.log(jqxhr);
                    // console.log(settings);
                });
        }
    };

    window.hasNamespace = function (namespace) {
        // declare variables
        var namespaceCompenents = namespace.split("."),
            hasNamespace = true,
            parent = window,
            component,
            i,
            length;

        // loop through namespaceComponents and create new sub-objects for each component
        for (i = 0, length = namespaceCompenents.length; i < length; i++) {
            component = namespaceCompenents[i];

            if (parent[component] === undefined) {

                hasNamespace = false;
                break;
            }
            
            parent = parent[component];
        }

        // return the namespace object
        return hasNamespace;
    };

    window.initializeNamespace = function (namespace) {
        
        try {
            window.setNamespace(namespace).initialize();
        } catch (error) {
            console.log("Cannot initialize namespace " + namespace + error);
        }
    };

    window.releaseNamespace = function (namespace) {

        try {
            window.setNamespace(namespace).release();
        } catch (error) {
            console.log("Cannot release namespace " + namespace + error);
        }
    };

    window.isCrippleBrowser = function () {
        var userAgent = navigator.userAgent,
            crippleBrowsers = [
                'MSIE 6',
                'MSIE 7',
                'MSIE 8',
                'MSIE 9'
            ],
            i,
            length;

        for (i = 0, length = crippleBrowsers.length; i < length; i++) {

            if (0 <= userAgent.indexOf(crippleBrowsers[i])) {
                return true;
            }
        }

        return false;
    };

    window.app.log = function (message) {
        window.app.debug && console.log(message);
    };

}(window, jQuery));(function (window, undefined) {
   var config = window.setNamespace('app.config'),
      routes;

   routes = [
      {
         route: "/competitions/{slug}/games/{id}/dump",
         action: "Competition/dump",
         requirements: {
            id: "[\\w-]+",
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/games/{id}",
         action: "Competition/game",
         requirements: {
            id: "[\\w-]+",
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/game/challenge",
         action: "Competition/challenge",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/finals",
         action: "Competition/finals",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/semi-finals/show",
         action: "Competition/semiFinals",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/semi-finals/round",
         action: "Competition/showFinalsMatch",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/prizes",
         action: "Competition/prizes",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/game-log",
         action: "Competition/gameLog",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/leaderboard",
         action: "Competition/leaderboard",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/getting-started",
         action: "Competition/gettingStarted",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/rules",
         action: "Competition/rules",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}/edit",
         action: "Competition/edit",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "/competitions/{slug}",
         action: "Competition/show",
         requirements: {
            slug: "[\\w-]+"
         }
      },
      {
         route: "competitions",
         action: "Competition/index"
      },
      {
         route: "discussions",
         action: "Discussion/forum",
      },
      {
         route: "^/$",
         action: "Home/index"
      },
      {
         route: "/profile/edit",
         action: "Home/editProfile"
      },
      {
         route: "/profile",
         action: "Home/profile"
      },
      {
         route: "/languages/",
         action: "Home/languages",
      }
   ];

   config.routes = routes;
}(window));(function (window, undefined) {
    var app = window.setNamespace('app'),
        _routes = [];

    /**
     * Initializes the router component
     * @param Object routes
     */
    app.Router = function (routes) {

        if (false === (this instanceof app.Router)) {
            return new app.Router(arguments);
        }

        _routes = routes;
    };

    /**
     * Resolves current path to a controller action
     */
    app.Router.prototype.route = function() {

        var action = this.match(window.location.pathname.replace('app_dev.php/', '')),
            actionParts,
            controller,
            controllerName,
            methodName;

        app.log('action ' + action);

        // route to the right controller if action matches
        if (null !== action) {
            controllerName = this.getControllerName(action);
            methodName = this.getMethodName(action);

            app.log(controllerName);

            // instantiate the controller from app.controller
            controller = new app.controller[controllerName]();

            app.log(methodName);

            // call the controller method named methodName
            controller[methodName]();
        }
    };

    /**
     * Matches path against the registered routes
     * @param String path
     * @return String || null
     */
    app.Router.prototype.match = function (path) {
        var i,
            item,
            length,
            route,
            regexp,
            requirement,
            requirements;

        // loop through all routes to check path against route
        for (i = 0, length = _routes.length; i < length; i++) {
            item = _routes[i];
            route = item.route;
            requirements = item.requirements;
            
            // replace requirements in url by associated regexp
            for (requirement in requirements) {
                regexp = new RegExp("\{" + requirement + "\}");
                route = route.replace(regexp, requirements[requirement]);
            }

            // return the action if path matches
            if (null !== path.match(route)) {
                return _routes[i].action;
            }
        }

        // return null if no match found
        return null;
    };

    /**
     * Returns the full controller name
     * @param String action
     * @return String
     */
    app.Router.prototype.getControllerName = function (action) {
        return action.split("/")[0] + "Controller";
    };

    /**
     * Returns the full method name
     * @param String action
     * @return String
     */
    app.Router.prototype.getMethodName = function (action) {
        return action.split("/")[1] + "Action";
    };
}(window));(function (window, Raphael, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * Ranking over time graph
     */
    snippet.drawRankingGraph = function (currentView, competition) {

      if ($('.competition_' + competition + ' #profile-rankingOverTime-data').length <= 0) {
         return;
      }

      // Get data
       var split,
         dates = [],
           ranks = [],
           versions = [],
           differentVersions = [];

       var yo = 1;
       currentView.find("#profile-rankingOverTime-data tfoot th").each(function () {
           dates.push(new Date(parseInt($(this).html())));
       });
       currentView.find("#profile-rankingOverTime-data tbody td").each(function () {
         split = $(this).html().split(" ");
         if (split.length === 2) {
              ranks.push(parseInt(split[0]));
              versions.push(split[1]);
              if (differentVersions.indexOf(split[1]) === -1) {
               differentVersions.push(split[1]);
              }
          }
       });
       if (dates.length !== ranks.length && dates.length !== versions.length) {
         console.log("data not correct");
         return;
       }

       // Draw graph
       var dot, i, x, y, p, Y, X0, Y0, X2, Y2, a, line,
         bottomText, topText, rect, timer, dateText, frame,
         width = 320,
         height = 385,
         leftMargin = 32,
         rightMargin = 32,
         topMargin = 15,
         bottomMargin = 15,
         graphSize = dates.length,
         canvas = Raphael("profile-rankingOverTime-graph-" + competition, width, height),
         X = (width - leftMargin - rightMargin) / graphSize,
         minRank = Number.MAX_VALUE,
         maxRank = -1,
         isLabelVisible = false,
         dotColor = 255,
         dotColorDecrease = 255 / differentVersions.length,
         bg = canvas.rect(leftMargin - 8, topMargin, width - leftMargin - rightMargin + 22, height - topMargin - bottomMargin).toBack(),
         textAttr = {"font-size": "14px", "font-family": "'Maven Pro', Helvetica, Arial, sans-serif"},
         label = canvas.set(),
         overlay = canvas.set(),
         lastSide = null,
         lastRevision = null,
         lx = 0, 
         ly = 0;

         // if (competition.indexOf("warlight") >= 0) {
         //    color = "rgb(251, 184, 23)";
         // } else if (competition === "heads-up-omaha") {
         //    color = "rgb(143, 67, 142)";
         // } else if (competition === "texas-hold-em") {
         //    color = "rgb(161, 49, 32)";
         // } else if (competition === "ai-block-battle") {
         //    color = "rgb(250, 167, 25)";
         // } else {
         //    color = "rgb(251, 184, 23)"; //default warlight
         // }
         line = canvas.path().attr({"stroke-width": 4, "stroke-linejoin": "round"});
      line.node.setAttribute("class", "profile-rankingOverTime-graph-line");
       bg.attr({'fill': 'rgba(0, 0, 0, 0.05)', 'stroke': 'none'});
      frame = canvas.popup(0, 0, "", "right", 8).hide();
      frame[0].attr({fill: "#000", stroke: "#737373", "stroke-width": 2, "fill-opacity": .7});
      frame[1].attr(textAttr).attr({fill: 'white', "font-size": "13px"});
      dateText = canvas.text(0, height - 8, "").attr(textAttr);

       for (i = 0; i < graphSize; i++) {
         if (ranks[i] < minRank) {
            minRank = ranks[i];
         }
         if (ranks[i] > maxRank) {
            maxRank = ranks[i];
         }
       }
       Y = (height - topMargin - bottomMargin) / (maxRank - minRank + 2);

       for (i = 0; i < graphSize; i++) {
         x = Math.round(leftMargin + X * (i + .5));
         y = (ranks[i] - minRank + 1) * Y + topMargin;
         if (lastRevision !== versions[i]) {
            dotColor -= dotColorDecrease;
           }
         dot = canvas.circle(x, y, 4).attr({
            fill: "rgb(" + dotColor + "," + dotColor + "," + dotColor + ")", 
            "stroke-width": 0
         });

         if (!i) {
               p = ["M", x, y, "C", x, y];
            }
            if (i && i < graphSize - 1) {
               Y0 = (ranks[i-1] - minRank + 1) * Y + topMargin;
                X0 = Math.round(leftMargin + X * (i - .5));
                Y2 = (ranks[i+1] - minRank + 1) * Y + topMargin;
                X2 = Math.round(leftMargin + X * (i + 1.5));
               a = getAnchors(X0, Y0, x, y, X2, Y2);

               p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
           }

           overlay.push(canvas.rect(leftMargin + X * i, topMargin, X, height - topMargin - bottomMargin).attr({stroke: "none", fill: '#fff', opacity: 0}));
           rect = overlay[overlay.length - 1];

           (function (x, y, date, rank, version, dot) {
            rect.hover(function () {
               var ppp, anim, 
                  side = "right",
                  textR = "Rank " + rank + "\n" + "Revision " + version,
                  textD = date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear();

               clearTimeout(timer);
                   if (x + frame.getBBox().width > width) {
                       side = "left";
                   }

                  ppp = canvas.popup(0, 0, textR, side, 8);
                  anim = Raphael.animation({
                        transform: ["t", x, y]
                    }, 200 * isLabelVisible);

                    frame[0].attr({
                     path: ppp[0].attrs.path
                    });
                  frame[0].show().stop().animate(anim);

               frame[1].attr({
                  x: ppp[1].transform()[1][1]
               });
                  frame[1].attr({
                     text: textR,
                  }).show().stop().animateWith(frame[0], anim, {
                     transform: ["t", x, y]
                  }, 200 * isLabelVisible);

                  dateText.attr({
                     text: textD
                  }).show().stop().animate({
                     transform: ["t", x, 0]
                  }, 200 * isLabelVisible);

                  ppp.remove();
               dot.attr("r", 7);
               lastSide = side;
               isLabelVisible = true;
            }, function () {
               dot.attr("r", 4);
               timer = setTimeout(function () {
                       frame.hide();
                       dateText.hide();
                       isLabelVisible = false;
                   }, 1);
            });
           })(x, y, dates[i], ranks[i], versions[i], dot);

           lastRevision = versions[i];
       }
       bottomText = canvas.text(12, Y + topMargin, minRank).attr(textAttr);
       topText = canvas.text(12, (maxRank - minRank + 1) * Y + topMargin, maxRank).attr(textAttr);
       if (minRank === maxRank) {
         bottomText.hide();
       }
       p = p.concat([x, y, x, y]);
       line.attr({path: p});
       frame.toFront();
       dateText.toFront();
       overlay.toFront();

       function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
           var l1 = (p2x - p1x) / 2,
               l2 = (p3x - p2x) / 2,
               a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
               b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
           a = p1y < p2y ? Math.PI - a : a;
           b = p3y < p2y ? Math.PI - b : b;
           var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
               dx1 = l1 * Math.sin(alpha + a),
               dy1 = l1 * Math.cos(alpha + a),
               dx2 = l2 * Math.sin(alpha + b),
               dy2 = l2 * Math.cos(alpha + b);
           return {
               x1: p2x - dx1,
               y1: p2y + dy1,
               x2: p2x + dx2,
               y2: p2y + dy2
           };
       }
    };
}(window, window.Raphael, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * Slide show
     */
    snippet.slideShow = function () {

        var i, slideWidth, newSlide, lastSide,
            slides = $('.banner-slide'),
            slideShow = $('#banner-slide-show'),
            nrOfSlides = slides.length,
            nextPosition = 1,
            time = 10000,
            speed = 800;

        slides.css('display', 'inline');

        // set the images for each slide
        $.each($('.banner-image'), function () {
            $(this).css('background-image', 'url(' + $(this).attr("data-url") + ')');
        });
        $.each($('.banner-foreground-image'), function () {
            if($(this).attr("data-url") !== "") {
                $(this).css('background-image', 'url(' + $(this).attr("data-url") + ')');
            }
        });

        if (nrOfSlides > 1) {

            // detach all slides
            for (i = 0; i < nrOfSlides; i++) {
                slides.eq(i).detach();
            }

            // attach the first 3 slides
            slides.eq(nrOfSlides - 1).clone().appendTo('#banner-slide-show');
            slides.eq(0).clone().appendTo('#banner-slide-show');
            slides.eq(1).clone().appendTo('#banner-slide-show');

            // move to center slide
            slideShow.css('margin-left', '-100%');

            window.slideShowInterval = setInterval(function() {
                nextSlide(true);
            }, time);
            
            $(document).one('click', '.slide-show-button', function() {
                buttonClick($(this));
            });
        }

        function buttonClick (button) {
            window.clearInterval(slideShowInterval);

            if (button.attr('id') === 'slide-show-button-left') {
                nextSlide(false);
            }
            else if (button.attr('id') === 'slide-show-button-right') {
                nextSlide(true);
            }

            window.slideShowInterval = setInterval(function() {
                nextSlide(true);
            }, time);
        }

        // slide left / right
        function nextSlide (slideLeft) {

            var toImageMarginLeft, toTextMarginLeftIn, toTextMarginLeftOut,
                nextSlideText, currentSlideDescription, nextSlideDescription,
                nextSlideImage, toDescriptionLeftOut, toForegroundImageLeftIn,
                currentSlideText = slideShow.children().eq(1).children().first();

            // handles switching of sides
            if (lastSide != undefined && lastSide != slideLeft) {
                if (slideLeft)
                    nextPosition += 2;
                else
                    nextPosition -= 2;
            }
            lastSide = slideLeft;
                
            $(document).off('click', '.slide-show-button');
            if (slideLeft) { //left
                toImageMarginLeft = '-200%';
                toTextMarginLeftIn = '10%';
                toTextMarginLeftOut = '40%';
                toDescriptionLeftOut = '-15%';
                toForegroundImageLeftIn = '10%';
                nextSlideText = slideShow.children().eq(2).children().first();
                nextPosition = ((nrOfSlides*2) + nextPosition + 1) % nrOfSlides;
            }
            else { //right
                toImageMarginLeft = '0%';
                toTextMarginLeftIn = '-10%';
                toTextMarginLeftOut = '-40%';
                toDescriptionLeftOut = '15%';
                toForegroundImageLeftIn = '-10%';
                nextSlideText = slideShow.children().eq(0).children().first();
                nextPosition = ((nrOfSlides*2) + nextPosition - 1) % nrOfSlides;
            }

            slideShow.animate({ 'marginLeft' : toImageMarginLeft }, speed, function() {
                newSlide = slides.eq(nextPosition).clone();
                $(newSlide).css('width', slideWidth + 'px');
                if (slideLeft) {
                    slideShow.children().eq(0).detach();
                    slideShow.append(newSlide);
                }
                else {
                    slideShow.children().eq(2).detach();
                    slideShow.prepend(newSlide);
                }
                
                slideShow.css('marginLeft', '-100%');
                $(document).one('click', '.slide-show-button', function() {
                    buttonClick($(this));
                });
            });
            nextSlideText.css('opacity', 0);
            nextSlideText.css('marginLeft', toTextMarginLeftIn);
            nextSlideText.delay(speed / 1.65).animate({ 'opacity' : 1, 'marginLeft' : 0 }, speed * 0.7 );

            currentSlideText.animate({ 'opacity' : 0, 'marginLeft' : toTextMarginLeftOut }, speed * 0.7);

            if (slideLeft) {
                nextSlideImage = slideShow.children().eq(2).children().eq(1);
            } else {
                nextSlideImage = slideShow.children().eq(0).children().eq(1);
            }
            nextSlideImage.css('opacity', 0);
            nextSlideImage.css('marginLeft', toForegroundImageLeftIn);
            nextSlideImage.delay(speed / 1.8).animate({ 'opacity' : 1, 'marginLeft' : 0 }, speed * 0.7 );

            if ($('#banner-competition-index').length > 0) {
                currentSlideDescription = currentSlideText.children().eq(1);
                nextSlideDescription = nextSlideText.children().eq(1);
                

                nextSlideDescription.css('opacity', 0);
                nextSlideDescription.css('marginLeft', toTextMarginLeftIn);
                nextSlideDescription.delay(speed / 1.8).animate({ 'opacity' : 1, 'marginLeft' : 0 }, speed * 0.7 );

                currentSlideDescription.animate({ 'opacity' : 0, 'marginLeft' : toDescriptionLeftOut }, speed * 0.7);
            }
        }
    };
}(window, window.jQuery));
(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicked
     *
     * @param Event event
     */
    snippet.addBodyClass = function (event) {

        var url = window.location.href,
            urlParts = url.split('/'),
            competitionsIndex = urlParts.indexOf('competitions'),
            competition;

        $('body').removeAttr('class');

        if(competitionsIndex != -1) {
            competition = urlParts[competitionsIndex + 1];

            $('body').addClass(competition);
        }
    };
}(window, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicked
     *
     * @param Event event
     */
    snippet.addFileUpload = function (event) {

        $(document).bind('drop dragover', function (e) {
            e.preventDefault();
        });

        $('.upload-bot-form').each(function () {
            $(this).fileupload({
                dropZone: $(this),
                done: function(event, data) {
                    $('#upload-bot-text').html('Your bot has been uploaded.');
                    $.pjax ({
                        url: '/profile',
                        container: '#page'
                    });
                },
                progress: function(event, data) {

                },
                start: function(event, data) {
                    $('#upload-bot-text').html('Your bot is being uploaded');
                }
            });
        });
    };
}(window, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicked
     *
     * @param Event event
     */
    snippet.addSyntaxHighlighting = function (event) {

        $('code').each(function() {

            if($(this).parent().is('pre')) {
                $(this).parent().addClass('prettyprint')
            } else {
                $(this).addClass('prettyprint');
            }
        });
        
        prettyPrint();
    };
}(window, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicked
     *
     * @param Event event
     */
    snippet.loadCompetition = function (event) {

        window.loadNamespace([
            'app.competitions', snippet.getCompetitionName()
        ].join('.'));

        // for the new frontend
        var iFrame = document.getElementById("player");
        if (iFrame) {
            iFrame.contentWindow.focus();
            $(document).on('click', '#page *', function () {
                iFrame.contentWindow.focus();
            });
        }
    };
}(window, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicked
     *
     * @param Event event
     */
    snippet.unloadCompetition = function () {

        window.releaseNamespace([
            'app.competitions', snippet.getCompetitionName()
        ].join('.'));

        $(document).off('pjax:click', snippet.unloadCompetition);
    };
}(window, window.jQuery));(function (window, $, undefined) {

    'use strict';

    var snippet = window.setNamespace('app.snippet');

    /**
     * snippet.handleParentClick
     * Gets the page when a parent containing an anchor tag is clicke
     */
    snippet.getCompetitionName = function () {

        var competition, competitionsIndex,
            urlParts = window.location.href.split('/');

        if (urlParts[competitionsIndex + 1] === undefined || urlParts[3] != "competitions") {
            urlParts = window.initialURL.split('/');
        }

        competitionsIndex = urlParts.indexOf('competitions');
        competition = urlParts[competitionsIndex + 1];
        if (competition === 'warlight-ai-challenge') {
            competition = 'conquest';
        }
        
        return competition;
    };
}(window, window.jQuery));(function (window, $, undefined) {

    var controller = window.setNamespace('app.controller'),
        snippet    = window.setNamespace('app.snippet');

    controller.CompetitionController = function () {

        if (false === (this instanceof controller.CompetitionController)) {
            return new controller.CompetitionController(arguments);
        }
    };

    controller.CompetitionController.prototype.indexAction = function () {
        app.log('CompetitionController::indexAction');

        snippet.slideShow();

        $(document).on('click', '.competition-link-external', function () {
            $('.competition-index-overlay').addClass('show');

            var link = $(this).attr('data-href');

            $('#competition-index-message-button-confirm').data('href', link);
        });

        $(document).on('click', '.competition-index-overlay, #competition-index-message-button-cancel', function (event) {
            if (event.target != this) return;
            $('.competition-index-overlay').removeClass('show');
        });

        $(document).on('click', '#competition-index-message-button-confirm', function (event) {
            if (event.target != this) return;

            window.open($(this).data('href'));

            $('.competition-index-overlay').removeClass('show');
        })
    };

    controller.CompetitionController.prototype.showAction = function () {
        app.log('CompetitionController::showAction');

        var urlParts = window.location.href.split('/'),
            competition = urlParts[4];

        snippet.addFileUpload();
        snippet.loadCompetition();
        this.setMenuButtonSelected('Home');

        refreshPrizes('eu');

        $(document).on('click', '.button-currency', function () {
            var currency;
            
            if ($(this).attr('class').indexOf('selected') === -1) {
                currency = $(this).attr('data-currency');
                refreshPrizes(currency);
            }
        });

        function refreshPrizes (currency) {
            $.ajax({
                url: '/competitions/' + competition + '/prizes/' + currency,
                context: this,
                beforeSend: function () {
                    $('#page').addClass('wait');
                    $('.currency-button').addClass('wait');
                }
            }).done(function(newData) {
                $('#show-prizes').replaceWith(newData);

                $('#prizes-table td').each(function () {
                    if ($(this).html().indexOf("Finals winner") !== -1) {
                        $(this).css('color', '#919191');
                    }
                });

                $('#page').removeClass('wait');
                $('.currency-button').removeClass('wait');
            });
        }

        $(document).on('pjax:end', snippet.unloadCompetition);
    };

    controller.CompetitionController.prototype.gameAction = function () {
        app.log('CompetitionController::gameAction');

        snippet.loadCompetition();

        $(document).on('pjax:end', snippet.unloadCompetition);
    };

    controller.CompetitionController.prototype.challengeAction = function () {
        app.log('CompetitionController::challengeAction');

        var timeout, refreshUrl, urlParts,
            gameUrl = $('#challenge-game').attr("data-url");

        if(gameUrl.length <= 0) {
            urlParts = window.location.href.split('/');
            urlParts[urlParts.length - 1] = 'refresh';
            refreshUrl = urlParts.join('/');

            timeout = setTimeout(function(){
                urlParts = window.location.href.split('/');
                if(urlParts[5] === "game" && urlParts[6] === "challenge") {
                    $.pjax ({
                        url: refreshUrl,
                        container: '#page'
                    });
                }
            }, 2400);
        } else {
            $.pjax ({
                url: gameUrl,
                container: '#page'
            });
        }
    };

    controller.CompetitionController.prototype.dumpAction = function () {
        app.log('CompetitionController::dumpAction');

        snippet.addSyntaxHighlighting();
    };

    controller.CompetitionController.prototype.rulesAction = function () {
        app.log('CompetitionController::rulesAction');

        this.setMenuButtonSelected('Rules');
    };

    controller.CompetitionController.prototype.gettingStartedAction = function () {
        app.log('CompetitionController::gettingStartedAction');

        snippet.addSyntaxHighlighting();
        this.setMenuButtonSelected('Getting Started');
    };

    controller.CompetitionController.prototype.leaderboardAction = function () {
        app.log('CompetitionController::leaderboardAction');

        this.setMenuButtonSelected('Leaderboard');

        var playerInfoOffset = $('#leaderboard-sider').offset().top,
            urlParts = window.location.href.split('/'),
            competition = urlParts[4];

        $('.country-flag').each(function () {
            $(this).css('background', 'url(' + $(this).attr("data-flag") + ') center center no-repeat');
        });

        if ($('#leaderboard-sider').hasClass('show')) {
            setBotGraph();
        }

        if (window.location.pathname.indexOf('global') !== -1) {
            // readLeaderboardCookie();
            // writeLeaderboardCookie();
            setLeaderboardArrows();
        }

        $(document).on('click', '.leaderboard-button', function () {
            var target = $(this).attr('data-url');
            if (!$(this).hasClass('selected')) {
                $.pjax ({
                    url: target,
                    container: '#page'
                });
            }
        });

        $(document).on('click', '.bot-ranks-list li', function (event) {
            var target = $('a', this).first().attr('href');

            if ($('b', this).length === 0 && target !== undefined) {
                $.pjax ({
                    url: target,
                    container: '#page'
                });
            }
        });

        $(document).on('click', '#leaderboard-table tr', function () {
            var url,
                rowId = $(this).attr('data-rowId');

            $('#leaderboard-table tr').each(function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                }
            });
            $(this).addClass('selected');

            if (!$('#leaderboard-sider').hasClass('show')) {
                $('#leaderboard-sider').addClass('show');
                $('#leaderboard').addClass('show-sider');
            }

            if ($('#leaderboard-table').hasClass('instituteLeaderboard')) {
                url = '/competitions/' + competition + '/show-institute-data/' + rowId
            } else {
                url = '/competitions/' + competition + '/show-player-data/' + rowId;
            }

            $.ajax({
                url: url,
                context: this
            }).done(function(newData) {
                $('#leaderboard-sider-content').replaceWith(newData);
                $.each($('script'), function (_, script) {
                    if (script.innerHTML.indexOf("pjax:end") !== -1) {
                        script.remove();
                    }
                });
                $('.bot-stat').each(function () {
                    if ($(this).find('b').length > 0) {
                        $(this).addClass('current-competition');
                    }
                });
                setBotGraph();
                setLeaderboardHeight();
            });
        });

        $(document).on('click', '#page', function (event) {
            if ((event.target.id === 'page' || event.target.id === 'leaderboard') 
                    && $('#leaderboard-sider').hasClass('show')) {
                $('#leaderboard-sider').removeClass('show');
                $('#leaderboard').removeClass('show-sider');
                $('#leaderboard-table tr').each(function () {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                    }
                });
            }
        });

        $(document).on('scroll', setPlayerInfoBox);
        setLeaderboardHeight();

        function setPlayerInfoBox () {
            var playerInfo = $('#leaderboard-sider'),
                scrollTop = window.pageYOffset || document.body.scrollTop;

            if ((scrollTop + 12) > playerInfoOffset && !playerInfo.hasClass('fixed')) {
                playerInfo.addClass('fixed');
            } else if ((scrollTop + 12) <= playerInfoOffset && playerInfo.hasClass('fixed')
                        && $('#menu').hasClass('hidden')) {
                playerInfo.removeClass('fixed');
            } else if ((scrollTop + 12) <= (playerInfoOffset - 60) && playerInfo.hasClass('fixed')
                        && !$('#menu').hasClass('hidden')) {
                playerInfo.removeClass('fixed');
            }

            if (!$('#menu').hasClass('hidden') && !playerInfo.hasClass('menu-visible')) {
                playerInfo.addClass('menu-visible');
            } else if ($('#menu').hasClass('hidden') && playerInfo.hasClass('menu-visible')){
                playerInfo.removeClass('menu-visible');
            }
        }

        function setBotGraph () {
            var win, tie, loss, total;

            $('.graph-bar').each(function (index) {
                win = parseInt($(this).attr('data-win'));
                tie = parseInt($(this).attr('data-tie'));
                loss = parseInt($(this).attr('data-loss'));
                total = win + tie + loss;
                
                if (total != 0) {
                    $(this).children('#graph-loss').css('flex-basis', ((loss * 100) / total) + '%');
                    $(this).children('#graph-tie').css('flex-basis', ((tie * 100) / total) + '%');
                }
                else {
                    $(this).addClass('no-games');
                }
                $(this).css('opacity', 1);
            });
        }

        function setLeaderboardHeight () {
            var minHeight = $('#leaderboard-sider').height() + 200;
                
            if ($('#leaderboard').height() < minHeight) {
                $('#leaderboard').height(minHeight);
            }
        }

        // function writeLeaderboardCookie () {
        //     var userName,
        //         data = [],
        //         rows = $("#leaderboard-table tbody").children();

        //     if (urlParts.length >= 7 && urlParts[5] === "global") {
        //         $.removeCookie('leaderboard-ranking-' + competition);
        //     }
            
        //     $.cookie.json = true;

        //     rows.each(function (rank, row) {
        //         userName = $.trim($(this).find('.user-name').text());
        //         data.push(userName);
        //     });

        //     $.cookie('leaderboard-ranking-' + competition, data, { expires: 365 });
        // }

        // function readLeaderboardCookie () {
        //     var rank, userName,
        //         rows = $("#leaderboard-table tbody").children(),
        //         data = $.cookie('leaderboard-ranking-' + competition);

        //     if (typeof data === "string") {
        //         data = $.parseJSON(data);
        //     }
        //     if (data != undefined) {
        //         rows.each(function (currentRank, row) {
        //             userName = $.trim($(this).find('.user-name').text());
        //             for (rank = 0; rank < data.length; rank++) {
        //                 if (data[rank] == userName) {
        //                     if (currentRank > rank) {
        //                         rows.eq(rank).children().first().addClass('rise');
        //                     } else if (currentRank < rank) {
        //                         rows.eq(rank).children().first().addClass('fall');
        //                     }
        //                     break;
        //                 }
        //             }
        //         });
        //     }
        // }

        function setLeaderboardArrows () {
            var rows = $("#leaderboard-table tbody").children(),
                dataRows = $('#leaderboard-data td'),
                data = [];

            if (dataRows.length > 0) {
                dataRows.each(function () {
                    var split = $(this).html().split(',');
                    data[parseInt(split[1]) - 1] = split[0];
                });
                rows.each(function (currentRank, row) {
                    userName = $.trim($(this).find('.bot-name').text());
                    for (rank = 0; rank < data.length; rank++) {
                        if (data[rank] == userName) {
                            if (currentRank > rank) {
                                rows.eq(rank).children().first().addClass('rise');
                            } else if (currentRank < rank) {
                                rows.eq(rank).children().first().addClass('fall');
                            }
                            break;
                        }
                    }
                });
            }
        }
    };

    controller.CompetitionController.prototype.gameLogAction = function () {
        app.log('CompetitionController::gameLogAction');

        var botDataArray,
            botData = [],
            botDataInput = $(".js-botData"),
            urlParts = window.location.href.split('/'),
            competition = urlParts[4];

        if(botDataInput.length <= 0) {
            botDataInput.ready(this.gameLogAction);
            return;
        }

        botDataArray = botDataInput.val().split(';');

        this.setMenuButtonSelected('Game log');

        $(document).on('click', '.gamelog-bot-click', function () {
            var botName = $.trim($(this).children('.div-botName-gameLog').text()),
                newUrlParts = urlParts,
                currentQuery = urlParts[6];

            if (currentQuery === 'a') {
                newUrlParts[6] = botName;
            } else {
                newUrlParts[6] = currentQuery + '%20' + botName;
            }

            $.pjax ({
                url: newUrlParts.join("/"),
                container: '#page',
            });
        });

        $.each(botDataArray, function (_, name) {
            botData.push({value: name});
        });

        //twitter typeahead
        var engine = new Bloodhound({
            local: botData,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.value); 
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace    
        });
        engine.initialize();
        
        $('#search-gameLog')
            .on('tokenfield:createtoken', function (event) {
                var data = event.attrs.value;
                if ($.inArray(data, botDataArray) < 0 && data.indexOf('score<') === -1 
                        && data.indexOf('score>') === -1 && data.indexOf('score=') === -1
                        && data.indexOf('date>') === -1 && data.indexOf('date=') === -1
                        && data.indexOf('date<') === -1 ){
                    event.preventDefault();
                }
            })
            .on('tokenfield:createdtoken tokenfield:editedtoken tokenfield:removedtoken', function (event) {
                var queryString = "",
                    tokens = $('#search-gameLog').tokenfield('getTokens');

                if (tokens.selector !== '#search-gameLog') {
                    queryItems = [];
                    $.each(tokens, function() {
                        queryItems.push(this.value);
                    });

                    if (queryItems.length < 1) {
                        queryString = "a";
                    } else {
                        $.each(queryItems, function (_, queryItem) {
                            queryString += queryItem + "+";
                        });
                        queryString = queryString.slice(0, -1);
                    }

                    $.pjax ({
                        url: '/competitions/' + competition + '/game-log/' + queryString + '/1',
                        container: '#page',
                    });
                }
            })
            .tokenfield({
                typeahead: [{
                    hint: true,
                    highlight: true,
                    minLength: 1
                },{
                    source: engine.ttAdapter(),
                    displayKey: 'value'
                }]
            });

        $('#search-gameLog-tokenfield').focus();
    };

    controller.CompetitionController.prototype.prizesAction = function () {
        app.log('CompetitionController::prizesAction');

        this.setMenuButtonSelected('Prizes');
    };

    controller.CompetitionController.prototype.editAction = function () {
        app.log('CompetitionController::editAction');
    };

    controller.CompetitionController.prototype.semiFinalsAction = function () {
        app.log('CompetitionController::semiFinalsAction');

        var r, round, i, idNr, textElement,
            scheme = document.getElementById('conquest-semifinals'),
            svg = scheme.getSVGDocument(),
            winners = new Array(),
            losers = new Array(),
            maxRound = document.getElementById('semifinals-data').getAttribute('data-round'),
            round8Loser = "";  

        try {
            this.setMenuButtonSelected('Semi-finals');
        } catch (err) {}

        if(svg === null || svg === undefined) {
            scheme.addEventListener('load', this.semiFinalsAction, false);
            return;
        }

        if(maxRound >= 8 && document.getElementById('round8Loser') !== null) {
            round8Loser = document.getElementById('round8Loser').innerHTML;
            maxRound = 8;
        }

        for(r = 0; r <= maxRound; r++) { //rounds
            if(r === 5 || r === 7){
                continue;
            }
            round = document.getElementById('semifinalsRound' + r).children;
            
            for(i = 0; i < round.length; i++) {
                idNr = (i - Math.floor(i/3)) + 1;

                if(r % 2 !== 0 || r === 0) { //winners pool

                    if(r === 0) { //set the names on round 0
                        textElement = svg.getElementById("winner" + (i+1));
                        textElement.textContent = round[i].innerHTML;
                        winners[i+1] = round[i].innerHTML;
                    }
                    else if((i-1)%3 == 0) { //set the strokes and lines for round 1 and 3
                        idNr = winners.indexOf(round[i+1].innerHTML); //loser Id
                        if(idNr < 0)
                            return;
                        svg.getElementById("stroke" + idNr).setAttribute('opacity', 1);
                        svg.getElementById("R1B" + idNr).setAttribute('opacity', 0.15);

                        //set names on losers side
                        if(r == 1) {
                            textElement = svg.getElementById("loser" + (Math.ceil(idNr/2)));
                            textElement.textContent = winners[idNr];
                        } else if (r == 3) {
                            textElement = svg.getElementById("loser" + (Math.ceil(idNr/4)+12));
                            textElement.textContent = winners[idNr];
                        }

                        if(r >= 3) { //round 3 strokes and lines
                            svg.getElementById("R3B" + (Math.ceil(idNr/2))).setAttribute('opacity', 0.15);
                        }
                        i++;
                    }

                }
                else { //losers pool

                    if(r === 2) { //first round losers pool
                        //set names
                        textElement = svg.getElementById("loser" + idNr);
                        textElement.textContent = round[i].innerHTML;
                        losers[idNr] = round[i].innerHTML;
                    }
                    if(r === 4) { //second round losers pool
                        //set remaining names
                        if(idNr % 2 === 0) {
                            idNr--;
                        }
                        if(!(round[i].innerHTML == losers[idNr] || round[i].innerHTML == losers[idNr+1])) {
                            idNr = Math.ceil(idNr/2) + 12;
                            textElement = svg.getElementById("loser" + idNr);
                            textElement.textContent = round[i].innerHTML;
                            losers[idNr] = round[i].innerHTML;
                        }
                    }

                    if((i-1)%3 == 0) { //set the strokes and lines
                        if(r <= 6 || round[i+1].innerHTML == round8Loser) //round <= 6 or round 8 and we found the loser
                            idNr = losers.indexOf(round[i+1].innerHTML); //loser Id
                        else  //round 8, not the loser
                            continue;

                        svg.getElementById("loserstroke" + idNr).setAttribute('opacity', 1);
                        if(idNr > 12) {
                            svg.getElementById("R4B" + idNr).setAttribute('opacity', 0.15);
                            if(r >= 6)
                                svg.getElementById("R6B" + (idNr-12)).setAttribute('opacity', 0.15);
                        }
                        else {
                            svg.getElementById("R2B" + idNr).setAttribute('opacity', 0.15);
                            if(r >= 4)
                                svg.getElementById("R4B" + (Math.ceil(idNr/2))).setAttribute('opacity', 0.15);
                            if(r >= 6)
                                svg.getElementById("R6B" + (Math.ceil(idNr/2))).setAttribute('opacity', 0.15);
                        }
                        if(r >= 8) { //round 8 special case
                            if(idNr === 13 || idNr === 14 || idNr <= 4) { //first bracket
                                svg.getElementById("R8B1").setAttribute('opacity', 0.15);
                                svg.getElementById("R8T").setAttribute('opacity', 0.15);
                                svg.getElementById("R8B2P1").setAttribute('opacity', 0.15);
                            }
                            else if(idNr === 15 || idNr === 16 || idNr <= 8) { //second bracket
                                svg.getElementById("R8B2P1").setAttribute('opacity', 0.15);
                                svg.getElementById("R8B2P2").setAttribute('opacity', 0.15);
                            }
                            else { //third bracket
                                svg.getElementById("R8B3").setAttribute('opacity', 0.15);
                                svg.getElementById("R8B").setAttribute('opacity', 0.15);
                                svg.getElementById("R8B2P2").setAttribute('opacity', 0.15);
                            }
                        }
                        i++;
                    }
                }
            }
        }
    };

    controller.CompetitionController.prototype.finalsAction = function () {
        app.log('CompetitionController::finalsAction');

        var finalsObject, players, maxRound, r, round,
            scheme = document.getElementById('conquest-finals'),
            svg = scheme.getSVGDocument(),
            namespace = 'app.competitions.'  + snippet.getCompetitionName();

        if(svg === null || svg === undefined) {
            scheme.addEventListener('load', this.finalsAction, false);
            return;
        }

        players = new Array();
        maxRound = document.getElementById('finals-data').getAttribute('data-round');
        
        for (r=100; r <= maxRound; r++) { //rounds

            if ((r >= 105 && r <= 108) || r === 111) { // rounds that are not shown (for 3/4th place etc.)
                continue;
            }

            var round = document.getElementById('finalsRound' + r).children;
            
            if (r === 100) { // set the names on round 100
                for (var i=0; i<round.length; i++) {
                    var textElement = svg.getElementById("player" + (i+1));
                    textElement.textContent = round[i].innerHTML;
                    players[i+1] = round[i].innerHTML;
                }
            }
            else {
                idNr = players.indexOf(round[2].innerHTML); // loser Id
                svg.getElementById("stroke" + idNr).setAttribute('opacity', 1); // set strokes

                // set lines
                if(r <= 104) {              
                    svg.getElementById("R" + r + "B" + idNr).setAttribute('opacity', 0.12);
                }
                else if(r <= 110) {
                    svg.getElementById("R" + r + "B" + (Math.ceil(idNr/2))).setAttribute('opacity', 0.30);
                    svg.getElementById("R" + (100 + Math.ceil(idNr/2)) + "B" + idNr).setAttribute('opacity', 0.30);
                }
                else if(r === 112) {
                    svg.getElementById("R" + r + "B" + (Math.ceil(idNr/4))).setAttribute('opacity', 0.45);
                    svg.getElementById("R" + (108 + Math.ceil(idNr/4)) + "B" + (Math.ceil(idNr/2))).setAttribute('opacity', 0.45);
                    svg.getElementById("R" + (100 + Math.ceil(idNr/2)) + "B" + idNr).setAttribute('opacity', 0.45);
                }
            }
        }

        //part for the timer
        if ($('.finals-timer').length) {
            snippet.loadCompetition();
            
            function releaseEventListeners() {
                if (window.hasNamespace(namespace) && window.setNamespace(namespace).game) {
                    window.setNamespace(namespace).game.releaseEventListeners();
                } else {
                    setTimeout(function () {
                        releaseEventListeners();
                    }, 50);
                }
            }
            releaseEventListeners();

            app.log($('.finals-timer').attr('data-timer'));
            var timer = $('.finals-timer');
            var nextGame = new Date(timer.attr('data-timer')).getTime();
            var serverTime = new Date(timer.attr('data-timenow')).getTime();
            var currentTime = new Date().getTime();
            var delta = serverTime - currentTime;
            var minutes, seconds;
            
            function setTime() {
                var currentTime = new Date().getTime();
                var secondsLeft = (nextGame - (currentTime + delta)) / 1000;

                minutes = parseInt(secondsLeft / 60);
                seconds = parseInt(secondsLeft % 60);

                if (secondsLeft > 0) {
                    $('.finals-timer-right').html(minutes + "m" + seconds + "s");
                }
                else {
                    $('.finals-timer-right').html("Refresh for next game...");
                }

            }

            setTime();
            setInterval(function() {
                setTime();
            },1000);

            $(document).on('pjax:end', snippet.unloadCompetition);
        }
    };

    controller.CompetitionController.prototype.showFinalsMatchAction = function () {
        app.log('CompetitionController::showFinalsMatch');
    };

    controller.CompetitionController.prototype.setMenuButtonSelected = function (buttonText) {

        var link;

        $.each($('#competition-menu > .menu-item'), function () {
            link = $(this).children('a').first();
            if (link.html() !== buttonText) {
                link.removeClass('selected');
            }
            else if (link.attr('class') !== 'selected') {
                link.addClass('selected');
            }
        });
    };

}(window, window.jQuery));(function (window, $, undefined) {
   var controller = window.setNamespace('app.controller'),
      snippet    = window.setNamespace('app.snippet');

   controller.HomeController = function () {

      if (false === (this instanceof controller.HomeController)) {
         return new controller.HomeController(arguments);
      }
   };

   controller.HomeController.prototype.indexAction = function () {
      app.log('HomeController::indexAction');

      snippet.slideShow();
   };

   controller.HomeController.prototype.languagesAction = function () {
      app.log('HomeController::indexAction');

      $(document).on('click', '.edit-language-button', function (event) {
         var form = $(this).closest("li").find("#languages-form");
         
         form.removeClass("hidden");
         form.find("input").focus();
      });
   };

   controller.HomeController.prototype.profileAction = function () {
      app.log('HomeController::profileAction');

      var competition,
         lastCompetitionSelected = sessionStorage.getItem("tabSelected");

      $.each($(".profile-tab"), function() {
         if ($(this).hasClass('tab-selected')) {
            $.each($(this).attr('class').split(" "), function (_, competitionClass) {
               if (competitionClass.indexOf("competition") !== -1) {
                  competition = competitionClass.split("_")[1];
                  $('body').addClass(competition);
                  return false;
               }
            });
            return false;
         }
      });

      //goes to the latest tab on opening the page
      if(lastCompetitionSelected != null && lastCompetitionSelected != undefined
            && lastCompetitionSelected != 'undefined') {
         gotoBot(lastCompetitionSelected, true);
      }

      sessionStorage.setItem("tabSelected", competition);
      snippet.addFileUpload();
      snippet.drawRankingGraph(getCurrentView(), competition);

      $(document).on('click', '.profile-tab', function (event) {
         $.each($(this).attr('class').split(" "), function (_, competitionClass) {
            if (competitionClass.indexOf("competition") !== -1) {
               classParts = competitionClass.split("_");
               gotoBot(classParts[1], false);
               return false;
            }
         });
      });

      $(document).on('click', '.bot-ranks-list li', function (event) {
         var target = $('a', this).first().attr('href');
         $.pjax ({
                url: target,
                container: '#page'
            });
      });

      $(document).on('click', '#edit-botname-button', function (event) {
         var currentView = getCurrentView();

         currentView.find('#bot-name').addClass('hidden');
         currentView.find('#bot-form').removeClass('hidden');
         currentView.find('#bot-form input').focus();

         bindHideFormClick(currentView);
      });

      $(document).on('change', '#versions', function () {
         var botId, version,
            currentView = getCurrentView();

         botId = currentView.find('#bot-status').attr('data-botId'),
         version = currentView.find('#versions').val();

         $.ajax({
                url: '/refresh/bot-status/' + botId + '/' + version,
                context: this
            }).done(function(newData) {
                currentView.find('#bot-status').replaceWith(newData);
                toggleEnableRankedButton();
            });
      });

      $(document).on('click', '.graph-bar', function () {
         var text;

         $(this).children().each(function () {
            text = $(this).children().first();
            if (text.hasClass('show')) {
               text.removeClass('show');
            } else {
               text.addClass('show');
            }
         });
      });

      $(document).on('click', '.graph-navigation', function () {
         if ($('.bot-graph-container').hasClass('shift-right')) {
            $('.bot-graph-container').removeClass('shift-right');
         } else {
            $('.bot-graph-container').addClass('shift-right');
         }
      });

      toggleEnableRankedButton();
      setBotGraph();
      setRefreshTimer();

      function gotoBot(selectedCompetition, pageLoaded) {
         var classParts, tab;

         if (competition != selectedCompetition) {
            $.each($(".profile-content-right"), function (_, content) {
               $(this).css('display', 'none');
            });
            $.each($(".profile-tab"), function (_, tab) {
               tab = $(this);
               tab.removeClass("tab-selected");
               $.each($(this).attr('class').split(" "), function (_, competitionClass) {
                  if (competitionClass.indexOf("competition") !== -1) {
                     classParts = competitionClass.split("_");
                     tab.removeClass(classParts[1]);
                  }
               });
            });

            competition = selectedCompetition;
            competitionClass = "competition_" + competition;
            $(".profile-content-right." + competitionClass).css('display', 'inline-flex');
            tab = $(".profile-tab." + competitionClass);
            tab.addClass("tab-selected");
            tab.addClass(competition);
            sessionStorage.setItem("tabSelected", competition);
            $('body').removeAttr('class');
            $('body').addClass(competition);

            if (!pageLoaded && $('#profile-rankingOverTime-graph-' + competition).find('svg').length <= 0) {
               snippet.drawRankingGraph(getCurrentView(), competition);
            }

            setRefreshTimer();
         }
      }

      function setRefreshTimer() {
         var currentView = getCurrentView();

         if (currentView != undefined && currentView.find(".compiling").length > 0) {
            window.refreshBotStatusInterval = setInterval(refreshStatus, 1200);
         } else {
            try { window.clearInterval(window.refreshBotStatusInterval); } catch (err) {}
         }
      }

      function toggleEnableRankedButton () {
         if (($(".failed").length > 0 || $('#versions').children().first().text() === "") 
               && $("#set-ranked-button").hasClass('disabled')) {
            $("#set-ranked-button").attr('disabled', 'true');
            $("#set-ranked-button").addClass('disabled');
         } else if ($(".failed").length === 0 && $("#set-ranked-button").hasClass('disabled')) {
            $("#set-ranked-button").removeAttr('disabled');
            $("#set-ranked-button").removeClass('disabled');
         }
      }

      function bindHideFormClick (currentView) {
         $(document).one('click', function (event) {
            if (event.target.tagName !== "INPUT" 
                  && currentView.find('#bot-name').hasClass('hidden')) {
               currentView.find('#bot-name').removeClass('hidden');
               currentView.find('#bot-form').addClass('hidden');
            } else {
               bindHideFormClick(currentView);
            }
         });
      }

      function refreshStatus () {
         var botId, 
            currentView = getCurrentView();

         botId = currentView.find('#bot-status').attr('data-botId');

         $.ajax({
                url: '/refresh/bot-status/' + botId + '/',
                context: this
            }).done(function(newData) {
               if (newData.indexOf("failed") > -1 || newData.indexOf("match success") > -1) {
                  window.clearInterval(window.refreshBotStatusInterval);
                  $.pjax.reload('#page');
               }
                currentView.find('#bot-status').replaceWith(newData);
            });
      }

      function setBotGraph () {
         var win, tie, loss, total;

         $('.graph-bar').each(function (index) {
            win = parseInt($(this).attr('data-win'));
            tie = parseInt($(this).attr('data-tie'));
            loss = parseInt($(this).attr('data-loss'));
            total = win + tie + loss;
            
            if (total != 0) {
               $(this).children('#graph-loss').css('flex-basis', ((loss * 100) / total) + '%');
               $(this).children('#graph-tie').css('flex-basis', ((tie * 100) / total) + '%');
            }
            else {
               $(this).addClass('no-games');
            }
            $(this).css('opacity', 1);
         });
      }

      function getCurrentView () {
         var currentView;

         $.each($('.profile-content-right'), function (_, content) {
            if ($(content).css('display') !== 'none') {
               currentView = $(content);
            }
         });

         return currentView;
      }

      // for focus on version selectbox
      $.each($(".js-select-version"), function () {
         $(this).val($(this).attr('data-focus'));
      });
   };

   controller.HomeController.prototype.editProfileAction = function () {
      app.log('HomeController::editProfileAction');

      var instituteData = [],
            instituteDataArray = $(".js-instituteData").val().split(';'),
            data = {};

        $.each(instituteDataArray, function (_, name) {
            instituteData.push({value: name});
        });
   
      //twitter typeahead
        var engine = new Bloodhound({
            local: instituteData,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.value); 
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace    
        });
        engine.initialize();

        $('#add-institutes')
            .on('tokenfield:createdtoken tokenfield:editedtoken tokenfield:removedtoken', function (event) {
                setMaxInstitutes();
            })
            .tokenfield({
                typeahead: [{
                    hint: true,
                    highlight: true,
                    minLength: 1
                },{
                    source: engine.ttAdapter(),
                    displayKey: 'value'
                }]
            });

         $(document).on('click', '#edit-profile-confirm', function (e) {
            var input = $('.token-input.tt-input').val();
         if (input.length > 1) {
            $('#add-institutes').tokenfield('createToken', input);
            $('.token-input.tt-input').val("");
         }

            data['country'] = $('#country :selected').text();
            data['time-zone'] = $('#time-zone :selected').text();
            data['notifications'] = $('#notifications').prop('checked');
            data['institutes'] = "";
            $('.token span').each(function () {
               data['institutes'] += $(this).text() + ';';
            });
            data['institutes'] = data['institutes'].slice(0,-1);
            $.ajax({
               type: 'POST',    
            url:'/profile/update',
            data: data,
         });
         setTimeout(function () {
            $.pjax ({
                   url: '/profile',
                   container: '#page'
               });
         },50);
      });

        setMaxInstitutes();

         function setMaxInstitutes () {
            if ($('.twitter-typeahead').css('display') !== 'none' 
                  && $('.tokenfield').children('div').length >= 3) {
            $('.twitter-typeahead').css('display', 'none');
           } else if ($('.twitter-typeahead').css('display') === 'none' 
                  && $('.tokenfield').children('div').length < 3) {
            $('.twitter-typeahead').css('display', 'inline-block');
           }
         }

         // for focus on country selectbox
      if($("#country").length > 0) {
         $('#country').val($('#country').attr('data-focus'));
      }
      // for focus on timeZone selectbox
      if($("#time-zone").length > 0) {
         $('#time-zone').val($('#time-zone').attr('data-focus'));
      }
   };

}(window, window.jQuery));
(function (window, $, undefined) {

   var controller = window.setNamespace('app.controller'),
        snippet    = window.setNamespace('app.snippet');

   controller.DiscussionController = function () {

      if (false === (this instanceof controller.DiscussionController)) {
         return new controller.DiscussionController(arguments);
      }
   };

   controller.DiscussionController.prototype.forumAction = function () {
      app.log('DiscussionController::forumAction');

        var urlParts = window.location.href.split('/'),
            discussion = urlParts[urlParts.length - 1];

        snippet.addSyntaxHighlighting();

      $(document).on('click', '#forums tr', function(event) {
           if($(event.target)[0].tagName !== 'A') {
               $('a', this).first().click();
           }
       });

       //confirm message and deleting discussions
        $(document).on('click', '#discussions tr', function(event) {

         var targetParts, target;
         
            if($(event.target).first().hasClass('fa-trash')) {
                if(confirm("Are you sure you want to delete this discussion?")) {
                    targetParts = $(event.target).closest('tr').children().find('a').attr('href').split('/');
                    targetParts.pop(); targetParts.pop(); targetParts.pop();
                    targetParts.push('remove');
                    target = targetParts.join('/');
                    $.pjax ({
                        url: target,
                        container: '#page'
                    });
                }
                else {
                    return false;
                }
            }
            else if($(event.target)[0].tagName === 'DIV' || $(event.target)[0].tagName === 'SPAN') {
                $('a', this).first().click();
            }
        });

        //search forum 
        $("#search-forum")
            .on('tokenfield:createdtoken tokenfield:editedtoken tokenfield:removedtoken', function (event) {
                var tokens = $('#search-forum').tokenfield('getTokens'),
                    queryString = "";

                $.each(tokens, function () {
                    queryString += this.value + "+";
                }) 
                queryString = queryString.slice(0, -1);
                if (queryString.length <= 0) {
                    queryString = "~empty";
                }

                $.ajax({
                    url: '/discussions/' + discussion + '/search/' + queryString + "/search",
                    context: this   
                }).done(function(newData) {
                    $('#discussions').replaceWith(newData);

                    //highlight words
                    $.each(tokens, function () {
                        var searchWord = this.value;
                        $('.js-search-text a, .search-description').each(function () {
                            $(this).html($(this).html().replace(new RegExp('\\b(' + searchWord + ')\\b', 'gi'), '<span class="highlight-search-forum">$1</span>'));
                        });
                    });
                });
            })
            .tokenfield();
   };

}(window, window.jQuery));