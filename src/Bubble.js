function floatingTooltip(tooltipId) {
    // Local variable to hold tooltip div for
    // manipulation in other functions.
    var tt = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .attr('id', tooltipId)
        .style('pointer-events', 'none');


    // Initially it is hidden.
    hideTooltip();

    /*
     * Display tooltip with provided content.
     *
     * content is expected to be HTML string.
     *
     * event is d3.event for positioning.
     */
    function showTooltip(content, event) {
        tt.style('opacity', 1.0)
            .html(content);

        updatePosition(event);
    }

    /*
     * Hide the tooltip div.
     */
    function hideTooltip() {
        tt.style('opacity', 0.0);
    }

    /*
     * Figure out where to place the tooltip
     * based on d3 mouse event.
     */
    function updatePosition(event) {
        var xOffset = 20;
        var yOffset = 10;

        var ttw = tt.style('width');
        var tth = tt.style('height');

        var wscrY = window.scrollY;
        var wscrX = window.scrollX;

        var curX = (document.all) ? event.clientX + wscrX : event.pageX;
        var curY = (document.all) ? event.clientY + wscrY : event.pageY;
        var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth) ?
            curX - ttw - xOffset * 2 : curX + xOffset;

        if (ttleft < wscrX + xOffset) {
            ttleft = wscrX + xOffset;
        }

        var tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight) ?
            curY - tth - yOffset * 2 : curY + yOffset;

        if (tttop < wscrY + yOffset) {
            tttop = curY + yOffset;
        }

        tt
            .style('top', tttop + 'px')
            .style('left', ttleft + 'px');
    }

    return {
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        updatePosition: updatePosition
    };
}

