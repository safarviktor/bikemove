import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { BikedataService } from '../bikedata.service';
import { Trip } from '../models';
import {} from 'google.maps';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-movemap',
  templateUrl: './movemap.component.html',
  styleUrls: ['./movemap.component.css']
})
export class MovemapComponent implements OnInit {

  constructor(
    private bikeDataService: BikedataService) { }
  

  @ViewChild('map') mapElement: any;
  map: google.maps.Map;
  trips: Trip[];
  runningTripIds: number[];
  hours: Date[] = [];
  timeOfDay: Date;
  clockInterval: any;
  timeProgress: number = 0;
  minutesInADay: number = 24 * 60;
  clockTickMs: number = 100;
  tripStartOffsets: number[];

  ngAfterViewInit() {

    this.bikeDataService.getTrips().subscribe(data => 
      {
        this.trips = data; //.slice(0, 10);

        // to make GMaps remove the symbol after the trip end for same-same station trip, move the end slighly
        this.trips.filter(t => t.startStationName == t.endStationName).forEach(t => t.endLatitude = t.endLatitude + 0.00001);               

        // replace this with date selection
        this.timeOfDay = new Date(2021, 0, 1, 5);
        
        this.runningTripIds = [];
        this.tripStartOffsets = this.trips.map(t => {
          const startedAt = new Date(t.startedAt);
          const startedInMInutesOfDay = startedAt.getHours() * 60 + startedAt.getMinutes();
          const offset = startedInMInutesOfDay / this.minutesInADay;
          return offset;
        });

        this.initMap();
        this.runClock();
      });
  } 
  
  ngOnInit(): void {
    for (let index = 0; index < 24; index++) {
      this.hours.push(new Date(2000, 0, 1, index));
    }    
  }

  ngOnDestroy() {
    clearInterval(this.clockInterval);
  }

  animate(currentTrips: Trip[]): void {
    
    const lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      strokeColor: "red"
    };

    currentTrips.forEach(currentTrip => {

      // console.log("starting trip");
      // console.log(currentTrip.startedAt);
      // console.log(currentTrip.endedAt);
      
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

      this.animateCircle(line, currentTrip.durationSeconds);
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

  runClock() : void
  {
    console.log("starting clock");
    this.clockInterval = setInterval(() => {
      this.timeOfDay.setMinutes(this.timeOfDay.getMinutes() + 1);

      let tripsToStart = this.trips.filter(t => new Date(t.startedAt) <= this.timeOfDay && !this.runningTripIds.includes(t.id));
      this.animate(tripsToStart);
      this.runningTripIds = this.runningTripIds.concat(tripsToStart.map(t => t.id));

      let elapsedMinutes = this.timeOfDay.getHours() * 60 + this.timeOfDay.getMinutes();
      this.timeProgress = elapsedMinutes / this.minutesInADay * 100;
      
    },
    this.clockTickMs);
  }

  animateCircle(line: google.maps.Polyline, durationSeconds: number) {
    let refreshIntervalMs = 50;
    const hundredPercent = 100;    
    let offsetPercent = 0; 
  
    var thisInterval = window.setInterval(() => {

      // console.log(this.timeOfDay);
      // console.log(`offsetPercent: ${offsetPercent}`);
      
      //debugger;

      if (offsetPercent >= hundredPercent)
      {
        window.clearInterval(thisInterval);
      }
  
      const icons = line.get("icons");
      icons[0].offset = offsetPercent + "%";
      line.set("icons", icons);

      // provided the refresh run in sync with the clock, 
      // every clock tick is 1 minute, so we need to move 1 minute (60 seconds) into the trip
      offsetPercent = offsetPercent 
        + (60 / durationSeconds / (this.clockTickMs / refreshIntervalMs)) * 100 ; // because percent
      
    }, refreshIntervalMs);
  }

}