let cart = [];
let guestData = {};

// NUEVO
function enterWithLogin(){
  const name   = document.getElementById('guestName').value.trim();
  const email  = document.getElementById('guestEmail').value.trim();
  const nights = document.getElementById('guestNights').value.trim();
  const ci     = document.getElementById('checkin').value;
  const co     = document.getElementById('checkout').value;

  if(!name)  { showNotif('Please enter your full name'); return; }
  if(!email || !email.includes('@')) { showNotif('Please enter a valid email'); return; }
  if(!nights || nights < 1) { showNotif('Please enter number of nights'); return; }
  if(!ci)    { showNotif('Please select a check-in date'); return; }
  if(!co)    { showNotif('Please select a check-out date'); return; }
  if(co <= ci){ showNotif('Check-out must be after check-in'); return; }

  guestData = { name, email, nights, checkin: ci, checkout: co };

  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, checkin: ci, checkout: co, nights })
  })
  .catch(err => console.log('Register error:', err));

  hideLogin();
}
function enterGuest(){guestData={};hideLogin();}
function hideLogin(){
  const lo = document.getElementById('loginOverlay');
  lo.style.opacity='0';lo.style.transition='opacity 0.8s';
  setTimeout(()=>{lo.style.display='none';startHeroAnim();},800);
}
// Navegar entre pantallas del login
function showScreen(id){
  document.getElementById('screenChoice').style.display  = 'none';
  document.getElementById('screenLogin').style.display   = 'none';
  document.getElementById('screenRegister').style.display= 'none';
  document.getElementById(id).style.display = 'block';
}

// Login con email — busca en Google Sheets
function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  if(!email || !email.includes('@')){
    showNotif('Please enter a valid email');
    return;
  }

  showNotif('Looking up your account...');

  fetch('/api/login?email=' + encodeURIComponent(email))
    .then(res => res.json())
    .then(data => {
      if(data.found){
        guestData = {
          name:     data.name,
          email:    data.email,
          checkin:  data.checkin,
          checkout: data.checkout,
          nights:   data.nights
        };
        showNotif('Welcome back, ' + data.name + '!');
        setTimeout(() => hideLogin(), 1000);
      } else {
        showNotif('Email not found — please register first');
        setTimeout(() => showScreen('screenRegister'), 1800);
      }
    })
    .catch(() => showNotif('Connection error, please try again'));
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
  // Si entró como guest, redirigir al login
  if(!guestData.email){
    showNotif('Please sign in or register to add items');
    setTimeout(()=>{
      // Mostrar el overlay de login en la pantalla de elección
      const lo = document.getElementById('loginOverlay');
      lo.style.display = 'flex';
      lo.style.opacity = '0';
      lo.style.transition = 'opacity 0.5s';
      showScreen('screenChoice');
      setTimeout(()=>{ lo.style.opacity = '1'; }, 50);
    }, 1200);
    return;
  }

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
  if(cart.length === 0){ showNotif('Your cart is empty'); return; }

  const name     = guestData.name     || 'Guest';
  const email    = guestData.email    || '';
  const total    = cart.reduce((s,i) => s+i.price, 0);
  const itemsStr = cart.map(i => i.name + ' ($' + i.price + ')').join('|');

  showNotif('Sending your order...');

  fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      checkin:  guestData.checkin  || '—',
      checkout: guestData.checkout || '—',
      nights:   guestData.nights   || '—',
      items:    itemsStr,
      total
    })
  })
  .then(() => {
    setTimeout(() => showNotif('Thank you, ' + name + '! Order confirmed — check your email.'), 500);
  })
  .catch(() => showNotif('Error sending order, please try again'));

  cart = [];
  renderCart();
  document.getElementById('cartPanel').classList.remove('open');
}

function showNotif(msg){
  const el=document.getElementById('notif');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}

// Init login defaults
const today    = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
document.getElementById('checkin').value  = today;
document.getElementById('checkout').value = nextWeek;
document.getElementById('guestNights').value = 7;

// Calcula noches cuando cambian las fechas
function calcNights(){
  const ci = document.getElementById('checkin').value;
  const co = document.getElementById('checkout').value;
  if(ci && co && co > ci){
    const diff = Math.round((new Date(co) - new Date(ci)) / 864e5);
    document.getElementById('guestNights').value = diff;
  }
}

// Calcula checkout cuando cambian las noches
function calcCheckout(){
  const ci = document.getElementById('checkin').value;
  const n  = parseInt(document.getElementById('guestNights').value);
  if(ci && n > 0){
    const co = new Date(new Date(ci).getTime() + n * 864e5).toISOString().split('T')[0];
    document.getElementById('checkout').value = co;
  }
}

document.getElementById('checkin').addEventListener('change', calcNights);
document.getElementById('checkout').addEventListener('change', calcNights);
document.getElementById('guestNights').addEventListener('input', calcCheckout);