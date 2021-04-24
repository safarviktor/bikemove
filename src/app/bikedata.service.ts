import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Trip } from './models';

@Injectable({
  providedIn: 'root'
})
export class BikedataService {

  constructor(private http: HttpClient) { }

  getTrips() : Observable<Trip[]>
  {
    return this.http.get<Trip[]>("http://localhost:5000/api/trips");
  }
}
