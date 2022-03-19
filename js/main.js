var STATE = {
  Empty:    {value: 0, text: 'Empty'},
  Loaded:   {value: 1, text: 'Loaded'},
  Reading:  {value: 2, text: 'Reading'},
  Paused:   {value: 3, text: 'Paused'},
  NewModal: {value: 4, text: 'NewModal'},
  Options:  {value: 5, text: 'Options'}
};

var canStore = 0; var storageEnabled = 1; var darkMode = 0; var hideMode = 1;
var chunk = 3;
var txt;
var wpmdelta = 50;
var wpm = 300;
var skipbackWords = 10;
var chunkLen = 20;
var defaultText;
var skipEnabled = 1;
var filesSupported = ['txt'];

var ePrevState = STATE.Empty;
var eState = STATE.Empty;

$(document).ready(function(){
  checkLocalStorageSupport();
  loadState();

  InitEngine();
  setupAttributes();
  onNewText();
});

function onKeyPress(event) {
  var k = (event.keyCode ? event.keyCode : event.which);

  if (eState == STATE.NewModal || eState == STATE.Options) return;

  if (k == 78 || k == 110) {
    Engine.pause();
    $('#txtaInput').focus();
    changeState(STATE.NewModal);
    $('#modalInput').modal('show');
  }
  else if (k == 79 || k == 111) {
    Engine.pause();
    $('#optionsWPM').focus();
    changeState(STATE.Options);
    $('#modalOptions').modal('show');
  }
  else if (k == 82 || k == 114) {
    Engine.reset();
    $('#divCanvas').text(Engine.getNextChunk());
  }
  else if (k == 32) {
    if (eState == STATE.Loaded) {
      changeState(STATE.Reading);
      Engine.start();
    }
    else if (eState == STATE.Reading) {
      Engine.pause();
    }
    else if (eState == STATE.Paused) {
      changeState(STATE.Reading);
      Engine.resume();
    }
  }
  else if (k == 71 || k == 103) {
    changeChunkSize(-1);
  }
  else if (k == 72 || k == 104) {
    changeChunkSize(1);
  }
  else if (k == 70 || k == 102) {
    changeWPM(-wpmdelta);
  }
  else if (k == 74 || k == 106) {
    changeWPM(wpmdelta);
  }
  else if (k == 65 || k == 97) {
    if (skipEnabled) {
      Engine.rewind(skipbackWords);
    }
  }
}

function onKeyDown(e) {
  var k = (e.keyCode ? e.keyCode : e.which);

  if (eState == STATE.NewModal) {
    if (e.ctrlKey && k == 13) {       $('#modalInput').modal('hide');
      onNewText();
    }
  }
  else if (eState == STATE.Options) {
    if (e.ctrlKey && k == 13) {       $('#modalOptions').modal('hide');
      onChangeOptions();
    }
    else if (k == 68 || k == 100) {       resetOptionsToDefaults();
    }
  }
  else if (eState == STATE.Reading) {
    if (k == 27) {       Engine.pause();
    }
  }
}

function EngineCallback(state, text) {
  if (state == EngSTATE.Finished) {
    changeState(STATE.Loaded);
    return;
  }
  else if (state == EngSTATE.Paused) {
    changeState(STATE.Paused);
    return;
  }

  $('#divCanvas').text(text);
}

function InitEngine() {
  changeWPM(0);
  changeChunkSize(0);
  Engine.setCallback(EngineCallback);
}

function onNewText() {
  txt = $.trim($('#txtaInput').val());
  var res = Engine.setText(txt);

  if (res > 0) {
    changeState(STATE.Loaded);
  } else {
    changeState(STATE.Empty);
  }

  if (canStore && storageEnabled) {
    localStorage.txt = txt;
  }
  $('#divCanvas').text(Engine.getNextChunk());
}

function onChangeOptions() {
    wpm = parseInt($('#optionsWPM').val(), 10) || wpm;
  changeWPM(0);
  wpmdelta = parseInt($('#optionsDelta').val(), 10) || wpmdelta;
  chunk = parseInt($('#optionsChunkSize').val(), 10) || chunk;
  chunkLen = parseInt($('#optionsChunkLen').val(), 10) || 0;
  hideMode = $('#option-hidenoise').hasClass('active') ? 1 : 0;

  if ($('#option-localstorage').hasClass('active')) {
    setStorageOpts(1);
  } else {
    setStorageOpts(0);
  }

  if ($('#option-darkmode').hasClass('active')) {
    setDarkMode(1);
  } else {
    setDarkMode(0);
  }

  skipEnabled = $('#option-enableskipback').hasClass('active') ? 1 : 0;
  skipbackWords = parseInt($('#optionsSkipBackWords').val(), 10) || skipbackWords;
  changeChunkSize(0);
  saveState();
}

