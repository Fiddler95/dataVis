var mapObject = {
    path:null,
    mapData : null,
    mapBattles : null,
    mapRef: null,
    mapProjection : null,
    mapTooltip : null,
    mapLegend : null,
    mapInfobox : null,
    mapWidth : '1200',
    mapHeight : '700',
    createMap: null,
    drawMap: null,
    colorMapAlly:null,
    colorMapDeaths:null,
    handleCircleClick:null,
    return2map:null,
    active : null,
    zoomF:null,
    popUp:null,
    battlesRef:null,
};

mapObject.popUp= function(d) {
    if (mapObject.mapInfobox) mapObject.mapInfobox.remove();
    if(mapObject.active==null) return;
    var x,y;
    var ratio = (parseInt(d.properties.deaths)/parseInt(d.properties.pop))*100000

    x=820;
    y=20;


    mapObject.mapInfobox  = d3.select("#mapSvg").append("g")
        .attr("transform", "translate(" + x + "," + y + ")");

    var rect= mapObject.mapInfobox.append("rect")
        .style("fill","white");

    mapObject.mapInfobox.append("text")
        .text("Name: " + d.properties.name)
        .attr("font-family", "Courier New")
        .attr("dy", "1em")
        .attr("x", 5);

    mapObject.mapInfobox.append("text")
        .text("Deaths: " + d.properties.deaths)
        .attr("font-family", "Courier New")
        .attr("dy", "2em")
        .attr("x", 5);

    mapObject.mapInfobox.append("text")
        .text("Population: " + d.properties.pop)
        .attr("font-family", "Courier New")
        .attr("dy", "3em")
        .attr("x", 5);

    var bbox = mapObject.mapInfobox.node().getBBox();
    var w = bbox.width;
    var h = bbox.height+5;

    var ibSvg=mapObject.mapInfobox.append("svg")
        .style("width","0px")
        .style("height","0px");

    ibSvg
    .transition()
    .duration(2000)
    .style("width","300px")
    .style("height","300px");

    var ratioScale = d3.scaleSqrt()
        .domain([0, 100000])
        .range([ 1, 30]);

    var bolle = ibSvg.append("g").selectAll("circle");

    bolle.data([parseInt(d.properties.pop)])
        .enter()
        .append("circle")
        .attr("cx", w/2 )
        .attr("cy", h+60 )
        .attr("r", 60 )
        .attr("class","bubbleP");

    bolle.data([parseInt(d.properties.deaths)])
        .enter()
        .append("circle")
        .attr("cx", w/2 )
        .attr("cy",function(d){return h+120-ratioScale(parseInt(ratio))} )
        .attr("r", function(d){return ratioScale(parseInt(ratio))} )
        .attr("class","bubbleD");

    rect.attr("width", bbox.width + 10)
        .attr("height", bbox.height + 130);

  };

