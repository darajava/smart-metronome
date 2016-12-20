String.prototype.ucFirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

Number.prototype.toEnglish = function() {
  // lol
  if (this == '1') return 'one';
  if (this == '2') return 'two';
  if (this == '3') return 'three';
  if (this == '4') return 'four';
  if (this == '5') return 'five';
  if (this == '6') return 'six';
  if (this == '7') return 'seven';
  if (this == '8') return 'eight';
  if (this == '9') return 'nine';
  if (this == '10') return 'ten';
  return this;
}

class Metronome extends React.Component {
  constructor(props) {
    super(props);

    this.interval, this.timeout;

    this.ac = new (window.AudioContext || window.webkitAudioContext());
    this.oscillator = this.ac.createOscillator();
    this._gain = this.ac.createGain();
    this.oscillator.frequency.value = 550;
    this._gain.gain.value = 0;
    this._gain.connect(this.ac.destination);
    this.oscillator.start(0);
  
    this.hands = "both"; 
    this.beatsInBar = 4;
    this.reps = 6; 
    this.octaves = 1;
    var degreesOfScale = 7;
    var totalNotesInScale = degreesOfScale * this.octaves * 2 + 1;

    this.notesPerBeat = 4;
    this.beatsInScale = (Math.ceil(totalNotesInScale / 4) * 4) / this.notesPerBeat;
 
    this.state = {
      count: 0,
      counting: false,
      bpm: this.props.bpm,
      displayRetryDialogue: false
    }

    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
    this.userStopMetronome = this.userStopMetronome.bind(this);
    this.slowMetronome = this.slowMetronome.bind(this);
  }
  
  startMetronome(e) {
    var bpm = this.state.bpm;
    var beat = 1/20;
    var rest = (60 / bpm) - beat;

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
      }, (60 * 1000)/bpm - beat);
    }, (beat + rest) * 1000 * (this.beatsInBar - 1));
    this.setState({counting: true, displayRetryDialogue: false});
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
    this.stopMetronome();
    this.setState({displayRetryDialogue: true});
  }

  slowMetronome() {
    this.setState({bpm: this.state.bpm - 5});
    this.startMetronome();
  }

  render() {
    var click = this.state.counting ? this.userStopMetronome : this.startMetronome;

    var progresses = [];
    for (var i=1; i <= 6; i++) {
      progresses.push(
        <Progress key={i} number={i} complete={this.state.count > i * this.beatsInScale}/>
      );
    }

    return (
      <div>
        {this.state.displayRetryDialogue ? <RetryModal fail={() => this.slowMetronome()} retry={() => this.startMetronome()}/> : null}
        <div className="todo">
          <h2>Play <b>{this.props.scale.displayName}</b> :</h2> 
          <div className="image-holder">
            <img className="piano-scale" src={"/images/scales/" + this.props.scale.name + ".png"} />
          </div>
          <ul className="rounded-list">
            <li><b>{this.reps.toEnglish().ucFirst()}</b> time{this.reps == 1 ? '' : 's'}</li>
            <li><b>{this.notesPerBeat.toEnglish().ucFirst()}</b> notes per beat</li>
            <li><b>{this.octaves.toEnglish().ucFirst()}</b> Octave{this.octaves == 1 ? '' : 's'}</li>
            <li><b>Similar</b> motion</li>
            <li><b>{this.hands.ucFirst()}</b> hands</li>
            <li>BPM: <b>{this.state.bpm}</b></li>
            <li>Adjusted BPM: <b>{this.state.bpm*(this.notesPerBeat/4)}</b></li>
          </ul>
        </div>
        <div className="progress-container"><span className="progress-holder">{progresses}</span></div>
        <div className="metronome-holder">
          <div><h1>{(this.state.count - 1) % this.beatsInBar + 1}</h1></div>
          <StartButton
            onClick={() => click()}
            counting={this.state.counting} />
        </div>
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
      <button onClick={() => this.props.onClick()}>
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
        <button className="retry" onClick={() => this.props.retry()}>Retry</button>
        <button className="fail" onClick={() => this.props.fail()}>Slow down</button>
      </div>
    </div>
  }
}

ReactDOM.render(<Metronome scale={JSON.parse(document.getElementById('scale').value)} bpm={document.getElementById('bpm').value}/>, document.getElementById('root'));
