/**
 * pedal-connector.js (Web Serial / USB 유선 버전)
 *
 * 기존 웹페이지에 <script src="pedal-connector.js"></script> 한 줄만 추가하면
 * 화면 오른쪽 아래에 작은 "발페달 연결" 버튼이 나타납니다.
 *
 * 마이크로비트를 USB 케이블로 컴퓨터에 연결한 뒤 이 버튼을 누르면,
 * 발판을 밟을 때(PRESS)/뗄 때(RELEASE) 이 페이지에 스페이스바
 * keydown/keyup 이벤트를 그대로 발생시켜서, 기존에 Space로 반응하던
 * 로직이 그대로 작동합니다.
 *
 * 마이크로비트 쪽 코드 (블루투스 불필요, USB 시리얼만 사용):
 *   input.onPinPressed(TouchPin.P0, function () {
 *       serial.writeLine("PRESS")
 *   })
 *   input.onPinReleased(TouchPin.P0, function () {
 *       serial.writeLine("RELEASE")
 *   })
 *
 * 제약: Web Serial은 크롬/엣지 등 크로미움 계열 브라우저에서만 동작하며,
 * HTTPS(GitHub Pages 포함)에서 열어야 합니다. 사파리/파이어폭스는 지원하지 않습니다.
 * MakeCode 편집기 탭에서 콘솔/WebUSB로 이미 이 마이크로비트에 연결되어 있으면
 * 포트가 사용 중이라 열리지 않을 수 있으니, 그 탭은 닫아주세요.
 */
(function(){
  const BAUD_RATE = 115200; // micro:bit 기본 시리얼 통신 속도

  const btn = document.createElement('button');
  btn.textContent = '🔌 발페달 연결(USB)';
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

  async function readLoop(port){
    const textDecoder = new TextDecoderStream();
    const readableClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    let buffer = '';

    try{
      while (true){
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        buffer += value;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0){
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line === 'PRESS'){
            sendSpaceKey('keydown');
          } else if (line === 'RELEASE'){
            sendSpaceKey('keyup');
          }
        }
      }
    }catch(err){
      console.warn('발페달 읽기 중 오류:', err.message);
    }finally{
      reader.releaseLock();
    }
  }

  async function connect(){
    if (!('serial' in navigator)){
      alert('이 브라우저는 Web Serial을 지원하지 않아요. 크롬 또는 엣지로 열어주세요.');
      return;
    }
    try{
      btn.textContent = '연결 중...';
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: BAUD_RATE });

      btn.textContent = '✅ 발페달 연결됨 (USB)';
      readLoop(port);

      navigator.serial.addEventListener('disconnect', () => {
        btn.textContent = '🔌 발페달 연결 (끊김, 재연결)';
      });
    }catch(err){
      btn.textContent = '🔌 발페달 연결 (USB)';
      console.warn('발페달 연결 실패:', err.message);
    }
  }

  btn.addEventListener('click', connect);
})();