function changeWPM(delta) {
  if (wpm + delta < 0) return;

  wpm += delta;
  Engine.setWPM(wpm);
  saveState();
  $('#divWPM').text(wpm);
}

function changeChunkSize(delta) {
  if (chunk + delta < 0) return;

  chunk += delta;
  Engine.setChunk(chunk);
  Engine.setChunkLen(chunkLen);
  saveState();
  $('#divChunk').text(chunk);
}

function setupAttributes() {
  $(document).keypress(function(e){
    onKeyPress(e);
  }).keydown(function(e){
    onKeyDown(e);
  });

  var legend = "[N]: Текст_____[SPACE]: Начать/Пауза_____[R]: Перезапустить_____[J]/[F]: +/- СВМ_____[H]/[G]: +/- Размер_____[O]: Настройки";
  $('#divLegend').html(formatLegend(legend));

  defaultText = "В палатке было сухо, тепло и уютно. Несмотря на это, Василиса не могла заснуть — ее мучила мысль о часолисте. Застегнув спальник до самого подбородка, Диана дышала ровно и глубоко, да и две другие соседки тоже заснули. Устав бороться с бессонницей, Василиса осторожно открыла полог и бесшумно выскользнула наружу. В десяти метрах догорал костер — возле него, ежась от холода, дежурные клевали носом. Василиса вызвала стрелу и, настороженно озираясь по сторонам, углубилась в ночной лес. Выбрав небольшую полянку, слабо освещаемую лунным светом, она обрисовала алый, пылающий круг и вызвала часолист. Ее сердце билось гулко, часто и тревожно, словно стремилось разорвать грудную клетку на части — кто знает, действительно ли отцовский подарок преспокойно лежит в безвременье. К большому облегчению Василисы, из круга медленно выплыла красная книга с черно-золотым циферблатом.";

  if (canStore && storageEnabled && localStorage.getItem("txt") !== null) {
    $('#txtaInput').val(localStorage.txt);
  }
  else {
    $('#txtaInput').val(defaultText);
  }

  var mod = $('#modalInput');
  var mdlFileUpload = $('#mdlFileUpload');

  mod.on('shown', function() {
    $('#txtaInput').val(txt).select().focus();
        mdlFileUpload.on('change', function() { changeTextWithFile(this) });
  }).on('hidden', function() {
    if (eState == STATE.NewModal) changeState(ePrevState);
    mdlFileUpload.val('');   });

  $('#modalInputLegend').html(formatLegend("[Ctrl]+[ENTER]: Использовать этот текст_____[ESC]: Отмена"));

  $('#txtaInput').on('input select focus', function(){
    var wc = ($('#txtaInput').val().split(/\s+/).length -1);
    $('#modalInputWC').text('Это примерно ' + parseInt(wc, 10) + ' слов');
  });

  $('#modalOptions').on('shown', function() {
    $('#optionsWPM').val(wpm).select().focus();
    $('#optionsDelta').val(wpmdelta);
    $('#optionsChunkSize').val(chunk);
    $('#optionsChunkLen').val(chunkLen);

    if (hideMode == 1) {
      $('#option-hidenoise').addClass('active');
    }

    if (storageEnabled == 1) {
      $('#option-localstorage').addClass('active');
    }

    if (darkMode == 1) {
      $('#option-darkmode').addClass('active');
    }

    if (skipEnabled == 1) {
      $('#option-enableskipback').addClass('active');
    }

    $('#optionsSkipBackWords').val(skipbackWords);
  }).on('hidden', function() {
    if (eState == STATE.Options) changeState(ePrevState);
  });

  $('#modalOptions input').keypress(function(e) {
    validateNumber(e);
  });

  $('#modalOptionsLegend').html(formatLegend("[Ctrl]+[ENTER]: Сохранить_____[D]: Сбросить_____[ESC]: Отмена"));

  if (darkMode == 1) {
    setDarkMode(1);
  }
}

