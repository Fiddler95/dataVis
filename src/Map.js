var mapObject = {
    path:null,
    mapData : null,
    mapRef: null,
    mapProjection : null,
    mapTooltip : null,
    mapInfobox : null,
    mapWidth : '2200',
    mapHeight : '200',
    createMap: null,
    drawMap: null,
    colorMapAlly:null,
    colorMapDeaths:null,
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
    
    mapObject.mapInfobox  = mapObject.mapRef.append("g")
      .attr("transform", "translate(" + x + "," + y + ")");

    var rect = mapObject.mapInfobox.append("rect")
      .style("fill", "white")
      .style("stroke", "steelblue");

      mapObject.mapInfobox.append("text")
      .text("Name: " + d.properties.name)
      .attr("dy", "1em")
      .attr("x", 5);

      mapObject.mapInfobox.append("text")
      .text("Deaths: " + d.properties.deaths)
      .attr("dy", "2em")
      .attr("x", 5);

      var ibSvg=mapObject.mapInfobox.append("svg");
        console.log(ibSvg);
      var bubbleScale = d3.scaleSqrt()
        .domain([0, 25000000])
        .range([ 1, 30]);
    var sel=ibSvg.append("g")
        .selectAll("dot")
        .data(parseInt(d.properties.deaths)).enter()
        .append("circle")
        .attr("cx", 10 )
        .attr("cy", 10 )
        .attr("r",20)
        .style("fill","black");
        //.attr("r", function (d) { return bubbleScale(d); } )
        

    var bbox = mapObject.mapInfobox.node().getBBox();
    rect.attr("width", '100')
        .attr("height",  '90')
        .style("opacity",0.5)
      
  }    

mapObject.zoomF=function(d) {
    var x, y, k;
  //if selected, zoom onto it
    if (d && mapObject.active !== d) {        
      var centroid =  mapObject.path.centroid(d);
      x = centroid[0]+100;
      y = centroid[1]-200;
      k = 2;
      mapObject.active = d;
    //   if(centroid[0]>mapObject.mapWidth/ 4) x=x-300 
    //   else x=x+280;
    } 
    //else, reset the view to normal zoom
    else {
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
        
  }
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
    countries= d3.selectAll("path");
    countries.attr('style',function(d){
        colorN=parseInt(d.properties.deaths)/25000000*255*2;
        return color="fill:rgb(255,"+(255-colorN-60)+","+(255-colorN-60)+")";
    });


};

mapObject.drawMap = function(){    
    
    mapObject.mapRef = d3.select("#map").append("svg").append("g")
        .attr("width", mapObject.mapWidth)
        .attr("height", mapObject.mapHeight);
        
    //tooltip
    mapObject.mapTooltip = d3.select("body").append("div").append("g")
        .attr("class", "tooltip")
        .style("opacity", 0);
    document.getElementsByTagName('svg')[0].id = 'mapSvg';
    mapObject.mapInfobox = d3.select("body").append("div").append("g")
        .attr("class","infobox")
        .style("opacity",0)

    mapObject.mapProjection = d3.geoMercator()  
        .scale(190)
        .translate( [mapObject.mapWidth / 3.5, mapObject.mapHeight*2])
        .center([0,40]) ;

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
