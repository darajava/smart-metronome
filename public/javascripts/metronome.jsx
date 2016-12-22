String.prototype.ucFirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

var toEnglish = function(w) {
  // lol
  if (w == '1') return 'one';
  if (w == '2') return 'two';
  if (w == '3') return 'three';
  if (w == '4') return 'four';
  if (w == '5') return 'five';
  if (w == '6') return 'six';
  if (w == '7') return 'seven';
  if (w == '8') return 'eight';
  if (w == '9') return 'nine';
  if (w == '10') return 'ten';
  return this;
}

class Metronome extends React.Component {
  constructor(props) {
    super(props);

    this.interval, this.timeout, this.flag = false;

    this.ac = new (window.AudioContext || 
      window.webkitAudioContext || 
      window.mozAudioContext || 
      window.oAudioContext || 
      window.msAudioContext);
    this.oscillator = this.ac.createOscillator();
    this._gain = this.ac.createGain();
    this.oscillator.frequency.value = 550;
    this._gain.gain.value = 0;
    this._gain.connect(this.ac.destination);
    this.oscillatorStarted = false;

    var userlog = this.props.userlog[0];

    this.scaleName = userlog.scale[0].name;
    this.displayName = userlog.scale[0].displayName;

    this.hands = "both"; 
    this.beatsInBar = 4;
    this.reps = 6;
    this.octaves = userlog.octaves;
    var degreesOfScale = 7;
    var totalNotesInScale = degreesOfScale * this.octaves * 2 + 1;

    this.notesPerBeat = userlog.notesPerBeat;
    this.beatsInScale = Math.ceil((totalNotesInScale / this.notesPerBeat)/4) * 4;
    
    this.state = {
      count: 0,
      counting: false,
      bpm: userlog.bpm,
      displayRetryDialogue: false,
      completed: false
    }

    this.actualBpm = this.state.bpm / (this.notesPerBeat / 4);

    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
    this.userStopMetronome = this.userStopMetronome.bind(this);
    this.slowMetronome = this.slowMetronome.bind(this);
  }
  
  startMetronome() {
    if (this.flag) {
      return;
    }

    this.flag = true;
    setTimeout(() => {this.flag = false;}, 1000);
    var bpm = this.actualBpm;
    var beat = 1/20;
    var rest = (60 / bpm) - beat;

    if (!this.oscillatorStarted) {
      this.oscillator.start(0);
      this.oscillatorStarted = true;
    } 

    var t = this.ac.currentTime;

    var gainVal = 0.1
    for (var i = 0; i < this.beatsInBar; i++) {
      this._gain.gain.setValueAtTime(gainVal, t);
      t += beat;
      this._gain.gain.setValueAtTime(0.0, t);
      t += rest;
    }

    beat = 1/200;
    rest = (60 / bpm) - beat;
    for (var rep = 0; rep < this.reps; rep++){
      for (var i = 1; i <= this.beatsInScale; i++) {
        if ((i-1) % 4 == 0) {
          gainVal = 1.0;
        } else {
          gainVal = 0.1;
        }
        this._gain.gain.setValueAtTime(gainVal, t);
        t += beat;
        this._gain.gain.setValueAtTime(0.0, t);
        t += rest;
      }
    }
    this._gain.gain.setValueAtTime(0.0, t);
    this.oscillator.connect(this._gain);

    this.timeout = setTimeout(() => {
      this.interval = setInterval(() => {
        this.setState({count: this.state.count + 1});
        if (this.state.count > this.beatsInScale * this.reps) {
          clearTimeout(this.interval);
          setTimeout(() => {
            this.setState({completed: true, count: 0, counting: false});
          }, 100);
        }
      }, (60 * 1000)/bpm - beat);
    }, (beat + rest) * 1000 * (this.beatsInBar - 1));
    this.setState({counting: true, displayRetryDialogue: false, completed: false});
  }

  stopMetronome() {
    clearInterval(this.interval); 
    clearTimeout(this.timeout); 
    this.oscillator.disconnect(this._gain);
    this._gain = this.ac.createGain();
    this._gain.connect(this.ac.destination);
    this.setState({count:0, counting: false});
  }

  userStopMetronome() {
    if (this.flag) {
      return;
    }

    this.stopMetronome();
    this.setState({displayRetryDialogue: true, completed: false});
  }

