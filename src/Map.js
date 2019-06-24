var mapObject = {
    path:null,
    mapData : null,
    mapRef: null,
    mapProjection : null,
    mapWidth : '600',
    mapHeight : '400',
    createMap: null,
    drawMap: null,
    colorMapAlly:null,
    colorMapDeaths:null,
    active : null,
    testCoord : [
        {
            "x":132.455278,
            "y":34.385278},
        {
            "x":129.876667,
            "y":32.749444}]
};
function zoomF(d) {
    var x, y, k;
  
    if (d && mapObject.active !== d) {        
      var centroid =  mapObject.path.centroid(d);
      x = centroid[0];
      y = centroid[1]-70;
      k = 2;
      mapObject.active = d;
      if(x>mapObject.mapWidth/ 2) x=x-240;
      else x=x-30;
    } else {
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
        console.log(x);
        console.log(y);
  }

mapObject.colorMapAlly = function(){
    countries= d3.selectAll(".countries");
    countries.attr('class',function(d){
        if(d.properties.alliance==1) return "ally";
        if(d.properties.alliance==10000) return "baddies";
        return "countries";
    })
    
};


mapObject.colorMapDeaths = function(){
    countries= d3.selectAll(".baddies,.ally");
    
    countries.attr('style',function(d){
        //console.log(d.properties.deaths);
        colorN=parseInt(d.properties.deaths)/25000000*255*2;
        console.log(colorN);
        //return color ="fill:rgb(255,255,255)";
        return color="fill:rgb(255,"+(255-colorN-60)+","+(255-colorN-60)+")";
    })
    
};

mapObject.drawMap = function(){    
    mapObject.mapRef = d3.select("#map").append("svg")
        .attr("width", mapObject.mapWidth)
        .attr("height", mapObject.mapHeight);

    mapObject.mapProjection = d3.geoMercator()
        .scale(80)
        .translate( [mapObject.mapWidth / 2, mapObject.mapHeight / 1.5]);

    mapObject.path = d3.geoPath().projection(mapObject.mapProjection);

    mapObject.mapRef
            .selectAll("path")
            .data(topojson.feature(mapObject.mapData, mapObject.mapData.objects.units).features)
            .enter().append("path")
            .attr("d", mapObject.path)
            .attr("class", "countries")
            .attr("id",function(d) {return d['id']})
            .on("click", zoomF);

    // add circles to svg
    mapObject.mapRef.selectAll("circle")
        .data(mapObject.testCoord).enter()
        .append("circle")
        .attr("cx", function (d) { console.log(d.x); return mapObject.mapProjection([d.x,d.y])[0]; })
        .attr("cy", function (d) { return mapObject.mapProjection([d.x,d.y])[1]; })
        .attr("r", "5px")
        .attr("fill", "yellow")

};

mapObject.createMap = function(dataMap){
   // console.log(dataMap);
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
        
        
        mapObject.mapData=world;
        mapObject.drawMap();
        mapObject.colorMapAlly();
    });
};
