
(function (window, undefined) {
    'use strict';

    // set the namespace
    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        MoveType;

    /**
     * MoveType contains constants to translate between game data and game logic
     */
    MoveType = {
        ATTACK: 'attack/transfer',
        ILLEGAL: 'illegal_move',
        PLACE: 'place_armies',
        TRANSFER: 'transfer'
    };

    warlight.MoveType = MoveType;

}(window));(function (window, undefined) {

   // set the namespace
   var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
      RegionStatus;

   /**
    * RegionStatus contains constants to translate between game data and game logic
    */
   RegionStatus = {
      NEUTRAL: 'neutral',
      PLAYER_1: 'player1',
      PLAYER_2: 'player2',
      UNKNOWN: 'unknown'
   };

   warlight.RegionStatus = RegionStatus;
   
}(window));(function (window, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Point;

    Point = function (x, y) {

        // force new on constructor
        if ((this instanceof Point) === false) {
            return new Point(x, y);
        }

        this.x = x;
        this.y = y;
        // this.distortedX;
        // this.distortedY;
        this.cells = [];

        this.distortCoordinates(5);
        // var circle = canvas.circle(this.x, this.y, 3);
        // circle.attr('fill', 'green');
    };

    /**
     * Distorts the x and y coordinates of the point a bit
     * so the grids looks more playful
     */
    Point.prototype.distortCoordinates = function (offSetAmount) {
        
        var offSet;

        offSet = Math.floor(Math.random() * ((offSetAmount * 2) + 1)) - offSetAmount;
        this.distortedX = this.x + offSet;

        offSet = Math.floor(Math.random() * ((offSetAmount * 2) + 1)) - offSetAmount;
        this.distortedY = this.y + offSet;
    };

    /**
     * Returns part of a path drawing string for this point
     */
    Point.prototype.toPathString = function (distorted) {

        if (distorted) {
            return this.distortedX + "," + this.distortedY + " L";
        }
        return this.x + "," + this.y + " L";
    };

    warlight.Point = Point;

}(window));(function (window, Raphael, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Point = window.setNamespace('app.competitions.warlight-ai-challenge-2.Point'),
        Cell;

    Cell = function (coordinates, x, y) {

        // force new on constructor
        if ((this instanceof Cell) === false) {
            return new Cell(coordinates, x, y);
        }

        this.x = x;         //column in grid
        this.y = y;         //row in grid
        this.coordinates = coordinates;   //array of x,y coordinates in canvas
        this.points = [];    //Points
        this.neighbors = []; //Cells
        // this.drawnObject;
        // this.unUsedNeighbors; //Cells
        // this.islandNeighbors; //Cells
        // this.island;
        // this.superRegion;
        // this.region;
    };

    /**
     * Make drawing of the Cell from array of points
     */
    Cell.prototype.drawCell = function (canvas, distorted) {

        // make drawing string from points
        var drawing = "M";

        $.each(this.points, function (_, point) {
            drawing += point.toPathString(distorted);
        });
        drawing = drawing.slice(0, -1);
        drawing += "Z";

        this.drawnObject = canvas.path(drawing);
        this.drawnObject.attr({'fill': '#8FCFF7', 'stroke-width': 0});
        $(this.drawnObject.node).attr('id', "l" + this.x + "c" + this.y);
    };

    /**
     * Adds the six corner points of the cell to an array
     * as new or existing Point objects
     */
    Cell.prototype.addPoints = function () {

        var i, j, prev, p1, p2;

        for (i = 0; i < 6; i++) {
            j = (i + 1) % 6;
            prev = (i + 5) % 6;

            if (this.neighbors[i] !== undefined) {
                p1 = this.neighbors[i].points[(i + 4) % 6];
                p2 = this.neighbors[i].points[(j + 2) % 6];

                p1.cells.push(this);
                p2.cells.push(this);
                this.points[i] = p1;
                this.points[j] = p2;
            } else if (this.neighbors[prev] === undefined && this.points[i] === undefined) {
                p1 = new Point(this.coordinates[i].x, this.coordinates[i].y);
                p1.cells.push(this);
                this.points[i] = p1;
            }
        }
    };

    /**
     * Adds doubly linked neighbor cell
     */
    Cell.prototype.addNeighbor = function (cell, order) {

        var otherSide;

        if (cell !== undefined) { // cell is not undefined (edge of grid)
            otherSide = (order + 3) % 6;
            this.neighbors[order] = cell;
            cell.neighbors[otherSide] = this;
        }
    };

    /**
     * Get random neighbor for creating the islands
     */
    Cell.prototype.getRandomNeighborForIsland = function () {

        if (this.unUsedNeighbors === undefined) { // if unUsedNeighbors is not set yet (aka first time method is called for this cell)
            this.unUsedNeighbors = this.neighbors.slice(); // copy neighbors array to it
        }

        return this.getRandomNeighbor(this.unUsedNeighbors);
    };

    /**
     * Get random neighbor for creating regions
     */
    Cell.prototype.getRandomNeighborForRegion = function () {

        var island = this.island,
            islandNeighbors = [];

        if (this.islandNeighbors === undefined) {
            $.each(this.neighbors, function (_, cell) {
                if (cell !== undefined && island === cell.island) {
                    islandNeighbors.push(cell);
                }
            });
            this.islandNeighbors = islandNeighbors;
        }

        return this.getRandomNeighbor(this.islandNeighbors);
    };

    /**
     * Gets a random item from array
     */
    Cell.prototype.getRandomNeighbor = function (neighbors) {

        var index, neighbor;

        if (neighbors.length > 0) {
            index = Math.floor(Math.random() * neighbors.length);
            neighbor = neighbors[index];

            neighbors.splice(index, 1); // remove cell from array because we use it now.

            return neighbor;
        }

        return;
    };

    /**
     * Finds all regions objects, not the same as this cell's region, 
     * that are neighbor to this cell
     */
    Cell.prototype.findNeighboringRegions = function () {

        var neighboringRegions = [],
            region = this.region;

        $.each(this.neighbors, function (_, neighbor) {
            if (neighbor !== undefined && neighbor.region !== undefined && neighbor.region !== region
                    && neighboringRegions.indexOf(neighbor.region) === -1) {
                neighboringRegions.push(neighbor.region);
            }
        });

        return neighboringRegions;
    };

    /**
     * Sets this cell's region
     */
    Cell.prototype.setRegion = function (region) {

        this.region = region;
        if (this.drawnObject !== undefined) { // not really needed anymore
            $(this.drawnObject.node).attr('class', 'region' + region.id);
        }
    };

    /**
     * Gets the distance in grid to given cell
     */ 
    Cell.prototype.getDistanceToCell = function (cell) {
        
        var distanceX = this.x - cell.x,
            distanceY = this.y - cell.y;

        return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
    };

    /**
     * Get the middle point of this cell
     */ 
    Cell.prototype.getMiddlePoint = function () {
        
        var sumX = 0,
            sumY = 0;

        $.each(this.coordinates, function (_, point) {
            sumX += point.x;
            sumY += point.y;
        });

        this.pathPoint = {x: Math.floor(sumX / this.coordinates.length), y: Math.floor(sumY / this.coordinates.length)};
    };

    warlight.Cell = Cell;

}(window, window.Raphael, window.jQuery));(function (window, Raphael, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        SuperRegion;

    SuperRegion = function (id) {

        if ((this instanceof SuperRegion) === false) {
            return new SuperRegion(id);
        }

        this.id = id;
        this.points = [];
        this.cells = [];
        this.regions = [];
        // this.island;
    };

    /**
     * Gets all the necessary properties in this object for creating 
     * a string of the map
     */
    SuperRegion.prototype.getProperties = function () {

        var regions = [],
            object = {};

        object.id = this.id;
        object.bonus = this.bonus;
        object.island = this.island.id;

        $.each(this.regions, function (_, region) {
            regions.push(region.id);
        });
        object.regions = regions;

        object.text = this.bonusTextPosition;

        return object;
    };

    /**
     * Stores points of the superRegion borders and draws the region objects
     */
    SuperRegion.prototype.drawObject = function (canvas, distorted, offSetX, offSetY) {

        var point, currentCell, count, startCell, currentPointIndex, nextPoint,
            cellHeight = -1,
            superRegion = this,
            drawing = "M";

        // get a starting point and starting cell
        $.each(this.cells, function (_, cell) {
            $.each(cell.points, function (_, p) {
                count = 0;
                $.each(p.cells, function (_, c) {
                    if (c.superRegion === superRegion) {
                        startCell = c;
                        count++;
                    }
                });
                // to avoid problems, always start with a point with 1 cell
                // and a cell that is on the highest row in the superRegion (for holes)
                if (count === 1 && startCell.y > cellHeight) { 
                    point = p;
                    currentCell = startCell;
                    cellHeight = currentCell.y;
                }
            });
        });

        drawing += point.toPathString(distorted);

        // find the whole path
        while (this.points.indexOf(point) === -1) {

            $.each(point.cells, function (_, cell) {
                if (cell.superRegion === superRegion && cell !== currentCell) { // we need to move to the next cell
                    currentCell = cell;
                    return false;
                }
            });

            currentPointIndex = currentCell.points.indexOf(point);
            nextPoint = currentCell.points[(currentPointIndex + 1) % 6];

            drawing += nextPoint.toPathString(distorted);
            this.points.push(point);
            point = nextPoint;
        }

        drawing = drawing.slice(0, -1);
        drawing += "Z";

        // draw it
        this.drawnObject = canvas.path(drawing);
        this.drawnObject.attr({"stroke-width": 5, "fill": "rgba(0, 0, 0, 0)"});
        this.drawnObject.transform("t" + offSetX + "," + offSetY);

        $(this.drawnObject.node).attr('id', "superRegion" + this.id);

        // return this.drawnObject;
    };

    /**
     * Draws the textObject for each superRegion
     */
    SuperRegion.prototype.drawBonusText = function (canvas, offsetX, offsetY) {

        this.textObject = canvas.text(
            this.bonusTextPosition.x + offsetX,
            this.bonusTextPosition.y + offsetY,
            this.bonus
        ).attr({ // later in css
            'font-size': 30,
            'font-weight': 'bold',
            'opacity': 0
        });

        $(this.textObject.node).attr({'id': 'superRegion' + this.id + 'Text', 'class': 'superRegionText'});
    };

    warlight.SuperRegion = SuperRegion;

}(window, window.Raphael, window.jQuery));(function (window, Raphael, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        SuperRegion = window.setNamespace('app.competitions.warlight-ai-challenge-2.SuperRegion'),
        Region;

    Region = function (id) {

        if ((this instanceof Region) === false) {
            return new Region(id);
        }

        this.id = id;
        // this.drawnObject;
        // this.textObject;
        this.points = [];
        this.cells = [];
        this.neighbors = [];
        // this.islandNeighbors;
        // this.island;
        // this.superRegion;
        // this.armiesTextPosition;
    };

    /**
     * Gets all the necessary properties in this object for creating 
     * a string of the map
     */
    Region.prototype.getProperties = function () {

        var cells = [],
            neighbors = [],
            object = {};

        object.id = this.id;
        object.island = this.island.id;

        $.each(this.cells, function (_, cell) {
            cells.push({x: cell.x, y: cell.y});
        });
        object.cells = cells;

        $.each(this.neighbors, function (_, neighbor) {
            neighbors.push(neighbor.id);
        });
        object.neighbors = neighbors;

        object.text = this.armiesTextPosition;

        return object;
    };

        /**
     * Stores points of the region borders and draws the region objects
     */
    Region.prototype.drawObject = function (canvas, distorted, offSetX, offSetY, color) {

        var point, currentCell, count, startCell, currentPointIndex, nextPoint,
            region = this,
            drawing = "M";

        // get a starting point and starting cell
        $.each(this.cells, function (_, cell) {
            $.each(cell.points, function (_, p) {
                count = 0;
                $.each(p.cells, function (_, c) {
                    if (c.region === region) {
                        startCell = c;
                        count++;
                    }
                });
                if (count === 1) { // to avoid problems, always start with a point with 1 cell
                    point = p;
                    currentCell = startCell;
                    return false;
                }
            });
            if (point !== undefined) {
                return false;
            }
        });

        drawing += point.toPathString(distorted);

        // find the whole path
        while (this.points.indexOf(point) === -1) {

            $.each(point.cells, function (_, cell) {
                if (cell.region === region && cell !== currentCell) { // we need to move to the next cell
                    currentCell = cell;
                    return false;
                }
            });

            currentPointIndex = currentCell.points.indexOf(point);
            nextPoint = currentCell.points[(currentPointIndex + 1) % 6];

            drawing += nextPoint.toPathString(distorted);
            this.points.push(point);
            point = nextPoint;
        }

        drawing = drawing.slice(0, -1);
        drawing += "Z";

        // draw it
        this.drawnObject = canvas.path(drawing);
        this.drawnObject.attr({'fill': color, "stroke-width": 1});
        this.drawnObject.transform("t" + offSetX + "," + offSetY);
        $(this.drawnObject.node).attr('class', 'region' + this.id + ' superRegion' + this.superRegion.id);
    };

    /**
     * Draws an overlay path in the same shape as this region.
     * Used for hovering.
     */
    Region.prototype.drawOverlay = function (canvas, offSetX, offSetY) {

        this.overlayObject = canvas.path(this.drawnObject.attrs.path);
        this.overlayObject.attr({'fill': 'black', 'opacity': 0});
        this.overlayObject.transform("t" + offSetX + "," + offSetY);
        $(this.overlayObject.node).css('cursor', 'pointer');

        return this.overlayObject;
    };

    /**
     * Draw region shadow
     */
    Region.prototype.drawShadow = function (canvas, offSetX, offSetY) {

        var shadowObject = canvas.path(this.drawnObject.attrs.path);

        shadowObject.attr({'fill': 'rgb(132, 208, 208)', 'stroke':'none'});
        shadowObject.transform("t" + (offSetX + 10) + "," + (offSetY + 6));
        shadowObject.toBack();
    };

    Region.prototype.setHover = function (canvas, legend) {

        var textObject = this.textObject,
            region = this;

        this.overlayObject.hover(function (event) {
            clearTimeout(canvas.outTimer);
            canvas.inTimer = setTimeout(function () {
                region.hoverIn(legend);
                if (canvas.outRegion !== undefined && canvas.outRegion !== region) {
                    if (canvas.outRegion.superRegion.id === region.superRegion.id) {
                        canvas.outRegion.hoverOut(false, legend);
                    } else {
                        canvas.outRegion.hoverOut(true, legend);
                    }
                }
                canvas.outRegion = region;
            }, 50);
        }, function () {
            clearTimeout(canvas.inTimer);
            canvas.outTimer = setTimeout(function () {
                if (canvas.outRegion !== undefined) {
                    canvas.outRegion.hoverOut(true, legend);

                    // hide tooltip
                    if ($('#game-teaser').length === 0) {
                        $('div.tooltip').css({ "display": "none" });
                    }
                }
            }, 50);
        });
    };

    Region.prototype.hoverIn = function (legend) {

        this.overlayObject.attr({"opacity": 0.1});
        this.superRegion.drawnObject.attr({"stroke-width": 7, "fill": "rgba(0, 0, 0, 0.1)"});
        // legend[1][this.superRegion.id - 1].attr({'font-weight': 'bold'});

        // show tooltip
        if ($('#game-teaser').length === 0) {
            $('div.tooltip').text("Region\u00a0" + this.id);
            $('div.tooltip').css({ "display": "initial" });
        }
    };

    Region.prototype.hoverOut = function (removeSuperRegionHover, legend) {

        this.overlayObject.attr({"opacity": 0});
        if (removeSuperRegionHover && this.superRegion.clicked !== true) {
            this.superRegion.drawnObject.attr({"stroke-width": 5, "fill": "rgba(0, 0, 0, 0)"});
            legend[1][this.superRegion.id - 1].attr({'font-weight': 'normal'});
        }
    };

    Region.prototype.setClick = function (legend, deselectAllSuperRegions) {
        var superRegion = this.superRegion;

        this.overlayObject.click(function () {
            deselectAllSuperRegions();

            superRegion.drawnObject.attr({"stroke-width": 7, "fill": "rgba(0, 0, 0, 0.1)"});
            legend[1][superRegion.id - 1].attr({'font-weight': 'bold'});
            legend.show();
            legend.toFront();

            superRegion.clicked = true;
        });
    };

    /**
     * Sets the superRegion variable this region and it's cells
     */
    Region.prototype.setSuperRegion = function (superRegion) {
        this.superRegion = superRegion;
        $.each(this.cells, function (_, cell) {
            cell.superRegion = superRegion;
        });
    };

    /**
     * Draws the textObject for each region
     */
    Region.prototype.drawArmiesText = function (canvas, offsetX, offsetY) {

        this.textObject = canvas.text(
            this.armiesTextPosition.x + offsetX,
            this.armiesTextPosition.y + offsetY,
            "2"
        ).attr({ // later in css
            'font-size': 18,
            'font-weight': 'bold',
            'font-family': 'Exo'
        });
        this.textObject.attr('text', '');

        $(this.textObject.node).attr({'id': 'region' + this.id + 'Text', 'class': 'regionText'});
    };

    /**
     * Sets this region's color
     */
    Region.prototype.setColor = function (color) {

        if (this.drawnObject === undefined) {
            return;
        }

        this.drawnObject.attr('fill', color);
    };

    /**
     * Sets the text on this region that represents the amount of armies on it
     * 0 means that the region is invisible to the player so no text is set
     */
    Region.prototype.setArmiesText = function (armiesText) {

        if (this.textObject === undefined) {
            return;
        }

        if (armiesText === '0') {
            armiesText = '';
        }

        this.textObject.attr('text', armiesText);
    };

    warlight.Region = Region;

}(window, window.Raphael, window.jQuery));(function (window, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Island;

    Island = function (id) {

        if ((this instanceof Island) === false) {
            return new Island(id);
        }

        this.id = id;
        this.cells = [];
        this.regions = [];
        this.superRegions = [];
    };

    /**
     * Gets all the necessary properties in this object for creating 
     * a string of the map
     */
    Island.prototype.getProperties = function () {
        return { "id": this.id };
    };

    warlight.Island = Island;

}(window, window.jQuery));(function (window, document, Raphael, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Cell = window.setNamespace('app.competitions.warlight-ai-challenge-2.Cell'),
        Island = window.setNamespace('app.competitions.warlight-ai-challenge-2.Island'),
        Region = window.setNamespace('app.competitions.warlight-ai-challenge-2.Region'),
        SuperRegion = window.setNamespace('app.competitions.warlight-ai-challenge-2.SuperRegion'),
        Player = window.setNamespace('app.competitions.warlight-ai-challenge-2.Player'),
        Map;


    Map = function (width, height, offSetX, offSetY, distorted, colors) {

        // force new on constructor
        if ((this instanceof Map) === false) {
            return new Map(width, height, offSetX, offSetY, distorted, colors);
        }

        this.pixelsX = width;
        this.pixelsY = height;
        this.offSetX = offSetX;
        this.offSetY = offSetY;
        this.distorted = distorted;
        this.colors = colors;
        this.round = 0;
    };

    /**
     * Loads the map file
     */
    Map.prototype.loadMap = function (indexGame) {

        var url = window.location.href + '/replay/games/' + gameId + '/mapdata';
        /* TSTEINKE
        if (indexGame !== "") {
            url = 'http://' + window.location.hostname + '/competitions/warlight-ai-challenge/games/' + indexGame + '/mapdata';
        } else if ( window.location.href.split('/').length < 7 ) {
            console.log("Cannot find map for competition homepage");
            warlight.release();
            return;
        }
         */ 
        url = '/games/' + gameId + '/mapdata';

        var loadHandler = window.curry(this.handleMapLoaded, this);
        $.get(url, function (data) { loadHandler([data]); })
            .fail(function (jqxhr, settings, exception) {
                console.log('map data failed to load!');
                console.log(exception);
            });
    };

    /**
     * Handles the loaded map file
     */
    Map.prototype.handleMapLoaded = function (data) {

        this.parseMapFile(data);
        this.drawBackground();
        // this.drawCells();
        this.drawPaths();
        this.drawRegions();
        this.drawSuperRegions();
        
        // fire loaded event
        $(this).trigger("mapLoadedEvent");
    };

    /**
     * parses JSON input string and loads all the map objects needed for drawing
     * and other visuals
     */
    Map.prototype.parseMapFile = function (mapFile) {

        var regions,
            mapData = $.parseJSON(mapFile);
        
        //to reset the generated map so we can read it from the mapData
        this.islands = []; 
        this.regions = [];
        this.grid = [];
        this.paths = [];
        this.maxX = 0;
        this.maxY = 0;
        this.canvas = null;
        ////////////////////////////////////////////////////////////////

        this.maxX = mapData.Settings.gridSizeCells.x;
        this.maxY = mapData.Settings.gridSizeCells.y;
        this.grid = new Array(this.maxY); // grid is: [y][x]
        this.paths = [];
        this.canvas = Raphael('gridmap', this.pixelsX, this.pixelsY);

        this.makeGrid();
        this.loadIslands(mapData.Islands);
        this.regions = this.loadRegions(mapData.Regions); // in array by region id
        this.superRegions = this.loadSuperRegions(mapData.SuperRegions);
        this.superRegions.sort(function (a, b) {
            if (a.id > b.id) {
                return 1;
            }
            if (a.id < b.id) {
                return -1;
            }
            return 0;
        });
        this.loadPaths(mapData.Paths);
    };

    /**
     * loads all the island objects from the map data
     */
    Map.prototype.loadIslands = function (islandData) {

        var islands = [];

        $.each(islandData, function (_, islandObject) {
            islands.push(new Island(islandObject.id));
        });

        this.islands = islands;
    };

    /**
     * loads all the region objects from the map data
     * returns an array of regions that is used again to load
     * the superRegions more easily
     */
    Map.prototype.loadRegions = function (regionData) {

        var region,
            regions = [],
            islands = this.islands,
            grid = this.grid;

        $.each(regionData, function (_, regionObject) {
            region = new Region(regionObject.id)

            regions[regionObject.id] = region;
            region.island = islands[regionObject.island];
            region.island.regions.push(region);
            region.armiesTextPosition = regionObject.text;

            $.each(regionObject.cells, function (_, cell) {
                region.cells.push(grid[cell.y][cell.x]);
                grid[cell.y][cell.x].setRegion(region);
            });
        });

        // we need another loop because the neighbors can only be set when
        // all regions are loaded
        $.each(regionData, function (_, regionObject) {
            $.each(regionObject.neighbors, function (_, neighborId) {
                regions[regionObject.id].neighbors.push(regions[neighborId]);
            });
        });

        return regions;
    };

    /**
     * loads all the superRegion objects from the map data
     */
    Map.prototype.loadSuperRegions = function (superRegionData) {

        var superRegion,
            islands = this.islands,
            regions = this.regions,
            superRegions = [];

        $.each(superRegionData, function (_, superRegionObject) {
            superRegion = new SuperRegion(superRegionObject.id);

            superRegion.island = islands[superRegionObject.island];
            superRegion.island.superRegions.push(superRegion);
            superRegion.bonus = superRegionObject.bonus;
            superRegion.bonusTextPosition = superRegionObject.text;
            superRegions.push(superRegion);

            $.each(superRegionObject.regions, function (_, regionId) {
                superRegion.regions.push(regions[regionId]);
                regions[regionId].setSuperRegion(superRegion);
                superRegion.cells = superRegion.cells.concat(regions[regionId].cells);
            });
        });

        return superRegions;
    };

    /**
     * loads all the path objects from the map data
     */
    Map.prototype.loadPaths = function (pathData) {

        var path,
            paths = [],
            grid = this.grid;

        $.each(pathData, function (_, pathObject) {
            path = [];
            $.each(pathObject.cells, function (_, cell) {
                path.push(grid[cell.y][cell.x]);
            })
            paths.push(path);
        });

        this.paths = paths;
    };

    /**
     * Makes the starting grid on which the map is made
     */
    Map.prototype.makeGrid = function () {

        //points go from top-left to mid-left
        var i,
            points = [
                {x: 10, y: 0},
                {x: 30, y: 0},
                {x: 40, y: 17},
                {x: 30, y: 34},
                {x: 10, y: 34},
                {x: 0, y: 17}
            ];

        for (i = 0; i < this.maxY; i++) {
            this.grid[i] = new Array(this.maxX);
            this.makeHorizontalGridLine(points, i, this.maxY, 17);
        }
    };

    /** 
     * Makes one horizontal line of the grid
     */
    Map.prototype.makeHorizontalGridLine = function (points, line, lastLine, offSetAmount) {

        var i, newCell, offSet, transformedPoints;

        for (i = 0; i < this.maxX; i++) {
            transformedPoints = [];

            if (line === lastLine - 1 && i % 2 === 1) {
                continue;
            }

            offSet = i % 2 * offSetAmount;

            $.each(points, function (_, point) {
                transformedPoints.push({
                    x: point.x + (30 * i), 
                    y: point.y + (34 * line + offSet)
                });
            });

            newCell = new Cell(transformedPoints, i, line);

            // add the neighbors to the cell object in order
            if (i % 2 === 0) {
                newCell.addNeighbor(this.grid[line][i - 1], 4);
            } else {
                newCell.addNeighbor(this.grid[line][i - 1], 5);
            }
            if (line > 0) {
                newCell.addNeighbor(this.grid[line - 1][i], 0);
                if (i % 2 === 0) {
                    newCell.addNeighbor(this.grid[line - 1][i + 1], 1);
                    newCell.addNeighbor(this.grid[line - 1][i - 1], 5);
                }
            }

            this.grid[line][i] = newCell;
            newCell.addPoints();
        }
    };

    // MAYBE DO SOME OF THIS IN HTML (background image)
    /**
     * Draws all the background elements of the game
     */
    Map.prototype.drawBackground = function () {

        var legend, superRegions,
            map = this,
            canvas = this.canvas,
            background = this.canvas.rect(0, 0, this.pixelsX, this.pixelsY),
            // barTop = this.canvas.rect(0, 0, this.pixelsX, 60),
            barBottom = this.canvas.rect(0, this.pixelsY - 50, this.pixelsX, 50),
            // barSet = this.canvas.set().push(barTop).push(barBottom),
            playerNamesSet = this.canvas.set(),
            playerArmiesSet = this.canvas.set();
            

        background.attr({'fill': 'rgb(255, 255, 255)', 'stroke': 'none', 'opacity': 0});
        barBottom.attr({'fill': 'rgba(0, 0, 0, 0.2)', 'stroke': 'none'});
        this.roundNumber = this.canvas.text(this.pixelsX / 2, this.offSetY - 42, "Picking phase");
        this.gameEndText = this.canvas.text(this.pixelsX / 2, this.pixelsY / 2, "Game end!");
        this.overlay = this.canvas.rect(0, 0, this.pixelsX, this.pixelsY);

        // set player names
        this.playerName1 = this.canvas.text(this.offSetX + 25, 31, this.players[0].name);
        this.playerName2 = this.canvas.text(this.pixelsX - (this.offSetX + 15), 31, this.players[1].name);
        playerNamesSet.push(this.playerName1).push(this.playerName2);
        playerNamesSet.attr({'fill':'rgb(255, 255, 255)', 'font-family': 'Exo', 'font-size': '26px'});
        this.playerName1.attr({'text-anchor': 'start'});
        this.playerName2.attr({'text-anchor': 'end'});

        // set player armies text
        // this.playerArmies1 = this.canvas.text(this.offSetX * 2 + $.fn.textWidth($(this.playerName1.node).text() + 5, "Exo", '28px'), 36, "5 Armies/round");
        // this.playerArmies2 = this.canvas.text(this.pixelsX - (this.offSetX * 2 + $.fn.textWidth($(this.playerName2.node).text() + 5, "Exo", '28px')), 36, "5 Armies/round");
        this.playerArmies1 = this.canvas.text(this.offSetX + 370, 35, "5 Armies/round");
        this.playerArmies2 = this.canvas.text(this.pixelsX - (this.offSetX + 360), 30, "5 Armies/round");
        this.playerArmies1.attr({'text-anchor': 'start'});
        this.playerArmies2.attr({'text-anchor': 'end'});
        playerArmiesSet.push(this.playerArmies1).push(this.playerArmies2);
        playerArmiesSet.attr({'fill':'rgb(255, 255, 255)', 'font-family': 'Exo', 'font-size': '17px'});

        this.makeLegend();

        // background click stuff
        legend = this.legend;
        superRegions = this.superRegions;
        background.click(function () {
            legend.hide();
            legend.toBack();
            map.deselectAllSuperRegions();
        });

        this.overlay.attr({'fill': 'black', 'opacity': 0});
        this.roundNumber.attr({'font-family': 'Exo', 'font-size': '35px'});
        this.gameEndText.attr({'font-family': 'Exo', 'font-size': '72px', 'opacity': 0});
    };

    /**
     * Makes the legend
     */
    Map.prototype.makeLegend = function () {

        var legendTextObject, legendBox,
            textHeight = 0,
            map = this,
            canvas = this.canvas,
            legendTextSet = canvas.set();

        $.each(this.superRegions, function (_, superRegion) { // create a line for each superRegions

            /* TSTEINKE - 200 */
            legendTextObject = canvas.text(0, textHeight - 200, "SuperRegion " + superRegion.id + ", bonus " + superRegion.bonus);
            $(legendTextObject.node).css('cursor', 'pointer');

            legendTextObject.click(function () { // set click
                map.deselectAllSuperRegions();

                superRegion.drawnObject.attr({"stroke-width": 7, "fill": "rgba(0, 0, 0, 0.1)"});
                superRegion.clicked = true;
                this.attr({'font-weight': 'bold'});
            });

            legendTextSet.push(legendTextObject);
            textHeight += 30;
            $(legendTextObject.node).attr('class', 'superRegion' + superRegion.id + 'LegendText');
        });

        legendTextSet.attr({'font-family': 'Exo', 'font-size': '22px', 'text-anchor': 'start'});
        legendTextSet.transform('t' + 35 + ',' + (this.pixelsY - (textHeight + 67)));
        legendBox = canvas.rect(15, this.pixelsY - 200 - (textHeight + 102), $.fn.textWidth($(legendTextObject.node).text(), "Exo", '22px') + 35, textHeight + 38);
        legendBox.attr({'fill': 'rgba(255,255,255,0.6)', 'stroke-width': 4, 'stroke': 'black', 'stroke-linejoin': 'round'});
        legendTextSet.toFront();
        this.legend = canvas.set().push(legendBox, legendTextSet);
        this.legend.hide();
    };

    $.fn.textWidth = function(text, font, fontSize) {
        if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
        $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
        $.fn.textWidth.fakeEl.css('font-size', fontSize);
        return $.fn.textWidth.fakeEl.width();
    };

    /**
     * Removes click effect from all superRegions
     */
    Map.prototype.deselectAllSuperRegions = function () {

        this.legend.attr({'font-weight': 'normal'});
        $.each(this.superRegions, function (_, superRegion) {
            superRegion.clicked = false;
            superRegion.drawnObject.attr({"stroke-width": 5, "fill": "rgba(0, 0, 0, 0)"});
        });
    };

    /**
     * Draws the cells, probably not needed in the end
     */
    Map.prototype.drawCells = function () {

        var i, j, cell;

        for (i = 0; i < this.maxY; i++) {
            for (j = 0; j < this.maxX; j++) {
                cell = this.grid[i][j];
                if (cell !== undefined) {
                    cell.drawCell(this.canvas, this.distorted);
                }
            }
        }
    };

    /**
     * Draws the paths as a dashed line with smooth curves
     */
    Map.prototype.drawPaths = function () {

        var point, drawing, drawnPath, curveType,
            canvas = this.canvas,
            map = this;

        $.each(this.paths, function (_, path) {
            drawing = "M";
            $.each(path, function (i, cell) {
                if (cell.pathPoint === undefined) {
                    cell.getMiddlePoint();
                }
                if (i > 0 && i < path.length - 1 && path[i-1].y === cell.y && path[i+1].y === cell.y) {
                    if (path[i-1].pathPoint === undefined) {
                        path[i-1].getMiddlePoint();
                    }
                    cell.pathPoint.y = path[i-1].pathPoint.y;
                }
                curveType = " S";
                if (i % 2 !== 0) {
                    curveType = " ";
                }
                if (i % 2 === 1 && i === path.length - 1) {
                    curveType = " " + cell.pathPoint.x + "," + cell.pathPoint.y + " ";
                }
                drawing += cell.pathPoint.x + "," + cell.pathPoint.y + curveType;
            });
            drawing = drawing.slice(0, -1);
            drawnPath = canvas.path(drawing);
            drawnPath.attr({'stroke-width': 5, 'stroke-dasharray': '-'});
            drawnPath.transform("t" + map.offSetX + "," + map.offSetY);
        });
    };

    /**
     * Draws the region object from the outline of it's grid cells
     */
    Map.prototype.drawRegions = function () {

        var canvas = this.canvas,
            distorted = this.distorted,
            map = this,
            deselectSuperRegionsHandler = window.curry(this.deselectAllSuperRegions, this);

        this.regionsOverlay = canvas.set();

        $.each(this.islands, function (_, island) {
            $.each(island.regions, function (_, region) {
                region.drawObject(canvas, distorted, map.offSetX, map.offSetY, map.colors.neutral);
                region.drawArmiesText(canvas, map.offSetX, map.offSetY);
                map.regionsOverlay.push(region.drawOverlay(canvas, map.offSetX, map.offSetY));
                region.drawShadow(canvas, map.offSetX, map.offSetY);
                region.setHover(canvas, map.legend);
                region.setClick(map.legend, deselectSuperRegionsHandler);
            });
        });
    };

    /**
     * Draws the superRegion object, same way as the regions
     */
    Map.prototype.drawSuperRegions = function () {

        var canvas = this.canvas,
            distorted = this.distorted,
            map = this;

        $.each(this.islands, function (_, island) {
            $.each(island.superRegions, function (_, superRegion) {
                superRegion.drawObject(canvas, distorted, map.offSetX, map.offSetY);
                superRegion.drawBonusText(canvas, map.offSetX, map.offSetY);
            });
        });

        this.regionsOverlay.toFront();
    };

    /**
     * Updates the round number
     */
    Map.prototype.setRoundNumber = function (round) {
        this.round = parseInt(round,10);
        if (this.round === 0) {
            this.roundNumber.attr({"text": "Picking phase"});
        } else {
            this.roundNumber.attr({"text": "Round " + this.round});
        }
    };

    /**
     * draws/shows the end of the game
     */
    Map.prototype.showGameEnd = function (winner) {

        var text;

        if (winner !== "") {
            text = "Game end! " + winner + " has won.";
        } else {
            text = "Game end! Players have tied.";
        }

        this.overlay.attr({'opacity': 0.2}).toFront();
        this.gameEndText.attr({'text': text, 'opacity': 1}).toFront();
    };

    /**
     * Draws an arrow from origin Region to target Region
     */
    Map.prototype.drawArrow = function (originRegionId, targetRegionId, movingArmies, player, animationSpeed) {

        var angle, arrow, dist, movingArmiesText,
            textRadius = 25, //a value so that the arrow won't draw over the regionText
            origin = this.regions[originRegionId],
            target = this.regions[targetRegionId],
            ox = origin.armiesTextPosition.x + this.offSetX,
            oy = origin.armiesTextPosition.y + this.offSetY,
            tx = target.armiesTextPosition.x + this.offSetX,
            ty = target.armiesTextPosition.y + this.offSetY,
            transform = {
                x: 0,
                y: 0
            },
            newOrigin = {
                x: ox,
                y: oy
            };

        // calculate arrow angle and length
        dist = Math.sqrt(Math.pow(tx - ox, 2) + Math.pow(ty - oy, 2)) - textRadius * 2; //arrow's distance
        angle = Math.atan2(ty - oy, tx - ox) * 180 / Math.PI; //arrow's angle

        //calculate the starting point of the arrow
        newOrigin.x += (textRadius * Math.cos(angle * Math.PI / 180));
        newOrigin.y += (textRadius * Math.sin(angle * Math.PI / 180));
        transform.x = (dist / 2) * Math.cos(angle * Math.PI / 180);
        transform.y = (dist / 2) * Math.sin(angle * Math.PI / 180);

        // draw the arrow
        arrow = this.canvas.path('M -9,-9 -9,9 -9,9 -9,18 11,0 -9,-18 -9,-9 z').attr({
            'fill': player.color,
            'stroke-width': 2.2,
            'stroke': 'black',
            'stroke-linejoin': 'round'
        });
        // add the text
        movingArmiesText = this.canvas.text(newOrigin.x, newOrigin.y, movingArmies).attr({ 
            'font-weight': 'bold', 
            'font-family': 'Exo',
            'font-size': '17px'
        });
        this.arrowLayer = this.canvas.set().push(arrow, movingArmiesText);

        // set the point of origin and angle
        arrow.transform('t' + newOrigin.x + ',' + newOrigin.y + 'r' + angle);
        arrow.animate({
            path: 'M -9,-9 -9,9 '+ (dist - 9) +',9 '+ (dist - 9) +',18 '+ (dist + 11) +',0 '+ (dist - 9) +',-18 '+ (dist - 9) +',-9 z'
        }, animationSpeed);

        movingArmiesText.animate({ transform: 't' + transform.x + ',' + transform.y }, animationSpeed);
    };

    /**
     * Draws a box from origin region with amount of armies
     */
    Map.prototype.drawBox  = function (originRegionId, armies, player, animationSpeed) {

        // define variables
        var armiesText, box, boxPrototype, textWidth, color, boxLayer,
            origin = this.regions[originRegionId],
            ox = origin.armiesTextPosition.x + this.offSetX,
            oy = origin.armiesTextPosition.y + this.offSetY;

        boxPrototype = 'm -__textWidth15__,-13 0,26 c 0,0 0,3 3,3 3,0 __textWidth__,0 __textWidth__,0 0,0 3,0 3,-3 0,-3 0,-26 0,-26 0,0 0,-3 -3,-3 -3,0 -__textWidth__,0 -__textWidth__,0 0,0 -3,0 -3,3 z';

        // draw the text
        armiesText = this.canvas.text(1, 0, armies).attr({
            'font-family': 'Exo',
            'font-weight': 'bold',
            'font-size': '17px',
            'text-anchor': 'end'
        });

        // draw the bounding box
        textWidth = armiesText.getBBox().width;
        box = this.canvas.path(
            boxPrototype.replace(/__textWidth__/g, textWidth + 5)
                .replace(/__textWidth15__/g, textWidth + 4.5)
        );

        color = this.colors.neutral;
        if (player !== undefined) {
            color = player.color;
        }

        box.attr({
            'fill': color,
            'stroke': 'rgb(0, 0, 0)',
            'stroke-width': 2.2,
            'stroke-linejoin': 'round'
        });

        // set the box and animate
        armiesText.toFront();

        boxLayer = this.canvas.set().push(armiesText, box).attr({ opacity: '0' });
        boxLayer.transform('t' + (ox + (textWidth / 2)) + ',' + oy);
        boxLayer.animate({ transform: 't' + (ox + (textWidth / 2)) + ',' + (oy - 32), opacity: '1' }, animationSpeed, 'backout');

        if (this.boxSet === undefined) {
            this.boxSet = this.canvas.set();
        }
        this.boxSet.push(boxLayer);
    };

    /**
     * Clears all game elements on the map
     */
    Map.prototype.clearMap = function () {

        this.overlay.attr({'opacity': 0}).toBack();
        this.gameEndText.attr({'opacity': 0}).toBack();

        if (this.boxSet !== undefined) {
            this.boxSet.remove();
        }
        if (this.arrowLayer !== undefined) {
            this.arrowLayer.remove();
        }
    };

    /**
     * updates the colors of the regions
     * @param array mapData
     */
    Map.prototype.update = function (mapData) {
        var color, i, regionId, regionParts, regionText;

        // cycle through all regions
        for (i = 1; i < mapData.length - 1; i++) {

            regionParts = mapData[i].split(';');
            regionId = regionParts[0];

            color = this.colors[regionParts[1]];
            if (regionParts[1].indexOf('player') !== -1) {
                color = this.colors.players[regionParts[1].substr(regionParts[1].length - 1) - 1];
            }

            if (this.round === 0) {
                if (this.startingRegions.indexOf(regionId) !== -1 && regionParts[1] === 'neutral') {
                    regionText = ' ';
                    color = this.colors.starting;
                } else if (regionParts[1] === 'neutral' && regionParts[2] == '2') {
                    regionText = ' ';
                } else {
                    regionText = regionParts[2];
                }
            } else {
                regionText = regionParts[2];
            }
            this.regions[regionId].setColor(color)
            this.regions[regionId].setArmiesText(regionText);
        }
    };

    /**
     * Checks for each superRegion if it's owned by one player and
     * updates the armies per round text accordingly
     */
    Map.prototype.checkSuperRegions = function () {

        var player1Armies = 5,
            player2Armies = 5,
            map = this;

        this.legend[1].attr({'fill': 'black'});
        $.each(this.superRegions, function (_, superRegion) {

            var gotWholeSuperRegion = true,
                playerColor = superRegion.regions[0].drawnObject.attr('fill');

            if (playerColor !== map.colors.players[0] && playerColor !== map.colors.players[1]) {
                return true;
            }

            $.each(superRegion.regions, function (_, region) {
                if (region.drawnObject.attr('fill') !== playerColor) {
                    gotWholeSuperRegion = false;
                    return false;
                }
            });

            if (!gotWholeSuperRegion) {
                return true;
            }

            if (playerColor === map.colors.players[0]) {
                player1Armies += superRegion.bonus;
            } else {
                player2Armies += superRegion.bonus;
            }

            map.legend[1][superRegion.id - 1].attr({'fill': playerColor});
        });

        this.playerArmies1.attr({'text': player1Armies + " Armies/round"});
        this.playerArmies2.attr({'text': player2Armies + " Armies/round"});
    };

    warlight.Map = Map;

}(window, document, window.Raphael, window.jQuery));(function (window, undefined) {
    'use strict';

    // set the namespace
    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Player;

    /**
     * Player defines a player
     * @param string playerName
     * @param string playerColor
     */
    Player = function (playerName, playerColor) {

        // enforce use of new on constructor
        if ((this instanceof Player) === false) {
            return new Player(playerName, playerColor);
        }

        // set defaults
        this.armies = 5;
        this.color = playerColor;
        this.name = playerName;
        this.history = {
            map: [],
            moves: []
        };
    };

    warlight.Player = Player;

}(window));(function (window, undefined) {
    'use strict';

    // set the namespace
    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        ViewMode;

    /**
     * ViewMode are constans representing the view modes
     */
    ViewMode = {
        SHOW_ALL: 'all',
        PLAYER_1: '0',
        PLAYER_2: '1'
    };

    warlight.ViewMode = ViewMode;

}(window));(function (window, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        MoveType = window.setNamespace('app.competitions.warlight-ai-challenge-2.MoveType'),
        RegionStatus = window.setNamespace('app.competitions.warlight-ai-challenge-2.RegionStatus'),
        Move;

    /**
     * Move parses moveData into readable variables
     * @param array moveData
     * @param array players
     */
    Move = function (moveData, players) {

        //enforce use of new on constructor
        if ((this instanceof Move) === false) {
            return new Move(moveData, players);
        }

        var playerIndex = moveData[0].substr(moveData[0].length - 1);

        this.amount = 0;
        this.moveType = moveData[1];
        this.player = players[playerIndex - 1];
        this.sourceRegion = parseInt(moveData[2], 10);
        this.targetRegion = -1;
        this.intendedMoveType = this.moveType;

        switch (this.moveType) {

        case MoveType.ILLEGAL:
            // set the intendedMoveType and description if move is illegal
            this.intendedMoveType = moveData[3];
            this.description = moveData.splice(4, moveData.length - 1).join(' ');

            break;

        case MoveType.PLACE:
            // set amount of armies to place
            this.amount = moveData[3];
            break;

        case MoveType.ATTACK:
            // set targetRegion and amount if move is attack
            this.targetRegion = parseInt(moveData[3], 10);
            this.amount = parseInt(moveData[4], 10);
            break;
        }
    };

    Move.prototype.getAttackingArmies = function(armiesPresent) {

        var attackingArmies = this.amount;

        if(armiesPresent <= attackingArmies && armiesPresent > 0) {

            attackingArmies = armiesPresent - 1;
        }        

        return attackingArmies;
    }

    /**
     * Move.isAttack checks whether move is an attack
     * @param array visibleHistory
     * @param number moveIndex
     * @return boolean
     */
    Move.prototype.isAttack = function (visibleMap, moveIndex) {

        // declare variables
        var isAttack = true,
            sourceRegion,
            targetRegion;

        // get source and target region
        sourceRegion = visibleMap[moveIndex - 1][this.sourceRegion].split(';');
        targetRegion = visibleMap[moveIndex - 1][this.targetRegion].split(';');

        // check whether move is an attack
        if (sourceRegion[1] === targetRegion[1] ||
                (sourceRegion[1] === RegionStatus.UNKNOWN &&
                targetRegion[1] !== RegionStatus.NEUTRAL)) {

            isAttack = false;
        }

        return isAttack;
    };

    /**
     * Converts the move into a readable string
     * @param String regionName
     * @param Number attackingArmies
     * @return String
     */
    Move.prototype.toString = function (regionName, attackingArmies) {

        var armiesText = 'armies',
            string;

        // make armiesText singular if only 1 army attacks
        if (this.amount === 1) {
            armiesText = 'army';
        }

        // create output string depending on moveType
        switch (this.moveType) {

        case MoveType.ILLEGAL:

            string = "__playerName__ cannot __moveType__: __regionName__ __description__";
            string = string.replace(/__moveType__/g, this.intendedMoveType)
                 .replace(/__description__/g, this.description);

            break;

        case MoveType.PLACE:

            string = "__playerName__ places __amount__ __unit__ on __regionName__";
            string = string.replace(/__amount__/g, this.amount)
                 .replace(/__unit__/g, armiesText);

            break;

        case MoveType.TRANSFER:

            string = "__playerName__ transfers __amount__ __unit__ to __regionName__";
            string = string.replace(/__amount__/g, this.amount)
                 .replace(/__unit__/g, armiesText);

            break;

        case MoveType.ATTACK:

            string = "__playerName__ attacks __regionName__ with __amount__ __unit__";
            string = string.replace(/__amount__/g, attackingArmies)
                 .replace(/__unit__/g, armiesText);

            break;
        }

        if (regionName == undefined) {
            regionName = '';
        }

        string = string.replace(/__playerName__/g, this.player.name)
            .replace(/__regionName__/g, regionName);

        return string;
    };

    warlight.Move = Move;

}(window));(function (window, $, undefined) {
    'use strict';

    // define namespace
    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
        Move = window.setNamespace('app.competitions.warlight-ai-challenge-2.Move'),
        MoveType = window.setNamespace('app.competitions.warlight-ai-challenge-2.MoveType'),
        MoveBox;

    /**
     * MoveBox defines collapsing and expanding behavior the select box
     * @param selector
     */
    MoveBox = function (selector, colors) {

        //enforce use of new on constructor
        if ((this instanceof MoveBox) === false) {
            return new MoveBox(selector, colors);
        }

        //set defaults
        this.boxHeight = 600;
        this.view = $(selector);
        this.data = [];
        this.colors = colors;
        this.view.css({height: (this.boxHeight - 60) + 'px'});
        this.selectedOption = 0;
    };

    /**
     * MoveBox.clear removes all options from the MoveBox
     */
    MoveBox.prototype.clear = function () {
        this.view.empty();
    };

    /**
     * MoveBox.collapse collapses the select box
     */
    MoveBox.prototype.collapse = function () {

        var newHeight = (this.boxHeight - 60) + 'px',
            moveBox = this;

        // only collapse if expanded
        if (this.view.css('opacity') >= 1) {
            $('#textBox').removeClass('active');
            this.view.animate({ opacity: 0, height: '540px' }, 300, function () {
                $(this).css({'display': 'none'});
            });
        }
    };

    /**
     * MoveBox.expand expands the select box
     */
    MoveBox.prototype.expand = function () {

        var newHeight = this.boxHeight + 'px',
            moveBox = this;

        // only expand if collapsed
        if (this.view.css('opacity') <= 0) {
            $('#textBox').addClass('active');
            this.view.css('display', 'block');
            this.view.animate({ opacity: 1, height: newHeight }, 300);
            this.view.scrollTop(19.17 * this.selectedOption);
        }
    };

    /**
     * MoveBox.toggle toggles between expanded/collapsed states
     */
    MoveBox.prototype.toggle = function () {

        // collapse if expanded, else expand if collapsed
        if ($('#textBox').hasClass('active')) {
            this.collapse();
            this.view.blur();
        } else {
            this.expand();
        }
    };

    /**
     * MoveBox.fill populates the MoveBox with options
     */
    MoveBox.prototype.fill = function(visibleHistory, players) {
        var attackingArmies = 0,
            currentMove,
            moveData,
            moveOption,
            moveType = null,
            optionText,
            regionName,
            sourceRegion,
            bold;

        this.view.empty();

        for (var i = 1; i < visibleHistory.moves.length; i++) {

            moveData = visibleHistory.moves[i].split(' ');

            if (i >= visibleHistory.moves.length - 1) { //game end
                optionText = 'Game end';
                bold = true;

            } else if (moveData.length <= 1) { //new round
                if (moveData[0] == 0) {
                    optionText = 'Picking phase';
                } else {
                    optionText = 'Round ' + moveData[0];
                }
                bold = true;

            } else {
                currentMove = new Move(moveData, players);
                moveType = currentMove.moveType;
                regionName = 'Region ' + currentMove.sourceRegion;
                bold = false;

                if (currentMove.moveType === MoveType.ATTACK) {
                    regionName = 'Region ' + currentMove.targetRegion;

                    if (currentMove.isAttack(visibleHistory.map, i)) {
                        sourceRegion = visibleHistory.map[i - 1][currentMove.sourceRegion].split(';');
                        attackingArmies = currentMove.getAttackingArmies(sourceRegion[2]);

                    } else {
                        currentMove.moveType = MoveType.TRANSFER;
                    }
                }

                optionText = currentMove.toString(regionName, attackingArmies);
            }

            moveOption = document.createElement('option');
            moveOption.text = optionText;
            moveOption.value = i;
            if (bold) {
                moveOption.setAttribute('class', 'option-bold');
            }

            if (moveType === MoveType.ILLEGAL) {
                moveType = null;
                moveOption.style.color = this.colors.illegal;
            }

            this.view.append(moveOption);
        }       
    };

    /**
     * MoveBox.setSelected selects the option at index
     * @param number index
     */
    MoveBox.prototype.setSelected = function (index) {
        
        if(index < 0 || index == null) {

            index = 0;

        } else if (index >= this.view[0].length) {
            
            index = this.view[0].length - 1;
        }

        // set the index
        this.view.val(index + 1);
        this.setMoveText(index);
    };

    /**
     *
     */
    MoveBox.prototype.setMoveText = function (index) {
        $('#moveText').val(this.view[0][index].text);
        this.selectedOption = index;
    };

    warlight.MoveBox = MoveBox;

}(window, jQuery));(function (window, document, $, undefined) {
    'use strict';

    var warlight = window.setNamespace('app.competitions.warlight-ai-challenge-2'),
      Map = window.setNamespace('app.competitions.warlight-ai-challenge-2.Map'),
      Player = window.setNamespace('app.competitions.warlight-ai-challenge-2.Player'),
        ViewMode = window.setNamespace('app.competitions.warlight-ai-challenge-2.ViewMode'),
        MoveBox = window.setNamespace('app.competitions.warlight-ai-challenge-2.MoveBox'),
        Move = window.setNamespace('app.competitions.warlight-ai-challenge-2.Move'),
        MoveType = window.setNamespace('app.competitions.warlight-ai-challenge-2.MoveType'),
        RegionStatus = window.setNamespace('app.competitions.warlight-ai-challenge-2.RegionStatus'),
      Game,

      // set defaults
        _defaults = {
            colors: {
                illegal: '#d41f15',
                neutral: 'rgb(240, 222, 180)',
                unknown: 'rgb(163, 134, 113)',
                starting: 'rgb(255, 237, 209)',
                // starting: 'rgb(201, 188, 155)',
                players: {
                    0: 'rgb(192, 59, 43)',
                    1: 'rgb(40, 128, 186)'
                }
            },
            game: {
                animationSpeed: 750,
            },
            map: {
                width: 1515,
                height: 830 + 60,
                offSetX: 15,
                offSetY: 15 + 60,
                distorted: true
            },
            boxHeight: 630
        };

    Game = function () {

      if ((this instanceof Game) === false) {
         return new Game();
      }

      window.currentGame = this;

      var i, player, playerColor, playerName,
            playerNames = $('#gamediv').attr('data-players').split(','),
            mapLoadHandler = window.curry(this.handleMapLoaded, this);

        this.settings = _defaults;
        this.players = [];
        this.round = 0;
        this.history = {
            moves: [],
            map: []
        };
        this.visible = {
            round: 0,
            move: 0,
            history: {
                moves: [],
                map: []
            }
        };
        this.moveBox = new MoveBox('#moveSelector', this.settings.colors);

        // create the players
        for (i = 0; i < playerNames.length; i++) {
            playerColor = this.settings.colors.players[i];
            playerName = playerNames[i];
            player = new Player(playerName, playerColor);

            this.players.push(player);
        }

        //set the game for the homepage. Empty string if not homepage game.
        this.indexGame = $('#gamediv').attr('data-indexgame');

      this.map = new Map(this.settings.map.width, this.settings.map.height, 
                                this.settings.map.offSetX, this.settings.map.offSetY, 
                                this.settings.map.distorted, this.settings.colors);
        this.map.players = this.players;
        // this.map.round = 1;
      // this.map.setPlayerNames(this.players[0], this.players[1]);
      // this.map.setRoundNumber(1);
        this.map.loadMap(this.indexGame);

        // set viewMode to first person view
        this.viewMode = ViewMode.PLAYER_1;

        // set window resizing
        this.handleWindowResize();

        // register event listeners
        this.registerEventListeners();

        // will call handleMapLoaded once the map has really been loaded
        $(this.map).bind("mapLoadedEvent", mapLoadHandler);
    };

    Game.prototype.load = function () {

        var url = window.location.href + '/replay/games/' + gameId + '/data';
        /* TSTEINKE
        if (this.indexGame !== "") {
            url = 'http://' + window.location.hostname + '/competitions/warlight-ai-challenge/games/' + this.indexGame + '/data';
        } else if ( window.location.href.split('/').length < 7 ) {
            console.log("Cannot find game for competition homepage");
            warlight.release();
            return;
        }
        */
        url = '/games/' + gameId + '/data';

        var loadHandler = window.curry(this.handleData, this);
        $.get(url, function (data) { loadHandler([data]); })
            .fail(function (jqxhr, settings, exception) {
                console.log('data failed to load!');
                console.log(exception);
            });
    };

    /**
     * Creates the history for the game and each player
     * @param array historyData
     * @param string viewMode
     * @param number lineNumber
     */
    Game.prototype.createHistory = function (historyData, viewMode, lineNumber) {

        // declare variables
        var moveIndex = 1,
            history = {
                map: [historyData[lineNumber].split(' ')],
                moves: [0]
            },
            lineParts;

        lineNumber++;

        while (lineNumber < historyData.length) {

            lineParts = historyData[lineNumber].split(' ');

            if (lineParts[0] === 'map') { // happens when picking phase output is over
                lineNumber++;
                continue;

            } else if (lineParts[0] === 'round') { //new round found

                if (lineParts[1] === '1') { // extra map is given to switch views again
                    history.map[moveIndex] = historyData[lineNumber - 1].split(' ');
                } else {
                    history.map[moveIndex] = history.map[moveIndex - 1]; //add previous map to this moveIndex
                }
                history.moves[moveIndex] = lineParts[1]; //add roundnumber to this moveIndex

            } else if (lineParts[1] === 'won') {

                history.map[moveIndex] = history.map[moveIndex - 1]; //add previous map to this moveIndex
                history.moves[moveIndex] = lineParts.join(' ');
                lineNumber++;
                break;

            } else { //move found

                history.moves[moveIndex] = historyData[lineNumber];
                lineNumber++;
                history.map[moveIndex] = historyData[lineNumber].split(' ');

            }

            lineNumber++;
            moveIndex++;
        }
        // set the history
        if (viewMode === ViewMode.SHOW_ALL) {
            this.history = history;
        } else {
            this.players[viewMode].history = history;
        }

        return lineNumber;
    };

    /**
     * updateMap updates the regions with the right color and armies
     */
    Game.prototype.updateMap = function () {

        var currentMap = this.visible.history.map[this.visible.move];

        this.map.update(currentMap);
        this.map.checkSuperRegions();
    };

    /**
     * Game.setView sets the viewMode to viewMode
     * @param string viewMode
     */
    Game.prototype.setView = function (viewMode) {

        if (viewMode === '' || viewMode === null || 
                viewMode === undefined || viewMode.type === "keypress") {
            viewMode = this.getNextViewMode();
        }

        // set the visible history
        if (viewMode === ViewMode.SHOW_ALL) {
            this.visible.history = this.history;
        } else {
            this.visible.history = this.players[viewMode].history;
        }

        this.viewMode = viewMode;
        
        if (this.visible.move > 0) {
            if (this.visible.move > this.visible.history.moves.length - 1) {
                this.visible.move = this.visible.history.moves.length - 1;
            }
            this.setNewRoundIndex();
        }

        this.fillMoveBox();
        this.drawMove();
    };

    /**
     * Fills the MoveBox according to the visible history
     */
    Game.prototype.fillMoveBox = function () {

        this.moveBox.collapse();
        this.moveBox.fill(this.visible.history, this.players);

        //set the move text
        if (this.visible.move < 1) {
            this.visible.move = 1;
        } 

        this.moveBox.setSelected(this.visible.move - 1);
    };

    /**
     * Game.drawMove draws the current move on the map
     */
    Game.prototype.drawMove = function () {

        var currentMove, roundText, text, origin, target, regionTextId, player,
            currentFromRegion, currentToRegion, resultFromRegion, resultToRegion,
            attackingArmies, attackersLost, defendersLost, playerIndex, winner,

            animationSpeed = this.settings.game.animationSpeed,
            colors = this.settings.colors,
            delayMapUpdate = false,
            doMapUpdate = true,
            moveData = this.visible.history.moves[this.visible.move].split(' '),
            moveText = document.getElementById('moveText'),
            visibleMap = this.visible.history.map;

        this.map.clearMap();
        moveText.style.color = '';
        moveText.style.fontSize = '';

        // if end of game
        if (this.visible.move >= this.visible.history.moves.length - 1) {

            if (moveData[0].indexOf('player') !== -1) {
                playerIndex = moveData[0].substr(moveData[0].length - 1);
                winner = this.players[playerIndex - 1];
                this.map.showGameEnd(winner.name);
            } else {
                this.map.showGameEnd("");
            }

            this.pause();

        // if new round
        } else if (moveData.length <= 1) {

            this.visible.round = moveData[0];
            this.map.setRoundNumber(this.visible.round);

        // move
        } else {

            currentMove = new Move(moveData, this.players);

            if(currentMove.moveType === MoveType.ILLEGAL) {

                //set illegal move text style
                moveText.style.fontSize = '13px';
                moveText.style.color = this.settings.colors.illegal;

                doMapUpdate = false;

            } else {

                if (currentMove.moveType === MoveType.PLACE) { //place armies
                    this.map.drawBox(currentMove.sourceRegion, '+' + currentMove.amount, currentMove.player, animationSpeed);

                } else if (currentMove.moveType === MoveType.ATTACK) { //attack transfer
                    
                    currentFromRegion = visibleMap[this.visible.move - 1][currentMove.sourceRegion].split(';');
                    currentToRegion = visibleMap[this.visible.move - 1][currentMove.targetRegion].split(';');
                    resultFromRegion = visibleMap[this.visible.move][currentMove.sourceRegion].split(';');
                    resultToRegion = visibleMap[this.visible.move][currentMove.targetRegion].split(';');

                    if (currentMove.isAttack(visibleMap, this.visible.move)) { //attack
                        
                        attackingArmies = currentMove.getAttackingArmies(currentFromRegion[2]);

                        if (moveData[0] === resultToRegion[1]) {  //new toRegion equals player who did the move: attack success
                            attackersLost = attackingArmies - resultToRegion[2];
                            defendersLost = currentToRegion[2];
                        }
                        else { //attack fail
                            attackersLost = currentFromRegion[2] - resultFromRegion[2];
                            defendersLost = currentToRegion[2] - resultToRegion[2];
                        }

                        //draw the arrow
                        this.map.drawArrow(currentMove.sourceRegion, currentMove.targetRegion, 
                            attackingArmies, currentMove.player, animationSpeed);

                        //draw the boxes
                        if (currentFromRegion[1] !== RegionStatus.UNKNOWN) {
                            playerIndex = currentFromRegion[1].substr(currentFromRegion[1].length - 1);
                            player = this.players[playerIndex - 1];
                            this.map.drawBox(currentMove.sourceRegion, '-' + attackersLost, player, animationSpeed);
                        }
                            
                        if (currentToRegion[1] !== RegionStatus.UNKNOWN) {
                            playerIndex = currentToRegion[1].substr(currentToRegion[1].length - 1);
                            player = this.players[playerIndex - 1];
                            this.map.drawBox(currentMove.targetRegion, '-' + defendersLost, player, animationSpeed);
                        }
                    } else {
                        //transfer
                        this.map.drawArrow(currentMove.sourceRegion, currentMove.targetRegion, 
                            currentMove.amount, currentMove.player, animationSpeed);
                    }
                }

                this.visible.move--;
                this.updateMap();
                this.visible.move++;
                delayMapUpdate = true;
            }
        }

        if(doMapUpdate) {
            if(delayMapUpdate) {
                var timeoutHandler = window.curry(this.updateMap, this);
                this.delayTimer = window.setTimeout(timeoutHandler, this.settings.game.animationSpeed - 100);
            } else {
                this.updateMap();
            }
        }
    };

    /**
     * Game.getNextViewMode returns the next ViewMode
     * @return string
     */
    Game.prototype.getNextViewMode = function () {

        $('#changeViewButtons').children().removeAttr('checked');
        switch(this.viewMode) {
            case ViewMode.SHOW_ALL:
                $('#mapView_1').parent().attr('checked', true);
                return ViewMode.PLAYER_1;
            case ViewMode.PLAYER_1:
                $('#mapView_2').parent().attr('checked', true);
                return ViewMode.PLAYER_2;
            case ViewMode.PLAYER_2:
                $('#mapView_all').parent().attr('checked', true);
                return ViewMode.SHOW_ALL;
            default:
                $('#mapView_1').parent().attr('checked', true);
                return ViewMode.PLAYER_1;
        }
    };

    /**
     * sets the visible move to the index of visible round when changing viewMode
     */
    Game.prototype.setNewRoundIndex = function () {
        var searchDown = true;

        while (true) {
            if (searchDown) {
                if (this.visible.history.moves[this.visible.move].split(' ').length <= 1) {
                    if (this.visible.history.moves[this.visible.move] * 1 < this.visible.round) {
                        this.visible.move++;
                        searchDown = false;
                    }
                    else if (this.visible.history.moves[this.visible.move] * 1 == this.visible.round || this.visible.move <= 1)
                        break;
                }
                this.visible.move--;
            }
            else {
                if ((this.visible.history.moves[this.visible.move].split(' ').length <= 1 && this.visible.history.moves[this.visible.move] * 1 == this.visible.round) ||
                    this.visible.move >= this.visible.history.moves.length - 1)
                    break;
                this.visible.move++;
            }
        }
    }

    /**
     * Game.getRoundIndex returns the index of the start of round
     * in this.visible.history.moves
     * @param integer round
     * @return integer
     */
    Game.prototype.getRoundIndex = function (round) {

        var move,
            i = this.visible.move,
            moves = this.visible.history.moves,
            roundIndex = 0;

        while(i >= 0 && i < moves.length) {

            if(round < this.visible.round) {
                i--;
            } else {
                i++;
            }

            if (moves[i] !== 0 && moves[i] !== undefined) {
                move = moves[i].split(' ');

                if (move.length <= 1 || i === moves.length - 1) {
                    roundIndex = i;
                    break;
                }
            }
        }
        
        return roundIndex;
    };

    /**
     * Game.moveBackward moves the game backwards by one move
     */
    Game.prototype.moveBackward = function () {

        var nextMove;

        if(this.delayTimer !== null) {
            window.clearTimeout(this.delayTimer);
        }

        if (this.visible.move > 1) {
            this.visible.move -= 2;
            this.updateMap();
            this.visible.move++;

            nextMove = this.visible.history.moves[this.visible.move + 1];
            if (nextMove.split(' ').length <= 1) { //move round found
                this.map.setRoundNumber(this.visible.round - 1);
            }
        }

        this.moveBox.setSelected(this.visible.move - 1);
        this.drawMove();
    };

    /**
     * Game.moveForward moves the game forwards by one move
     */
    Game.prototype.moveForward = function () {

        if(this.delayTimer !== null) {
            window.clearTimeout(this.delayTimer);
        }

        if (this.visible.move < this.visible.history.moves.length - 1) {
            this.visible.move++;
        }

        this.moveBox.setSelected(this.visible.move - 1);
        this.drawMove();
    };

    /**
     * Game.roundBackward moves the game backwards by one round
     */
    Game.prototype.roundBackward = function () {

        if(this.delayTimer !== null) {
            window.clearTimeout(this.delayTimer);
        }

        if(this.visible.round > 1) {
            this.visible.move = this.getRoundIndex(this.visible.round - 1);    
        } else {
            this.visible.move = 1;
        }

        this.moveBox.setSelected(this.visible.move - 1);
        this.drawMove();
    };

    /**
     * Game.roundForward moves the game forwards by one round
     */
    Game.prototype.roundForward = function () {

        var newMove;

        if (this.delayTimer !== null) {
            window.clearTimeout(this.delayTimer);
        }

        if(this.visible.move < this.visible.history.moves.length - 1) {

            newMove = this.getRoundIndex(this.visible.round + 1);

            if (newMove > 0) {
                this.visible.move = newMove;
                this.moveBox.setSelected(this.visible.move - 1);
                this.drawMove();
            }
        }
    };

    /**
     * Game.pause pauses the game
     */
    Game.prototype.pause = function () {

        if(this.timer !== null || this.timer !== undefined) {
            window.clearTimeout(this.timer);
            this.timer = null;

            $('#playButton').removeClass('paused').addClass('playing');
        }
    };

    /**
     * Game.play resumes the game
     */
    Game.prototype.play = function () {

        var timerHandler,
            game = this;

        function setTimer(callback) {
            var internalCallback = function () {
                return function () {
                    game.timer = window.setTimeout(internalCallback, sliderValue);
                    callback();
                }
            }(0);
            game.timer = window.setTimeout(internalCallback, sliderValue);
        }
        timerHandler = window.curry(this.handleTimer, this);
        setTimer(timerHandler);

        $('#playButton').removeClass('playing').addClass('paused');

        this.moveForward();
    };

    /**
     * setSliderPostion sets the position of the game speed slider
     */
    Game.prototype.setSliderPosition = function () {

        var slider = $('#horizontal_slider'),
            offset = 120 - ((sliderValue - 500) * 0.06);

        slider.css('left', offset + 'px');
    }

    /**
     * Game.togglePlayback toggles the playback
     */
    Game.prototype.togglePlayback = function () {

        if (this.timer === null && this.visible.move < this.visible.history.moves.length - 1) {
            this.play();
        }
        else {
            this.pause();
        }
    };

    /**
     * resetGameSpeed resets the game speed to the average
     */
    Game.prototype.resetGameSpeed = function () {

        sliderValue = 1500;
        this.setSliderPosition();
    }

    /**
     * increaseGameSpeed makes the game progress faster by 200 msec
     */
    Game.prototype.increaseGameSpeed = function () {

        if (sliderValue > 500) {
            sliderValue -= 200;
        }
        this.setSliderPosition();
    }

    /**
     * reduceGameSpeed makes the game progress slower by 200 msec
     */
    Game.prototype.reduceGameSpeed = function () {

        if (sliderValue < 2500) {
            sliderValue += 200;
        }
        this.setSliderPosition();
    };

    /**
     * Register all the keyboard and mouse click events
     */
    Game.prototype.registerEventListeners = function () {

        var documentClickHandler        = window.curry(this.moveBox.collapse, this.moveBox),
            keyDownHandler              = window.curry(this.handleKeyDown, this),
            keyMoveBackwardHandler      = window.curry(this.moveBackward, this),
            keyMoveForwardHandler       = window.curry(this.moveForward, this),
            keyRoundBackwardHandler     = window.curry(this.roundBackward, this),
            keyRoundForwardHandler      = window.curry(this.roundForward, this),
            keyMoveBoxCollapseHandler   = window.curry(this.moveBox.collapse, this.moveBox),
            keyMoveBoxExpandHandler     = window.curry(this.moveBox.expand, this.moveBox),
            keyMoveBoxToggleHandler     = window.curry(this.moveBox.toggle, this.moveBox),
            keyTogglePlaybackHandler    = window.curry(this.togglePlayback, this),
            keyViewToggleHandler        = window.curry(this.setView, this),
            keySpeedIncreaseHandler     = window.curry(this.increaseGameSpeed, this),
            keySpeedReduceHandler       = window.curry(this.reduceGameSpeed, this),
            keySpeedResetHandler        = window.curry(this.resetGameSpeed, this),
            viewSelectedHandler         = window.curry(this.handleViewSelected, this),
            moveBoxClickHandler         = window.curry(this.handleMoveBoxClick, this),
            moveSelectedHandler         = window.curry(this.handleMoveSelected, this),
            playPauseHandler            = window.curry(this.handlePlayPauseButtonClick, this),
            moveBackwardHandler         = window.curry(this.handleMoveBackwardButtonClick, this),
            moveForWardHandler          = window.curry(this.handleMoveForwardButtonClick, this),
            roundBackwardHandler        = window.curry(this.handleRoundBackwardButtonClick, this),
            roundForwardHandler         = window.curry(this.handleRoundForwardButtonClick, this),
            windowResizeHandler         = window.curry(this.handleWindowResize, this),
            mousemoveHandler            = window.curry(this.moveTooltip, this);

        $('#skipbackwardButton').click(roundBackwardHandler);
        $('#backwardButton').click(moveBackwardHandler);
        $('#playButton').click(playPauseHandler);
        $('#forwardButton').click(moveForWardHandler);
        $('#skipforwardButton').click(roundForwardHandler);
        $('#moveText').click(moveBoxClickHandler);
        $('#moveSelector').on('click', 'option', moveSelectedHandler);
        $('#changeViewButtons').on('change', 'input', viewSelectedHandler);
        
        //hotkeys
        Mousetrap.bind('shift+left', keyRoundBackwardHandler);
        Mousetrap.bind('left', keyMoveBackwardHandler);
        Mousetrap.bind('space', keyTogglePlaybackHandler);
        Mousetrap.bind('right', keyMoveForwardHandler);
        Mousetrap.bind('shift+right', keyRoundForwardHandler);
        Mousetrap.bind('up', keyMoveBoxExpandHandler);
        Mousetrap.bind('down', keyMoveBoxCollapseHandler);
        Mousetrap.bind('enter', keyMoveBoxToggleHandler);
        Mousetrap.bind('v', keyViewToggleHandler);
        Mousetrap.bind('-', keySpeedReduceHandler);
        Mousetrap.bind('+', keySpeedIncreaseHandler);
        Mousetrap.bind('=', keySpeedResetHandler);

        //collapse listbox when clicking on the map
        $(document).on('click', documentClickHandler);

        //for disabling default functionality of custom bound keys
        $(document).on('keydown', keyDownHandler);

        //tooltip movement
        $('#gamediv').on('mousemove', mousemoveHandler);

        //window resize
        $(window).on('resize', windowResizeHandler);
    };

    /**
     * Release all events
     */
    Game.prototype.releaseEventListeners = function () {

      var documentClickHandler        = window.curry(this.moveBox.collapse, this.moveBox),
            windowResizeHandler         = window.curry(this.handleWindowResize, this),
            keyDownHandler              = window.curry(this.handleKeyDown, this),
            mapLoadHandler              = window.curry(this.handleMapLoaded, this);

        $('#skipbackwardButton').off('click');
        $('#backwardButton').off('click');
        $('#playButton').off('click');
        $('#forwardButton').off('click');
        $('#skipforwardButton').off('click');
        $('#moveText').off('click');
        $('#moveSelector').off('click', 'option');
        $('#changeViewButtons').off('change', 'input');

        //hotkeys
        Mousetrap.unbind('shift+left');
        Mousetrap.unbind('left');
        Mousetrap.unbind('space');
        Mousetrap.unbind('right');
        Mousetrap.unbind('shift+right');
        Mousetrap.unbind('up');
        Mousetrap.unbind('down');
        Mousetrap.unbind('enter');
        Mousetrap.unbind('v');
        Mousetrap.unbind('-');
        Mousetrap.unbind('+');
        Mousetrap.unbind('=');

        $(document).off('click', documentClickHandler);
        $(document).off('keydown');
        $('#gamediv').off('mousemove');
        $(window).off('resize', windowResizeHandler);
    };

    //////////////////// Event listeners //////////////////////////////////

    /**
     * Handles loading of the game when the map has been loaded
     */
    Game.prototype.handleMapLoaded = function () {

        this.load();
    };

    /**
     * Handles the loaded game data
     */
    Game.prototype.handleData = function (data) {

        var split,
            historyData = data[0].split('\n') || data.split('\n'),
            startingRegions = [],
            lineNumber = 0;

        // for the available starting regions
        split = historyData[0].split(' ');
        if (split[0] !== 'map') {
            startingRegions = split;
            lineNumber = 1;
        }
        this.map.startingRegions = startingRegions;

        for(var key in ViewMode) {
            lineNumber = this.createHistory(historyData, ViewMode[key], lineNumber);
        }

        //set the point of view that should be started with
        this.setView(this.viewMode);

        //draw the initial map
        this.updateMap();

        //start playing
        this.play();
    };

    /**
     * handleKeyDown is the event handler for keyboard input
     */
    Game.prototype.handleKeyDown = function (event) {

        var returnValue = true;

        switch(event.which) {

        case 32:
        case 37:
        case 38:
        case 39:
        case 40:
            event.preventDefault();
            returnValue = false;
        }

        return returnValue;
    };

    /**
     * Game.handleMoveBackwardButtonClick is the event handler for the move backward button
     */
     Game.prototype.handleMoveBackwardButtonClick = function (event) {

        event.target.blur();
        this.moveBackward();
    };
    

    /**
     * Game.handleMoveForwardButtonClick is the event handler for the move forward button
     */
    Game.prototype.handleMoveForwardButtonClick = function (event) {

        event.target.blur();
        this.moveForward();
    };

    /**
     * Game.handleRoundBackwardButtonClick is the event handler for the round backward button
     */
     Game.prototype.handleRoundBackwardButtonClick = function (event) {

        event.target.blur();
        this.roundBackward();
    };
    

    /**
     * Game.handleRoundForwardButtonClick is the event handler for the round forward button
     */
    Game.prototype.handleRoundForwardButtonClick = function (event) {

        event.target.blur();
        this.roundForward();
    };

    /**
     * Game.handlePlayPauseButtonClick is the event handler for the play/pause button
     */
    Game.prototype.handlePlayPauseButtonClick = function (event) {
        
        event.target.blur();
        this.togglePlayback();
    };

    /**
     * Game.handleTimer plays through the game
     */
     Game.prototype.handleTimer = function () {

        if (this.visible.move < this.visible.history.moves.length - 1) {
            this.settings.game.animationSpeed = sliderValue / 2;
            this.moveForward();
        } else {
            this.pause();
        }
     };

    /**
     * Game.handleMoveBoxClick expands the moveBox when clicking on the moveText
     */
    Game.prototype.handleMoveBoxClick = function (event) {

        event.target.blur();
        event.stopPropagation();

        this.moveBox.toggle();
    };

    /**
     * handleMoveSelected is the event handler for MoveBox.change
     */
    Game.prototype.handleMoveSelected = function (event) {

        var newRoundIndex, newRound, roundText, newIndex;

        event.delegateTarget.blur();

        // this.moveBox.collapse();

        newIndex = $(event.target).val();
        this.visible.move = newIndex;
        this.moveBox.setMoveText(newIndex - 1);

        newRoundIndex = this.getRoundIndex(this.visible.round - 1);
        newRound = this.visible.history.moves[newRoundIndex];
        
        this.map.setRoundNumber(newRound);
        this.visible.round = newRound;

        this.visible.round--;
        this.updateMap();
        this.visible.round++;
        this.drawMove();
    };

    /**
     * Game.handleViewSelected handles selection of the player view
     */
    Game.prototype.handleViewSelected = function (event, setNewRoundIndex) {

        var target = $(event.target);
        target.parent().attr('checked', true);
        target.parent().siblings().removeAttr('checked');

        this.setView(target.val(), setNewRoundIndex);
    };

    /**
     * handleWindowResize resizes the game board when resizing the browser window
     */
    Game.prototype.handleWindowResize = function () {

        var widthScale, heightScale, scale, margin,
            minWidth = 1000,
            minHeight = 588,
            scalePrototype = 'scale(__scale__)',
            width = $('#game').width() - 30,
            height = window.innerHeight - 80;

        if(this.indexGame === "")
        {
            if (width < this.settings.map.width && width > minWidth) {
                widthScale = width / this.settings.map.width;
            } else if (width > this.settings.map.width) {
                widthScale = 1;
            } else {
                widthScale = minWidth / this.settings.map.width;
            }

            if (height < this.settings.map.height && height > minHeight) {
                heightScale = height / this.settings.map.height;
            } else if (height > this.settings.map.height) {
                heightScale = 1;
            } else {
                heightScale = minHeight / this.settings.map.height;
            }

            scale = scalePrototype.replace(/__scale__/g, Math.min(widthScale, heightScale));

            $('#wrapper')
                .css('-moz-transform', scale)
                .css('-o-transform', scale)
                .css('-webkit-transform', scale)
                .css('transform', scale);

            if (scale !== 'scale(1)') {
                if (heightScale < widthScale) {
                    margin = ($('#game').width() - (heightScale * this.settings.map.width)) / 2;
                } else {
                    margin = 15;
                }
                $('#wrapper').css('margin-left', margin + 'px');
            } else {
                $('#wrapper').css('margin-left', 'auto');
            }
        }
    };

    /**
     * Handles movements of the mouse so that the tooltip stays with the cursor
     */
    Game.prototype.moveTooltip = function (event) {

        if ($('#game-teaser').length === 0) { // not on frontpage
            var tooltip = $("div.tooltip"),
                mouseOffsetX = 22,
                mouseOffsetY = 12,
                offsetX = event.offsetX == undefined ? event.originalEvent.layerX : event.offsetX,
                offsetY = event.offsetY == undefined ? event.originalEvent.layerY : event.offsetY,
                left = offsetX + mouseOffsetX,
                top = offsetY + mouseOffsetY;

            if (left + tooltip.width() + 10 > this.settings.map.width) {
                left = offsetX - (mouseOffsetX * 1.5) - tooltip.width();
            }
            if (top + tooltip.height() + 60 > this.settings.map.height) {
                top = offsetY - mouseOffsetY - tooltip.height();
            }
            
            tooltip.css({ "left": left, "top": top });
        }
    };

    warlight.release = function () {

        if (warlight.game instanceof Game) {
            window.clearTimeout(warlight.game.delayTimer);
            warlight.game.pause();
            warlight.game.releaseEventListeners();
            warlight.game = undefined;
        }
    };

    warlight.initialize = function () {

        if (warlight.game instanceof Game) {
            warlight.release();
        }
        warlight.game = new Game();
    };

    warlight.Game = Game;

}(window, document, window.jQuery));