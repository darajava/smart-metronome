$(document).ready(function(e) {
  $("#note-select").msDropDown();
  $('#notation svg').css("transform", "scale(" +  $(window).width() / $('#notation svg').attr('width') + ")");
});

$(window).on('resize', function(){
  $('#notation svg').css("transform", "scale(" +  $(window).width() / $('#notation svg').attr('width') + ")");
})

String.prototype.ucFirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

var toEnglish = function(w) {
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
    
    console.log(userlog);

    this.key = userlog.key;
    this.displayName = userlog.scale[0].displayName;
    this.scaleType = userlog.scale[0].type;
    this.prevId = $('#prevId').val();

    switch (this.scaleType) {
      case "major-scale":
        this.sequence = [2, 2, 1, 2, 2, 2, 1];
        break;
      case "minor-scale":
        this.sequence = [2, 1, 2, 2, 1, 3, 1];
        break;
      case "major-pentatonic":
        this.sequence = [2, 2, 3, 2, 3];
        break;
      case "minor-pentatonic":
        this.sequence = [3, 2, 2, 3, 2];
        break;
      case "blues-pentatonic":
        this.sequence = [3, 2, 1, 1, 3, 2];
        break;
      case "major-arpeggio":
        this.sequence = [4, 3, 5];
        break;
      case "minor-arpeggio":
        this.sequence = [3, 4, 5];
        break;
      case "major-7-arpeggio":
        this.sequence = [4, 3, 4, 1];
        break;
      case "minor-7-arpeggio":
        this.sequence = [3, 4, 4, 1];
        break;
      case "augmented-arpeggio":
        this.sequence = [4, 4, 4];
        break;
      case "diminished-arpeggio":
        this.sequence = [3, 3, 6];
        break;
      case "augmented-7-arpeggio":
        this.sequence = [4, 4, 2, 2];
        break;
      case "diminished-7-arpeggio":
        this.sequence = [3, 3, 3, 3];
        break;
      case "chromatic":
        this.sequence = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        break;
    }

    this.hands = "both"; 
    this.beatsInBar = 4;
    this.reps = 4;
    
    this.state = {
      count: 0,
      counting: false,
      octaves: userlog.octaves,
      mode: 0,
      displayRetryDialogue: false,
      notesPerBeat: userlog.notesPerBeat,
      bpm: userlog.bpm + 10,
      completed: false
    }
    
    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
    this.userStopMetronome = this.userStopMetronome.bind(this);
    this.slowMetronome = this.slowMetronome.bind(this);
    this.changeOctaves = this.changeOctaves.bind(this);
    this.changeMode = this.changeMode.bind(this);
    this.changeNotesPerBeat = this.changeNotesPerBeat.bind(this);
    this.calculateAdjustedBpm = this.calculateAdjustedBpm.bind(this);
  }
  
  startMetronome() {
    if (this.flag) {
      return;
    }
    this.flag = true;
    setTimeout(() => {this.flag = false;}, 200);

    var degreesOfScale = this.sequence.length;
    var totalNotesInScale = degreesOfScale * this.state.octaves * 2 + 1;
    this.beatsInScale = Math.ceil((totalNotesInScale / this.state.notesPerBeat)/4) * 4;
    
    var bpm = this.state.bpm;
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

    setTimeout(() => {
      this.stopMetronome();
      this.setState({displayRetryDialogue: true, completed: false});
    }, 10);
  }

  slowMetronome() {
    this.setState({
      bpm: (this.state.bpm - 2),
    }, () => {
      this.startMetronome();
    });
  }

  saveWorkout() {
    var userlog = {
      scale: this.scaleType,
      notesPerBeat: this.state.notesPerBeat,
      octaves: this.state.octaves,
      bpm: parseInt(this.state.bpm),
      adjustedBpm: this.calculateAdjustedBpm(this.state.bpm, this.state.notesPerBeat),
      key: this.key,
      prevId: this.prevId
    };

    $.post({
      url: '/saveuserlog',
      data: userlog,
      success: function() {
        $('.success').html('Saved!<br/>Congrats!');
        setTimeout(function() {
          document.location = '/';
        }, 400);
      },
    }).fail(function(err) {
      console.log(err);
    });
  } 

  calculateAdjustedBpm(bpm, notesPerBeat) {
    var npb = typeof notesPerBeat === "undefined" ? this.state.notesPerBeat : notesPerBeat; 
    return bpm * (npb/ 4);
  }

  changeNotesPerBeat(event) {
    console.log('new' + $('#note-select').val());
    this.setState({
      notesPerBeat: $('#note-select').val(),
    });
  }

  changeOctaves(event) {
    this.setState({
      octaves: event.target.value,
    });
  }

  changeMode(event) {
    this.setState({
      mode: event.target.value,
    });
  }

  incrementBpm(inc) {
    this.setState({
      bpm: this.state.bpm + inc,
    });
  }

  closeModal() {
    this.setState({
      completed: false,
      displayRetryDialogue: false
    });
  }


  render() {
    var click = this.state.counting ? this.userStopMetronome : this.startMetronome;

    var progresses = [];
    for (var i=1; i <= this.reps; i++) {
      progresses.push(
        <Progress key={i} number={i} complete={this.state.count > i * this.beatsInScale || this.state.completed}/>
      );
    }


    var notesOptions = [];
    for (var notes = 1; notes <= 4; notes++) {
      var noteValue = 'semiquaver';
      if (notes == 1) {
        noteValue = 'semiquaver';
      } else if (notes == 2) {
        noteValue = 'quaver';
      } else if (notes == 4) {
        noteValue = 'crotchet';
      } else {
        continue;
      }

      notesOptions.push(
        <option key={notes} value={notes} data-image={"/images/notes/" + noteValue + ".png"}></option>
      );
    }

    var octavesOptions = [];
    for (var octaves = 2; octaves <= 4; octaves++) {
      octavesOptions.push(
        <option key={octaves} value={octaves}>{toEnglish(octaves).ucFirst()}</option>
      );
    }

    var modeLabel = "mode";
    var showModes = true;
    if (this.scaleType == 'major-scale') {
      var modes = [
        "I - Ionian",
        "II - Dorian",
        "III - Phrygian",
        "IV - Lydian",
        "V - Mixolydian",
        "VI - Aeolian",
        "VII - Locrian",
      ];
    } else if (this.scaleType == 'minor-scale') {
      var modes = [
        "I - Harmonic Minor",
        "II - Locrian #6",
        "III - Ionian #5",
        "IV - Dorian #4",
        "V - Phrygian Dominant",
        "VI - Lydian #2",
        "VII - Superlocrian",
      ];
    } else if (this.scaleType == 'major-arpeggio' || this.scaleType == 'minor-arpeggio') {
      var modes = [
        "Root",
        "Second",
        "Third",
      ];
      modeLabel = "position";
    } else {
      showModes = false;
    }

    var modesOptions = [];
    if (typeof modes !== "undefined") {
      for (var i = 0; i < modes.length; i++) {
        modesOptions.push(
          <option key={i} value={i}>{modes[i]}</option>
        );
      }
    }

    return (
      <div>
        {
          this.state.displayRetryDialogue ? 
              <RetryModal
                closeModal={() => this.closeModal()}
                fail={() => this.slowMetronome()}
                retry={() => this.startMetronome()}/> :
              null
        }
        {
          this.state.completed ? 
              <CompleteModal
                closeModal={() => this.closeModal()}
                fail={() => this.slowMetronome()}
                retry={() => this.startMetronome()}
                success={() => this.saveWorkout()}/> :
              null
        }
        <div className="todo">
          <h1>{this.key.toUpperCase()}{this.displayName}</h1> 
          <div className="piano-holder">
            <Piano mode={this.state.mode} startingKey={this.key} sequence={this.sequence} />
          </div>
          <div className="notation-holder">
            <div id="notation"></div>
          </div>
          <hr />
          <ul className="rounded-list">
            <li className="todo-elem">
              Play <b>{toEnglish(this.reps)} </b>
              time{this.reps == 1 ? '' : 's'} 
            </li>
            <li className="todo-elem">
              Tempo: 
              <span onBlur={this.changeNotesPerBeat}>
                <select id='note-select' value={this.state.notesPerBeat} onChange={function(){}}>
                  {notesOptions}
                </select>
              </span> = 
              <b className="display-bpm">{this.state.bpm}</b>
              <input type="button" value="-" className="plus-minus"  onClick={() => this.incrementBpm(-2)}/>
              <input type="button" value="+" className="plus-minus"  onClick={() => this.incrementBpm(2)}/>
              <input type="button" value="Megaplus" className="plus-minus"  onClick={() => this.incrementBpm(-50)}/>
              <input type="button" value="megaplus" className="plus-minus"  onClick={() => this.incrementBpm(50)}/>
            </li>
            <li className={"todo-elem " + (showModes ? '' : 'hidden')}>
              <div className="select-style" >
                <select onChange={this.changeMode}>
                  {modesOptions}
                </select>
              </div>
              {modeLabel}
            </li>
            <li className="todo-elem">
              <div className="select-style" >
                <select value={this.state.octaves} onChange={this.changeOctaves}>
                  {octavesOptions}
                </select>
              </div>
              octave{this.state.octaves == 1 ? '' : 's'}
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

class Piano extends React.Component {

  constructor(props) {
    super();
  }

  transposeString(cString, targetKey) {
    var notes = cString.split(',');

    var difference = (notes[0].charCodeAt(0) - targetKey.charCodeAt(0));
    for (var i = 0; i < notes.length; i++) {
      notes[i] = String.fromCharCode((notes[i].charCodeAt(0) - difference))
      if (notes[i].charCodeAt(0) > 'G'.charCodeAt(0))
        notes[i] = String.fromCharCode((notes[i].charCodeAt(0) - 7))
    }
    return notes.join(',');
  }

  numberOctaves(plainString) {
    var startingOctave = 4;
    var notes = plainString.split(',');

    for (var i = 0; i < notes.length; i++) {
      if (notes[i] == 'C') startingOctave++;
      notes[i] += startingOctave;
    }
    return notes.join(',');
  }

  addTiming(plainString) {
    var notes = plainString.split(',');

    notes[0] += '/8';

    return notes.join(',');
  }

  splitInTwo(longString) {
    var notes = longString.split(',');
    return [notes.splice(0, notes.length/2).join(','), notes.splice(notes.length/2 -2).join(',')]
  }

  componentDidMount() {
    
    var vf = new Vex.Flow.Factory({
      renderer: {selector: 'notation', width: 520, height: 200}
    });

    var score = vf.EasyScore();
    var system = vf.System();

    var noteString = "C,D,E,F,G,A,B,C";

    noteString = this.addTiming(this.numberOctaves(this.transposeString(noteString, this.props.startingKey.ucFirst())));    
    noteString = this.splitInTwo(noteString);
console.log(noteString)
    system.addStave({
      voices: [score.voice(score.beam(score.notes(noteString[0], {stem: 'up'})).concat(score.beam(score.notes(noteString[1], {stem: 'down'}))))]
    }).addClef('treble').addKeySignature(this.props.startingKey.ucFirst());

    vf.draw();
  }
 
  render() {

    // 24 empty strings
    var key = Array(24).join(".").split(".");

    var noteValues = [
      'c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b',
      'c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b',
    ];

    // Wrap the sequence around depending on the mode we are on
    var head = this.props.sequence.slice(0, this.props.mode);
    var tail = this.props.sequence.slice(this.props.mode);
    var sequence = tail.concat(head);

    var i = 0;
    for (var noteValue of noteValues) {
      // Count until we find the right key
      if (noteValue == this.props.startingKey) {
        // Then add notes as appropriate depending on the mode
        // So that we find the right starting note
        i += head.reduce((a, b) => a + b, 0);
        // Wrap so we always start at the first half of the keyboard
        i %= 12;
        break;
      }
      i++;
    }
   
    // Press the correct notes
    key[i] = "pressed";
    for (var value of sequence) {
      i += value;
      key[i] = "pressed";
    }

    return <div className="piano">
      <div className="keys">
        <span className={"c " + key[0]}></span>
        <span className={"d " + key[2]}>
          <span className={"db " + key[1]}></span>
        </span>
        <span className={"e " + key[4]}>
          <span className={"eb " + key[3]}></span>
        </span>
        <span className={"f " + key[5]}></span>
        <span className={"g " + key[7]}>
          <span className={"gb " + key[6]}></span>
        </span>
        <span className={"a " + key[9]}>
          <span className={"ab " + key[8]}></span>
        </span>
        <span className={"b " + key[11]}>
          <span className={"bb " + key[10]}></span>
        </span>
        <span className={"c " + key[12]}></span>
        <span className={"d " + key[14]}>
          <span className={"db " + key[13]}></span>
        </span>
        <span className={"e " + key[16]}>
          <span className={"eb " + key[15]}></span>
        </span>
        <span className={"f " + key[17]}></span>
        <span className={"g " + key[19]}>
          <span className={"gb " + key[18]}></span>
        </span>
        <span className={"a " + key[21]}>
          <span className={"ab " + key[20]}></span>
        </span>
        <span className={"b " + key[23]}>
          <span className={"bb " + key[22]}></span>
        </span>
      </div>
    </div>
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
    return <div className="modal-bg" onClick={() => this.props.closeModal()} >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={() => this.props.closeModal()}></span>
        <div className="message">
          Would you like to slow down or retry?
        </div>
        <button className="fail" onClick={() => this.props.fail()}>Slow down</button>
        <button className="retry" onClick={() => this.props.retry()}>Retry</button>
      </div>
    </div>
  }
}

class CompleteModal extends React.Component {
  render() {
    return <div className="modal-bg" onClick={() => this.props.closeModal()}>
      <div className="modal complete"  onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={() => this.props.closeModal()}></span>
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





