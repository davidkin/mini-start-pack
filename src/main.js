let state = [true, null, null, null];
let ws = null;
let currentStateId = null;
let checkCounter = 0;
let notWork = false;
let neededArr = [];

(function addHandlers() {
  const connectBtn = document.getElementsByClassName('button_connect')[0];
  const disconnectBtn = document.getElementsByClassName('button_disconnect_disable')[0];
  connectBtn.onclick = () => {
    ws = new WebSocket('ws://178.20.156.145:3000');
    ws.onmessage = ({ data }) => {
      const parseData = JSON.parse(data);
      console.log(parseData);
      console.log(state);
      if (parseData.newState === 'poweredOn') {
        showText(`Запрос на отлючение был не удачным. Осталась 1 попытка!`);
      } else if (parseData.newState === 'poweredOff') {
        console.log(parseData);
        showText(`token: ${parseData.token}`);
        ws.close();
      } else if (typeof parseData.pulled === 'number') {
        handleSwitch(parseData);
    
        if (checkCounter < 3) {
          sendCheck(checkCounter, currentStateId);
          checkCounter += 1;
        }
      } else if (parseData.action === 'check') {
        handleCheck(parseData);
      }
    };
    
    ws.onopen = () => {
      console.log('opened');
      checkCounter = 0;
      state = [true, null, null, null];
      notWork = false;
      neededArr = [];

      setDefaultImage();
      showText('')
      const indicator = document.getElementsByClassName('indicator')[0];
      indicator.classList.remove('indicator_red');
      indicator.classList.add('indicator_green');

      connectBtn.disabled = true;
      connectBtn.classList.remove('button_connect');
      connectBtn.classList.add('button_connect_disable');

      disconnectBtn.disabled = false;
      disconnectBtn.classList.remove('button_disconnect_disable');
      disconnectBtn.classList.add('button_disconnect');
    };
    
    ws.onclose = function() {
      console.log('closed');
      const indicator = document.getElementsByClassName('indicator')[0];
      indicator.classList.remove('indicator_green');
      indicator.classList.add('indicator_red');

      connectBtn.disabled = false;
      connectBtn.classList.add('button_connect');
      connectBtn.classList.remove('button_connect_disable');

      disconnectBtn.disabled = true;
      disconnectBtn.classList.add('button_disconnect_disable');
      disconnectBtn.classList.remove('button_disconnect');
    };
    
    ws.onerror = function(error) {
      console.log(error);
    };
  }
  
  disconnectBtn.onclick = () => {
    ws.close();
  }
})();

function toggleSwitchImage(pulled) {
  const id = pulled + 1;
  const switch_element = document.getElementsByClassName('sw_' + id)[0];

  if(switch_element.classList.contains('switch_on')) {
    switch_element.classList.remove('switch_on');
    switch_element.classList.add('switch_off');
  } else {
    switch_element.classList.remove('switch_off');
    switch_element.classList.add('switch_on');
  }
}

function setSwitchImage(id, value) {
  const switch_element = document.getElementsByClassName('sw_' + (id + 1))[0];
  const questionMark = switch_element.firstElementChild;
  questionMark.classList.add('fa_off');

  switch_element.classList.remove('unknown_switch');
  if (value) {
    switch_element.classList.add('switch_on');
  } else {
    switch_element.classList.add('switch_off');
  }
  
  
}

function setDefaultImage() {
  const switch_element0 = document.getElementsByClassName('sw_1')[0];
  const switch_element1 = document.getElementsByClassName('sw_2')[0];
  const switch_element2 = document.getElementsByClassName('sw_3')[0];
  const switch_element3 = document.getElementsByClassName('sw_4')[0];

  const questionMark1 = switch_element1.firstElementChild;
  questionMark1.classList.remove('fa_off');
  const questionMark2 = switch_element2.firstElementChild;
  questionMark2.classList.remove('fa_off');
  const questionMark3 = switch_element3.firstElementChild;
  questionMark3.classList.remove('fa_off');

  switch_element0.classList.value = 'switch sw_1 switch_on';
  switch_element1.classList.value = 'switch sw_2 unknown_switch';
  switch_element2.classList.value = 'switch sw_3 unknown_switch';
  switch_element3.classList.value = 'switch sw_4 unknown_switch';
}

function showText(text) {
  const textArea = document.getElementsByClassName('messages')[0];
  textArea.innerText = text;
}

function handleSwitch(data) {
  const { pulled, stateId } = data;

  if (typeof state[pulled] === 'boolean') {
    state[pulled] = !state[pulled];
    toggleSwitchImage(pulled);
  }
  currentStateId = stateId;

  // Этот кусок кода нужно переписать :) - он отвечает за отправку запросов на выключение
  if (notWork) { // для отправки заревершеной версии
    if (state.every((el, id) => el === neededArr[id])) {
      const powerOff = {
        action: 'powerOff',
        stateId
      };
      ws.send(JSON.stringify(powerOff));
    }
  } else if (state.every(el => el === true)
          || state.every(el => el === false)) {// пробуем первый раз выключить
    const powerOff = {
      action: 'powerOff',
      stateId
    };
    ws.send(JSON.stringify(powerOff));
    notWork = !notWork;
    neededArr = state.map(el => !el); // запоминаем нужный стейт
  }
}

function handleCheck(data) {
  const { action, lever1, lever2, stateId, same } = data;
  const setValue = same ? state[lever1] : !state[lever1];
  state[lever2] = setValue;
  setSwitchImage(lever2, setValue)

}

function sendCheck(checkCounter, currentStateId) {
  const sameCheck = {
    action: 'check',
    'lever1': checkCounter,
    'lever2': checkCounter + 1,
    stateId: currentStateId
  };
  ws.send(JSON.stringify(sameCheck));
}