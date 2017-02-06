
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
    this.suburbId = data.suburbId;
    this.name = data.name;
    this.position = data.position;
    this.active = ko.observable(true);
    this.marker = data.marker;
};

Venue.prototype.showMarker = function() {
    // "this" is the current venue
    var venue = this;
    venue.marker.setAnimation(google.maps.Animation.DROP);
    venue.marker.setVisible(true);
    venue.active(true);
};

Venue.prototype.hideMarker = function () {
    var venue = this;
    venue.marker.setAnimation(null);
    venue.marker.setVisible(false);
    venue.active(false);
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
    self.filteredVenues = ko.observableArray([]);
    
    self.selectedSuburb.subscribe(function (suburb) {
        
        // hide any markers that might be showing
        removeMarkers();

        // switch current suburb to the one selected
        self.currentSuburb(suburb);
        var suburbCenter = new google.maps.LatLng({ lat: suburb.position.lat, lng: suburb.position.lng });

        // need to load the data for the suburb if it
        // hasn't yet been loaded
        if (!suburb.hasLoadedData()) {

            // set up a callback in order to have access to the data
            getVenueData(suburb, function (data) {

                var venues = [];
                venues = data.response.venues;

                // add the venues to the venues list
                venues.forEach(function (venueItem) {
                    // need to build a venue due to the fact that the API layer
                    // is pulling from multiple levels and I need to reuse the Venue
                    // for the filtered venues

                    // create a marker
                    var marker = createMarker(venueItem);

                    var venue = ({
                        id: venueItem.id,
                        name: venueItem.name,
                        position: { lat: venueItem.location.lat, lng: venueItem.location.lng },
                        suburbId: suburb.id,
                        marker: marker,
                    });

                    self.venuesList.push(new Venue(venue));
                });

                suburb.hasLoadedData(true);

                // create the filtered list for this suburb
                self.filteredVenues([]);
                self.venuesList().forEach(function (venueItem) {
                    if (venueItem.suburbId === suburb.id) {
                        venueItem.showMarker();
                        self.filteredVenues.push(new Venue(venueItem));
                    }
                });

                map.setOptions({ center: suburbCenter, zoom: 14 });

            })
        }

        map.setOptions({ center: suburbCenter, zoom: 14 });

        // show the marker for the suburb and create the filtered list
        self.filteredVenues([]);
        self.venuesList().forEach(function (venueItem) {
            if (venueItem.suburbId === suburb.id) {
                venueItem.showMarker();
                self.filteredVenues.push(new Venue(venueItem));
            }
        });


    });


    // react to the user clicking on the list view items
    self.selectedVenue = ko.observable();
    self.selectedVenue.subscribe(function (venue) {

        // make active if inactive and vice versa
        if (venue.active()) {
            self.selectedVenue().active(false);
            venue.hideMarker(venue);
            venue.marker.info.close();
        }
        else {
            self.selectedVenue().active(true);
            venue.showMarker(venue);
            venue.marker.info.open(map, venue.marker);           

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

function createMarker(venue) {

    // iterate the venues adding a marker for each  
    var bounds = new google.maps.LatLngBounds();

    // create the marker
    var marker = new google.maps.Marker({
        position: { lat: venue.location.lat, lng: venue.location.lng },
        map: map,
        animation: google.maps.Animation.DROP,
        title: venue.name,
        id: venue.id,
        checkinsCount: venue.stats.checkinsCount // custom field
    });

    bounds.extend(marker.position);

    marker.info = new google.maps.InfoWindow({
        content: '<div>' + marker.title + '</div>' +
            '<div>Total checkins: ' + marker.checkinsCount + '</div'
    });

    google.maps.event.addListener(marker, 'click', function () {
        marker.info.open(map, marker);
        toggleBounce(marker);
    })

    google.maps.event.addListener(marker.info, 'closeclick', function () {
        marker.info.close();
        marker.setAnimation(null);
    })

    map.fitBounds(bounds);

    return marker;
}
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    }
    else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

// remove all the markers from the map
function removeMarkers() {
    viewModel.venuesList().forEach(function (venue) {
        venue.hideMarker();
    });
}

