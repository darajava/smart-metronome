var Metronome = React.createClass({
  render: function() {
    return (
      <p>{this.props.message}</p>
    );
  }
});

class StartButton extends React.Component {
  constructor(props) {
    super(props);
    this.startMetronome = this.startMetronome.bind(this)
  }

  startMetronome(e) {
    var context = new (window.AudioContext || window.webkitAudioContext());
    var oscillator = context.createOscillator();
    var _gain = context.createGain();

    oscillator.frequency.value = 220;
    oscillator.connect(_gain);

    _gain.gain.value = 0;
    _gain.connect(context.destination);
  
    var beats = 160;
    var bpm = 60;
    var beat = 1/100;
    var rest = (60 / bpm) - beat;
    var t = context.currentTime;
  
    for (var i = 0; i < beats; i++) {
      if (i % 4 == 0) {
        console.log('beat');
        oscillator.frequency.value = 220;
       
        oscillator.type = 'square';
        var gainVal = 1.0;
      } else {
        console.log('bar');
        oscillator.frequency.value = 440;
        oscillator.type = 'triangle';
        gainVal = 0.5;
      }
      t += beat;
      _gain.gain.setValueAtTime(0.0, t);
      t += rest;
      _gain.gain.setValueAtTime(gainVal, t);
    }
    oscillator.start(0);
  }

  stopMetronome() {
    ReactDOM.render(<StartButton start='Start'/>, document.getElementById('button'));
  }

  render() {
    return (
      <button onClick={this.props.start == 'Start' ? this.startMetronome : this.stopMetronome}>{this.props.start}</button>
    );
  }
}

ReactDOM.render(<StartButton start='Start'/>, document.getElementById('button'));
