import { Component, OnInit, ViewChild } from '@angular/core';
import { BikedataService } from '../bikedata.service';
import { Trip } from '../models';
import {} from 'google.maps';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { interval } from 'rxjs';

@Component({
  selector: 'app-startstopmap',
  templateUrl: './startstopmap.component.html',
  styleUrls: ['./startstopmap.component.css']
})
export class StartstopmapComponent implements OnInit {

  
  constructor(
    private bikeDataService: BikedataService) { }
  

  @ViewChild('map') mapElement: any;
  map: google.maps.Map;
  markers: google.maps.Marker[] = [];
  trips: Trip[];
  runningTripIds: number[];
  hours: Date[] = [];
  timeOfDay: Date;
  clockInterval: any;
  timeProgress: number = 0;
  minutesInADay: number = 24 * 60;
  clockTickMs: number = 200;
  tripStartOffsets: number[];

  ngAfterViewInit() {

    let d = new Date(2020, 2, 18);

    this.bikeDataService.getTrips(d).subscribe(data => 
      {
        this.trips = data; //.slice(0, 10);

        // replace this with date selection
        this.timeOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6);
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
      scale: 1,
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

  endTrips(tripsToEnd: Trip[]) : google.maps.Marker[]  {
    let addedMarkers: google.maps.Marker[] = [];

    const icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      strokeColor: "red"
    };

    tripsToEnd.forEach(currentTrip => {
      let marker = this.addMarker(currentTrip.endLatitude, currentTrip.endLongitude, icon)  
      addedMarkers.push(marker);
    });   

    return addedMarkers;
  }

  startTrips(tripsToStart: Trip[]) : google.maps.Marker[]  {
    let addedMarkers: google.maps.Marker[] = [];

    const icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 5,
      strokeColor: "cyan"
    };

    tripsToStart.forEach(currentTrip => {
      let marker = this.addMarker(currentTrip.startLatitude, currentTrip.startLongitude, icon)  
      addedMarkers.push(marker);
    });  
    
    return addedMarkers;
  }

  addMarker(lat: number, lon: number, icon: any) : google.maps.Marker {
    return new google.maps.Marker({
      position: new google.maps.LatLng(lat, lon),
      map: this.map,
      icon: icon
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
    const minutesPerClockTick: number = 1;
    this.clockInterval = setInterval(() => {
      this.timeOfDay.setMinutes(this.timeOfDay.getMinutes() + minutesPerClockTick);

      let newMarkers: google.maps.Marker[] = [];
            
      let minuteAgo = new Date(
        this.timeOfDay.getFullYear(), 
        this.timeOfDay.getMonth(), 
        this.timeOfDay.getDate(), 
        this.timeOfDay.getHours(), 
        this.timeOfDay.getMinutes() - minutesPerClockTick);
      
      let tripsToStart = this.trips.filter(t => {
        let startDate = new Date(t.startedAt);
        return startDate <= this.timeOfDay && startDate > minuteAgo;
      });      
      newMarkers = newMarkers.concat(this.startTrips(tripsToStart));
      
      let tripsToEnd = this.trips.filter(t => {
        let endDate = new Date(t.endedAt);
        return endDate <= this.timeOfDay && endDate > minuteAgo;        
      });
      newMarkers = newMarkers.concat(this.endTrips(tripsToEnd));      

      if (newMarkers.length > 0)
      {
        setInterval((toRemove) => {
          // clear the markers from the map
          toRemove.forEach(m => {
            m.setMap(null);
          });
          // remove them from memory
          toRemove = [];                
        }, 1000, newMarkers);
      }

      let elapsedMinutes = this.timeOfDay.getHours() * 60 + this.timeOfDay.getMinutes();
      this.timeProgress = elapsedMinutes / this.minutesInADay * 100;
      
    },
    this.clockTickMs);
  }

  animateCircle(line: google.maps.Polyline, durationSeconds: number) {
    let refreshIntervalMs = 500;
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