mapObject.zoomF=function(d) {
    var x, y, k;
  //if selected, zoom onto it
    if (d && mapObject.active !== d) {        
        var centroid =  mapObject.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 2;
        mapObject.active = d;
        // add circles to svg
        mapObject.battlesRef.transition()
                        .duration(1000)
                        .attr('width', 10)
                        .attr('height', 10);
    } 
    //else, reset the view to normal zoom
    else {
        mapObject.battlesRef.transition()
                        .duration(1000)
                        .attr('width', 0)
                        .attr('height', 0)
        x = mapObject.mapWidth / 2;
        y = mapObject.mapHeight / 2;
        k = 1;
        mapObject.active = null;
    }
  
    mapObject.mapRef.selectAll("path")
        .classed("activeCountry",  mapObject.active && function(d) { return d ===  mapObject.active; });
   
  
    mapObject.mapRef.transition()
        .duration(750)
        .attr("transform", "translate(" + mapObject.mapWidth / 2 + "," + mapObject.mapHeight / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
        
  };
function onClick(d){
    mapObject.zoomF(d);
    if("deaths" in d.properties){
        mapObject.popUp(d);
    }
    else{
        mapObject.mapInfobox.remove();
    }
}
mapObject.colorMapAlly = function(){
    if(mapObject.mapLegend!=null){mapObject.mapLegend.remove();}
    countries= d3.selectAll("path");
    countries.attr('class',"countries");
    setTimeout(function(){
        countries.attr("style",null)
        .attr('class',function(d){
        if(d.properties.alliance=="Allies") return "ally";
        if(d.properties.alliance=="Axis") return "baddies";
        return "countries";
    });

    }, 200);

    mapObject.mapLegend = mapObject.mapRef.append("svg").attr("class", "legend");
    mapObject.mapLegend.append("ellipse").attr("cx",70).attr("cy",500).attr("rx", 6).attr("ry", 6).style("fill", "#084B8A");
    mapObject.mapLegend.append("ellipse").attr("cx",70).attr("cy",530).attr("rx", 6).attr("ry", 6).style("fill", "#B43104");
    mapObject.mapLegend.append("text").attr("x", 90).attr("y", 500).text("Allies").style("font-size", "15px").style('fill', 'white').attr("alignment-baseline","middle").attr("font-family", "Courier New");
    mapObject.mapLegend.append("text").attr("x", 90).attr("y", 530).text("Axis").style("font-size", "15px").style('fill', 'white').attr("alignment-baseline","middle").attr("font-family", "Courier New");

    
};

mapObject.colorMapDeaths = function(){
    if(mapObject.mapLegend!=null){mapObject.mapLegend.remove();}
    var colorN = 0;
    var keys=[0,1,2,3,4,5];
    var n = [0,1000,100000,1000000,10000000];
    var colorScale = d3.scaleLog().base(Math.E).domain([Math.exp(0), Math.exp(17)])
        .range([d3.rgb("#ffffff"), d3.rgb('#cc0000')]);
    countries= d3.selectAll("path");
    countries.attr('style',function(d){
        if(isNaN(d.properties.deaths)){
            return "fill:rgb(255,255,255)";
        }
        else {
            //colorN = parseInt(parseInt((parseInt(d.properties.deaths) / 20045724) * 100) * 2.55);
            //console.log(colorN);
            //return "fill:rgb(255," + (255-colorN) + "," + (255-colorN) + ")";
            colorN = "fill:"+colorScale(parseInt(d.properties.deaths));
            return colorN;
        }
    });
    mapObject.mapLegend = mapObject.mapRef.append("svg").attr("class", "legend");
    for(var j=0;j<keys.length;j++){
        let y = 410 + j*30;
        let g = colorScale(n[j]);
        mapObject.mapLegend
            .append("ellipse")
            .attr("cx",70)
            .attr("cy",y)
            .attr("rx", 6)
            .attr("ry", 6)
            .style("fill",g);

        mapObject.mapLegend
            .append("text")
            .attr("x", 90)
            .attr("y", y)
            .text(n[j])
            .style("font-size", "15px")
            .attr("font-family", "Courier New")
            .style('fill', 'white')
            .attr("alignment-baseline","middle");
    }

};

mapObject.drawMap = function(){    
    
    mapObject.mapRef = d3.select("#map").append("svg").append("g");
        
    //tooltip
    mapObject.mapTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    document.getElementsByTagName('svg')[0].id = 'mapSvg';
    mapObject.mapInfobox = d3.select("body").append("div").append("g")
        .attr("class","infobox")
        .style("opacity",0);

    mapObject.mapProjection = d3.geoMercator()  
        .scale(150)
        .translate( [mapObject.mapWidth / 2, mapObject.mapHeight/1.8]);
        

    mapObject.path = d3.geoPath().projection(mapObject.mapProjection);

    mapObject.mapRef
        .selectAll("path")
        .data(topojson.feature(mapObject.mapData, mapObject.mapData.objects.units).features)
        .enter().append("path")
        .attr("d", mapObject.path)
        .attr("class", "countries")
        .attr("id",function(d) {return d['id']})
        .on("click", onClick)
        .on("mouseover", function(d) {
            mapObject.mapTooltip.transition()
                .duration(200)
                .style("opacity", .9);
            mapObject.mapTooltip.html(d.properties.name)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            mapObject.mapTooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    mapObject.battlesRef= mapObject.mapRef.selectAll("image");
    // mapObject.battlesRef.data(mapObject.mapBattles).enter()
    //     .append("circle")
    //     .attr("cx", function (d) { return mapObject.mapProjection([d.long,d.lat])[0]; })
    //     .attr("cy", function (d) { return mapObject.mapProjection([d.long,d.lat])[1]; })
    //     .attr("class", "circleE")
    //     //.attr("fill", function (d) { if(d.battle_siege == 1){return "#5E610B"} else {return "#0B615E"}})
    //     .attr("fill", function (d) { if(d.battle_siege == 1){return "#80A4ED"} else {return "#D4CB92"}})
    //     .on("click", function(d) {mapObject.handleCircleClick(d)} )
    //     .on("mouseover", function(d) {
    //         mapObject.mapTooltip.transition()
    //             .duration(200)
    //             .style("opacity", .9);
    //         mapObject.mapTooltip.html(d.battle_name)
    //             .style("left", (d3.event.pageX) + "px")
    //             .style("top", (d3.event.pageY) + "px");
    //     })
    //     .on("mouseout", function(d) {
    //         mapObject.mapTooltip.transition()
    //             .duration(500)
    //             .style("opacity", 0);
    //     });

    mapObject.battlesRef.data(mapObject.mapBattles).enter()
                        .append("svg:image")
                        .attr('x', function (d) { return mapObject.mapProjection([d.long,d.lat])[0]-5; })
                        .attr('y', function (d) { return mapObject.mapProjection([d.long,d.lat])[1]-5; })
                        .attr('width', 0)
                        .attr('height', 0)
                        .attr("xlink:href", function (d) { if(d.battle_siege != 1){return "Icons/exp.png"} else {return "Icons/siege.png"}})
                        .on("click", function(d) {mapObject.handleCircleClick(d)} )
                        .on("mouseover", function(d) {
                            mapObject.mapTooltip.transition()
                                .duration(200)
                                .style("opacity", .9);
                            mapObject.mapTooltip.html(d.battle_name)
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY) + "px");
                        })
                        .on("mouseout", function(d) {
                            mapObject.mapTooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });
    mapObject.battlesRef= mapObject.mapRef.selectAll("image");

};

mapObject.createMap = function(dataMap,dataBattle){

   mapObject.active=d3.select(null);
    d3.json("data/topojson/world/countries.json", function (error, world) {
        if (error) {
            console.log(error);  //Log the error.
            throw error;
        }
        //console.log(world.objects.units.geometries[0]);
        for(var i=0;i<dataMap.length;i++){
            let tag=dataMap[i].GeoCode;
            let deaths=dataMap[i].Deaths;
            let alliance=dataMap[i].Alliance;
            let pop=dataMap[i].Population;
            for(var j=0; j<world.objects.units.geometries.length;j++){
                let id= world.objects.units.geometries[j].id;
                if(id===tag){
                    world.objects.units.geometries[j].properties.deaths=deaths;
                    world.objects.units.geometries[j].properties.alliance=alliance;
                    world.objects.units.geometries[j].properties.pop=pop;
                }
            }

        }

        mapObject.mapBattles=dataBattle;
        mapObject.mapData=world;
        mapObject.drawMap();
        mapObject.colorMapAlly();
    });
};

mapObject.handleCircleClick=function(d){
    document.getElementById('id02').style.display='block';
    document.getElementById('battle_title').innerHTML = d.battle_name;
    document.getElementById('battle_description').innerHTML = d.descrip;
    document.getElementById('year').innerHTML = "Year: "+d.year;
    document.getElementById('d_count').innerHTML = "Casualties: "+d.dead_count;
    fronte="";
    if(d.front=="East"){
        fronte="Eastern Front"
    }
    else if(d.front=="West"){
        fronte="Western Front"
    }
    else {
        fronte="Asian Front"
    }
    document.getElementById('front').innerHTML = "Front: "+fronte;
    document.getElementById('pic').src = d.srcP;

};

mapObject.return2map = function () {
    document.getElementById('id02').style.display='none';
    document.body.style.overflowY = 'auto';
};

mapObject.closeInfo = function () {
    document.getElementById('id01').style.display='none';
    document.body.style.overflowY = 'auto';
};