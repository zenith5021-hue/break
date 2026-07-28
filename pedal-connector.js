/**
 * pedal-connector.js
 *
 * 기존 웹페이지에 <script src="pedal-connector.js"></script> 한 줄만 추가하면
 * 화면 오른쪽 아래에 작은 "마이크로비트 연결" 버튼이 나타납니다.
 * 발판(마이크로비트)을 밟으면 이 페이지에 스페이스바 keydown/keyup 이벤트를
 * 그대로 발생시켜서, 기존에 Space로 반응하던 로직이 그대로 작동합니다.
 *
 * 전제: micro:bit MakeCode에서
 *  - Project Settings > No Pairing Required 켜짐
 *  - bluetooth.startUartService() 로 시작
 *  - 핀 눌림/떼짐 시 "PRESS" / "RELEASE" 문자열을 uartWriteString 으로 전송
 *
 * 제약: Web Bluetooth는 크롬/엣지 등 크로미움 계열 브라우저에서만 동작하며,
 * HTTPS(GitHub Pages 포함)에서 열어야 합니다. 사파리는 지원하지 않습니다.
 */
(function(){
  const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const UART_TX_CHAR  = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  // 오른쪽 아래 떠 있는 연결 버튼 생성 (기존 페이지 레이아웃을 건드리지 않음)
  const btn = document.createElement('button');
  btn.textContent = '🔵 발페달 연결';
  Object.assign(btn.style, {
    position: 'fixed', right: '16px', bottom: '16px', zIndex: 999999,
    padding: '10px 14px', borderRadius: '10px', border: '1px solid #3a4f68',
    background: '#17263B', color: '#EAF0F6', fontSize: '13px',
    fontFamily: 'sans-serif', cursor: 'pointer', opacity: 0.9,
  });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
  if (document.body) document.body.appendChild(btn);

  function sendSpaceKey(type){
    const evt = new KeyboardEvent(type, {
      code: 'Space', key: ' ', keyCode: 32, which: 32, bubbles: true,
    });
    window.dispatchEvent(evt);
    document.dispatchEvent(evt);
  }

  async function connect(){
    if (!navigator.bluetooth){
      alert('이 브라우저는 Web Bluetooth를 지원하지 않아요. 크롬 또는 엣지로 열어주세요.');
      return;
    }
    try{
      btn.textContent = '연결 중...';
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BBC micro:bit' }],
        optionalServices: [UART_SERVICE],
      });
      device.addEventListener('gattserverdisconnected', () => {
        btn.textContent = '🔵 발페달 연결 (끊김, 재연결)';
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(UART_SERVICE);
      const txChar = await service.getCharacteristic(UART_TX_CHAR);
      await txChar.startNotifications();

      txChar.addEventListener('characteristicvaluechanged', (event) => {
        const text = new TextDecoder().decode(event.target.value).trim();
        if (text === 'PRESS') sendSpaceKey('keydown');
        else if (text === 'RELEASE') sendSpaceKey('keyup');
      });

      btn.textContent = '✅ 발페달 연결됨';
    }catch(err){
      btn.textContent = '🔵 발페달 연결';
      console.warn('발페달 연결 실패:', err.message);
    }
  }

  btn.addEventListener('click', connect);
})();
