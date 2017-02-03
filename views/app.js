
var venues = []

var suburbs = [
    { city: 'Deerfield', state: 'IL', position: {lat: 42.171137, lng: -87.844512 }},
    { city: 'Northbrook', state: 'IL', position: {lat: 42.127527, lng: -87.828955 }},
    { city: 'Winnetka', state: 'IL', position: {lat: 42.108083, lng: -87.735895 }},
    { city: 'Highwood', state: 'IL', position: {lat: 42.199747, lng: -87.809233 }},
    { city: 'Glenview', state: 'IL', position: {lat: 42.069751, lng: -87.787841 }}
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
    this.position = ko.observable(data.position);
};

var Venue = function (data) {
    this.id = ko.observable(data.id);
    this.name = ko.observable(data.name);
    this.checkins = ko.observable(data.checkins);
    this.position = ko.observable(data.position);
    this.active = ko.observable(true);
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

    self.currentSuburb = ko.observable();
    self.venuesList = ko.observableArray([]);
    self.selectedSuburb = ko.observable();

    self.selectedSuburb.subscribe(function (suburb) {
        

        // switch current suburb to the one selected
        self.currentSuburb(suburb);

        // load the restaurants
        var venues = [];
     
        // set up a callback in order to have access to the data
        getVenueData(suburb, function (data) {

            var venues = data.response.venues;

            // clear the venues
            self.venuesList([]);

            // add the venues to the venues list
            venues.forEach(function (venueItem) {
                self.venuesList.push(new Venue(venueItem));
            });

            // clear out any markers
            deleteMarkers();

            // reset the map center
            map.setOptions({ center: data.response.geocode.feature.geometry.center, zoom: 14 });

            // add restaurants as markers
            initializeMarkers(venues);
        })

    });

    self.currentVenue = ko.observable();
    self.selectedVenue = ko.observable();
    self.selectedVenue.subscribe(function (venue) {

        // make active if inactive and vice versa
        if (venue.active()) {
            self.selectedVenue().active(false);
            hideMarker(venue);
        }
        else {
            self.selectedVenue().active(true);
            showMarker(venue);
        }

    });
}

function resetMap() {

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
    

}

function getVenueData(suburb, callback) {

    // set the URL for the Foursquare API search
    var url = 'https://api.foursquare.com/v2/venues/search?v=20170131&client_id=OZ5CHQMLCUODJNEG1DJW5EHBXBNGFVSE2BBQLIHK45HNY34M&client_secret=1UJX0D5JGLNQHUZPC05CW5L5X5ZP3B5CHITJ3AAB1SZMHTWI&limit=5&categoryId=4bf58dd8d48988d142941735&radius=2000&near=' +
        suburb.city() + ',' + suburb.state()

    //console.log('url: ' + url);

    // make the API call
    $.getJSON(url, function (data) {
        callback(data);

    })
      .fail(function (data, textStatus, error) {
          var err = textStatus + ", " + error;
          console.log("Request Failed: " + err);
      });

}

function initializeMarkers(venues) {

    // iterate the venues adding a marker for each  
    var bounds = new google.maps.LatLngBounds();

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
            checkins: checkins // custom field
        });

        bounds.extend(marker.position);

        var venueInfoWindow = new google.maps.InfoWindow();
        marker.addListener('click', function () {
            fillInfoWindow(this, venueInfoWindow);
            toggleBounce(this);
        });

        markers.push(marker);

        

    }
    map.fitBounds(bounds);

    
}

function fillInfoWindow(marker, infoWindow) {

    if (infoWindow.marker != marker) {
        infoWindow.marker = marker;
        infoWindow.setContent('<div>' + marker.title + '</div>' +
            '<div>Total checkins: ' + marker.checkins + '</div');
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function () {
            infoWindow.close();
            marker.setAnimation(null);
        });
    }
}

function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    }
    else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function showMarker(venue) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].id == venue.id()) {
            markers[i].setAnimation(google.maps.Animation.DROP);
            markers[i].setMap(map);
            break;
        }
    }
}
function hideMarker(venue) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].id == venue.id()) {
            markers[i].setAnimation(null);
            markers[i].setMap(null);
            break;
        }
    }
}

function deleteMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);