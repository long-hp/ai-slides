(function(){
  'use strict';
  const state={score:0,answered:{},lifelines:{fifty:false,poll:false,phone:false},wrong:false};
  const questions={
    3:{correct:'B',value:100000,explain:'Sao Thủy (Mercury) là hành tinh gần Mặt Trời nhất.'},
    4:{correct:'C',value:200000,explain:'1 byte gồm 8 bit — một quy ước nền tảng của máy tính.'},
    5:{correct:'A',value:500000,explain:'Ý là quốc gia nổi tiếng với hình dáng chiếc ủng trên bản đồ.'},
    6:{correct:'D',value:1000000,explain:'Tô Hoài là tác giả của Dế Mèn phiêu lưu ký.'},
    7:{correct:'B',value:5000000,explain:'“42” là đáp án nổi tiếng trong The Hitchhiker’s Guide to the Galaxy.'},
    8:{correct:'A',value:10000000,explain:'Ngựa có thể ngủ đứng nhờ cơ chế khóa khớp đặc biệt ở chân.'},
    9:{correct:'C',value:20000000,explain:'Đây là câu hỏi cuối: đáp án C — và đúng, AI cũng có lúc phải suy nghĩ 😄'}
  };
  function slideIndex(){return (window.__hpxGetIndex?.()??0)+1}
  function toast(msg){let el=document.querySelector('.game-toast');if(!el){el=document.createElement('div');el.className='game-toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200)}
  function modal(title,text,extra){const back=document.querySelector('.modal-backdrop');if(!back)return;back.querySelector('.modal-title').textContent=title;back.querySelector('.modal-text').innerHTML=text;if(extra)back.querySelector('.troll-box').textContent=extra;back.classList.add('open')}
  function closeModal(){document.querySelector('.modal-backdrop')?.classList.remove('open')}
  function updateLadder(){document.querySelectorAll('.money-step').forEach(el=>{const q=parseInt(el.dataset.q,10);el.classList.toggle('current',q===slideIndex()-2);el.classList.toggle('done',q<slideIndex()-2&&state.answered[q]);})}
  function answer(btn,slide){
    const q=questions[slide];if(!q||state.answered[slide])return;
    const picked=btn.dataset.answer;state.answered[slide]=true;
    GameVoice?.stop();
    const buttons=[...slideEl(slide).querySelectorAll('.answer-btn')];
    buttons.forEach(b=>{b.disabled=true;b.classList.add('disabled');if(b.dataset.answer===q.correct)b.classList.remove('disabled')});

    if(picked===q.correct){
      btn.classList.remove('disabled');btn.classList.add('correct');
      state.score=q.value;
      toast('CHÍNH XÁC! +'+q.value.toLocaleString('vi-VN')+' ₫');
      slideEl(slide).querySelector('.explain').classList.add('show');
      slideEl(slide).querySelector('.explain').innerHTML='<strong>✓ Đúng!</strong> '+q.explain;
    }else{
      btn.classList.remove('disabled');btn.classList.add('wrong');
      state.wrong=true;
      toast('ỐI! Đáp án này chưa đúng 😅');
      slideEl(slide).querySelector('.explain').classList.add('show');
      slideEl(slide).querySelector('.explain').innerHTML='<strong>✕ Sai rồi.</strong> '+q.explain;
    }

    const next=slideEl(slide).querySelector('.next-btn');if(next)next.hidden=false;

    // Gameshow rhythm: first confirm the player's choice, then reveal the result.
    GameVoice?.confirmChoice(picked);
    window.setTimeout(()=>{
      if(picked===q.correct){
        GameVoice?.announceCorrect(picked,q.value,slide===9);
      }else{
        GameVoice?.announceWrong(picked,q.correct,q.value);
      }
    },1550);
  }

  function slideEl(n){return document.querySelectorAll('.slide')[n-1]}
  function resetQuestion(slide){const el=slideEl(slide);if(!el)return;el.querySelectorAll('.answer-btn').forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong','disabled')});const ex=el.querySelector('.explain');if(ex){ex.classList.remove('show');ex.innerHTML=''}const next=el.querySelector('.next-btn');if(next)next.hidden=true}
  function nextFrom(slide){if(state.wrong){window.__hpxGo?.(9)}else window.__hpxGo?.(slide)}
  function useFifty(slide){const el=slideEl(slide);if(state.lifelines.fifty)return;state.lifelines.fifty=true;document.querySelectorAll('[data-lifeline="fifty"]').forEach(b=>b.classList.add('used'));const q=questions[slide];[...el.querySelectorAll('.answer-btn')].filter(b=>b.dataset.answer!==q.correct).slice(0,2).forEach(b=>b.classList.add('disabled'));toast('50:50 đã loại 2 phương án.')}
  function usePoll(slide){if(state.lifelines.poll)return;state.lifelines.poll=true;document.querySelectorAll('[data-lifeline="poll"]').forEach(b=>b.classList.add('used'));modal('BÌNH CHỌN KHÁN GIẢ','Kết quả mô phỏng:<br><br><b style="font-size:32px">A  18% · B  64% · C  12% · D  6%</b>','Khán giả đã bình chọn. Đừng hỏi vì sao họ tự tin thế.');}
  function usePhone(){if(state.lifelines.phone)return;state.lifelines.phone=true;document.querySelectorAll('[data-lifeline="phone"]').forEach(b=>b.classList.add('used'));modal('GỌI NGƯỜI THÂN','📞 Đang gọi…<br><br>“Alo? Anh nghe đây!”<br><br>…<br><br>“Khoan, câu hỏi là gì nhỉ?”','Người thân: 50% kiến thức · 50% đang ăn tối.');}
  function bind(){
    document.querySelectorAll('.start-btn,[data-start]').forEach(b=>b.addEventListener('click',()=>window.__hpxGo?.(2)));
    document.querySelectorAll('.answer-btn').forEach(b=>b.addEventListener('click',()=>answer(b,parseInt(b.closest('.slide').dataset.qslide,10))));
    document.querySelectorAll('.next-btn').forEach(b=>b.addEventListener('click',()=>nextFrom(parseInt(b.closest('.slide').dataset.qslide,10))));
    document.querySelectorAll('[data-lifeline="fifty"]').forEach(b=>b.addEventListener('click',()=>useFifty(parseInt(b.closest('.slide').dataset.qslide,10))));
    document.querySelectorAll('[data-lifeline="poll"]').forEach(b=>b.addEventListener('click',()=>usePoll(parseInt(b.closest('.slide').dataset.qslide,10))));
    document.querySelectorAll('[data-lifeline="phone"]').forEach(b=>b.addEventListener('click',usePhone));
    document.querySelectorAll('.close-btn').forEach(b=>b.addEventListener('click',closeModal));
    document.querySelector('.modal-backdrop')?.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
    const gift=document.querySelector('[data-gift]');gift?.addEventListener('click',()=>modal('HỘP QUÀ BÍ MẬT','Bạn mở ra…<br><br>🎁 <b>một lời nhắc rất quan trọng:</b> đừng bấm đáp án chỉ vì nó “trông đúng”.','TROLL BOX: Phần thưởng là… bạn vừa mất 3 giây. 😎'));
  }
  function renderResult(){const el=document.querySelector('[data-result]');if(!el)return;const win=!state.wrong&&state.score>=20000000;el.querySelector('.result-score').textContent=state.score.toLocaleString('vi-VN')+' ₫';el.querySelector('.result-head').textContent=win?'BẠN ĐÃ TRỞ THÀNH TRIỆU PHÚ!':'TẠM DỪNG CUỘC CHƠI';el.querySelector('.result-copy').textContent=win?'Bạn vừa vượt qua toàn bộ 7 câu hỏi. Quá dữ!':'Bạn vẫn mang về được '+state.score.toLocaleString('vi-VN')+' ₫. Quan trọng nhất: không bị AI troll quá đau.';}
  function observe(){
    const obs=new MutationObserver(()=>{const n=slideIndex();updateLadder();if(questions[n])resetQuestion(n);if(n===10)renderResult()});
    document.querySelectorAll('.slide').forEach(s=>obs.observe(s,{attributes:true,attributeFilter:['class']}));
  }
  let lastVoiceSlide=0;
  function handleVoiceSlide(n){
    if(!GameVoice||n===lastVoiceSlide)return;
    lastVoiceSlide=n;
    if(questions[n]){
      window.setTimeout(()=>GameVoice.readQuestion(slideEl(n)),180);
    }else{
      GameVoice.stop();
    }
  }
  function init(){
    bind();
    GameVoice?.injectControls();
    observe();
    updateLadder();
    renderResult();
    handleVoiceSlide(slideIndex());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();