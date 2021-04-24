import { TestBed } from '@angular/core/testing';

import { BikedataService } from './bikedata.service';

describe('BikedataService', () => {
  let service: BikedataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BikedataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
