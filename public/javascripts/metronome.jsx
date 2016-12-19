class Metronome extends React.Component {
  constructor(props) {
    super(props);

    this.interval;

    this.ac = new (window.AudioContext || window.webkitAudioContext());
    this.oscillator = this.ac.createOscillator();
    this._gain = this.ac.createGain();
    this.oscillator.frequency.value = 550;
    this._gain.gain.value = 0;
    this._gain.connect(this.ac.destination);
    this.oscillator.start(0);
    
    this.octaves = 4;
    this.notesInScale = 8;
    this.beatsInBar = 4;
    this.barsPerOctave = Math.round(this.notesInScale / this.beatsInBar);
    this.notesInScale = (2 * (this.barsPerOctave * this.octaves * this.beatsInBar)) + 1;
 
    this.state = {
      count: 0,
      counting: false,
      bpm: this.props.bpm
    }

    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
  }
  
  startMetronome(e) {
    var bpm = this.state.bpm;
    var beat = 1/20;
    var rest = (60 / bpm) - beat;

    var t = this.ac.currentTime;

    var gainVal = 0.1
    for (var i = 0; i < this.beatsInBar; i++) {
      t += rest;
      this._gain.gain.setValueAtTime(gainVal, t);
      t += beat;
      this._gain.gain.setValueAtTime(0.0, t);
    }

    beat = 1/200;
    rest = (60 / bpm) - beat;
    for (var i = 0; i < this.notesInScale; i++) {
      if (i % 4 == 0) {
        gainVal = 1.0;
      } else {
        gainVal = 0.1;
      }
      t += rest;
      this._gain.gain.setValueAtTime(gainVal, t);
      t += beat;
      this._gain.gain.setValueAtTime(0.0, t);
    }
    this._gain.gain.setValueAtTime(0.0, t);
    this.oscillator.connect(this._gain);

    setTimeout(() => {
      this.interval = setInterval(() => {
        this.setState({count: this.state.count + 1});
      }, (60 * 1000)/bpm - beat);
    }, (beat + rest) * 1000 * this.notesInBar);
    this.setState({counting: true});
  }

  stopMetronome() {
    clearInterval(this.interval); 
    this.oscillator.disconnect(this._gain);
    this.setState({counting: false});
  }

  render() {
    var click = this.state.counting ? this.stopMetronome : this.startMetronome;

    var progresses = [];
    for (var i=1; i <= 6; i++) {
      progresses.push(
        <Progress key={i} complete={this.state.count > i * this.notesInScale}/>
      );
    }

    return (
      <div>
        <div>{(this.state.count - 1) % this.beatsInBar + 1}</div>
        {progresses}
        <StartButton
          onClick={() => click()}
          counting={this.state.counting} />
      </div>
    );
  }
}

class Progress extends React.Component {
  render() {
    return <div className={'progress ' + (this.props.complete ? 'complete' : '')}></div>
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

ReactDOM.render(<Metronome bpm={document.getElementById('bpm').value}/>, document.getElementById('root'));
