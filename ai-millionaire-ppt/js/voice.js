/* AI Millionaire voice layer — offline Web Speech API */
(function(){
  'use strict';

  const synth = window.speechSynthesis;
  let enabled = true;
  let speaking = false;
  let runId = 0;
  let selectedVoice = null;

  const moneySpeech = {
    100000: 'một trăm nghìn đồng',
    200000: 'hai trăm nghìn đồng',
    500000: 'năm trăm nghìn đồng',
    1000000: 'một triệu đồng',
    5000000: 'năm triệu đồng',
    10000000: 'mười triệu đồng',
    20000000: 'hai mươi triệu đồng'
  };

  function pickVoice(){
    const voices = synth?.getVoices?.() || [];
    selectedVoice =
      voices.find(v => /^vi(-|_)?VN$/i.test(v.lang)) ||
      voices.find(v => /^vi/i.test(v.lang)) ||
      voices.find(v => /Vietnam|Vietnamese|Tiếng Việt/i.test(v.name)) ||
      null;
    return selectedVoice;
  }

  if (synth) {
    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);
  }

  function stop(){
    runId++;
    speaking = false;
    try { synth?.cancel(); } catch(e) {}
    document.documentElement.classList.remove('voice-speaking');
  }

  function speak(text, options = {}){
    if (!enabled || !synth || !text) return Promise.resolve();
    const myRun = runId;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = options.lang || 'vi-VN';
    u.rate = options.rate ?? 0.9;
    u.pitch = options.pitch ?? 1.0;
    u.volume = options.volume ?? 1.0;
    if (selectedVoice) u.voice = selectedVoice;

    return new Promise(resolve => {
      u.onstart = () => {
        if (myRun !== runId) return;
        speaking = true;
        document.documentElement.classList.add('voice-speaking');
      };
      u.onend = () => {
        if (myRun === runId) {
          speaking = false;
          document.documentElement.classList.remove('voice-speaking');
        }
        resolve();
      };
      u.onerror = () => {
        if (myRun === runId) {
          speaking = false;
          document.documentElement.classList.remove('voice-speaking');
        }
        resolve();
      };
      synth.speak(u);
    });
  }

  async function sequence(lines, options = {}){
    stop();
    const myRun = runId;
    for (const line of lines) {
      if (myRun !== runId || !enabled) return;
      await speak(line, options);
      if (myRun !== runId || !enabled) return;
      if (options.pause) await new Promise(r => setTimeout(r, options.pause));
    }
  }

  function prizeText(value){
    return moneySpeech[value] || `${Number(value).toLocaleString('vi-VN')} đồng`;
  }

  function cleanText(text){
    return text.replace(/\s+/g,' ').trim();
  }

  function getQuestionData(slide){
    if (!slide) return null;
    const numberMatch = cleanText(slide.querySelector('.question-index')?.textContent || '').match(/QUESTION\s+(\d+)/i);
    const prizeMatch = cleanText(slide.querySelector('.question-index')?.textContent || '').match(/·\s*([\d.]+)\s*₫/);
    const question = cleanText(slide.querySelector('.question-text')?.textContent || '');
    const answers = {};
    slide.querySelectorAll('.answer-btn').forEach(btn => {
      const letter = btn.dataset.answer;
      const text = cleanText(btn.textContent.replace(/^[A-D]\s*/,''));
      if (letter) answers[letter] = text;
    });
    return {
      number: numberMatch ? Number(numberMatch[1]) : null,
      value: prizeMatch ? Number(prizeMatch[1].replace(/\./g,'')) : null,
      question,
      answers
    };
  }

  function readQuestion(slide){
    const q = getQuestionData(slide);
    if (!q || !q.question) return;
    const lines = [
      q.number ? `Câu hỏi số ${q.number}.` : 'Câu hỏi tiếp theo.',
      q.value ? `Mức tiền thưởng: ${prizeText(q.value)}.` : '',
      'Câu hỏi của bạn là...',
      q.question,
      q.answers.A ? `Đáp án A: ${q.answers.A}.` : '',
      q.answers.B ? `Đáp án B: ${q.answers.B}.` : '',
      q.answers.C ? `Đáp án C: ${q.answers.C}.` : '',
      q.answers.D ? `Đáp án D: ${q.answers.D}.` : '',
      'Bạn hãy suy nghĩ thật kỹ và lựa chọn đáp án của mình.'
    ].filter(Boolean);

    sequence(lines, { rate: 0.9, pause: 320 });
  }

  function confirmChoice(letter){
    sequence([
      `Bạn đã chọn đáp án ${letter}.`,
      `${letter} là câu trả lời cuối cùng của tôi.`
    ], { rate: 0.88, pause: 420 });
  }

  function announceCorrect(letter, value, isFinal){
    const lines = isFinal ? [
      'Chính xác!',
      'Xin chúc mừng!',
      `Đáp án ${letter} là câu trả lời chính xác.`,
      `Bạn đã giành được ${prizeText(value)}.`,
      'Bạn đã trở thành triệu phú!'
    ] : [
      'Chính xác!',
      'Xin chúc mừng bạn!',
      `Đáp án ${letter} là câu trả lời chính xác.`,
      `Bạn đã giành được ${prizeText(value)}.`,
      'Hãy chuẩn bị cho câu hỏi tiếp theo.'
    ];
    sequence(lines, { rate: 0.88, pause: 430 });
  }

  function announceWrong(selected, correct, value){
    sequence([
      'Rất tiếc!',
      `Đáp án ${selected} chưa chính xác.`,
      `Đáp án đúng là ${correct}.`,
      `Bạn dừng cuộc chơi tại đây và bảo toàn mức thưởng ${prizeText(value)}.`
    ], { rate: 0.88, pause: 430 });
  }

  function setEnabled(value){
    enabled = !!value;
    document.documentElement.classList.toggle('voice-disabled', !enabled);
    if (!enabled) stop();
    updateControls();
  }

  function toggle(){
    setEnabled(!enabled);
  }

  function updateControls(){
    document.querySelectorAll('[data-voice-toggle]').forEach(btn => {
      btn.textContent = enabled ? '🔊 GIỌNG ĐỌC: BẬT' : '🔇 GIỌNG ĐỌC: TẮT';
      btn.setAttribute('aria-pressed', String(enabled));
    });
    document.querySelectorAll('[data-voice-replay]').forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  function injectControls(){
    document.querySelectorAll('.slide[data-qslide]').forEach(slide => {
      const panel = slide.querySelector('.question-panel');
      if (!panel || panel.querySelector('[data-voice-replay]')) return;
      const actions = document.createElement('div');
      actions.className = 'voice-actions';
      actions.innerHTML = `
        <button class="voice-replay" type="button" data-voice-replay>🔊 ĐỌC LẠI CÂU HỎI</button>
        <span class="voice-hint">Giọng đọc chạy trực tiếp bằng JavaScript · offline</span>
      `;
      panel.insertBefore(actions, panel.querySelector('.explain'));
    });

    if (!document.querySelector('[data-voice-toggle]')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'voice-toggle';
      toggleBtn.type = 'button';
      toggleBtn.dataset.voiceToggle = '';
      toggleBtn.title = 'Bật hoặc tắt giọng đọc';
      document.body.appendChild(toggleBtn);
    }

    document.querySelectorAll('[data-voice-replay]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slide = btn.closest('.slide');
        readQuestion(slide);
      });
    });

    document.querySelectorAll('[data-voice-toggle]').forEach(btn => {
      btn.addEventListener('click', toggle);
    });

    updateControls();
  }

  window.GameVoice = {
    readQuestion,
    confirmChoice,
    announceCorrect,
    announceWrong,
    stop,
    setEnabled,
    toggle,
    injectControls,
    isEnabled: () => enabled,
    isSpeaking: () => speaking
  };
})();