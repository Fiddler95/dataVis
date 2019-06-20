var mapObject = {
    mapData : null,
    mapRef: null,
    mapProjection : null,
    mapWidth : '1000',
    mapHeight : '580',
    createMap: null,
    drawMap: null,
    colorMapAlly:null,
    colorMapDeaths:null
};
kappa=[];

mapObject.colorMapAlly = function(){
    countries= d3.selectAll(".countries");
    countries.attr('class',function(d){
        if(d.properties.alliance==1) return "ally";
        if(d.properties.alliance==10000) return "baddies";
        return "countries";
    })
    
}

mapObject.colorMapDeaths = function(){
    countries= d3.selectAll(".baddies,.ally");
    
    countries.attr('style',function(d){
        //console.log(d.properties.deaths);
        colorN=parseInt(d.properties.deaths)/25000000*255*2;
        console.log(colorN);
        //return color ="fill:rgb(255,255,255)";
        return color="fill:rgb(255,"+(255-colorN-60)+","+(255-colorN-60)+")";
    })
    
}

mapObject.drawMap = function(){    
    mapObject.mapRef = d3.select("#map").append("svg")
        .attr("width", mapObject.mapWidth)
        .attr("height", mapObject.mapHeight);

    mapObject.mapProjection = d3.geoMercator()
        .scale(130)
        .translate( [mapObject.mapWidth / 2, mapObject.mapHeight / 1.5]);

    let path = d3.geoPath().projection(mapObject.mapProjection);

    mapObject.mapRef.append("g")
            .selectAll("path")
            .data(topojson.feature(mapObject.mapData, mapObject.mapData.objects.units).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "countries")
            .attr("id",function(d) {return d['id']})
}

mapObject.createMap = function(dataMap){
   // console.log(dataMap);
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
}
