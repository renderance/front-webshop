function saveOrderInBasket(park,adults,childs){
  let sogyoBasket = JSON.parse(localStorage.getItem('sogyoBasket')) || {};
  if(adults || childs){
    let thisOrder = {ticketadult:adults||0,ticketkid:childs||0};
    sogyoBasket[park] = (thisOrder);
    localStorage.setItem('sogyoBasket',JSON.stringify(sogyoBasket));
  }
  let numOfOrders = Object.keys(sogyoBasket).length;
  shoppingbasket.getElementsByClassName("badge")[0].innerText = numOfOrders;
}

function orderButtonClicked(hitbox){
  let target = hitbox.target;
  let article = target.parentNode.parentNode;
  let parkname = article.getElementsByClassName("parkname")[0].textContent;
  let numadult = parseInt(
                  article.getElementsByClassName("numberofadults")[0].value
                );
  let numchild = parseInt(
                  article.getElementsByClassName("numberofkids")[0].value
                );
  saveOrderInBasket(parkname,numadult,numchild);
}

function updateSubTotal(hitbox){
  let target = hitbox.target;
  let order = target.parentNode.parentNode;
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
              'kids': Number(order.querySelector('.numberofkids').value || 0),
              'adults': Number(order.querySelector('.numberofadults').value || 0),
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
          order.querySelector('.total .price').innerText = results['total'].toFixed(2);
        }
      )
    }
  )
}

function updateConfirmAllowed(hitbox){
  let target = hitbox.target;
  let order = target.parentNode.parentNode;
  fetch("api/parkdetails",
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(
        {
          'parkname':order.querySelector('.parkname').textContent
        }
      )
    }
  )
  .then(response => response.json())
  .then(results=>
    {
      let ticketsToOrder=Number(order.querySelector(".numberofadults").value)
                        +Number(order.querySelector(".numberofkids").value);
      order.querySelector("button.orderbutton").addEventListener("click",orderButtonClicked);
      order.querySelector("button.orderbutton").textContent = "Add to shopping basket!"
      if(Number(results[0]['available']) < Number(ticketsToOrder)){
        order.querySelector("button.orderbutton").removeEventListener("click",orderButtonClicked);
        order.querySelector("button.orderbutton").textContent = "NOT ENOUGH TICKETS AVAILABLE"
      }
      else {
      }
    }
  )
}

/*
 *
 *
 */

console.log("Index page opened.")
let sogyoBasket = JSON.parse(localStorage.getItem('sogyoBasket')) || {};
let numOfOrders = Object.keys(sogyoBasket).length;
shoppingbasket.getElementsByClassName("badge")[0].innerText = numOfOrders;

fetch("api/attractions")
.then(response => response.json())
.then(parklist => {
  let template = document.getElementsByTagName("template")[0];
  for(component in parklist){
    let park = parklist[component];
    let clone = template.content.cloneNode(true);
    clone.querySelector('.parkname').textContent = park.parkname;
    clone.querySelector('.parkdescription').textContent = park.description;
    clone.querySelector('.adultprice .price').textContent = park.adult_price;
    clone.querySelector('.kidsprice .price').textContent = park.kid_price;
    clone.querySelector('.discountrequirement .adults').textContent = park.discount_adult_req;
    clone.querySelector('.discountrequirement .child').textContent = park.discount_kid_req;
    clone.querySelector('.discountrequirement .percentage').textContent = park.discount_percent;
    document.getElementById("placeholder").appendChild(clone);
  }
  let valinputs = document.querySelectorAll("input");
  for (const field of valinputs) {
    field.addEventListener('change',updateSubTotal);
    field.addEventListener('change',updateConfirmAllowed);
  }
})
