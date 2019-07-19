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
    // dimensioni
    var width = 1200;
    var height = 700;

    document.getElementById("split").innerHTML = "Group by Alliances";

    var tooltip = floatingTooltip('gates_tooltip');

    var center = { x: width / 2, y: height / 2.3 };

    var splitCenters = {
        "Allies": { x: width / 3, y: height / 2.3 },
        "Neutral": { x: width / 2, y: height / 2.3 },
        "Axis": { x: 2 * width / 3, y: height / 2.3 }
    };

    var svg = null;
    var bubbles = null;
    var nodes = [];
    var colors = ['#084B8A', '#eeeeee', '#B43104'];
    var categorie = ["Allies", "Neutral", "Axis"];

    var fillColor = d3.scaleOrdinal()
        .domain(categorie)
        .range(colors);

    var forceStrength = 0.03;

    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    simulation.stop();

    /*
     *Questa funzione prende i dati ritornati da d3.csv e li converte in un
     * array di oggetti nodo
     */
    function createNodes(rawData) {
        var maxAmount = d3.max(rawData, function (d) {return +d.Deaths; });

        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([5, 120])
            .domain([0, maxAmount]);

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

        myNodes.sort(function (a, b) { return b.Deaths - a.Deaths; });

        return myNodes;
    }

    /*
   * Inizializzazione del processo di visualizzazione
   *
   * selector è un elemento DOM dentro il quale aggiungere
   * l' SVG contenente il bubblechart.
   *
   * rawData è un array di oggetti ritornati dalla chimata
   * a d3.csv per leggere i dati dal dataset
   */
    var chart = function chart(selector, rawData) {
        //converto i dati in nodi
        nodes = createNodes(rawData);

        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.GeoCode; });

        // creo un elemento cerchio per ciascun nodo nell'array
        //setto il raggio inizialmente a 0
        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r',0)
            .attr('fill', function (d) { return fillColor(d.Alliance); })
            .attr('stroke', function (d) { return d3.rgb(fillColor(d.Alliance)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail);

        bubbles = bubbles.merge(bubblesE);

        //transizione per arrivare ad avere i raggi corretti
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
                .attr("alignment-baseline","middle")
                .attr("font-family", "Courier New");
        }

        simulation.nodes(nodes);

        //di default i cerchi saranno raggruppati
        groupBubbles();
    };

    /*
   * Callback function per il riposizionamento dei cerchi
   */
    function ticked() {
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    function nodePos(d) {
        return splitCenters[d.Alliance].x;
    }

    function groupBubbles() {

        // Resetto la forza per attrarre i cerchi verso il centro e
        // lancio la simulazione
        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        simulation.alpha(1).restart();
    }

    function splitBubbles() {
        // Resetto la forza per attrarre i cerchi verso il centri
        // relativi alle loro classi e lancio la simulazione
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));

        simulation.alpha(1).restart();
    }

    function showDetail(d) {
        // modifico il tooltip
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

    function hideDetail(d) {
        // reset outline
        d3.select(this)
            .attr('stroke', d3.rgb(fillColor(d.Alliance)).darker());

        tooltip.hideTooltip();
    }

    chart.toggleDisplay = function (displayName) {
        if (displayName === 'split') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };

    return chart;
}

function bubbleChartB() {
    // dimensioni
    var width = 1200;
    var height = 700;

    document.getElementById("split").innerHTML = "Group by Front";

    var tooltip = floatingTooltip('gates_tooltip');

    var center = { x: width / 2, y: height / 2.3 };

    var splitCenters = {
        "West": { x: width / 3, y: height / 2.3 },
        "East": { x: width / 2, y: height / 2.3 },
        "Asia": { x: 2 * width / 3, y: height / 2.3 }
    };

    var svg = null;
    var bubbles = null;
    var nodes = [];
    var colors = ['#17595c', '#56822e', '#ff752b'];
    var categorie = ["West", "Asia", "East"];

    var fillColor = d3.scaleOrdinal()
        .domain(categorie)
        .range(colors);

    var forceStrength = 0.03;

    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    simulation.stop();

    function createNodes(rawData) {
        var maxAmount = d3.max(rawData, function (d) {return +d.dead_count; });

        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([5, 100])
            .domain([0, maxAmount]);

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

        myNodes.sort(function (a, b) { return b.dead_count - a.dead_count; });

        return myNodes;
    }

    var chart = function chart(selector, rawData) {
        nodes = createNodes(rawData);

        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        bubbles = svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; });

        var bubblesE = bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r',0)
            .attr('fill', function (d) { return fillColor(d.front); })
            .attr('stroke', function (d) { return d3.rgb(fillColor(d.front)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showDetail)
            .on('mouseout', hideDetail);

        bubbles = bubbles.merge(bubblesE);

        bubbles.transition()
            .duration(1000)
            .attr('r',function (d) { return d.radius; });

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
                .attr("alignment-baseline","middle")
                .attr("font-family", "Courier New");
        }

        groupBubbles();
    };

    function ticked() {
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    function nodePos(d) {
        return splitCenters[d.front].x;
    }

    function groupBubbles() {
        simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

        simulation.alpha(1).restart();
    }

    function splitBubbles() {
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));

        simulation.alpha(1).restart();
    }

    function showDetail(d) {
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

    function hideDetail(d) {
        d3.select(this)
            .attr('stroke', d3.rgb(fillColor(d.front)).darker());

        tooltip.hideTooltip();
    }

    chart.toggleDisplay = function (displayName) {
        if (displayName === 'split') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };

    return chart;
}

function setupButtons(myBubbleChart) {
    d3.select('#toolbar')
        .selectAll('.pulsanti_')
        .on('click', function () {
            // Rimuovo la classe attiva a tutti i pulsanti
            d3.selectAll('.pulsanti_').classed('active', false);
            // Identifico il pulsante appena premuto e lo setto "active"
            var button = d3.select(this);

            button.classed('active', true);

            var buttonId = button.attr('id');

            myBubbleChart.toggleDisplay(buttonId);
        });
}

function contexSwitch(choice) {
    d3.selectAll('.pulsanti_').classed('active', false);

    var button = d3.select("#all");

    button.classed('active', true);

    if(choice==1){
        let t = d3.selectAll('svg');
        t.remove();
        d3.csv('data/Deaths&Alliances.csv', display);

        var myBubbleChart = bubbleChartC();

        function display(error, data) {
            if (error) {
                console.log(error);
            }
            myBubbleChart('#vis', data);
        }

        setupButtons(myBubbleChart);
    }
    else {
        let t = d3.selectAll('svg');
        t.remove();
        d3.csv('data/Battles.csv', display);

        var myBubbleChart = bubbleChartB();

        function display(error, data) {
            if (error) {
                console.log(error);
            }
            myBubbleChart('#vis', data);
        }

        setupButtons(myBubbleChart);
    }
}

contexSwitch(1);

