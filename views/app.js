


var locations = [
           { id: 1, title: 'Downtown Deerfield', active: true, position: { lat: 42.167308, lng: -87.845736 } },
           { id: 2, title: 'Agran house', active: true, position: { lat: 42.161208, lng: -87.829428 } },
           { id: 3, title: 'Groner\s House', active: true, position: { lat: 42.175045, lng: -87.856293 } },
           { id: 4, title: 'Meliker\s House', active: true, position: { lat: 42.157176, lng: -87.829599 } },
           { id: 5, title: 'Batt\s House', active: true, position: { lat: 42.196891, lng: -87.871571 } }
];

var Location = function (data) {
    this.id = ko.observable(data.id);
    this.title = ko.observable(data.title);
    this.active = ko.observable(data.active);
    this.position = ko.observable(data.position);
};

var ViewModel = function () {
    
    var self = this;

    self.locationsList = ko.observableArray([]);

    locations.forEach(function(locationItem) {
        self.locationsList.push(new Location(locationItem));
    });

    self.currentLocation = ko.observable(this.locationsList()[0]);

    // When a list item is clicked, set it as
    // the current location on the map and list
    self.setCurrentLocation = function (clickedLocation) {
        self.currentLocation(clickedLocation);

        // switch whether the marker displays based on its
        // active state
        if (self.currentLocation().active()) {
            self.currentLocation().active(false);
            hideMarker(self.currentLocation().id());

        } else {
            self.currentLocation().active(true);
            showMarker(self.currentLocation().id());
        }
    };
}

function initializeMarkers() {

    for (var i = 0; i < viewModel.locationsList().length; i++) {
        var marker = new google.maps.Marker({
            position: viewModel.locationsList()[i].position(),
            map: map,
            animation: google.maps.Animation.DROP,
            title: viewModel.locationsList()[i].title(),
            id: viewModel.locationsList()[i].id()
        });

        markers.push(marker);
    }
    
}

function showAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
        showMarker(markers[i].id);
    }
}

function showMarker(id) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].id == id) {
            markers[i].setAnimation(google.maps.Animation.DROP);
            markers[i].setMap(map);

            // need to set the location to active as well
            viewModel.locationsList()[i].active(true);

            break;
        }
    }
}

function hideAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
        hideMarker(markers[i].id);
    }
}

function hideMarker(id) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].id == id) {
            markers[i].setAnimation(null);
            markers[i].setMap(null);

            // need to set the location to inactive as well
            viewModel.locationsList()[i].active(false);

            break;
        }
    }
}



var viewModel = new ViewModel();
ko.applyBindings(viewModel);