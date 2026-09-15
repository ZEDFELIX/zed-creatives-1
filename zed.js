(function(){
  try{
    var host = document.getElementById('site-header');
    if(!host){ return; }
    var words = 'FREE SHIPPING OVER $75 \u2726 NEW DROP LIVE \u2726 T-SHIRTS \u2726 POSTERS \u2726 STICKERS \u2726 MERCH \u2726 ' ;
    var copy = '';
    for(var i=0;i<5;i++){ copy += '<span>'+words+'<\/span>'; }
    var el = document.createElement('div');
    el.className = 'zed-marquee';
    el.setAttribute('aria-hidden','true');
    el.innerHTML = '<div class="zed-track">'+copy+'</div>';
    document.body.insertBefore(el, document.body.firstChild);
  }catch(e){}
})();