
var suburbs = [
    { id: 1, city: 'Deerfield', state: 'IL', position: {lat: 42.171137, lng: -87.844512 }},
    { id: 2, city: 'Northbrook', state: 'IL', position: { lat: 42.127527, lng: -87.828955 } },
    { id: 3, city: 'Winnetka', state: 'IL', position: { lat: 42.108083, lng: -87.735895 } },
    { id: 4, city: 'Highwood', state: 'IL', position: { lat: 42.199747, lng: -87.809233 } },
    { id: 5, city: 'Glenview', state: 'IL', position: { lat: 42.069751, lng: -87.787841 } }
];

var Suburb = function (data) {
    this.id = data.id;
    this.city = data.city;
    this.state = data.state;
    this.position = data.position;
    this.hasLoadedData = ko.observable(false);
};

var Venue = function (data) {
    this.id = data.id;
    this.suburbId = 0; // default to zero until 
    this.name = data.name;
    this.checkins = data.stats.checkinsCount;
    this.position = { lat: data.location.lat, lng: data.location.lng };
    this.active = ko.observable(true);
    this.marker = null; // will be added
};

Venue.prototype.showMarker = function() {
    // "this" is the current venue
    var venue = this;
    venue.marker.setAnimation(google.maps.Animation.DROP);
    venue.marker.setVisible(true);
};

Venue.prototype.hideMarker = function () {
    var venue = this;
    venue.marker.setAnimation(null);
    venue.marker.setVisible(false);
};

var ViewModel = function () {
    
    var self = this;

    // build list of suburbs
    self.suburbsList = ko.observableArray([]);
    suburbs.forEach(function (suburbItem) {
        self.suburbsList.push(new Suburb(suburbItem));
    });

    self.currentSuburb = ko.observable();
    self.venuesList = ko.observableArray([]);
    self.selectedSuburb = ko.observable();

    self.selectedSuburb.subscribe(function (suburb) {
        
        // hide any markers that might be showing
        removeMarkers();

        // switch current suburb to the one selected
        self.currentSuburb(suburb);

        // need to load the data for the suburb if it
        // hasn't yet been loaded
        if (!suburb.hasLoadedData()) {
                
            // set up a callback in order to have access to the data
            getVenueData(suburb, function (data) {

                var venues = [];
                venues = data.response.venues;

                // add the venues to the venues list
                venues.forEach(function (venueItem) {
                    self.venuesList.push(new Venue(venueItem));
                });

                // add markers
                initializeMarkers(suburb, self.venuesList());

                // reset the map center
                map.setOptions({ center: data.response.geocode.feature.geometry.center, zoom: 14 });

                suburb.hasLoadedData(true);

            })
        }
        else {

            // show the markers for this suburb
            self.venuesList().forEach(function (venue) {
                if (venue.suburbId === suburb.id)
                venue.showMarker();
            });
        }
        

    });


    // react to the user clicking on the list view items
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

// Resize the map within the bounds of the markers when 
// the window is resized
function resetMap() {

    var bounds = new google.maps.LatLngBounds();
    viewModel.venuesList().forEach(function (venue) {
        if (venue.suburbId === viewModel.currentSuburb().id) {
            bounds.extend(venue.position);
        }
    });
    map.fitBounds(bounds);
   
}

function getVenueData(suburb, callback) {

    // set the URL for the Foursquare API search
    var url = 'https://api.foursquare.com/v2/venues/search?v=20170131&client_id=OZ5CHQMLCUODJNEG1DJW5EHBXBNGFVSE2BBQLIHK45HNY34M&client_secret=1UJX0D5JGLNQHUZPC05CW5L5X5ZP3B5CHITJ3AAB1SZMHTWI&limit=5&categoryId=4bf58dd8d48988d142941735&radius=2000&near=' +
        suburb.city + ',' + suburb.state

    // make the API call
    $.getJSON(url, function (data) {
        callback(data);

    })
      .fail(function (data, textStatus, error) {
          var err = textStatus + ", " + error;
          alert('An attempt to contact the Foursquare API has failed. Please try again');
      });

}

function initializeMarkers(suburb, venuesList) {

    // iterate the venues adding a marker for each  
    var bounds = new google.maps.LatLngBounds();

    venuesList.forEach(function(venue) {
        // only add for suburbId = 0
        if (venue.suburbId === 0) {
            // add the marker
            var marker = new google.maps.Marker({
                position: venue.position,
                map: map,
                animation: google.maps.Animation.DROP,
                title: venue.name,
                id: venue.id,
                checkins: venue.checkins // custom field
            });

            venue.marker = marker;
            venue.suburbId = suburb.id;

            bounds.extend(marker.position);

            var venueInfoWindow = new google.maps.InfoWindow();
            marker.addListener('click', function () {
                fillInfoWindow(this, venueInfoWindow);
                toggleBounce(this);
            });
        }
    });

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

//function showMarker(venue) {
//    for (var i = 0; i < markers.length; i++) {
//        if (markers[i].id == venue.id()) {
//            markers[i].setAnimation(google.maps.Animation.DROP);
//            markers[i].setMap(map);
//            break;
//        }
//    }
//}

//function hideMarker(venue) {
//    for (var i = 0; i < markers.length; i++) {
//        if (markers[i].id == venue.id()) {
//            markers[i].setAnimation(null);
//            markers[i].setMap(null);
//            break;
//        }
//    }
//}


// remove all the markers from the map
function removeMarkers() {
    viewModel.venuesList().forEach(function (venue) {
        venue.hideMarker();
    });
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);