  slowMetronome() {
    this.setState({bpm: this.state.bpm - 4});
    this.startMetronome();
  }

  saveWorkout() {
    var userlog = {
      scale: this.scaleName,
      notesPerBeat: this.notesPerBeat,
      octaves: this.octaves,
      bpm: parseInt(this.state.bpm) + 2 // increment for next time
    };

    console.log(userlog);

    $.post({
      url: '/saveuserlog',
      data: userlog,
      success: function() {
        console.log('Success!');
        $('.success').html('Saved!<br/>Congrats!');
        setTimeout(function() {
          document.location = '/';
        }, 400);
      },
    }).fail(function(err) {
      console.log(err);
    });
  } 

  render() {
    var click = this.state.counting ? this.userStopMetronome : this.startMetronome;

    var progresses = [];
    for (var i=1; i <= 6; i++) {
      progresses.push(
        <Progress key={i} number={i} complete={this.state.count > i * this.beatsInScale || this.state.completed}/>
      );
    }

    return (
      <div>
        {
          this.state.displayRetryDialogue ? 
              <RetryModal
                fail={() => this.slowMetronome()}
                retry={() => this.startMetronome()}/> :
              null
        }
        {
          this.state.completed ? 
              <CompleteModal
                fail={() => this.slowMetronome()}
                retry={() => this.startMetronome()}
                success={() => this.saveWorkout()}/> :
              null
        }
        <div className="todo">
          <h2>Play <b>{this.displayName}</b> :</h2> 
          <div className="image-holder">
            <img
              className="piano-scale"
              src={"/images/scales/" + this.scaleName + ".png"} />
          </div>
          <ul className="rounded-list">
            <li>
              <b>{toEnglish(this.reps).ucFirst()} </b>
              time{this.reps == 1 ? '' : 's'} 
            </li>
            <li>
              <b>{toEnglish(this.notesPerBeat).ucFirst()} </b>
              note{this.notesPerBeat == 1 ? '' : 's'} per beat
            </li>
            <li>
              <b>{toEnglish(this.octaves).ucFirst()} </b>
              octave{this.octaves == 1 ? '' : 's'}
            </li>
            <li>
              Actual BPM:
              <b> {this.actualBpm} </b>
            </li>
            <li>
              Equivalant BPM:
              <b> {this.state.bpm}</b>
            </li>
          </ul>
        </div>
        <div className="progress-container">
          <span className="progress-holder">
            {progresses}
          </span>
        </div>
        <div className="metronome-holder">
          <div><h1>{(this.state.count - 1) % this.beatsInBar + 1}</h1></div>
          <StartButton
            onClick={(e) => click(e)}
            counting={this.state.counting} />
        </div>
        <Hamster />
      </div>
    );
  }
}

class Progress extends React.Component {
  render() {
    return <div className={'progress ' + (this.props.complete ? 'complete' : '')}>
       {this.props.number}
    </div>
  }
}

class StartButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button onTouchEnd={() => this.props.onClick()} onClick={() => this.props.onClick()}>
        {this.props.counting ? 'Stop' : 'Start'}
      </button>
    );
  }
}
class RetryModal extends React.Component {
  render() {
    return <div className="modal-bg">
      <div className="modal">
        <div className="message">
          Would you like to retry or slow down?
        </div>
        <button className="fail" onClick={() => this.props.fail()}>Slow down</button>
        <button className="retry" onClick={() => this.props.retry()}>Retry</button>
        <a className="go-home" href="/">or <span>go back home</span></a>
      </div>
    </div>
  }
}

class CompleteModal extends React.Component {
  render() {
    return <div className="modal-bg">
      <div className="modal complete">
        <div className="message">
          Finished! How did it go?
        </div>
        <button className="fail" onClick={() => this.props.fail()}>Not good -<br/> slow down</button>
        <button className="retry" onClick={() => this.props.retry()}>A bit iffy -<br/> retry</button>
        <button className="success" onClick={() => this.props.success()}>Great!<br/> Count it</button>
      </div>
    </div>
  }
}

class Hamster extends React.Component {
  render() {
    return <div className="hamster">
      <img src="/images/cutehamster.gif" title="Arrr" />
    </div>
  }
}

ReactDOM.render(<Metronome userlog={JSON.parse(document.getElementById('userlog').value)} />, document.getElementById('root'));