function changeTextWithFile (filePath) {
  var reader = (function() {
    if (window.File && window.FileReader && window.Blob) {
      return new FileReader();
    } else {       return false;
    }
  }());

  var output = "";
  if(filePath.files && filePath.files[0]) {
      reader.onload = function (e) {
          output = e.target.result;
          $.trim($('#txtaInput').val(output).focus());
      };

      var ext = filePath.files[0].name.split('.').pop();
      if ($.inArray(ext, filesSupported)) {
        alert('Unsupported file');
        $('#mdlFileUpload').val('');
        return;
      }
      reader.readAsText(filePath.files[0]);
  } else if(ActiveXObject && filePath) {       try {
          reader = new ActiveXObject("Scripting.FileSystemObject");
          var file = reader.OpenTextFile(filePath, 1);           output = file.ReadAll();           file.Close();           $.trim($('#txtaInput').val(output).focus());
      } catch (e) {
          if (e.number == -2146827859) {
              alert('Невозможно получить доступ к локальным файлам из-за настроек безопасности браузера. ' +
               'Чтобы преодолеть это, перейдите в раздел "Инструменты" -> "Свойства обозревателя" -> "Безопасность" -> "Пользовательский уровень". ' +
               'Найдите параметр "Инициализировать и создавать сценарии элементов управления ActiveX, не помеченных как безопасные", и измените его на "Включить" или "Подсказать".');
          }
      }
  }
}

function changeState(state) {
  ePrevState = eState;
  eState = state;

  takeStateBasedActions();
}

function formatLegend(str) {
  return str.replace(/\[/g, '<strong class="label">').replace(/\]/g, '</strong>')
    .replace(/_/g, '&nbsp;');
}

function validateNumber(ev) {
  var theEvent = ev || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  var regex = /[0-9]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function checkLocalStorageSupport() {
  try {
    canStore = 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    canStore = 0;
  }
}

function saveState() {
  if (!canStore || !storageEnabled) return;

  localStorage.spdWPM = wpm;
  localStorage.spdDelta = wpmdelta;
  localStorage.spdChunk = chunk;
  localStorage.spdChunkLen = chunkLen;
  localStorage.hideMode = hideMode;
  localStorage.skipEnabled = skipEnabled;
  localStorage.skipbackWords = skipbackWords;
  localStorage.darkMode = darkMode;
}

function loadState() {
  if (!canStore) return;

  if (localStorage.getItem("spdWPM") !== null) {
    storageEnabled = parseInt(localStorage.storage, 10);
  }

  if (!storageEnabled) return;

  if (localStorage.getItem("spdWPM") !== null) {
    wpm = parseInt(localStorage.spdWPM, 10);
  }

  if (localStorage.getItem("spdDelta") !== null) {
    wpmdelta = parseInt(localStorage.spdDelta, 10);
  }

  if (localStorage.getItem("spdChunk") !== null) {
    chunk = parseInt(localStorage.spdChunk, 10);
  }

  if (localStorage.getItem("spdChunkLen") !== null) {
    chunkLen = parseInt(localStorage.spdChunkLen, 10);
  }

  if (localStorage.getItem("hideMode") !== null) {
    hideMode = parseInt(localStorage.hideMode, 10);
  }

  if (localStorage.getItem("skipbackWords") !== null) {
    skipbackWords = parseInt(localStorage.skipbackWords, 10);
  }

  if (localStorage.getItem("skipEnabled") !== null) {
    skipEnabled = parseInt(localStorage.skipEnabled, 10);
  }

  if (localStorage.getItem("darkMode") !== null) {
    darkMode = parseInt(localStorage.darkMode, 10);
  }

  changeWPM(0);
  changeChunkSize(0);
}

function setStorageOpts(val) {
  if (!canStore) return;

  storageEnabled = val;
  localStorage.storage = val;
}

function setDarkMode(darkModeVal) {
  if (darkModeVal == 1) {
    $('body').addClass('dark');
  } else {
    $('body').removeClass('dark');
  }

  darkMode = darkModeVal;
}

function resetOptionsToDefaults() {
  $('#optionsWPM').val(300).select().focus();
  $('#optionsDelta').val(50);
  $('#optionsChunkSize').val(3);
  $('#optionsChunkLen').val(20);
  $('#optionsSkipBackWords').val(10);
  }

function hideNoise() {
  $('a, .rowInfo, .rowLegend').fadeOut();
}

function showNoise() {
  $('a, .rowInfo, .rowLegend').fadeIn();
}

function takeStateBasedActions() {
  if (hideMode == 1) {
    if (eState == STATE.Reading) {
      hideNoise();
    }
    else {
      showNoise();
    }
  }
}
