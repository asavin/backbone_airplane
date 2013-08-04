//
// Testing Telemetry model
//

var telemetryData = [{
  'current' : 200,
  'min' : 100,
  'max' : 300,
  'dataArray': [210, 211, 230, 200]
}]

describe("Telemetry", function () {

    beforeEach(function () {
        this.telemetry = new Telemetry(telemetryData[0]);
    });
    
    it("properly constructs object from data", function() {
      expect(this.telemetry.get('dataArray').length).toEqual(4);
    });
    
    it("calculates proper min value", function() {
      this.telemetry.set('current', 50);
      expect(this.telemetry.get('min')).toEqual(50);
    });
    
    it("calculates proper max value", function() {
      this.telemetry.set('current', 400);
      expect(this.telemetry.get('max')).toEqual(400);
    });
    
    it("calculates proper average value", function() {
      var dataArray = [210, 220, 230, 240];
      this.telemetry.set('dataArray', dataArray);
      this.telemetry.set('current', 250);
      var average = (210 + 220 + 230 + 240 + 250) / 5;
      expect(this.telemetry.get('average')).toEqual(average);
    });

});

//
// Testing Flaps model
//

describe("Flaps", function() {
  beforeEach(function() {
    this.flaps = new Flaps({'state': 4});
  });
  
  it("creates object properly with arguments", function() {
    expect(this.flaps.get('state')).toEqual(4);
  });
  
});

//
// Testing LandingGear model
//

describe("LandingGear", function() {
  beforeEach(function() {
    this.landingGear = new LandingGear();
  });
  
  it("creates object properly with arguments", function() {
    expect(this.landingGear.get('extended')).toBeFalsy();
  });
  
});

//
// Testing utility methods
//

describe("Validating Speed values", function() {
  it("approves proper speed values", function() {
    expect(validateSpeed(200)).toBeTruthy();
  });
  
  it("rejects negative values", function() {
    expect(validateSpeed(-200)).toBeFalsy();
  });
  
  it("rejects too big values", function() {
    expect(validateSpeed(99999)).toBeFalsy();
  });
  
  it("rejects non numerical values", function() {
    expect(validateSpeed("hello")).toBeFalsy();
  });
});

describe("Validating Landing Gear values", function() {
  it("approves proper landing gear values", function() {
    expect(validateLandingGear(1)).toBeTruthy();
  });
  
  it("rejects negative values", function() {
    expect(validateLandingGear(-4)).toBeFalsy();
  });
  
  it("rejects too big values", function() {
    expect(validateLandingGear(454)).toBeFalsy();
  });
  
  it("rejects non numerical values", function() {
    expect(validateLandingGear("hello")).toBeFalsy();
  });
});

describe("Validating Flaps values", function() {
  it("approves proper flaps values", function() {
    expect(validateFlaps(5)).toBeTruthy();
  });
  
  it("rejects negative values", function() {
    expect(validateFlaps(-2)).toBeFalsy();
  });
  
  it("rejects too big values", function() {
    expect(validateFlaps(121)).toBeFalsy();
  });
  
  it("rejects non numerical values", function() {
    expect(validateFlaps("hello")).toBeFalsy();
  });
});