function bubbleChartC() {
    // Constants for sizing
    var width = 1200;
    var height = 700;

    var tooltip = floatingTooltip('gates_tooltip');

    var center = { x: width / 2, y: height / 2.3 };

    var splitCenters = {
        "Allies": { x: width / 3, y: height / 2.3 },
        "Neutral": { x: width / 2, y: height / 2.3 },
        "Axis": { x: 2 * width / 3, y: height / 2.3 }
    };

    var forceStrength = 0.03;

    // These will be set in create_nodes and create_vis
    var svg = null;
    var bubbles = null;
    var nodes = [];
    var colors = ['#084B8A', '#eeeeee', '#B43104'];
    var categorie = ["Allies", "Neutral", "Axis"];


    // Charge function that is called for each node.
    // As part of the ManyBody force.
    // This is what creates the repulsion between nodes.
    //
    // Charge is proportional to the diameter of the
    // circle (which is stored in the radius attribute
    // of the circle's associated data.
    //
    // This is done to allow for accurate collision
    // detection with nodes of different sizes.
    //
    // Charge is negative because we want nodes to repel.
    // @v4 Before the charge was a stand-alone attribute
    //  of the force layout. Now we can use it as a separate force!
    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    // Here we create a force layout and
    // @v4 We create a force simulation now and
    //  add forces to it.
    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    // @v4 Force starts up automatically,
    //  which we don't want as there aren't any nodes yet.
    simulation.stop();

    var fillColor = d3.scaleOrdinal()
        .domain(categorie)
        .range(colors);

    /*
     * This data manipulation function takes the raw data from
     * the CSV file and converts it into an array of node objects.
     * Each node will store data and visualization values to visualize
     * a bubble.
     *
     * rawData is expected to be an array of data objects, read in from
     * one of d3's loading functions like d3.csv.
     *
     * This function returns the new node array, with a node in that
     * array for each element in the rawData input.
     */

    function createNodes(rawData) {
        // Use the max total_amount in the data as the max in the scale's domain
        // note we have to ensure the total_amount is a number.
        var maxAmount = d3.max(rawData, function (d) {return +d.Deaths; });

        // Sizes bubbles based on area.
        // @v4: new flattened scale names.
        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([5, 120])
            .domain([0, maxAmount]);

        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.
        var myNodes = rawData.map(function (d) {
            return {
                Nationality: d.Nationality,
                radius: radiusScale(+d.Deaths),
                GeoCode: d.GeoCode,
                Deaths: d.Deaths,
                Alliance: d.Alliance,
                x: Math.random() * 900,
                y: Math.random() * 800
            };
        });

        // sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.Deaths - a.Deaths; });

        return myNodes;
    }

    /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
    var chart = function chart(selector, rawData) {
        // convert raw data into nodes data
        nodes = createNodes(rawData);

        // Create a SVG element inside the provided selector
        // with desired size.
        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Bind nodes data to what will become DOM elements to represent them.
        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.GeoCode; });

        // Create new circle elements each with class `bubble`.
        // There will be one circle.bubble for each object in the nodes array.
        // Initially, their radius (r attribute) will be 0.
        // @v4 Selections are immutable, so lets capture the
        //  enter selection to apply our transtition to below.
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r',0)
            .attr('fill', function (d) { return fillColor(d.Alliance); })
            .attr('stroke', function (d) { return d3.rgb(fillColor(d.Alliance)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail);

        // @v4 Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        // Fancy transition to make bubbles appear, ending with the
        // correct radius
        bubbles.transition()
            .duration(1000)
            .attr('r',function (d) { return d.radius; });

        let leg = svg.append("svg").attr("class", "legend");
        for(let j=0;j<categorie.length;j++){
            let y = 470 + j*30;
            leg.append("ellipse")
                .attr("cx",70)
                .attr("cy",y)
                .attr("rx", 6)
                .attr("ry", 6)
                .style("fill",colors[j]);

            leg.append("text")
                .attr("x", 90)
                .attr("y", y)
                .text(categorie[j])
                .style("font-size", "15px")
                .style('fill', 'white')
                .attr("alignment-baseline","middle");
        }

        // Set the simulation's nodes to our newly created nodes array.
        // @v4 Once we set the nodes, the simulation will start running automatically!
        simulation.nodes(nodes);

        // Set initial layout to single group.
        groupBubbles();
    };

    /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
    function ticked() {
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    function nodePos(d) {
        console.log(d.Alliance);
        return splitCenters[d.Alliance].x;
    }

    /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
    function groupBubbles() {

        // @v4 Reset the 'x' force to draw the bubbles to the center.
        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    function splitBubbles() {
        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    function showDetail(d) {
        // change outline to indicate hover state.
        d3.select(this).attr('stroke', '#F4FA58');

        var content = '<span class="name">Country: </span><span class="value">' +
            d.Nationality +
            '</span><br/>' +
            '<span class="name">Casualties: </span><span class="value">' +
            d.Deaths +
            '</span><br/>' +
            '<span class="name">Side: </span><span class="value">' +
            d.Alliance +
            '</span>';

        tooltip.showTooltip(content, d3.event);
    }

    /*
     * Hides tooltip
     */
    function hideDetail(d) {
        // reset outline
        d3.select(this)
            .attr('stroke', d3.rgb(fillColor(d.Alliance)).darker());

        tooltip.hideTooltip();
    }


    /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
    chart.toggleDisplay = function (displayName) {
        if (displayName === 'year') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };

    // return the chart function from closure.
    return chart;
}

function bubbleChartB() {
    // Constants for sizing
    var width = 1200;
    var height = 700;

    var tooltip = floatingTooltip('gates_tooltip');

    var center = { x: width / 2, y: height / 2.3 };

    var splitCenters = {
        "West": { x: width / 3, y: height / 2.3 },
        "East": { x: width / 2, y: height / 2.3 },
        "Asia": { x: 2 * width / 3, y: height / 2.3 }
    };

    var forceStrength = 0.03;

    // These will be set in create_nodes and create_vis
    var svg = null;
    var bubbles = null;
    var nodes = [];
    var colors = ['#17595c', '#56822e', '#ff752b'];
    var categorie = ["West", "Asia", "East"];

    // Charge function that is called for each node.
    // As part of the ManyBody force.
    // This is what creates the repulsion between nodes.
    //
    // Charge is proportional to the diameter of the
    // circle (which is stored in the radius attribute
    // of the circle's associated data.
    //
    // This is done to allow for accurate collision
    // detection with nodes of different sizes.
    //
    // Charge is negative because we want nodes to repel.
    // @v4 Before the charge was a stand-alone attribute
    //  of the force layout. Now we can use it as a separate force!
    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    // Here we create a force layout and
    // @v4 We create a force simulation now and
    //  add forces to it.
    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    // @v4 Force starts up automatically,
    //  which we don't want as there aren't any nodes yet.
    simulation.stop();

    var fillColor = d3.scaleOrdinal()
        .domain(categorie)
        .range(colors);

    /*
     * This data manipulation function takes the raw data from
     * the CSV file and converts it into an array of node objects.
     * Each node will store data and visualization values to visualize
     * a bubble.
     *
     * rawData is expected to be an array of data objects, read in from
     * one of d3's loading functions like d3.csv.
     *
     * This function returns the new node array, with a node in that
     * array for each element in the rawData input.
     */

    function createNodes(rawData) {
        // Use the max total_amount in the data as the max in the scale's domain
        // note we have to ensure the total_amount is a number.
        var maxAmount = d3.max(rawData, function (d) {return +d.dead_count; });

        // Sizes bubbles based on area.
        // @v4: new flattened scale names.
        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([5, 100])
            .domain([0, maxAmount]);

        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.
        var myNodes = rawData.map(function (d) {
            return {
                id: d.id,
                battle_name: d.battle_name,
                radius: radiusScale(+d.dead_count),
                year: d.year,
                country: d.country,
                Alliance: d.Alliance,
                front: d.front,
                dead_count: d.dead_count,
                battle_siege: d.battle_siege,
                x: Math.random() * 900,
                y: Math.random() * 800
            };
        });

        // sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.dead_count - a.dead_count; });

        return myNodes;
    }

    /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
    var chart = function chart(selector, rawData) {
        // convert raw data into nodes data
        nodes = createNodes(rawData);

        // Create a SVG element inside the provided selector
        // with desired size.
        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Bind nodes data to what will become DOM elements to represent them.
        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; });

        // Create new circle elements each with class `bubble`.
        // There will be one circle.bubble for each object in the nodes array.
        // Initially, their radius (r attribute) will be 0.
        // @v4 Selections are immutable, so lets capture the
        //  enter selection to apply our transtition to below.
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r',0)
            .attr('fill', function (d) { return fillColor(d.front); })
            .attr('stroke', function (d) { return d3.rgb(fillColor(d.front)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail);

        // @v4 Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        // Fancy transition to make bubbles appear, ending with the
        // correct radius
        bubbles.transition()
            .duration(1000)
            .attr('r',function (d) { return d.radius; });

        // Set the simulation's nodes to our newly created nodes array.
        // @v4 Once we set the nodes, the simulation will start running automatically!
        simulation.nodes(nodes);

        let leg = svg.append("svg").attr("class", "legend");
        for(let j=0;j<categorie.length;j++){
            let y = 470 + j*30;
            leg.append("ellipse")
                .attr("cx",70)
                .attr("cy",y)
                .attr("rx", 6)
                .attr("ry", 6)
                .style("fill",colors[j]);

            leg.append("text")
                .attr("x", 90)
                .attr("y", y)
                .text(categorie[j])
                .style("font-size", "15px")
                .style('fill', 'white')
                .attr("alignment-baseline","middle");
        }

        // Set initial layout to single group.
        groupBubbles();
    };

    /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
    function ticked() {
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    function nodePos(d) {
        console.log(d.battle_name);
        return splitCenters[d.front].x;
    }

    /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
    function groupBubbles() {

        // @v4 Reset the 'x' force to draw the bubbles to the center.
        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    function splitBubbles() {
        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
    }

    function showDetail(d) {
        // change outline to indicate hover state.
        d3.select(this).attr('stroke', '#F4FA58');

        var content = '<span class="name">'+d.battle_name+'</span>'+
            '</span><br/>' +
            '<span class="name">Casualties: </span><span class="value">' +
            d.dead_count +
            '</span><br/>' +
            '<span class="name">Front: </span><span class="value">' +
            d.front +
            '</span>';

        tooltip.showTooltip(content, d3.event);
    }

    /*
     * Hides tooltip
     */
    function hideDetail(d) {
        // reset outline
        d3.select(this)
            .attr('stroke', d3.rgb(fillColor(d.front)).darker());

        tooltip.hideTooltip();
    }


    /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
    chart.toggleDisplay = function (displayName) {
        if (displayName === 'year') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };

    // return the chart function from closure.
    return chart;
}

function setupButtons(myBubbleChart) {
    d3.select('#toolbar')
        .selectAll('.pulsanti_')
        .on('click', function () {
            // Remove active class from all buttons
            d3.selectAll('.pulsanti_').classed('active', false);
            // Find the button just clicked
            var button = d3.select(this);

            // Set it as the active button
            button.classed('active', true);

            // Get the id of the button
            var buttonId = button.attr('id');

            // Toggle the bubble chart based on
            // the currently clicked button.
            myBubbleChart.toggleDisplay(buttonId);
        });
}

function contexSwitch(choice) {
    if(choice==1){
        let t = d3.selectAll('svg')
        t.remove()
        // Load the data.
        d3.csv('data/Deaths&Alliances.csv', display);

        var myBubbleChart = bubbleChartC();

        /*
         * Function called once data is loaded from CSV.
         * Calls bubble chart function to display inside #vis div.
         */
        function display(error, data) {
            if (error) {
                console.log(error);
            }

            myBubbleChart('#vis', data);
        }

        setupButtons(myBubbleChart);
    }
    else {
        let t = d3.selectAll('svg')
        t.remove()
        // Load the data.
        d3.csv('data/Battles.csv', display);

        var myBubbleChart = bubbleChartB();

        /*
         * Function called once data is loaded from CSV.
         * Calls bubble chart function to display inside #vis div.
         */
        function display(error, data) {
            if (error) {
                console.log(error);
            }

            myBubbleChart('#vis', data);
        }
    }

    setupButtons(myBubbleChart);
}

contexSwitch(1);

