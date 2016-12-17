class Metronome extends React.Component {
  constructor(props) {
    super(props);
    this.context = new (window.AudioContext || window.webkitAudioContext());
    this.oscillator = this.context.createOscillator();
    this._gain = this.context.createGain();
    this.oscillator.frequency.value = 550;
    this._gain.gain.value = 0;
    this._gain.connect(this.context.destination);
    this.oscillator.start(0);
    
    this.t = this.context.currentTime;
    
    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
    
    this.state = {
      count: 0,
      counting:  false
    }
  }
  
  startMetronome(e) {
    var beats = 160;
    var bpm = 70;
    var beat = 1/200;
    var rest = (60 / bpm) - beat;

    for (var i = -1; i < beats; i++) {
      if (i % 4 == 0) {
        var gainVal = 1.0;
      } else {
        gainVal = 0.5;
      }
      this.t += beat;
      this._gain.gain.setValueAtTime(0.0, this.t);
      this.t += rest;
      this._gain.gain.setValueAtTime(gainVal, this.t);
    }
    this._gain.gain.setValueAtTime(0.0, this.t);
    this.oscillator.connect(this._gain);

    this.setState({counting: true});
  }

  stopMetronome() {
    this.oscillator.disconnect(this._gain);
    this.setState({counting: false});
  }

  render() {
    return (
      <div>
        <p>{this.count}</p>
        <StartButton
          onClick={() => this.state.counting ? this.stopMetronome() : this.startMetronome()}
          counting={this.state.counting} />
      </div>
    );
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

ReactDOM.render(<Metronome/>, document.getElementById('root'));
