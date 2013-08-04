// Backbone app

(function($) {
  
  //
  // Common telemetry model for both speed and altitude
  //
  
  window.Telemetry = Backbone.Model.extend({
    defaults: {
      'min' : '',
      'max' : '',
      'average': 0,
      'current': 0
    },
  
    initialize: function() {
     this.on('change:current', this.calculateValues, this);
    },
  
    // Calculating min, max and avg values
    calculateValues: function() {  
      var current = this.get('current');
      var dataArray = this.get('dataArray');
    
      // Updating tracked speed array with the latest value
      this.attributes.dataArray.push(current);
    
      // Calculating average speed based on the tracked speed
      var dataSum = 0;
      for (var i in dataArray) { 
        dataSum += dataArray[i];
      }
    
      // Now calculating the average speed
      average = dataSum / dataArray.length;
      this.set('average', average);
      console.log(average);
    
      // Updating min speed value
      if (this.get('min') != '') {
        if (current < this.get('min')) this.set('min', current);
      } else {
        this.set('min', current);
      }
    
      //Updating max speed value
      if (this.get('max') != '') {
        if (current > this.get('max')) this.set('max', current);
      } else {
        this.set('max', current);
      }
    }
  });
  
  
  //
  // Speed related view
  //
  window.Speed = Telemetry.extend({
  });
  
  window.SpeedView = Backbone.View.extend({
    id: 'speed-container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#speed-template').html());
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  // Creating actual objects for Speed model and view
  window.speed = new Speed({});
  
  // Initialize separate data array for this telemetry object
  speed.set('dataArray', []);
  
  window.speedView = new SpeedView({model: speed});
  
  //
  // Altitude related model and view
  //
  
  window.Altitude = Telemetry.extend({
  });
  
  window.AltitudeView = Backbone.View.extend({
    id: 'altitude-container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#altitude-template').html());
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  // Creating actual objects for Altitude model and view
  window.altitude = new Altitude({});
  
  // Initialize separate data array for this telemetry object
  altitude.set('dataArray', []);
  
  window.altitudeView = new AltitudeView({model: altitude});
  
  
  //
  // Airplane landing gear
  //
  
  window.LandingGear = Backbone.Model.extend({
    defaults: {
      extended: false
    },
    
    initialize: function() {
     this.on('change:extended', this.updateServer, this);
    },
    
    updateServer: function() {
      updateLandingGearStatus(this.get('extended'));
    }
  });
  
  window.LandingGearView = Backbone.View.extend({
    id: 'landing_gear_container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#landing-gear-template').html());
    },
    
    events: {
      'click #landing_gear_switch': 'toggleGear'
    },
    
    toggleGear: function() {
      console.log('toggling landing gear');
      var gearExtended = this.model.get('extended');
      if(gearExtended) {
        // Retracting gear
        this.model.set('extended', false);
      } else {
        // Extending gear
        this.model.set('extended', true);
      }
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  window.landingGear = new LandingGear();
  var landingGearView = new LandingGearView({model: landingGear});
  
  //
  // Airplane flaps control
  //
  
  window.Flaps = Backbone.Model.extend({
    defaults: {
      state: 0
    },
    
    initialize: function() {
     this.on('change:state', this.updateServer, this);
    },
    
    updateServer: function() {
      //updateFlapsStatus(this.get('state'));
    }
  });
  
  window.FlapsView = Backbone.View.extend({
    id: 'flaps_container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#flaps-template').html());
    },
    
    events: {
      'click .flap_state': 'changeFlapState'
    },
    
    changeFlapState: function(ev) {
      var flap_state = $(ev.target).data('flap');
      console.log("You've clicked on flap #" + flap_state);
    },
    
    render: function() {
      console.log("rendering flaps");
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  window.flaps = new Flaps();
  window.flapsView = new FlapsView({model: flaps});
  
  //
  // Main router
  //
  
  window.Dashboard = Backbone.Router.extend({
    routes: {
      '' : 'home'
    },
    
    initialize: function() {
    },
    
    home: function() {
      var $container = $('#container');
      $container.empty();
      $container.append(speedView.render().el);
      $container.append(altitudeView.render().el);
      $container.append(landingGearView.render().el);
      $container.append(flapsView.render().el);
    }
  });
  
  $(function() {
    window.App = new Dashboard();
    Backbone.history.start({pushState: true});
  });


  //
  // Websockets logic
  //
  var ws;
  window.initSockets = function() {
    if ("WebSocket" in window)
    {  
       // Updating connection indicator to 'connecting' state
       $('#connection_indicator').removeClass();
       $('#connection_indicator').addClass('connecting');
       $('#connection_state_text').text('Connecting');
       
       // Let us open a web socket
       ws = new WebSocket("ws://ec2-79-125-71-146.eu-west-1.compute.amazonaws.com:8888/telemetry");
       ws.onopen = function()
       {
         // Update connection indicator
         $('#connection_indicator').removeClass();
         $('#connection_indicator').addClass('online');
         $('#connection_state_text').text('Online');
         
          // Web Socket is connected, send data using send()
          ws.send("Message to send");
          console.log("Message is sent...");
       };
       ws.onmessage = function (evt) 
       { 
          var received_msg = evt.data;
          dataAdaptation(received_msg);
          
          console.log("Message is received...");
          console.log(received_msg);
          
       };
       ws.onerror = function(err) {
         console.log('Websocket error detected');
         console.log(err);
       };
       ws.onclose = function()
       { 
          // websocket is closed
          console.log("Connection is closed..."); 
          // Update connection indicator
          $('#connection_indicator').removeClass();
          $('#connection_indicator').addClass('offline');
          $('#connection_state_text').text('Offline');
          
          // Renewing connection to the server
          //initSockets();
       };
    }
    else
    {
       // The browser doesn't support WebSocket
       console.log("WebSockets are not supported by your browser :(");
    }    
  };
  
  //
  // Utility methods
  //
  
  // Adapter method for accepting and validating input data
  // Basically this method is abstracting the data protocol.
  // If Websockets are replaced with something else, just add
  // appropriate protocol handler method, and call this adapter method
  // with received data
  var dataAdaptation = function(data) {
    var parsed_objects;
    try {
      parsed_objects = eval("(" + data + ")");
      
      // Set new values to the models, but only if the data is
      // present and valid
      if (parsed_objects.hasOwnProperty('telemetry')) {
        if (parsed_objects.telemetry.hasOwnProperty('airspeed')) {
          if (validateSpeed(parsed_objects.telemetry.airspeed)) {
            var current = parsed_objects.telemetry.airspeed;
            speed.set('current',  current);
          }
        }
        
        if (parsed_objects.telemetry.hasOwnProperty('altitude')) {
          if (validateAltitude(parsed_objects.telemetry.altitude)) {
            var current = parsed_objects.telemetry.altitude;
            altitude.set('current',  current);
          }
        }
      }
      
      if (parsed_objects.hasOwnProperty('control')) {
        if(parsed_objects.control.hasOwnProperty('landing_gear')) {
          if(validateLandingGear(parsed_objects.control.landing_gear)) {
            landingGear.set('extended', parsed_objects.control.landing_gear);
          }
        }
        
        if(parsed_objects.control.hasOwnProperty('flaps')) {
          if(validateFlaps(parsed_objects.control.flaps)) {
            flaps.set('state', parsed_objects.control.flaps);
          }
        }
      }
    }
    catch (err) {
      console.log('Invalid data detected');
    }
  };
  
  // Updating server with new data
  var updateLandingGearStatus = function(value) {
    console.log('Updating server with new landing gear value');
    try {
      if(value) {
        msg = {"type": "landing_gear", "value": 1}
      } else {
        msg = {"type": "landing_gear", "value": 0}
      }
      ws.send(JSON.stringify(msg));
    }
    catch(err) {
       console.log("Error sending message to the server");   
    }
  };
  
  // Validating value of speed in knots
  var validateSpeed = function(value) {
    var maxSpeed = 420;
    var minSpeed = 0;
    var maxDifferenceToPreviousValue = 200; // safe assumptions here
    
    // Check if value is not a number
    if (isNaN(value))
      return false;
    
    // Filtering out values with too big difference to the previous value
    var previousValue = _.last(speed.get('dataArray'));
    if (Math.abs(value - previousValue) > maxDifferenceToPreviousValue)
      return false;

    return (value >= minSpeed && value <= maxSpeed);
  };
  
  // Validating new value of altitude in feet
  var validateAltitude = function(value) {
    var maxAltitude = 40000; // safe to assume that our plane is not climbing altitudes over 12km
    var minAltitude = 0;
    var maxDifferenceToPreviousValue = 5000;
    
    // Check if value is not a number
    if (isNaN(value))
      return false;
    
    // Filtering out values with too big difference to the previous value
    var previousValue = _.last(altitude.get('dataArray'));
    if (Math.abs(value - previousValue) > maxDifferenceToPreviousValue)
      return false;
    
    return (value >= minAltitude && value <= maxAltitude);
  };
  
  var validateLandingGear = function(value) {
    if (isNaN(value))
      return false;
      
    if (value == 0 || value == 1) {
      return true;
    }
    
    return false;
  };
  
  window.validateFlaps = function(value) {
    var flapsMin = 0;
    var flapsMax = 5;
    
    if (isNaN(value))
      return false;
    
    return (value >= flapsMin && value <= flapsMax);
  }

})(Zepto);
