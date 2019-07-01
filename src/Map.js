var mapObject = {
    path:null,
    mapData : null,
    mapBattles : null,
    mapRef: null,
    mapProjection : null,
    mapTooltip : null,
    mapInfobox : null,
    mapWidth : '1800',
    mapHeight : '1000',
    createMap: null,
    drawMap: null,
    colorMapAlly:null,
    colorMapDeaths:null,
    handleCircleClick:null,
    return2map:null,
    active : null,
    zoomF:null,
    popUp:null,
    testCoord : [
        {
            "x":132.455278,
            "y":34.385278},
        {
            "x":129.876667,
            "y":32.749444}]
};

mapObject.popUp= function(d) {
    var w=200; 
    if (mapObject.mapInfobox) mapObject.mapInfobox.remove();
    if(mapObject.active==null) return;
    var x,y;
    if( mapObject.path.centroid(d)[0]>mapObject.mapWidth/2){        
        x=0;
        y=0;
    }
    else{
        x=mapObject.mapWidth/4;
        y=0;

    }
    x=mapObject.path.centroid(d)[0]+90;
    y=mapObject.path.centroid(d)[1];
    
    mapObject.mapInfobox  = d3.select("#mapSvg").append("g")
      .attr("transform", "translate(" + x + "," + y + ")");

     var rect= mapObject.mapInfobox.append("rect")
      .style("fill","white")
      .style("stroke","steelblue");

      mapObject.mapInfobox.append("text")
      .text("Name: " + d.properties.name)
      .attr("dy", "1em")
      .attr("x", 5);

      mapObject.mapInfobox.append("text")
      .text("Deaths: " + d.properties.deaths)
      .attr("dy", "2em")
      .attr("x", 5);

      var ibSvg=mapObject.mapInfobox.append("svg")
      .style("width","300px")
      .style("height","300px");

      var bubbleScale = d3.scaleSqrt()
      .domain([0, 25000000])
      .range([ 4, 60]);

      ibSvg.append("g").selectAll("circle")
      .data([parseInt(d.properties.deaths)])
      .enter()
      .append("circle")
      .attr("cx", w/2 )
      .attr("cy",function(d){return bubbleScale(parseInt(d))+40} )
      .attr("r", function(d){return bubbleScale(parseInt(d))} )
      .attr("class","bubbleCircle");
        

    

    var bbox = mapObject.mapInfobox.node().getBBox();
    rect.attr("width", w)
        .attr("height", bbox.height + 5)
      
  };

mapObject.zoomF=function(d) {
    var x, y, k;
  //if selected, zoom onto it
    if (d && mapObject.active !== d) {        
        var centroid =  mapObject.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 2.5;
        mapObject.active = d;
        // add circles to svg

        mapObject.mapRef.selectAll("circle")
            .attr("class", "circleY")
    } 
    //else, reset the view to normal zoom
    else {
        mapObject.mapRef.selectAll("circle")
            .attr("class", "circleE");
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
    mapObject.popUp(d);
    
}
mapObject.colorMapAlly = function(){
    countries= d3.selectAll("path");
    countries.attr('class',"countries");
    setTimeout(function(){
        countries.attr("style",null)
        .attr('class',function(d){
        if(d.properties.alliance==1) return "ally";
        if(d.properties.alliance==10000) return "baddies";
        return "countries";
    });

    }, 200);
    

    
};

mapObject.colorMapDeaths = function(){

    var colorN = 0;
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
        .scale(210)
        .translate( [mapObject.mapWidth / 2, mapObject.mapHeight/1.6]);
        

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

    mapObject.mapRef.selectAll("circle")
        .data(mapObject.mapBattles).enter()
        .append("circle")
        .attr("cx", function (d) { return mapObject.mapProjection([d.long,d.lat])[0]; })
        .attr("cy", function (d) { return mapObject.mapProjection([d.long,d.lat])[1]; })
        .attr("class", "circleE")
        .attr("r", "0")
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
        })
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
            for(var j=0; j<world.objects.units.geometries.length;j++){
                let id= world.objects.units.geometries[j].id;
                if(id===tag){
                    world.objects.units.geometries[j].properties.deaths=deaths;
                    world.objects.units.geometries[j].properties.alliance=alliance;
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
    console.log(d);
    document.getElementById('id02').style.display='block';
    document.getElementById('p_1').innerHTML = d.battle_name;
    document.getElementById('p_2').innerHTML = d.descrip;
    document.getElementById('pic').src = d.srcP;
    //document.getElementById('pic').src = "data/pics/"+d.srcP;

};

mapObject.return2map = function () {
    document.getElementById('id02').style.display='none';
    document.body.style.overflowY = 'auto';
};