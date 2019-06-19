globalData = [];

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

mapObject.createMap(globalData)