(() => {
  function draw() {
    g.reset(); // reset the graphics context to defaults (color/font/etc)
      // s for sleep
    g.drawString("S", this.x, this.y);
  }

// Sleep/Wake detection with Estimation of Stationary Sleep-segments (ESS):
// Marko Borazio, Eugen Berlin, Nagihan KÃ¼cÃ¼kyildiz, Philipp M. Scholl and Kristof Van Laerhoven, "Towards a Benchmark for Wearable Sleep Analysis with Inertial Wrist-worn Sensing Units", ICHI 2014, Verona, Italy, IEEE Press, 2014.
// https://ubicomp.eti.uni-siegen.de/home/datasets/ichi14/index.html.en
//
// Function needs to be called for every measurement but returns a value at maximum once a second (see winwidth)
// start of sleep marker is delayed by sleepthresh due to continous data reading

// Adapted by Ben Everard to simply record your sleep phases over time
const winwidth=13;
const nomothresh=0.006;
const sleepthresh=600;
var ess_values = [];
var slsnds = 0;

var file = require("Storage").open("sleepquality.csv","a");

function calc_ess(val) {
  ess_values.push(val);

  if (ess_values.length == winwidth) {
    // calculate standard deviation over ~1s 
    const mean = ess_values.reduce((prev,cur) => cur+prev) / ess_values.length;
    const stddev = Math.sqrt(ess_values.map(val => Math.pow(val-mean,2)).reduce((prev,cur) => prev+cur)/ess_values.length);
    ess_values = [];

    // check for non-movement according to the threshold
    const nonmot = stddev < nomothresh;

    // amount of seconds within non-movement sections
    if (nonmot) {
      slsnds+=1;
      if (slsnds >= sleepthresh) {
        return true; // awake
      }
    } else {
      slsnds=0;
      return false; // sleep
    }
  }
}


// run
var minAlarm = new Date();
var measure = true;
var count = 0;
var quality = 0;

setInterval(function() {
    const now = new Date();
    const acc = Bangle.getAccel().mag;
    const swest = calc_ess(acc);

    // if currently sleeping, increment quality by one (so it will be a max of 100 in a before being reset)
    if (swest !== undefined) {
      if (swest) {
        quality++;
      }
    }
    count++;
    
    //count up over 100 seconds and 
     if (count > 100) {
       count = 0;
       file.write([getTime().toFixed(0),quality].join(",")+"\n");
       quality = 0;
     }


  }, 80); // 12.5Hz

  
// add your widget
WIDGETS["sleepqual"]={
    area:"bl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
    width: 28, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
    draw:draw // called to draw the widget
  };
})()