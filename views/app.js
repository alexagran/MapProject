

var suburbs = [
    { city: 'Deerfield', state: 'IL' },
    { city: 'Northbrook', state: 'IL' },
    { city: 'Winnetka', state: 'IL' },
    { city: 'Highwood', state: 'IL' },
    { city: 'Glenview', state: 'IL' }
];

//var locations = [
//    { id: 1, title: 'Downtown Deerfield', active: true, position: { lat: 42.167308, lng: -87.845736 } },
//    { id: 2, title: 'Agran house', active: true, position: { lat: 42.161208, lng: -87.829428 } },
//    { id: 3, title: 'Groner\s House', active: true, position: { lat: 42.175045, lng: -87.856293 } },
//    { id: 4, title: 'Meliker\s House', active: true, position: { lat: 42.157176, lng: -87.829599 } },
//    { id: 5, title: 'Batt\s House', active: true, position: { lat: 42.196891, lng: -87.871571 } }
//];

var Suburb = function (data) {
    this.city = ko.observable(data.city);
    this.state = ko.observable(data.state);
};

var Location = function (data) {
    this.id = ko.observable(data.id);
    this.title = ko.observable(data.title);
    this.active = ko.observable(data.active);
    this.position = ko.observable(data.position);
};

var ViewModel = function () {
    
    var self = this;

    // build list of suburbs
    self.suburbsList = ko.observableArray([]);
    suburbs.forEach(function (suburbItem) {
        self.suburbsList.push(new Suburb(suburbItem));
    });

    //// build list of locations
    //self.locationsList = ko.observableArray([]);
    //locations.forEach(function(locationItem) {
    //    self.locationsList.push(new Location(locationItem));
    //});

    self.currentSuburb = ko.observable(this.suburbsList()[0]);
    //self.currentRestaurant = ko.observable(this.locationsList()[0]);

    // When a suburb is selected, set it as the current suburb and
    // load the top 5 restaurants on Forsquare for that city

    self.selectedSuburb = ko.observable();
    self.selectedSuburb.subscribe(function (suburb) {
        //// hide markers for current suburb
        //hideAllMarkers();

        // switch current suburb to the one selected
        self.currentSuburb(suburb);

        // load the restaurants
        loadRestaurants(self.currentSuburb());


    });

    self.currentRestaurant = ko.observable();
    self.selectedRestaurant = ko.observable();
    self.selectedRestaurant.subscribe(function (restaurant) {

        self.currentRestaurant(restaurant);


    });

   // self.setCurrentSuburb = function (clickedSuburb) {

       


        //// switch whether the marker displays based on its
        //// active state
        //if (self.currentLocation().active()) {
        //    self.currentLocation().active(false);
        //    hideMarker(self.currentLocation().id());

        //} else {
        //    self.currentLocation().active(true);
        //    showMarker(self.currentLocation().id());
        //}
    //};
}

function loadRestaurants(suburb) {
    // build the URL
    var url = 'https://api.foursquare.com/v2/venues/search?v=20170131&client_id=OZ5CHQMLCUODJNEG1DJW5EHBXBNGFVSE2BBQLIHK45HNY34M&client_secret=1UJX0D5JGLNQHUZPC05CW5L5X5ZP3B5CHITJ3AAB1SZMHTWI&limit=5&categoryId=4bf58dd8d48988d142941735&radius=5000&near=' +
        suburb.city() + ',' + suburb.state()

        console.log('url: ' + url);

    $.getJSON(url, function (data) {
        console.log("venues: " + data.response.venues);

        // clear out any markers
        deleteMarkers();

        // reset the map center
        map.setOptions({ center: data.response.geocode.feature.geometry.center, zoom: 12 });

        // add restaurants as markers
        initializeMarkers(data);

    })
      .fail(function (data, textStatus, error) {
          var err = textStatus + ", " + error;
          console.log("Request Failed: " + err);
      });
}

function initializeMarkers(data) {

    // isolate the restaurants
    var venues = data.response.venues;

    for (var i = 0; i < venues.length; i++) {

        var position = { lat: venues[i].location.lat, lng: venues[i].location.lng };
        var venuesID = venues[i].id;
        var name = venues[i].name;
        var checkins = venues[i].stats.checkinsCount;

        // add the marker
        var marker = new google.maps.Marker({
            position: position,
            map: map,
            animation: google.maps.Animation.DROP,
            title: name,
            id: venuesID,
            checkins: checkins
        });

        var venueInfoWindow = new google.maps.InfoWindow();
        marker.addListener('click', function () {
            fillInfoWindow(this, venueInfoWindow);
        });

        markers.push(marker);
    }
    
}

function fillInfoWindow(marker, infoWindow) {

    if (infoWindow.marker != marker) {
        infoWindow.marker = marker;
        infoWindow.setContent('<div>' + marker.title + '</div>' +
            '<div>Total checkins: ' + marker.checkins + '</div');
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function () {
            infoWindow.setMarker(null);
        });
    }
}

//function showAllMarkers() {
//    for (var i = 0; i < markers.length; i++) {
//        showMarker(markers[i].id);
//    }
//}

//function showMarker(id) {
//    for (var i = 0; i < markers.length; i++) {
//        if (markers[i].id == id) {
//            markers[i].setAnimation(google.maps.Animation.DROP);
//            markers[i].setMap(map);

//            // need to set the location to active as well
//            viewModel.locationsList()[i].active(true);

//            break;
//        }
//    }
//}

//function hideAllMarkers() {
//    for (var i = 0; i < markers.length; i++) {
//        hideMarker(markers[i].id);
//    }
//}

//function hideMarker(id) {
//    for (var i = 0; i < markers.length; i++) {
//        if (markers[i].id == id) {
//            markers[i].setAnimation(null);
//            markers[i].setMap(null);

//            // need to set the location to inactive as well
//            viewModel.locationsList()[i].active(false);

//            break;
//        }
//    }
//}

function deleteMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function retrieveFoursquareVenue(address) {


    //https://api.foursquare.com/v2/venues/search?ll=40.7,-74&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&v=YYYYMMDD
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);