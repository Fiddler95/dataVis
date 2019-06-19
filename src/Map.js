var mapObject = {
    mapPaths : null,
    mapRef: null,
    mapProjection : null,
    mapWidth : '1000',
    mapHeight : '580',
    createMap: null,
    drawMap: null
};
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
            .data(topojson.feature(mapObject.mapPaths, mapObject.mapPaths.objects.units).features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "countries")
            .attr("id",function(d) {return d['id']})
}
mapObject.createMap = function(dataMap){
    d3.json("data/topojson/world/countries.json", function (error, world) {
        if (error) {
            console.log(error);  //Log the error.
            throw error;
        }
        //console.log(world);
        mapObject.mapPaths=world;
        mapObject.drawMap();
    });
}
