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
    this.key = userlog.scale[0].key;
    this.displayName = userlog.scale[0].displayName;

    switch (userlog.scale[0].type) {
      case "major-scale":
        this.sequence = [2, 2, 1, 2, 2, 2, 1];
        break;
      case "minor-scale":
        this.sequence = [2, 1, 2, 2, 1, 3, 1];
        break;
    }

    console.log(this.sequence);

    this.hands = "both"; 
    this.beatsInBar = 4;
    this.reps = 6;
    
    this.state = {
      count: 0,
      counting: false,
      bpm: userlog.bpm + 10,
      octaves: userlog.octaves,
      displayRetryDialogue: false,
      notesPerBeat: userlog.notesPerBeat,
      actualBpm: this.calculateActualBpm(userlog.bpm + 1000, userlog.notesPerBeat),
      completed: false
    }
    
    this.startMetronome = this.startMetronome.bind(this);
    this.stopMetronome = this.stopMetronome.bind(this);
    this.userStopMetronome = this.userStopMetronome.bind(this);
    this.slowMetronome = this.slowMetronome.bind(this);
    this.changeOctaves = this.changeOctaves.bind(this);
    this.changeNotesPerBeat = this.changeNotesPerBeat.bind(this);
    this.calculateActualBpm = this.calculateActualBpm.bind(this);
  }
  
  startMetronome() {
    if (this.flag) {
      return;
    }
    this.flag = true;
    setTimeout(() => {this.flag = false;}, 200);

    var degreesOfScale = 7;
    var totalNotesInScale = degreesOfScale * this.state.octaves * 2 + 1;
    this.beatsInScale = Math.ceil((totalNotesInScale / this.state.notesPerBeat)/4) * 4;
    
    var bpm = this.state.actualBpm;
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
      actualBpm: this.calculateActualBpm(this.state.bpm - 2),
    }, () => {
      console.log(this.state);
      this.startMetronome();
    });
  }

  saveWorkout() {
    var userlog = {
      scale: this.scaleName,
      notesPerBeat: this.state.notesPerBeat,
      octaves: this.state.octaves,
      bpm: parseInt(this.state.bpm)
    };

    console.log(this.scaleName);

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

  calculateActualBpm(bpm, notesPerBeat) {
    var npb = typeof notesPerBeat === "undefined" ? this.state.notesPerBeat : notesPerBeat; 
    return bpm / (npb/ 4);
  }

  changeNotesPerBeat(event) {
    this.setState({
      notesPerBeat: event.target.value,
    }, () => {
      this.setState({actualBpm: this.calculateActualBpm(this.state.bpm)});
    });
  }

  changeOctaves(event) {
    this.setState({
      octaves: event.target.value,
    });
  }

  incrementBpm(inc) {
    this.setState({
      bpm: this.state.bpm + inc,
      actualBpm: this.calculateActualBpm(this.state.bpm + inc)
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
    for (var i=1; i <= 6; i++) {
      progresses.push(
        <Progress key={i} number={i} complete={this.state.count > i * this.beatsInScale || this.state.completed}/>
      );
    }

    var notesOptions = [];
    for (var notes = 1; notes <= 4; notes++) {
      notesOptions.push(
        <option key={notes} value={notes}>{toEnglish(notes).ucFirst()}</option>
      );
    }

    var octavesOptions = [];
    for (var octaves = 2; octaves <= 4; octaves++) {
      octavesOptions.push(
        <option key={octaves} value={octaves}>{toEnglish(octaves).ucFirst()}</option>
      );
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
          <h2><b>{this.displayName}</b></h2> 
          <div className="image-holder">
            <Piano startingKey={this.key} sequence={this.sequence} />
          </div>
          <hr />
          <h3>Play this scale:</h3> 
          <ul className="rounded-list">
            <li>
              <b>{toEnglish(this.reps).ucFirst()} </b>
              time{this.reps == 1 ? '' : 's'} 
            </li>
            <li>
              <div className="select-style" >
                <select value={this.state.notesPerBeat} onChange={this.changeNotesPerBeat}>
                  {notesOptions}
                </select>
                <span></span>
              </div>
              note{this.state.notesPerBeat == 1 ? '' : 's'} per beat
            </li>
            <li>
              <div className="select-style" >
                <select value={this.state.octaves} onChange={this.changeOctaves}>
                  {octavesOptions}
                </select>
                <span></span>
              </div>
              octave{this.state.octaves == 1 ? '' : 's'}
            </li>
            <li>
              Actual BPM:
              <b> {Number(this.state.actualBpm.toFixed(2))} </b>
            </li>
            <li>
              BPM at 4 notes per beat:
              <input type="button" value="-" className="plus-minus"  onClick={() => this.incrementBpm(-1)}/>
              <b> {this.state.bpm}</b>
              <input type="button" value="+" className="plus-minus"  onClick={() => this.incrementBpm(1)}/>
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
  
  render() {

    // 24 empty strings
    var key = Array(24).join(".").split(".");

    var noteValues = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];

    var i = 0;
    for (var noteValue of noteValues) {
      if (noteValue == this.props.startingKey) {
        key[i] = "pressed";
        for (var value of this.props.sequence) {
          i += value;
          key[i] = "pressed";
        }
        break;
      }
      i++;
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





