globalData = [];
battleData = []

// Load CSV file
d3.csv("data/Deaths&Alliances.csv", function (error, csv) {
    if (error) {
        console.log(error);  //Log the error.
        throw error;
    }
    csv.forEach(function (d) {

        globalData.push(d);
    });
    
});

d3.csv("data/battles.csv", function (eror, csvv) {
    if (eror) {
        console.log(eror);  //Log the error.
        throw eror;
    }
    csvv.forEach(function (d1) {

        battleData.push(d1);
    });

});
mapObject.createMap(globalData,battleData);
