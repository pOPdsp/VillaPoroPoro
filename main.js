let cart = [];
let guestData = {};

function enterWithLogin(){
  const name = document.getElementById('guestName').value.trim();
  const ci = document.getElementById('checkin').value;
  const co = document.getElementById('checkout').value;
  if(!name){showNotif('Please enter your name');return;}
  guestData = {name,checkin:ci,checkout:co};
  hideLogin();
}
function enterGuest(){guestData={};hideLogin();}
function hideLogin(){
  const lo = document.getElementById('loginOverlay');
  lo.style.opacity='0';lo.style.transition='opacity 0.8s';
  setTimeout(()=>{lo.style.display='none';startHeroAnim();},800);
}
function startHeroAnim(){
  const els = ['h1','h2','h3','h4'];
  els.forEach((id,i)=>{
    setTimeout(()=>{
      const el=document.getElementById(id);
      if(el){el.classList.add('fade-up')}
    },i*200+100);
  });
}

// NAV SCROLL
window.addEventListener('scroll',()=>{
  const nav=document.getElementById('mainNav');
  nav.classList.toggle('scrolled',window.scrollY>80);
});

// CART
function toggleCart(){
  document.getElementById('cartPanel').classList.toggle('open');
}
function addToCart(name,price,desc){
  cart.push({name,price,desc,id:Date.now()});
  renderCart();
  showNotif(name + ' added to your order');
  document.getElementById('cartPanel').classList.add('open');
}
function removeFromCart(id){
  cart = cart.filter(i=>i.id!==id);
  renderCart();
}
function renderCart(){
  const container = document.getElementById('cartItems');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  countEl.textContent = cart.length;
  if(cart.length===0){
    container.innerHTML='<p class="empty-cart">Your cart is empty.<br/>Add meals or tours below.</p>';
    totalEl.textContent='$0';
    return;
  }
  const total = cart.reduce((s,i)=>s+i.price,0);
  container.innerHTML = cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
      </div>
      <div class="cart-item-right">
        <div class="price">$${item.price}</div>
        <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
  totalEl.textContent = '$'+total;
}
function checkout(){
  if(cart.length===0){showNotif('Your cart is empty');return;}
  const name = guestData.name||'Guest';
  const total = cart.reduce((s,i)=>s+i.price,0);
  showNotif('Thank you, '+name+'! Order of $'+total+' confirmed.');
  cart=[];renderCart();
  document.getElementById('cartPanel').classList.remove('open');
}

function showNotif(msg){
  const el=document.getElementById('notif');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}

// Init login defaults
const today=new Date().toISOString().split('T')[0];
const nextWeek=new Date(Date.now()+7*864e5).toISOString().split('T')[0];
document.getElementById('checkin').value=today;
document.getElementById('checkout').value=nextWeek;