var EngSTATE = {
  Initial:  {value: 0, text: 'Initial'},
  Reading:  {value: 1, text: 'Reading'},
  Paused:   {value: 2, text: 'Paused'},
  Finished:   {value: 3, text: 'Finished'},
  Intermed:   {value: 4, text: 'Intermed'}
};

var Engine = {
  start:    function() { return EngStart(); },
  pause:    function() { return EngPause(); },
  resume:   function() { return EngResume(); },
  reset:    function() { return EngReset(); },
  rewind:   function(words) { return EngRewind(words); },
  getNextChunk: function() { return EngGetNextChunk(1); },
  setCallback:  function(callback) { return EngSetCallback(callback); },
  setText:  function(text) { return EngSetText(text); },
  setChunk:   function(size) { return EngSetChunkSize(size); },
  setChunkLen:  function(size) { return EngSetChunkLen(size); },
  setWPM:   function(wpm) { return EngSetWPM(wpm); }
};

var _State = EngSTATE.Initial;
var _WPM;
var _CPM;
var _Text = null;
var _WordsArray = null;
var _WordCount;
var _TotalTime;
var _TimePerChar;
var _ChunkSize;
var _ChunkLen;
var _Cb;
var _Pos = 0;
var _Timer;
var _Offset = 0.0;
var _paraBreak = String.fromCharCode(6);

function EngStart() {
  if (!_Timer) {
    _Timer = $.timer(function() {
      _EngOnTimer();
    });
  }

  _Pos = 0;
  _EngSetupParams();
  _State = EngSTATE.Reading;

  _EngOnTimer();
}

function EngPause() {
  if (_State != EngSTATE.Reading)
    return;

  _State = EngSTATE.Paused;
  _Timer.stop();
}

function EngResume() {
  _State = EngSTATE.Reading;
  _EngOnTimer();
}

function EngReset() {
  if (!_Timer) {
    return;
  }
  _Timer.stop();
  _Pos = 0;
}

function EngRewind(words) {
  _Pos -= words;
  if (_Pos < 0)  _Pos = 0;

  if (_State == EngSTATE.Reading) {
    _Cb(_State, EngGetNextChunk(0));
  } else {
    _Cb(EngSTATE.Intermed, EngGetNextChunk(1));
  }
}

function EngSetText(text) {
  _Text = text.replace(/^\s*\n/gm, _paraBreak);
  _WordsArray = _Text.split(/\s|\n/);
  _WordCount = _WordsArray.length;
  _Pos = 0;
  return _WordCount;
}

function _EngSetupParams() {
  if (_Text === null) return;

  var effectiveChars = _Text.length - _WordCount - _Pos;
  _TotalTime = (effectiveChars / _CPM) * 60 * 1000;
  _TimePerChar = _TotalTime / effectiveChars;
}

function _EngOnTimer() {
  if (_State == EngSTATE.Paused) {
    _Cb(_State, "");
    return;
  }

  var offset = 0.0;
  var txt = EngGetNextChunk(0);

  if (txt === "") {
    _State = EngSTATE.Finished;
    _Cb(_State, "");
    _Pos = 0;
    return;
  }

  _Cb(EngSTATE.Reading, txt);
  var time4chunk = txt.length * _TimePerChar;
  _Timer.once(time4chunk + _Offset);
}

function EngGetNextChunk(mode) {
  var txt = "";
  var oldPos = _Pos;
  _Offset = 0.0;

  for (var i = 0; i < _ChunkSize; i++) {
    if (_Pos > _WordCount - 1) break;

    if (_ChunkLen > 0 && (txt + _WordsArray[_Pos]).length > _ChunkLen && i > 0) break;

    txt += _WordsArray[_Pos++];

    var x = txt.substr(-1);
    if (x == _paraBreak) {
      txt = txt.replace(_paraBreak, '');
      _Offset = 25 * _TimePerChar;
      break;
    }
    else if (/[\.;!\?,???]/.test(x)) {
      _Offset = 15 * _TimePerChar;
      break;
    }
    txt += " ";
  }

  if (mode == 1) {
    _Pos = oldPos;
  }

  return txt;
}

function EngSetWPM(wpm) {
  _WPM = wpm;
  _CPM = _WPM * 5;
  _EngSetupParams();
}

function EngSetChunkSize(size) {
  _ChunkSize = size;
}

function EngSetChunkLen(len) {
  _ChunkLen = len;
}

function EngSetCallback(callback) {
  _Cb = callback;
}
