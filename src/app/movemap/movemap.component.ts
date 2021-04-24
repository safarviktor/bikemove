import { Component, OnInit, ViewChild } from '@angular/core';
import { BikedataService } from '../bikedata.service';
import { Trip } from '../models';
import {} from 'google.maps';

@Component({
  selector: 'app-movemap',
  templateUrl: './movemap.component.html',
  styleUrls: ['./movemap.component.css']
})
export class MovemapComponent implements OnInit {

  constructor(private bikeDataService: BikedataService) { }
  
  @ViewChild('map') mapElement: any;
  map: google.maps.Map;
  trips: Trip[];

  ngAfterViewInit() {

    this.bikeDataService.getTrips().subscribe(data => 
      {
        this.trips = data;
        this.initMap();
        this.animate();
      });
  } 
  
  ngOnInit(): void {
  }

  animate(): void {
    // Define the symbol, using one of the predefined paths ('CIRCLE')
    // supplied by the Google Maps JavaScript API.
    const lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 2,
      strokeColor: "cyan",
    };

    this.trips.splice(0,1).forEach(currentTrip => {
  
        console.log(currentTrip.startedAt);
        console.log(currentTrip.endedAt);
        // Create the polyline and add the symbol to it via the 'icons' property.
        const line = new google.maps.Polyline({
        path: [
          { lat: currentTrip.startLatitude, lng: currentTrip.startLongitude },
          { lat: currentTrip.endLatitude, lng: currentTrip.endLongitude },
        ],
        strokeColor: '#000000',
        strokeOpacity: 1,
        strokeWeight: 0.00001,
        icons: [
          {
            icon: lineSymbol,
            offset: "0%",
          },
        ],
        map: this.map,
      });

      animateCircle(line, currentTrip.durationSeconds);
    });

    
  }  
  
  initMap(): void {
    const mapProperties = {
      center: new google.maps.LatLng(this.trips[0].startLatitude, this.trips[0].startLongitude),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapProperties);
  }
}


  // Use the DOM setInterval() function to change the offset of the symbol
// at fixed intervals.
function animateCircle(line: google.maps.Polyline, durationSeconds: number) {
  let refreshIntervalMs = 100;
  let oneSecondMs = 1000;
  let speedUpFactor = 100;
  let hundredPercent = 100;
  
  let offsetPercent = 0;
  console.log(durationSeconds);

  var thisInterval = window.setInterval(() => {
    if (offsetPercent >= hundredPercent)
    {
      window.clearInterval(thisInterval);
    }

    const icons = line.get("icons");
    icons[0].offset = offsetPercent + "%";
    line.set("icons", icons);

    offsetPercent = offsetPercent + (oneSecondMs / refreshIntervalMs) / durationSeconds * speedUpFactor;
    
  }, refreshIntervalMs);
}