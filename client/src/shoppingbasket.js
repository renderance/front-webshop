function cancelButtonClicked(hitbox){
  let target = hitbox.target;
  let article = target.parentNode.parentNode;
  let parkname = article.getElementsByClassName("parkname")[0].textContent;
  let sogyoBasket = JSON.parse(localStorage.getItem('sogyoBasket'))
  delete sogyoBasket[parkname];
  localStorage.setItem('sogyoBasket',JSON.stringify(sogyoBasket));
  let numOfOrders = Object.keys(sogyoBasket).length;
  shoppingbasket.getElementsByClassName("badge")[0].textContent = numOfOrders;
  location.reload(true);
}

function finalOrderButtonClicked(somevent){
  fetch("api/placeorder",
  {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: localStorage.getItem('sogyoBasket')
  })
  .then(response => {
    localStorage.removeItem("sogyoBasket");
    shoppingbasket.getElementsByClassName("badge")[0].textContent = 0;
    location.href = "orderplaced.html";
  })
}

function buildClickListenerButtons(buttons,routine,evnt){
  for (const button of buttons) {
    button.addEventListener(evnt,routine)
  }
}

function buildTotalDisplay(subtotals){
  let totals = 0;
  for (i = 0; i<subtotals.length; i++){
    let price = subtotals[i].textContent;
    totals += Number(price);
  }
  return totals;
}

function buildOrdersFromTemplate(placeholder,template,basket,parklist){
  for(ticket in basket){
    let order = buildOneOrder(template,ticket,basket,parklist)
    placeholder.appendChild(order);
  }
}

function buildOneOrder(template,ticket,basket,parklist){
  let order = template.content.cloneNode(true);
  order.querySelector('.parkname').textContent = ticket;
  order.querySelector('.numadults').textContent += basket[ticket].ticketadult || 0;
  order.querySelector('.numkids').textContent += basket[ticket].ticketkid || 0;
  let adultnumber = basket[ticket].ticketadult;
  let kidnumber = basket[ticket].ticketkid;
  updateSubTotal(order.querySelector('.orderbutton'));
  return order;
}

function updateSubTotal(hitbox){
  let order = hitbox.parentNode.parentNode;
  fetch("api/parkdetails",
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(
        {
          'parkname': order.querySelector('.parkname').textContent
        }
      )
    }
  )
  .then(response => response.json())
  .then(results=>
    {
      fetch("api/calctotals",
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify(
            {
              'kids': Number(order.querySelector('.numkids').textContent.slice(6) || 0),
              'adults': Number(order.querySelector('.numadults').textContent.slice(8) || 0),
              'kidprice': Number(results[0]['kid_price']),
              'adultprice': Number(results[0]['adult_price']),
              'reqkids': Number(results[0]['discount_kid_req']),
              'reqadults': Number(results[0]['discount_adult_req']),
              'discountpercent': Number(results[0]['discount_percent'] / 100)
            }
          )
        }
      )
      .then(response => response.json())
      .then(results=>
        {
          order.querySelector('.subtotal .price').innerText = results['total'].toFixed(2);
          updateTotal();
        }
      )
    }
  )
}

function updateTotal() {
  document.querySelector('.totalprice .price').textContent =
    buildTotalDisplay(document.querySelectorAll('.subtotal .price')).toFixed(2);
  }


/*
 *
 *
 */

let sogyoBasket = JSON.parse(localStorage.getItem('sogyoBasket')) || {};
let numOfOrders = Object.keys(sogyoBasket).length;
shoppingbasket.getElementsByClassName("badge")[0].innerText = numOfOrders;

fetch("api/attractions")
  .then(response => response.json())
  .then(parklist => {
    console.log("Loading shopping basket page.");
    buildOrdersFromTemplate(
      document.getElementById("placeholder"),
      document.getElementsByTagName("template")[0],
      sogyoBasket,
      parklist
    );
    buildClickListenerButtons(
      document.querySelectorAll("button.orderbutton"),
      cancelButtonClicked,
      "click"
    );
    buildClickListenerButtons(
      document.querySelectorAll("button.finalizepaymentbutton"),
      finalOrderButtonClicked,
      "click"
    )
  })
